import MovementLog from "../models/movementLog.js";
import Material from "../models/material.js";
import mongoose from "mongoose";

export const issueMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { materialId, quantity, purpose, assignedTo, department } = req.body;

    // Validate material exists and is available
    const material = await Material.findOne({
      _id: materialId,
      status: { $nin: ["Deleted", "Expired"] }
    }).session(session);
    
    if (!material) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Material not found or unavailable"
      });
    }

    if (material.quantity < quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${material.quantity} available`
      });
    }

    // Calculate new quantity and status
    const newQuantity = material.quantity - quantity;
    const newStatus = newQuantity === 0 ? "Issued" : 
                    newQuantity < 5 ? "Low Stock" : "Available";

    // Update material
    await Material.findByIdAndUpdate(
      materialId,
      {
        $inc: { quantity: -quantity },
        $set: { status: newStatus }
      },
      { session }
    );

    // Create movement log
    const movementLog = new MovementLog({
      materialId,
      quantity,
      action: 'Issued',
      from: 'Inventory',
      to: department,
      purpose,
      performedBy: req.user.id,
      assignedTo
    });

    await movementLog.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Material issued successfully",
      movementLog
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error issuing material:", error);
    res.status(500).json({
      success: false,
      message: "Failed to issue material",
      error: error.message
    });
  }
};

export const returnMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { movementId, condition, notes } = req.body;

    // Find the original issuance
    const originalIssuance = await MovementLog.findById(movementId)
      .session(session);
    
    if (!originalIssuance || originalIssuance.action !== 'Issued') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Original issuance record not found"
      });
    }

    // Update material quantity
    await Material.findByIdAndUpdate(
      originalIssuance.materialId,
      {
        $inc: { quantity: originalIssuance.quantity },
        $set: { 
          status: condition === 'Damaged' ? 'Damaged' : 'Available'
        }
      },
      { session }
    );

    // Create return log
    const returnLog = new MovementLog({
      materialId: originalIssuance.materialId,
      quantity: originalIssuance.quantity,
      action: 'Returned',
      from: originalIssuance.to,
      to: 'Inventory',
      purpose: notes || 'Material returned',
      performedBy: req.user.id,
      assignedTo: originalIssuance.assignedTo,
      condition,
      relatedMovement: originalIssuance._id
    });

    await returnLog.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Material returned successfully",
      returnLog
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error returning material:", error);
    res.status(500).json({
      success: false,
      message: "Failed to return material",
      error: error.message
    });
  }
};

export const getMovementLogs = async (req, res) => {
  try {
    const { 
      action, 
      materialId, 
      department, 
      assignedTo, 
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filters = {};
    
    if (action) filters.action = action;
    if (materialId) filters.materialId = materialId;
    if (department) filters.$or = [{ from: department }, { to: department }];
    if (assignedTo) filters.assignedTo = assignedTo;
    
    // Date range filter
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    const total = await MovementLog.countDocuments(filters);
    const logs = await MovementLog.find(filters)
      .populate('materialId', 'name category serialNumber')
      .populate('performedBy', 'name role')
      .populate('assignedTo', 'name role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      logs,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching movement logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch movement logs",
      error: error.message
    });
  }
};