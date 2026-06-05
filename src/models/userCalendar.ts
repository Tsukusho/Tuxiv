import mongoose, { type Document, type Model, models, Schema } from "mongoose";

export interface IPerformanceRoleIndex {
  performanceId: Schema.Types.ObjectId;
  roleTypeIds: Schema.Types.ObjectId[];
}

export interface IUserCalendar extends Document {
  userId: Schema.Types.ObjectId;
  performances: IPerformanceRoleIndex[];
  lastInputDate?: Date;
}

const performanceRoleSchema = new Schema(
  {
    performanceId: { type: Schema.Types.ObjectId, ref: "Performance", required: true },
    roleTypeIds: [{ type: Schema.Types.ObjectId, ref: "RoleType" }],
  },
  { _id: false },
);

const UserCalendarSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    performances: { type: [performanceRoleSchema], default: [] },
    lastInputDate: { type: Date },
  },
  { timestamps: true },
);

UserCalendarSchema.index({ "performances.performanceId": 1, "performances.roleTypeIds": 1 });

const UserCalendar: Model<IUserCalendar> =
  models.UserCalendar || mongoose.model<IUserCalendar>("UserCalendar", UserCalendarSchema);

export default UserCalendar;
