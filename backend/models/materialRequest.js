import mongoose from "mongoose";

const materialRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Doctor/Staff ID
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true }, // Requested Material
    quantity: { type: Number, required: true },
    reason: { type: String, required: true }, // Reason for request
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" }, // Priority Level
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    requestDate: { type: Date, default: Date.now },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      validate: {
        validator: function (value) {
          return this.status === "Approved" ? !!value : true;
        },
        message: "ApprovedBy should only be set if status is 'Approved'",
      },
    }, // Store Manager/Admin who approved
    approvedAt: { type: Date }, // Approval Timestamp
    rejectionReason: { 
      type: String,
      validate: {
        validator: function (value) {
          return this.status === "Rejected" ? !!value : true;
        },
        message: "Rejection reason must be provided if request is 'Rejected'",
      },
    }, // Reason if request is rejected
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

const MaterialRequest = mongoose.model("MaterialRequest", materialRequestSchema);
export default MaterialRequest;
