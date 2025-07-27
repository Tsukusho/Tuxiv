import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  artworkId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
}, { timestamps: true });

LikeSchema.index({ userId: 1, artworkId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);