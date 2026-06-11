// 旧 Availability.grade(string) を User.grade(int) へコピーする
// 1ユーザーに複数 Availability があり得るので、updatedAt が新しい方を採用 (既にgrade設定済みのUserはスキップ)

db.availabilities
  .find({ grade: { $exists: true, $ne: null } })
  .sort({ updatedAt: -1 })
  .forEach((a) => {
    const grade = parseInt(a.grade, 10);
    if (!Number.isNaN(grade)) {
      db.users.updateOne({ _id: a.userId, grade: { $exists: false } }, { $set: { grade } });
    }
  });
