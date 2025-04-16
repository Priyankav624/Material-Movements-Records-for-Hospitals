import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  website: { type: String, trim: true },
  taxId: { type: String },
  categories: [{ type: String }], // Types of materials they supply
  contractStartDate: { type: Date },
  contractEndDate: { type: Date },
  paymentTerms: { type: String },
  notes: { type: String },
  active: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export default Vendor;