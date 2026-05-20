import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IRoleType extends Document {
  name: string;
  order: number;
  isActive: boolean;
}

const RoleTypeSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const RoleType: Model<IRoleType> =
  models.RoleType || mongoose.model<IRoleType>('RoleType', RoleTypeSchema);

export default RoleType;
