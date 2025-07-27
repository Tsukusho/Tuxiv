import mongoose, { Document, Schema } from 'mongoose';

interface IImage {
  path: string;
  mimeType: string;
  size: number;
  order: number;
}

export interface IArtworkData {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  title: string;
  description?: string;
  images: (IImage & { url?: string })[];
  tags: string[];
  isNSFW: boolean;
  isAnonymous: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface IArtwork extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  title: string;
  description?: string;
  images: IImage[];
  tags: string[];
  isNSFW: boolean;
  isAnonymous: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema: Schema = new Schema({
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  order: { type: Number, required: true },
});

const ArtworkSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  images: { type: [ImageSchema], required: true },
  tags: { type: [String], default: [] },
  isNSFW: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Artwork || mongoose.model<IArtwork>('Artwork', ArtworkSchema);