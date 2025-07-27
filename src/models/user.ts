import mongoose, { Document, Schema } from 'mongoose';

export interface IUserData {
  _id: string;
  username: string;
  fullName: string;
  mutedTags?: string[];
  showNSFW?: boolean;
}

// Mongoose DocumentとしてのUserの型
export interface IUser extends Document {
  username: string;
  fullName: string;
  hashedPassword: string;
  mutedTags?: string[];
  showNSFW?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username.'],
    unique: true,
  },
  fullName: {
    type: String,
    required: [true, '本名（漢字）を入力してください。'],
    unique: true,
  },
  hashedPassword: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  mutedTags: {
    type: [String],
    default: [],
  },
  showNSFW: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);