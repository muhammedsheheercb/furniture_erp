import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUserPermissions } from "@/types";

export interface IUserDocument extends Document {
  name?: string;
  email: string;
  password: string;
  role: "admin" | "staff";
  permissions?: IUserPermissions;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
    permissions: {
      type: Map,
      of: new Schema({
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        approve: { type: Boolean, default: false },
        export: { type: Boolean, default: false },
      }, { _id: false }),
      default: {},
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    this.password = await bcrypt.hash(this.password, 12);
  } catch (err: any) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Force re-registration to pick up new schema hooks in Next.js dev mode
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).User;
}

const User: Model<IUserDocument> =
  mongoose.models.User ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default User;