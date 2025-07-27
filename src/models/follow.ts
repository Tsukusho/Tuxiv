import mongoose, { Document, Schema } from 'mongoose';

export interface IFollow extends Document {
  followerId: mongoose.Schema.Types.ObjectId;
  followingId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const FollowSchema: Schema = new Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema);