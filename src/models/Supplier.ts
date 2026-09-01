import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplierDocument extends Document {
  supplierNumber: string;
  name: string;
  mobile?: string;
  itemsProvided: string[];
  openingBalance: number;
  creditBalance: number;
  balanceHistory: {
    date: Date;
    amount: number;
    type: "payment" | "adjustment";
    paymentMethod?: "cash" | "bank" | "credit";
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    supplierNumber: {
      type: String,
      required: [true, "Supplier number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      unique: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    itemsProvided: [
      {
        type: String,
      },
    ],
    openingBalance: {
      type: Number,
      default: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    balanceHistory: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        type: {
          type: String,
          enum: ["payment", "adjustment"],
          default: "payment",
        },
        paymentMethod: { type: String, enum: ["cash", "bank", "credit"] },
        note: { type: String },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

SupplierSchema.index({ name: "text", supplierNumber: "text" });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Supplier;
}

const Supplier: Model<ISupplierDocument> =
  mongoose.models.Supplier ??
  mongoose.model<ISupplierDocument>("Supplier", SupplierSchema);

export default Supplier;
