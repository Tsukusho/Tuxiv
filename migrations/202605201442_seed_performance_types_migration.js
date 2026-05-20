// 公演種類テーブルの初期データをシードし、name unique index を作成

const now = new Date();

db.performancetypes.insertMany([
  { name: '新歓公演', order: 1, isActive: true, createdAt: now, updatedAt: now },
  { name: '新人公演', order: 2, isActive: true, createdAt: now, updatedAt: now },
  { name: '雙峰祭公演', order: 3, isActive: true, createdAt: now, updatedAt: now },
  { name: '卒業公演', order: 4, isActive: true, createdAt: now, updatedAt: now },
  { name: '夏公演', order: 5, isActive: true, createdAt: now, updatedAt: now },
  { name: '冬公演', order: 6, isActive: true, createdAt: now, updatedAt: now },
  { name: 'こども園公演', order: 7, isActive: true, createdAt: now, updatedAt: now },
]);

db.performancetypes.createIndex({ name: 1 }, { unique: true });
