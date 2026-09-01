import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryDocument extends Document {
  saleId: mongoose.Types.ObjectId;
  saleNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  items: {
    itemName: string;
    quantity: number;
    status: "pending" | "delivered";
  }[];
  status: "pending" | "delivered";
  deliveryDate?: Date;
  deliveryAddress?: string;
  remarks?: string;
  deliveryPartner?: string;
  driverName?: string;
  driverContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDeliveryDocument>(
  {
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
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "delivered"],
          default: "pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "delivered"],
      default: "pending",
    },
    deliveryDate: Date,
    deliveryAddress: String,
    remarks: String,
    deliveryPartner: String,
    driverName: String,
    driverContact: String,
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Delivery;
}

const Delivery: Model<IDeliveryDocument> =
  mongoose.models.Delivery ||
  mongoose.model<IDeliveryDocument>("Delivery", DeliverySchema);

export default Delivery;
