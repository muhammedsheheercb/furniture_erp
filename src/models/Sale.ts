import mongoose, { Schema, Document, Model } from "mongoose";

const SaleItemSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    itemNumber: { type: String },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    isFOC: { type: Boolean, default: false },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    batch: { type: String },
    color: { type: String },
    material: { type: String },
    size: { type: String },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

export interface ISaleDocument extends Document {
  saleNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerNumber: string;
  items: {
    itemId?: mongoose.Types.ObjectId;
    itemNumber?: string;
    itemName: string;
    quantity: number;
    price: number;
    discount: number;
    isFOC?: boolean;
    manufacturingDate?: Date;
    expiryDate?: Date;
    batch?: string;
    color?: string;
    material?: string;
    size?: string;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: "cash" | "bank" | "credit";
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isTaxInvoice?: boolean;
  advancePaid?: number;
  deliveryDate?: Date;
  deliveryAddress?: string;
  remarks?: string;
  status: "pending" | "processing" | "delivered" | "invoiced";
}

const SaleSchema = new Schema<ISaleDocument>(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, required: true },
    customerNumber: { type: String },
    items: { type: [SaleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentType: {
      type: String,
      enum: ["cash", "credit", "bank"],
      required: true,
    },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isTaxInvoice: { type: Boolean, default: false },
    advancePaid: { type: Number, default: 0 },
    deliveryDate: { type: Date },
    deliveryAddress: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: { 
      type: String, 
      enum: ["pending", "processing", "delivered", "invoiced"],
      default: "pending"
    },
  },
  { timestamps: true }
);

SaleSchema.index({ date: -1 });
SaleSchema.index({ customerId: 1 });
SaleSchema.index({ customerId: 1, "items.itemId": 1, date: -1 });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Sale;
}

const Sale: Model<ISaleDocument> =
  mongoose.models.Sale ?? mongoose.model<ISaleDocument>("Sale", SaleSchema);

export default Sale;