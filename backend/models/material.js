import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },

    category: {
      type: String,
      enum: ["Reusable", "Consumable", "Hazardous", "Critical"],
      required: true,
    },

    serialNumber: { type: String, unique: true, sparse: true },
    barcode: { type: String },

    quantity: { type: Number, min: 0, required: true },
    unit: {
      type: String,
      enum: ["pieces", "boxes", "liters", "kg", "units"],
      default: "pieces"
    },
    minStockLevel: { type: Number, default: 5 },

    batches: [{
      batchNumber: { type: String, required: true },
      quantity: { type: Number, required: true },
      expiryDate: Date,
      manufacturingDate: Date,
      supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
      purchasePrice: Number,
      purchaseDate: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'depleted'],
        default: 'active'
      }
    }],

    source: {
      type: String,
      enum: ["Vendor", "Donation", "Internal Procurement"],
      required: true,
    },

    vendorDetails: {
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      orderNumber: { type: String },
      purchaseDate: { type: Date },
      warrantyExpiry: { type: Date }
    },

    location: {
      storageArea: { type: String },
      shelf: { type: String },
      bin: { type: String }
    },

    status: {
      type: String,
      enum: ["Available", "Issued", "Low Stock", "Expired", "Damaged", "Disposed", "Maintenance", "Deleted"],
      default: "Available"
    },

    lastAuditDate: { type: Date },
    lastIssuedDate: { type: Date },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 🔢 Virtual to calculate total quantity from batches
materialSchema.virtual('totalQuantity').get(function () {
  if (this.batches && this.batches.length > 0) {
    return this.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  }
  return this.quantity;
});

// ⏰ Virtual to determine expiry status
materialSchema.virtual('expiryStatus').get(function () {
  const now = new Date();
  if (!this.batches || this.batches.length === 0) return 'N/A';

  const expiringSoon = this.batches.some(batch =>
    batch.expiryDate &&
    new Date(batch.expiryDate) > now &&
    new Date(batch.expiryDate) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  );

  const expired = this.batches.some(batch =>
    batch.expiryDate && new Date(batch.expiryDate) <= now
  );

  if (expired) return 'Expired';
  if (expiringSoon) return 'Expiring Soon';
  return 'OK';
});

// 🔁 Pre-save hook to update status
materialSchema.pre("save", function (next) {
  const now = new Date();
  const totalQty = this.totalQuantity;

  if (totalQty <= 0) {
    this.status = "Issued";
  } else if (this.minStockLevel && totalQty <= this.minStockLevel) {
    this.status = "Low Stock";
  } else if (this.status === "Low Stock" && totalQty > this.minStockLevel) {
    this.status = "Available";
  }

  // Check expiry
  if (this.batches && this.batches.some(batch =>
    batch.expiryDate && new Date(batch.expiryDate) <= now)) {
    this.status = "Expired";
  }

  next();
});

// 🔍 Indexes for text search
materialSchema.index({
  name: 'text',
  description: 'text',
  serialNumber: 'text',
  'batches.batchNumber': 'text'
});

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
export default Material;
