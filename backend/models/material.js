import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    category: {
      type: String,
      enum: ["Reusable", "Consumable", "Hazardous", "Critical"],
      required: true,
    },

    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    quantity: {
      type: Number,
      min: 0,
      required: function () {
        return this.category === "Consumable"; 
      },
    },

    expiryDate: {
      type: Date,
      required: function () {
        return this.category === "Consumable" || this.category === "Hazardous"; 
      },
    },

    source: {
      type: String,
      enum: ["Vendor", "Donation", "Internal Procurement"],
      required: true,
    },

    vendorDetails: {
      name: { type: String },
      contact: { type: String },
    },

    status: {
      type: String,
      enum: ["Available", "Issued", "Low Stock", "Expired", "Damaged", "Deleted"],
      default: "Available",
    },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Material = mongoose.model("Material", materialSchema);
export default Material; 