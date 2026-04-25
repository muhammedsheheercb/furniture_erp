import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemDocument extends Document {
  itemNumber: string;
  name: string;
  unit: string;
  category?: string;
  salesAmount: number;
  purchaseAmount: number;
  quantity: number;
  manufacturingDate?: Date;
  expiryDate?: Date;
  supplierRef?: mongoose.Types.ObjectId;
  supplierName?: string;
  batches?: {
    purchaseId?: mongoose.Types.ObjectId;
    purchaseNumber?: string;
    batchNumber?: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
    purchasePrice: number;
    salePrice: number;
    quantity: number;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const ItemSchema = new Schema<IItemDocument>(
  {
    itemNumber: {
      type: String,
      required: [true, "Item number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    unit: {
      type: String,
      enum: ["pcs", "meters", "sq.meters", "kg", "liters", "box", "set", "roll"],
      default: "pcs",
    },
    category: {
      type: String,
      trim: true,
    },
    salesAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    purchaseAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    quantity: {
      type: Number,
      required: false,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    supplierRef: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    supplierName: {
      type: String,
      trim: true,
    },
    batches: [
      {
        purchaseId: { type: Schema.Types.ObjectId, ref: "Purchase" },
        purchaseNumber: String,
        batchNumber: String,
        manufacturingDate: Date,
        expiryDate: Date,
        purchasePrice: Number,
        salePrice: Number,
        quantity: Number,
        createdAt: { type: Date, default: Date.now },
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ItemSchema.virtual("stockValue").get(function () {
  return (this.purchaseAmount || 0) * (this.quantity || 0);
});

ItemSchema.index({ name: "text", itemNumber: "text" });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Item;
}

const Item: Model<IItemDocument> =
  mongoose.models.Item || mongoose.model<IItemDocument>("Item", ItemSchema);

export default Item;
