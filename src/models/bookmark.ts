import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  artworkId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
}, { timestamps: true });

BookmarkSchema.index({ userId: 1, artworkId: 1 }, { unique: true });

export default mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);