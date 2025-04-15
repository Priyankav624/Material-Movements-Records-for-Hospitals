import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

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

    expiryDate: {
      type: Date,
      validate: {
        validator: function(value) {
          // Only validate if the item has an expiry date
          if (!value) return true;
          return value > new Date();
        },
        message: 'Expiry date must be in the future'
      },
      required: function() {
        return this.category === "Consumable" || this.category === "Hazardous";
      }
    },

    status: {
      type: String,
      enum: ["Available", "Issued", "Low Stock", "Expired", "Damaged", "Deleted"],
      default: "Available",
      validate: {
        validator: function(value) {
          if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
            return value === "Expired";
          }
          return true;
        },
        message: 'Expired items must have status "Expired"'
      }
    },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

materialSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-update status for expired items
  if (this.expiryDate && new Date(this.expiryDate) <= now) {
    this.status = 'Expired';
  }
  
  // Auto-update status for low stock
  if (this.quantity <= 0 && this.status !== 'Expired') {
    this.status = 'Low Stock';
  }
  
  // Reset to Available if quantity is replenished and not expired
  if (this.quantity > 0 && this.status === 'Low Stock' && 
      (!this.expiryDate || new Date(this.expiryDate) > now)) {
    this.status = 'Available';
  }

  next();
});

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
export default Material; 