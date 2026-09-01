import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemDocument extends Document {
  itemNumber: string;
  name: string;
  category: string;
  primaryMaterial: string;
  purchaseAmount: number;
  salesAmount: number;
  mrp: number;
  quantity: number;
  reorderLevel: number;
  unit: string;
  status: "active" | "inactive" | "discontinued";
  isManufactured: boolean;
  description?: string;

  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };

  pricing?: {
    materialCost?: number;
    laborCost?: number;
    extraCost?: number;
    totalCost?: number;
    profitMargin?: number;
    sellingPrice?: number;
    discountPrice?: number;
  };

  bom?: {
    materialId?: string;
    materialName?: string;
    materialCode?: string;
    unit?: string;
    quantity?: number;
    batchNumber?: string;
    pricePerUnit?: number;
    availableQty?: number;
    subtotal?: number;
  }[];

  variants?: {
    colors?: string[];
    sizes?: string[];
    finishes?: string[];
  };

  color?: string;
  finish?: string;
  taxRate?: number;
  leadTime?: number;
  supplierRef?: mongoose.Types.ObjectId;
  supplierName?: string;
  warrantyPeriod?: string;

  batches?: {
    purchaseId?: string;
    purchaseNumber?: string;
    batchNumber?: string;
    manufacturingDate?: string;
    expiryDate?: string;
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
    purchaseAmount: { type: Number, required: true, default: 0 },
    salesAmount: { type: Number, required: true, default: 0 },
    mrp: { type: Number, required: true, default: 0 },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    reorderLevel: { type: Number, required: true, default: 5 },
    unit: { type: String, required: true, default: "Piece" },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
    isManufactured: { type: Boolean, default: false },
    description: { type: String },

    dimensions: {
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
      weight: { type: Number },
      unit: { type: String, default: "cm" },
    },

    pricing: {
      materialCost: { type: Number, default: 0 },
      laborCost: { type: Number, default: 0 },
      extraCost: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      profitMargin: { type: Number, default: 0 },
      sellingPrice: { type: Number, default: 0 },
      discountPrice: { type: Number, default: 0 },
    },

    bom: [
      {
        materialId: { type: String },
        materialName: { type: String },
        materialCode: { type: String },
        unit: { type: String },
        quantity: { type: Number, default: 1 },
        batchNumber: { type: String },
        pricePerUnit: { type: Number, default: 0 },
        availableQty: { type: Number, default: 0 },
        subtotal: { type: Number, default: 0 },
      },
    ],

    variants: {
      colors: [{ type: String }],
      sizes: [{ type: String }],
      finishes: [{ type: String }],
    },

    color: { type: String },
    finish: { type: String },
    taxRate: { type: Number, default: 0 },
    leadTime: { type: Number },
    supplierRef: { type: Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    warrantyPeriod: { type: String },

    batches: [
      {
        purchaseId: { type: String },
        purchaseNumber: { type: String },
        batchNumber: { type: String },
        manufacturingDate: { type: String },
        expiryDate: { type: String },
        purchasePrice: { type: Number },
        salePrice: { type: Number },
        quantity: { type: Number },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ItemSchema.index({ name: "text", itemNumber: "text" });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Item;
}

const Item: Model<IItemDocument> =
  mongoose.models.Item || mongoose.model<IItemDocument>("Item", ItemSchema);

export default Item;
