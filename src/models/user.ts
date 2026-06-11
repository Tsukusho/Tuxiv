import mongoose, { type Document, Schema } from "mongoose";

export interface IUserData {
  _id: string;
  username: string;
  fullName: string;
  studentId?: string;
  grade?: number;
  isGraduated?: boolean;
  mutedTags?: string[];
  showNSFW?: boolean;
  profileImage?: {
    path: string;
    mimeType: string;
    uploadedAt: Date;
  };
}

// Mongoose DocumentとしてのUserの型
export interface IUser extends Document {
  username: string;
  fullName: string;
  studentId?: string;
  hashedPassword: string;
  isAdmin?: boolean;
  isGraduated?: boolean;
  showOBOGPost?: boolean;
  grade?: number;
  mutedTags?: string[];
  showNSFW?: boolean;
  profileImage?: {
    path: string;
    mimeType: string;
    uploadedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username."],
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "本名（漢字）を入力してください。"],
    },
    studentId: {
      type: String,
      match: /^\d{9}$/,
      unique: true,
      sparse: true,
    },
    hashedPassword: {
      type: String,
      required: [true, "Please provide a password."],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isGraduated: {
      type: Boolean,
      default: false,
    },
    showOBOGPost: {
      type: Boolean,
      default: true,
    },
    grade: {
      type: Number,
    },
    mutedTags: {
      type: [String],
      default: [],
    },
    showNSFW: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: {
        path: { type: String, required: true },
        mimeType: { type: String, required: true },
        uploadedAt: { type: Date, required: true },
      },
      required: false,
    },
  },
  { timestamps: true },
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
