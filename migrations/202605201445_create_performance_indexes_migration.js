// Performance コレクションに { year, typeId } unique index を作成
// 初期データは無し (Admin が管理画面から動的に追加)

db.performances.createIndex({ year: 1, typeId: 1 }, { unique: true });
