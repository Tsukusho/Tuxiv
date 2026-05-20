// 全 User に対して UserCalendar 空ドキュメントを生成 (1ユーザー1個)
// userId unique index と performances 配列のマルチキー複合 index を作成

const now = new Date();
const userIds = db.users.distinct('_id');

const docs = userIds.map(uid => ({
  userId: uid,
  performances: [],
  lastInputDate: null,
  createdAt: now,
  updatedAt: now
}));

db.usercalendars.insertMany(docs);

db.usercalendars.createIndex({ userId: 1 }, { unique: true });
db.usercalendars.createIndex({ 'performances.performanceId': 1, 'performances.roleTypeIds': 1 });
