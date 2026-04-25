import mongoose, { Schema, Document } from "mongoose";

export interface ISaleReturnItem {
    itemId: string;
    itemNumber: string;
    itemName: string;
    quantity: number;
    batch?: string;
    price: number;
    total: number;
    reason: string;
}

export interface ISaleReturn extends Document {
    returnNumber: string;
    saleId: string; // Reference to original sale
    customerId: string;
    customerName: string;
    items: ISaleReturnItem[];
    totalAmount: number;
    date: Date;
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
}

const SaleReturnItemSchema = new Schema<ISaleReturnItem>({
    itemId: { type: String, required: true },
    itemNumber: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    batch: { type: String },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    reason: { type: String, required: true },
});

const SaleReturnSchema = new Schema<ISaleReturn>({
    returnNumber: { type: String, required: true, unique: true },
    saleId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    items: [SaleReturnItemSchema],
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).SaleReturn;
}

export default mongoose.models.SaleReturn || mongoose.model<ISaleReturn>("SaleReturn", SaleReturnSchema);
