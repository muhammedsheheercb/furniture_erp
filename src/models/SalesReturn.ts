import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISalesReturnDocument extends Document {
  returnNumber: string;
  saleId: mongoose.Types.ObjectId;
  saleNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  items: {
    itemId?: mongoose.Types.ObjectId;
    itemName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  reason: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SalesReturnSchema = new Schema<ISalesReturnDocument>(
  {
    returnNumber: { type: String, required: true, unique: true },
    saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    saleNumber: { type: String, required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item" },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const SalesReturn: Model<ISalesReturnDocument> =
  mongoose.models.SalesReturn ||
  mongoose.model<ISalesReturnDocument>("SalesReturn", SalesReturnSchema);

export default SalesReturn;
