import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchaserDocument extends Document {
  name: string;
  mobile: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaserSchema = new Schema<IPurchaserDocument>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Purchaser;
}

const Purchaser: Model<IPurchaserDocument> =
  mongoose.models.Purchaser ??
  mongoose.model<IPurchaserDocument>("Purchaser", PurchaserSchema);

export default Purchaser;
