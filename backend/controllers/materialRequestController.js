import MaterialRequest from "../models/materialRequest.js";
import Material from "../models/material.js";
import mongoose from "mongoose";

export const requestMaterial = async (req, res) => {
  try {
    const { materialId, quantity, reason, priority } = req.body;

    // Validate material exists and is available
    const material = await Material.findOne({
      _id: materialId,
      status: { $ne: "Deleted" }
    });
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found or unavailable"
      });
    }

    if (material.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${material.quantity} available`
      });
    }

    const request = new MaterialRequest({
      requestedBy: req.user.id,
      materialId,
      quantity,
      reason,
      priority,
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: "Material request submitted successfully",
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.find()
      .populate({
        path: 'materialId',
        select: 'name quantity category status',
        match: { status: { $ne: "Deleted" } }
      })
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name')
      .lean();

    const enhancedRequests = requests.map(request => ({
      ...request,
      materialId: request.materialId || {
        name: "Material Deleted",
        quantity: 0,
        category: "Unknown",
        status: "Deleted"
      }
    }));

    res.status(200).json({ success: true, requests: enhancedRequests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message
    });
  }
};

export const updateRequestStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Validate input
    if (!["Approved", "Rejected"].includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'Approved' or 'Rejected'"
      });
    }

    // Find request with material
    const request = await MaterialRequest.findById(id)
      .populate('materialId')
      .session(session);

    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    if (request.status !== "Pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }

    if (status === "Approved") {
      if (!request.materialId || request.materialId.status === "Deleted") {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "Associated material not available"
        });
      }

      if (request.materialId.quantity < request.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${request.materialId.quantity} available`
        });
      }

      // Calculate new quantity and status
      const newQuantity = request.materialId.quantity - request.quantity;
      const newStatus = newQuantity === 0 ? "Issued" : 
                      newQuantity < 5 ? "Low Stock" : "Available";

      // Update material
      await Material.findByIdAndUpdate(
        request.materialId._id,
        {
          $inc: { quantity: -request.quantity },
          $set: { status: newStatus }
        },
        { session }
      );

      // Update request
      request.status = "Approved";
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
      await request.save({ session });
    } 
    else {
      if (!rejectionReason?.trim()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required"
        });
      }
      request.status = "Rejected";
      request.rejectionReason = rejectionReason;
      await request.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      request
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating request status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.find({ requestedBy: req.user._id })
      .populate("materialId", "name quantity status")
      .populate("approvedBy", "name");

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message
    });
  }
};