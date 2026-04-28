import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuotationDocument extends Document {
  quotationNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerMobile?: string;
  customerAddress?: string;
  items: {
    itemId?: mongoose.Types.ObjectId;
    itemNumber?: string;
    itemName: string;
    description?: string;
    unit: string;
    quantity: number;
    price: number;
    discount: number;
    color?: string;
    material?: string;
    size?: string;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: "quote" | "sale" | "reject";
  deliveryStatus: "pending" | "delivered" | "partial";
  deliveryDate?: Date;
  deliveredDate?: Date;
  notes?: string;
  validUntil?: Date;
  date: Date;
  convertedToSaleId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const QuotationSchema = new Schema<IQuotationDocument>(
  {
    quotationNumber: {
      type: String,
      required: [true, "Quotation number is required"],
      unique: true,
      trim: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true, trim: true },
    customerMobile: { type: String, trim: true },
    customerAddress: { type: String, trim: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item" },
        itemNumber: String,
        itemName: { type: String, required: true },
        description: String,
        unit: { type: String, default: "pcs" },
        quantity: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        color: String,
        material: String,
        size: String,
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["quote", "sale", "reject"],
      default: "quote",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "delivered", "partial"],
      default: "pending",
    },
    deliveryDate: { type: Date },
    deliveredDate: { type: Date },
    notes: { type: String, trim: true },
    validUntil: { type: Date },
    date: { type: Date, required: true, default: Date.now },
    convertedToSaleId: { type: Schema.Types.ObjectId, ref: "Sale" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

QuotationSchema.index({ customerName: "text", quotationNumber: "text" });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Quotation;
}

const Quotation: Model<IQuotationDocument> =
  mongoose.models.Quotation ||
  mongoose.model<IQuotationDocument>("Quotation", QuotationSchema);

export default Quotation;
