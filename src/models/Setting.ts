import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettingDocument extends Document {
  shopName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  quotationPrefix: string;
  orderPrefix: string;
  invoicePrefix: string;
  taxRate: number;
  currencySymbol: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISettingDocument>(
  {
    shopName: { type: String, default: "Diamond Home Furniture" },
    gstin: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    quotationPrefix: { type: String, default: "QT-" },
    orderPrefix: { type: String, default: "SO-" },
    invoicePrefix: { type: String, default: "INV-" },
    taxRate: { type: Number, default: 18 },
    currencySymbol: { type: String, default: "₹" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Setting;
}

const Setting: Model<ISettingDocument> =
  mongoose.models.Setting ?? mongoose.model<ISettingDocument>("Setting", SettingSchema);

export default Setting;
