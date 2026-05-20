import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IPerformance extends Document {
  year: number;
  typeId: Schema.Types.ObjectId;
  displayName: string;
}

const PerformanceSchema: Schema = new Schema({
  year: { type: Number, required: true },
  typeId: { type: Schema.Types.ObjectId, ref: 'PerformanceType', required: true },
  displayName: { type: String, required: true },
}, { timestamps: true });

PerformanceSchema.index({ year: 1, typeId: 1 }, { unique: true });

const Performance: Model<IPerformance> =
  models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);

export default Performance;
