// User コレクションにisAdmin / isGraduated / showOBOGPostを default 値で追加し、studentId に sparse unique index を作成
// テストDBがない設計なので、追加のみ　削除は別途行う。

db.users.updateMany(
  {},
  {
    $set: {
      isAdmin: false,
      isGraduated: false,
      showOBOGPost: true
    }
  }
);

db.users.createIndex({ studentId: 1 }, { unique: true, sparse: true });
