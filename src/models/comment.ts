import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  artworkId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  text: string;
}

const CommentSchema: Schema = new Schema({
  artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);