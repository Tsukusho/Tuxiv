import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IPerformanceType extends Document {
  name: string;
  order: number;
  isActive: boolean;
}

const PerformanceTypeSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const PerformanceType: Model<IPerformanceType> =
  models.PerformanceType || mongoose.model<IPerformanceType>('PerformanceType', PerformanceTypeSchema);

export default PerformanceType;
