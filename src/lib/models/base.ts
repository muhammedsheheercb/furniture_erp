import mongoose, { Schema, model, models } from 'mongoose';

import User from "@/models/User";
export { User };

const ProductSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['sofa', 'bed', 'dining', 'chair', 'table', 'wardrobe', 'office', 'other'] 
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'inch' }
  },
  weight: Number,
  material: String,
  finish: String,
  color: String,
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  mrp: Number,
  currentStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 5 },
  isManufactured: { type: Boolean, default: false },
  leadTimeDays: Number,
  status: { type: String, default: 'active', enum: ['active', 'discontinued'] },
  description: String,
}, { timestamps: true });

export const Product = models.Product || model('Product', ProductSchema);

const CustomerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  billingAddress: String,
  deliveryAddress: String,
  gstin: String,
  customerType: { type: String, enum: ['retail', 'wholesale', 'designer'], default: 'retail' },
  notes: String,
  totalPurchases: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
}, { timestamps: true });

export const Customer = models.Customer || model('Customer', CustomerSchema);

const SupplierSchema = new Schema({
  name: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  gstin: String,
  materialsSupplied: [String],
  outstandingPayable: { type: Number, default: 0 },
  notes: String,
}, { timestamps: true });

export const Supplier = models.Supplier || model('Supplier', SupplierSchema);

const RawMaterialSchema = new Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['wood', 'fabric', 'foam', 'hardware', 'polish', 'other'] 
  },
  unit: { type: String, enum: ['piece', 'meter', 'kg', 'sqft', 'liter'] },
  currentStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  lastPurchasePrice: Number,
  preferredSupplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
}, { timestamps: true });

export const RawMaterial = models.RawMaterial || model('RawMaterial', RawMaterialSchema);
