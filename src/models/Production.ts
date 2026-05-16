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
      dimensions?: {
        width?: number;
        height?: number;
        depth?: number;
        weight?: number;
        unit?: string;
      };
      bom?: {
        materialId: string;
        materialName: string;
        materialCode: string;
        unit: string;
        quantity: number;
      }[];
      variants?: {
        colors: string[];
        sizes: string[];
        finishes: string[];
      };
      pricing?: {
        materialCost: number;
        laborCost: number;
        extraCost: number;
        totalCost: number;
        profitMargin: number;
        sellingPrice: number;
        discountPrice?: number;
      };
    }[];
  status: "pending" | "processing" | "finished";
  remarks?: string;
  deliveryDate?: Date;
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
        dimensions: {
          width: Number,
          height: Number,
          depth: Number,
          weight: Number,
          unit: String
        },
        bom: [
          {
            materialId: { type: Schema.Types.ObjectId, ref: "Item" },
            materialName: String,
            materialCode: String,
            unit: String,
            quantity: Number
          }
        ],
        variants: {
          colors: [String],
          sizes: [String],
          finishes: [String]
        },
        pricing: {
          materialCost: Number,
          laborCost: Number,
          extraCost: Number,
          totalCost: Number,
          profitMargin: Number,
          sellingPrice: Number,
          discountPrice: Number
        }
      },
    ],
    status: { type: String, enum: ["pending", "processing", "finished"], default: "pending" },
    remarks: String,
    deliveryDate: Date,
  },
  { timestamps: true }
);

const Production: Model<IProductionDocument> =
  mongoose.models.Production ||
  mongoose.model<IProductionDocument>("Production", ProductionSchema);

export default Production;
