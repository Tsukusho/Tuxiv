import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IScheduleEvent extends Document {
  title: string;
  description?: string;
  // 候補日時を格納する配列
  candidateDates: {
    start: Date;
    end: Date;
  }[];
  // 作成者のUser IDを関連付け
  createdBy: Schema.Types.ObjectId;
}

const ScheduleEventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  candidateDates: [{
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// すでにモデルが存在する場合はそれを使用し、なければ新規作成
const ScheduleEvent: Model<IScheduleEvent> = models.ScheduleEvent || mongoose.model<IScheduleEvent>('ScheduleEvent', ScheduleEventSchema);

export default ScheduleEvent;