import mongoose, { Schema, model, models } from "mongoose";

const MaterialSchema = new Schema(
  {
    name:      { type: String, required: true },
    code:      { type: String, required: true, unique: true },
    category:  { type: String, enum: ["plywood", "wood", "fabric", "foam", "hardware", "polish", "other"], default: "other" },
    unit:      { type: String, enum: ["Sheet", "Piece", "Meter", "Kg", "Sqft", "Liter"], default: "Piece" },
    size:      { type: String, default: "" },
    thickness: { type: String, default: "" },
    brand:     { type: String, default: "" },
    currentStock:      { type: Number, default: 0 },
    reorderLevel:      { type: Number, default: 10 },
    lastPurchasePrice: { type: Number, default: 0 },
    batches: [
      {
        purchaseId:     { type: String },
        purchaseNumber: { type: String },
        batchNumber:    { type: String },
        purchaseDate:   { type: Date },
        purchasePrice:  { type: Number, required: true },
        quantity:       { type: Number, required: true },
        createdAt:      { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Material;
}

const Material = models.Material || model("Material", MaterialSchema);
export default Material;
