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

// 作品ごとのコメントを新着順で取得するクエリ用 (api/artworks/[id]/comments)。
// 実DBに存在していたが未宣言だった複合 index を明示化。artworkId 単体 index は複合の prefix で代替可能 (将来削除候補)。
CommentSchema.index({ artworkId: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);