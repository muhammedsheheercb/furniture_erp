import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductionDocument extends Document {
  saleId: mongoose.Types.ObjectId;
  saleNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  items: {
    itemName: string;
    quantity: number;
    color?: string;
    material?: string;
    size?: string;
    status: "pending" | "processing" | "finished";
  }[];
  status: "pending" | "processing" | "finished";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionSchema = new Schema<IProductionDocument>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    saleNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String, required: true },
    items: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        color: String,
        material: String,
        size: String,
        status: { type: String, enum: ["pending", "processing", "finished"], default: "pending" },
      },
    ],
    status: { type: String, enum: ["pending", "processing", "finished"], default: "pending" },
    remarks: String,
  },
  { timestamps: true }
);

const Production: Model<IProductionDocument> =
  mongoose.models.Production ||
  mongoose.model<IProductionDocument>("Production", ProductionSchema);

export default Production;
