// User.fullName の unique index を削除する (フィールド本体は保持)
// 同姓同名で新規登録できない問題を回避するため

db.users.dropIndex('fullName_1');
