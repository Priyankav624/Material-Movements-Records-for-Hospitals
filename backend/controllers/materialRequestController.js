import MaterialRequest from "../models/materialRequest.js";
import Material from "../models/material.js";
import ActivityLog from "../models/ActivityLog.js";

export const requestMaterial = async (req, res) => {
  try {
    const { materialId, quantity, reason, priority } = req.body;

    const request = new MaterialRequest({
      requestedBy: req.user.id, 
      materialId,
      quantity,
      reason,
      priority,
    });

    await request.save();

    res.status(201).json({ success: true, message: "Material request submitted successfully", request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.find()
      .populate("requestedBy", "name role")
      .populate("materialId", "name");

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const request = await MaterialRequest.findById(req.params.id)
      .populate('materialId')
      .populate('requestedBy', 'name');

    if (!request) return res.status(404).json({ message: "Request not found" });

    const material = await Material.findById(request.materialId);
    if (!material) return res.status(404).json({ message: "Material not found" });

    if (status === "Approved") {
      if (material.quantity < request.quantity) {
        return res.status(400).json({ success: false, message: "Insufficient stock to approve this request." });
      }

      material.quantity -= request.quantity;

      if (material.quantity === 0) {
        material.status = "Issued";
      } else if (material.quantity < 5) { 
        material.status = "Low Stock";
      } else {
        material.status = "Available";
      }

      await material.save();  

      request.status = "Approved";
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
    }
    else if (status === "Rejected") {
      request.status = "Rejected";
      request.rejectionReason = rejectionReason || "No reason provided";
    }
    await request.save();  
    res.status(200).json({ success: true, message: `Request ${status.toLowerCase()} successfully`, request });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.find({ requestedBy: req.user._id })
      .populate("materialId approvedBy");

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch requests." });
  }
};