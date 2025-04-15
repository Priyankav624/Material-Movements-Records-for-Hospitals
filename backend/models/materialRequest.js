import mongoose from "mongoose";

const materialRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Doctor/Staff ID
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
      validate: {
        validator: async function(value) {
          const material = await mongoose.model('Material').findById(value);
          return material && material.status !== 'Deleted';
        },
        message: 'Material does not exist or has been deleted'
      }
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: async function(value) {
          if (this.populated('materialId') || this.status !== 'Pending') return true;
          const material = await mongoose.model('Material').findById(this.materialId);
          return material && value <= material.quantity;
        },
        message: 'Quantity exceeds available stock'
      }
    },
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
