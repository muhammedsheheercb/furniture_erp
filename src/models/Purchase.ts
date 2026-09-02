import mongoose, { Schema, Document, Model } from "mongoose";

const PurchaseItemSchema = new Schema(
  {
    itemType: {
      type: String,
      enum: ["product", "material"],
      default: "product",
    },
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    materialId: { type: Schema.Types.ObjectId, ref: "Material" },
    itemNumber: { type: String, required: true },
    itemName: { type: String, required: true },
    unit: { type: String, default: "Piece" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, default: 0 },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    batch: { type: String },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export interface IPurchaseDocument extends Document {
  purchaseNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  purchaserId?: mongoose.Types.ObjectId;
  purchaserName?: string;
  supplierNumber: string;
  items: {
    itemType: "product" | "material";
    itemId?: mongoose.Types.ObjectId;
    materialId?: mongoose.Types.ObjectId;
    itemNumber: string;
    itemName: string;
    unit: string;
    quantity: number;
    price: number;
    sellingPrice: number;
    manufacturingDate?: Date;
    expiryDate?: Date;
    batch?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: "cash" | "credit" | "bank";
  paidAmount: number;
  note: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isTaxInvoice?: boolean;
}

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    purchaseNumber: { type: String, required: true, unique: true, trim: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: { type: String, required: true },
    purchaserId: { type: Schema.Types.ObjectId, ref: "Purchaser" },
    purchaserName: { type: String, default: "" },
    supplierNumber: { type: String, default: "" },
    items: { type: [PurchaseItemSchema], required: true },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentType: {
      type: String,
      enum: ["cash", "credit", "bank"],
      required: true,
    },
    paidAmount: { type: Number, default: 0 },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isTaxInvoice: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PurchaseSchema.index({ date: -1 });
PurchaseSchema.index({ supplierId: 1 });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Purchase;
}

const Purchase: Model<IPurchaseDocument> =
  mongoose.models.Purchase ??
  mongoose.model<IPurchaseDocument>("Purchase", PurchaseSchema);

export default Purchase;
