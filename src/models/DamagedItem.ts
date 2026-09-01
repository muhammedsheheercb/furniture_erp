import mongoose, { Schema, Document } from "mongoose";

export interface IDamagedItem extends Document {
  itemNumber: string;
  itemName: string;
  itemId: string;
  quantity: number;
  batch?: string;
  reason: string;
  date: Date;
  disposed: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const DamagedItemSchema = new Schema<IDamagedItem>(
  {
    itemNumber: { type: String, required: true },
    itemName: { type: String, required: true },
    itemId: { type: String, required: true, ref: "Item" },
    quantity: { type: Number, required: true },
    batch: { type: String },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    disposed: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).DamagedItem;
}

export default mongoose.models.DamagedItem ||
  mongoose.model<IDamagedItem>("DamagedItem", DamagedItemSchema);
