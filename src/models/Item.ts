import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemDocument extends Document {
  itemNumber: string; // SKU
  name: string;
  category: string;
  primaryMaterial: string;
  purchaseAmount: number; // Cost Price
  salesAmount: number; // Selling Price
  mrp: number;
  quantity: number; // Current Stock
  reorderLevel: number;
  unit: string;
  status: "active" | "inactive" | "discontinued";
  isManufactured: boolean;
  
  // Optional
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  color?: string;
  finish?: string;
  description?: string;
  taxRate?: number;
  leadTime?: number;
  supplierRef?: mongoose.Types.ObjectId;
  supplierName?: string;
  warrantyPeriod?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const ItemSchema = new Schema<IItemDocument>(
  {
    itemNumber: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    primaryMaterial: {
      type: String,
      required: [true, "Primary material is required"],
      trim: true,
    },
    purchaseAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    salesAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    mrp: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 5,
    },
    unit: {
      type: String,
      required: true,
      default: "Piece",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
    isManufactured: {
      type: Boolean,
      default: false,
    },
    
    // Optional
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    color: String,
    finish: String,
    description: String,
    taxRate: {
      type: Number,
      default: 0,
    },
    leadTime: Number,
    supplierRef: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    supplierName: String,
    warrantyPeriod: String,

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

ItemSchema.index({ name: "text", itemNumber: "text" });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Item;
}

const Item: Model<IItemDocument> =
  mongoose.models.Item || mongoose.model<IItemDocument>("Item", ItemSchema);

export default Item;
