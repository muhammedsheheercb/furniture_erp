import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerDocument extends Document {
  customerNumber: string;
  name: string;
  mobile: string;
  openingBalance: number;
  creditBalance: number;
  balanceHistory: {
    date: Date;
    amount: number;
    type: "payment" | "adjustment";
    paymentMethod?: "cash" | "bank" | "credit";
    note?: string;
  }[];
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    customerNumber: {
      type: String,
      required: [true, "Customer number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
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
        type: { type: String, enum: ["payment", "adjustment"], default: "payment" },
        paymentMethod: { type: String, enum: ["cash", "bank", "credit"] },
        note: { type: String },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: "text", customerNumber: "text", mobile: "text" });

// Schema Version: 1.0.2 - Full financial Ledger integration
// Force re-registration to pick up new schema fields in Next.js dev mode
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Customer;
}

const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDocument>("Customer", CustomerSchema);

export default Customer;