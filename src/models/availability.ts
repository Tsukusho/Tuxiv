import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IAvailability extends Document {
  eventId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  name: string;
  grade: string;
  roles: string[];
  availableSlots: {
    start: Date;
    end: Date;
    type: 'available' | 'undecided' | 'online'; 
  }[];
  lastInputDate?: Date; // 予定入力の最終日情報
}

const AvailabilitySchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'ScheduleEvent', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  grade: { type: String, required: true },
  roles: [{ type: String }],
  availableSlots: [{
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    type: { type: String, enum: ['available', 'undecided', 'online'], required: true, default: 'available' },
  }],
  lastInputDate: { type: Date }, // 予定入力の最終日情報
}, { timestamps: true });

// 複合インデックス: eventIdとuserIdの組み合わせで高速検索
AvailabilitySchema.index({ eventId: 1, userId: 1 });

const Availability: Model<IAvailability> = models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);

export default Availability;
