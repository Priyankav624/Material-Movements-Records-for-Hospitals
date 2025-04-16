// import mongoose from "mongoose";

// const materialSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },

//     category: {
//       type: String,
//       enum: ["Reusable", "Consumable", "Hazardous", "Critical"],
//       required: true,
//     },

//     serialNumber: {
//       type: String,
//       unique: true,
//       sparse: true,
//     },

//     quantity: {
//       type: Number,
//       min: 0,
//       required: function () {
//         return this.category === "Consumable"; 
//       },
//     },

//     expiryDate: {
//       type: Date,
//       required: function () {
//         return this.category === "Consumable" || this.category === "Hazardous"; 
//       },
//     },

//     source: {
//       type: String,
//       enum: ["Vendor", "Donation", "Internal Procurement"],
//       required: true,
//     },

//     vendorDetails: {
//       name: { type: String },
//       contact: { type: String },
//     },

//     expiryDate: {
//       type: Date,
//       validate: {
//         validator: function(value) {
//           // Only validate if the item has an expiry date
//           if (!value) return true;
//           return value > new Date();
//         },
//         message: 'Expiry date must be in the future'
//       },
//       required: function() {
//         return this.category === "Consumable" || this.category === "Hazardous";
//       }
//     },

//     status: {
//       type: String,
//       enum: ["Available", "Issued", "Low Stock", "Expired", "Damaged", "Deleted"],
//       default: "Available",
//       validate: {
//         validator: function(value) {
//           if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
//             return value === "Expired";
//           }
//           return true;
//         },
//         message: 'Expired items must have status "Expired"'
//       }
//     },

//     addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// materialSchema.pre('save', function(next) {
//   const now = new Date();
  
//   // Auto-update status for expired items
//   if (this.expiryDate && new Date(this.expiryDate) <= now) {
//     this.status = 'Expired';
//   }
  
//   // Auto-update status for low stock
//   if (this.quantity <= 0 && this.status !== 'Expired') {
//     this.status = 'Low Stock';
//   }
  
//   // Reset to Available if quantity is replenished and not expired
//   if (this.quantity > 0 && this.status === 'Low Stock' && 
//       (!this.expiryDate || new Date(this.expiryDate) > now)) {
//     this.status = 'Available';
//   }

//   next();
// });

// const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
// export default Material; 

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
    unit: { type: String, enum: ["pieces", "boxes", "liters", "kg", "units"], default: "pieces" },
    minStockLevel: { type: Number, default: 5 },
    batches: [{
      batchNumber: { type: String, required: true },
      quantity: { type: Number, required: true },
      expiryDate: Date,
      manufacturingDate: Date,
      supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
      purchasePrice: Number,
      purchaseDate: Date,
      status: { type: String, enum: ['active', 'expired', 'depleted'], default: 'active' }
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
      enum: ["Available", "Issued", "Low Stock", "Expired", "Damaged", "Disposed", "Maintenance"],
      default: "Available"
    },

    lastAuditDate: { type: Date },
    lastIssuedDate: { type: Date },
    
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for total quantity (sum of all batches)
materialSchema.virtual('totalQuantity').get(function() {
  if (this.batches && this.batches.length > 0) {
    return this.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  }
  return this.quantity;
});

// Virtual for expiry status
materialSchema.virtual('expiryStatus').get(function() {
  if (!this.batches || this.batches.length === 0) return 'N/A';
  
  const now = new Date();
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

// Pre-save hooks
materialSchema.pre('save', function(next) {
  const now = new Date();
  
  // Auto-update status based on quantity
  if (this.isModified('quantity') || this.isModified('batches')) {
    const totalQty = this.totalQuantity;
    
    if (totalQty <= 0) {
      this.status = this.status === 'Available' ? 'Issued' : this.status;
    } else if (this.minStockLevel && totalQty <= this.minStockLevel) {
      this.status = 'Low Stock';
    } else if (this.status === 'Low Stock' && totalQty > this.minStockLevel) {
      this.status = 'Available';
    }
  }
  
  // Auto-update status based on batch expiry
  if (this.batches && this.batches.length > 0) {
    const hasExpiredBatches = this.batches.some(batch => 
      batch.expiryDate && new Date(batch.expiryDate) <= now
    );
    
    if (hasExpiredBatches) {
      this.status = 'Expired';
    }
  }
  
  this.lastUpdatedAt = now;
  next();
});

// // Indexes for better performance
// materialSchema.index({ name: 'text', description: 'text' });
// materialSchema.index({ status: 1 });
// materialSchema.index({ category: 1 });
// materialSchema.index({ 'batches.expiryDate': 1 });

// In your Material model (models/material.js)
// materialSchema.index({ 
//   name: 'text', 
//   description: 'text', 
//   serialNumber: 'text',
//   'batches.batchNumber': 'text'
// });

// Create text index if it doesn't exist


const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
// Material.init().then(() => {
//   Material.ensureIndexes();
// });
export default Material;