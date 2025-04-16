// import MovementLog from "../models/movementLog.js";
// import Material from "../models/material.js";
// import mongoose from "mongoose";

// export const issueMaterial = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const { materialId, quantity, purpose, assignedTo, department } = req.body;

//     // Validate material exists and is available
//     const material = await Material.findOne({
//       _id: materialId,
//       status: { $nin: ["Deleted", "Expired"] }
//     }).session(session);
    
//     if (!material) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: "Material not found or unavailable"
//       });
//     }

//     if (material.quantity < quantity) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: `Insufficient stock. Only ${material.quantity} available`
//       });
//     }

//     // Calculate new quantity and status
//     const newQuantity = material.quantity - quantity;
//     const newStatus = newQuantity === 0 ? "Issued" : 
//                     newQuantity < 5 ? "Low Stock" : "Available";

//     // Update material
//     await Material.findByIdAndUpdate(
//       materialId,
//       {
//         $inc: { quantity: -quantity },
//         $set: { status: newStatus }
//       },
//       { session }
//     );

//     // Create movement log
//     const movementLog = new MovementLog({
//       materialId,
//       quantity,
//       action: 'Issued',
//       from: 'Inventory',
//       to: department,
//       purpose,
//       performedBy: req.user.id,
//       assignedTo
//     });

//     await movementLog.save({ session });
//     await session.commitTransaction();
//     session.endSession();

//     res.status(201).json({
//       success: true,
//       message: "Material issued successfully",
//       movementLog
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Error issuing material:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to issue material",
//       error: error.message
//     });
//   }
// };

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

export const getMovementStats = async (req, res) => {
  try {
    const stats = await MovementLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $project: {
          action: "$_id",
          count: 1,
          totalQuantity: 1,
          _id: 0
        }
      }
    ]);

    // Convert array to object for easier access
    const result = {
      totalIssued: stats.find(s => s.action === 'Issued')?.totalQuantity || 0,
      totalReturned: stats.find(s => s.action === 'Returned')?.totalQuantity || 0,
      totalDisposed: stats.find(s => s.action === 'Disposed')?.totalQuantity || 0,
      totalTransferred: stats.find(s => s.action === 'Transferred')?.totalQuantity || 0
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movement stats",
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


import Material from "../models/material.js";
import MovementLog from "../models/movementLog.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Enhanced issue material function with batch tracking
export const issueMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { materialId, quantity, department, purpose, assignedTo, batchNumber } = req.body;
    
    // Validate input
    if (!materialId || !quantity || !department || !purpose) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Get material with batches
    const material = await Material.findById(materialId)
      .session(session);

    if (!material) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Material not found" 
      });
    }

    // Check if material is available
    if (material.status === 'Expired' || material.status === 'Damaged' || material.status === 'Disposed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Material is ${material.status.toLowerCase()} and cannot be issued` 
      });
    }

    // Handle batch tracking if material has batches
    if (material.batches && material.batches.length > 0) {
      if (!batchNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Batch number is required for this material" 
        });
      }

      const batch = material.batches.find(b => b.batchNumber === batchNumber);
      if (!batch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Batch not found" 
        });
      }

      if (batch.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity in batch. Only ${batch.quantity} available` 
        });
      }

      // Update batch quantity
      batch.quantity -= quantity;
      if (batch.quantity === 0) {
        batch.status = 'depleted';
      }
    } else {
      // Regular quantity tracking
      if (material.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Only ${material.quantity} available` 
        });
      }
      material.quantity -= quantity;
    }

    // Update material status if needed
    if (material.minStockLevel && material.totalQuantity <= material.minStockLevel) {
      material.status = 'Low Stock';
    }

    // Create movement log
    const movementLog = new MovementLog({
      materialId,
      quantity,
      action: 'Issued',
      from: 'Inventory',
      to: department,
      purpose,
      performedBy: req.user.id,
      assignedTo,
      batchNumber: material.batches?.length > 0 ? batchNumber : undefined,
      notes: `Issued to ${department} for ${purpose}`
    });

    await Promise.all([
      material.save({ session }),
      movementLog.save({ session })
    ]);

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

