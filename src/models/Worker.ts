import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkerDocument extends Document {
  name: string;
  contactNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkerSchema = new Schema<IWorkerDocument>(
  {
    name: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

if (mongoose.models.Worker) {
  delete (mongoose.models as any).Worker;
}

const Worker: Model<IWorkerDocument> =
  mongoose.model<IWorkerDocument>("Worker", WorkerSchema);

export default Worker;
