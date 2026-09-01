import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpenseDocument extends Document {
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  date: Date;
  reference?: string;
  description?: string;
  paymentType: "cash" | "credit" | "debit" | "bank";
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    reference: { type: String },
    description: { type: String },
    paymentType: {
      type: String,
      enum: ["cash", "credit", "debit", "bank"],
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Expense;
}

const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense ??
  mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);

export default Expense;