// Disposal function for waste management
export const disposeMaterial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { materialId, quantity, reason, disposalMethod, batchNumber } = req.body;
    
    // Validate input
    if (!materialId || !quantity || !reason || !disposalMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const material = await Material.findById(materialId).session(session);
    if (!material) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: "Material not found" 
      });
    }

    // Handle batch tracking if material has batches
    if (material.batches && material.batches.length > 0) {
      if (!batchNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: "Batch number is required for this material" 
        });
      }

      const batch = material.batches.find(b => b.batchNumber === batchNumber);
      if (!batch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          success: false, 
          message: "Batch not found" 
        });
      }

      if (batch.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity in batch. Only ${batch.quantity} available` 
        });
      }

      // Update batch quantity
      batch.quantity -= quantity;
      if (batch.quantity === 0) {
        batch.status = 'depleted';
      }
    } else {
      // Regular quantity tracking
      if (material.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Only ${material.quantity} available` 
        });
      }
      material.quantity -= quantity;
    }

    // Update material status
    material.status = 'Disposed';

    // Create disposal log
    const movementLog = new MovementLog({
      materialId,
      quantity,
      action: 'Disposed',
      from: 'Inventory',
      purpose: reason,
      disposalMethod,
      performedBy: req.user.id,
      batchNumber: material.batches?.length > 0 ? batchNumber : undefined,
      notes: `Disposed due to: ${reason}. Method: ${disposalMethod}`
    });

    await Promise.all([
      material.save({ session }),
      movementLog.save({ session })
    ]);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ 
      success: true, 
      message: "Material disposal recorded successfully",
      movementLog
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error disposing material:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to record disposal",
      error: error.message 
    });
  }
};

// Updated generateMovementReport in controllers/movementLogController.js
export const generateMovementReport = async (req, res) => {
  try {
    const { startDate, endDate, department, action } = req.query;
    
    const filters = {};
    if (startDate && endDate) {
      filters.timestamp = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (department) filters.to = department;
    if (action) filters.action = action;

    const logs = await MovementLog.find(filters)
      .populate('materialId', 'name category')
      .populate('performedBy', 'name')
      .populate('assignedTo', 'name role')
      .sort({ timestamp: -1 });

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers before piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=movement-report.pdf');
    
    // Pipe directly to response
    doc.pipe(res);

    // PDF content
    doc.fontSize(18).text('Material Movement Report', { align: 'center' });
    doc.moveDown();
    
    if (startDate || endDate || department || action) {
      doc.fontSize(12).text('Filters Applied:', { underline: true });
      if (startDate) doc.text(`Start Date: ${new Date(startDate).toLocaleDateString()}`);
      if (endDate) doc.text(`End Date: ${new Date(endDate).toLocaleDateString()}`);
      if (department) doc.text(`Department: ${department}`);
      if (action) doc.text(`Action Type: ${action}`);
      doc.moveDown();
    }

    // Table header
    const startY = doc.y;
    doc.fontSize(10);
    doc.text('Date', 50, startY);
    doc.text('Material', 150, startY);
    doc.text('Action', 250, startY);
    doc.text('From/To', 350, startY);
    doc.text('Quantity', 450, startY);
    doc.moveDown();

    // Table rows
    let y = startY + 20;
    logs.forEach(log => {
      if (y > 700) { // Add new page if we're at the bottom
        doc.addPage();
        y = 50;
      }
      
      doc.text(dayjs(log.timestamp).format('DD/MM/YYYY'), 50, y);
      doc.text(log.materialId?.name || 'N/A', 150, y);
      doc.text(log.action, 250, y);
      doc.text(`${log.from} → ${log.to || 'N/A'}`, 350, y);
      doc.text(log.quantity.toString(), 450, y);
      
      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate report",
      error: error.message 
    });
  }
};

// Get expired items
export const getExpiredItems = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Find materials with expired batches
    const expiredMaterials = await Material.aggregate([
      { $unwind: "$batches" },
      { 
        $match: { 
          "batches.expiryDate": { $lte: currentDate },
          "batches.status": { $ne: "depleted" }
        } 
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          category: { $first: "$category" },
          totalExpired: { $sum: "$batches.quantity" },
          batches: { 
            $push: {
              batchNumber: "$batches.batchNumber",
              quantity: "$batches.quantity",
              expiryDate: "$batches.expiryDate"
            }
          }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      expiredMaterials 
    });
  } catch (error) {
    console.error("Error fetching expired items:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch expired items",
      error: error.message 
    });
  }
};