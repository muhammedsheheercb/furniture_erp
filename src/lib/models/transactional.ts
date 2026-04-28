import mongoose, { Schema, model, models } from 'mongoose';

const BOMSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  materials: [{
    materialId: { type: Schema.Types.ObjectId, ref: 'RawMaterial' },
    quantity: Number,
    unit: String
  }],
  laborCost: { type: Number, default: 0 },
  overheadCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
}, { timestamps: true });

export const BOM = models.BOM || model('BOM', BOMSchema);

const QuotationSchema = new Schema({
  quotationNumber: { type: String, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    qty: Number,
    price: Number,
    discount: { type: Number, default: 0 }
  }],
  subtotal: Number,
  taxAmount: Number,
  total: Number,
  validUntil: Date,
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected'], 
    default: 'draft' 
  },
  notes: String,
}, { timestamps: true });

export const Quotation = models.Quotation || model('Quotation', QuotationSchema);

const SalesOrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    qty: Number,
    price: Number,
    discount: { type: Number, default: 0 },
    isCustom: { type: Boolean, default: false }
  }],
  subtotal: Number,
  taxAmount: Number,
  total: Number,
  advancePaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partial', 'paid'], 
    default: 'pending' 
  },
  orderStatus: { 
    type: String, 
    enum: ['confirmed', 'in-production', 'ready', 'dispatched', 'delivered', 'cancelled'], 
    default: 'confirmed' 
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  notes: String,
}, { timestamps: true });

export const SalesOrder = models.SalesOrder || model('SalesOrder', SalesOrderSchema);

const ProductionOrderSchema = new Schema({
  productionNumber: { type: String, unique: true },
  salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  stage: { 
    type: String, 
    enum: ['cutting', 'assembly', 'finishing', 'polishing', 'ready'], 
    default: 'cutting' 
  },
  materialsConsumed: [{
    materialId: { type: Schema.Types.ObjectId, ref: 'RawMaterial' },
    qty: Number
  }],
  startDate: Date,
  expectedReadyDate: Date,
  actualReadyDate: Date,
  notes: String,
}, { timestamps: true });

export const ProductionOrder = models.ProductionOrder || model('ProductionOrder', ProductionOrderSchema);

const PurchaseOrderSchema = new Schema({
  poNumber: { type: String, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  materials: [{
    materialId: { type: Schema.Types.ObjectId, ref: 'RawMaterial' },
    qty: Number,
    unitPrice: Number
  }],
  total: Number,
  paidAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['ordered', 'received', 'cancelled'], 
    default: 'ordered' 
  },
  orderDate: { type: Date, default: Date.now },
  receivedDate: Date,
}, { timestamps: true });

export const PurchaseOrder = models.PurchaseOrder || model('PurchaseOrder', PurchaseOrderSchema);

const DeliverySchema = new Schema({
  salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  scheduledDate: Date,
  actualDate: Date,
  address: String,
  status: { 
    type: String, 
    enum: ['scheduled', 'dispatched', 'delivered', 'failed'], 
    default: 'scheduled' 
  },
  transportCost: { type: Number, default: 0 },
  notes: String,
}, { timestamps: true });

export const Delivery = models.Delivery || model('Delivery', DeliverySchema);

const ExpenseSchema = new Schema({
  category: { 
    type: String, 
    enum: ['rent', 'electricity', 'labor', 'transport', 'marketing', 'other'],
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: String,
  paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'bank'], default: 'cash' },
}, { timestamps: true });

export const Expense = models.Expense || model('Expense', ExpenseSchema);

const PaymentSchema = new Schema({
  type: { type: String, enum: ['received', 'paid'], required: true },
  referenceType: { type: String, enum: ['sales', 'purchase'], required: true },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['cash', 'upi', 'card', 'bank'], default: 'cash' },
  date: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

export const Payment = models.Payment || model('Payment', PaymentSchema);
