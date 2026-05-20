// 役職テーブルの初期データをシードし、name unique index を作成

const now = new Date();

db.roletypes.insertMany([
  { name: '役者', order: 1, isActive: true, createdAt: now, updatedAt: now },
  { name: '演出', order: 2, isActive: true, createdAt: now, updatedAt: now },
  { name: '舞監', order: 3, isActive: true, createdAt: now, updatedAt: now },
  { name: '制作', order: 4, isActive: true, createdAt: now, updatedAt: now },
  { name: '照明', order: 5, isActive: true, createdAt: now, updatedAt: now },
  { name: '音響', order: 6, isActive: true, createdAt: now, updatedAt: now },
  { name: '舞美', order: 7, isActive: true, createdAt: now, updatedAt: now },
  { name: '宣美', order: 8, isActive: true, createdAt: now, updatedAt: now },
  { name: '衣装', order: 9, isActive: true, createdAt: now, updatedAt: now },
  { name: '映像', order: 10, isActive: true, createdAt: now, updatedAt: now },
  { name: '記録', order: 11, isActive: true, createdAt: now, updatedAt: now },
  { name: 'web', order: 12, isActive: true, createdAt: now, updatedAt: now },
  { name: '広報', order: 13, isActive: true, createdAt: now, updatedAt: now },
]);

db.roletypes.createIndex({ name: 1 }, { unique: true });
