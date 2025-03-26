import MaterialRequest from "../models/materialRequest.js";
import Material from "../models/material.js";

// ✅ Doctor/Staff can request material
export const requestMaterial = async (req, res) => {
  try {
    const { materialId, quantity, reason, priority } = req.body;

    const request = new MaterialRequest({
      requestedBy: req.user.id, // Logged-in user ID
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

// ✅ Store Manager/Admin can view all material requests
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
    const request = await MaterialRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    const material = await Material.findById(request.materialId);
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    if (status === "Approved") {
      // ✅ Check stock before approval
      if (material.quantity < request.quantity) {
        return res.status(400).json({ success: false, message: "Insufficient stock to approve this request." });
      }

      // ✅ Deduct stock
      material.quantity -= request.quantity;

      // ✅ Update material status based on remaining stock
      if (material.quantity === 0) {
        material.status = "Issued";
      } else if (material.quantity < 5) { // You can set a threshold for low stock
        material.status = "Low Stock";
      } else {
        material.status = "Available";
      }

      await material.save();  // ✅ Save material stock update
      
      // ✅ Update request status
      request.status = "Approved";
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
    } 
    else if (status === "Rejected") {
      request.status = "Rejected";
      request.rejectionReason = rejectionReason || "No reason provided";
    }

    await request.save(); // ✅ Save request update

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