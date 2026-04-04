// MongoDB migration script to add 'type' field to availability slots
// Run this script to fix existing data that lacks the 'type' field

const { MongoClient } = require('mongodb');

// MongoDB接続設定（環境に合わせて変更してください）
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuxiv';

async function migrateAvailabilityTypes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB接続成功');
    
    const db = client.db();
    const collection = db.collection('availabilities');
    
    // 既存のavailabilityドキュメント数を確認
    const totalDocs = await collection.countDocuments();
    console.log(`総availability数: ${totalDocs}`);
    
    // availableSlotsにtypeフィールドがないドキュメントを検索
    const docsWithoutType = await collection.find({
      'availableSlots': {
        $elemMatch: {
          'type': { $exists: false }
        }
      }
    }).toArray();
    
    console.log(`typeフィールドが欠けているavailableSlots数: ${docsWithoutType.length}`);
    
    if (docsWithoutType.length === 0) {
      console.log('マイグレーション不要: 全てのavailableSlotsにtypeフィールドが存在します');
      return;
    }
    
    // 各ドキュメントのavailableSlotsにtypeフィールドを追加
    let updatedCount = 0;
    
    for (const doc of docsWithoutType) {
      const updatedSlots = doc.availableSlots.map(slot => ({
        ...slot,
        type: slot.type || 'available' // デフォルト値として'available'を設定
      }));
      
      await collection.updateOne(
        { _id: doc._id },
        { $set: { availableSlots: updatedSlots } }
      );
      
      updatedCount++;
      console.log(`進捗: ${updatedCount}/${docsWithoutType.length} 更新完了`);
    }
    
    console.log(`マイグレーション完了: ${updatedCount}件のドキュメントを更新しました`);
    
    // 結果確認
    const remainingDocsWithoutType = await collection.find({
      'availableSlots': {
        $elemMatch: {
          'type': { $exists: false }
        }
      }
    }).countDocuments();
    
    console.log(`マイグレーション後、typeフィールドが欠けているドキュメント数: ${remainingDocsWithoutType}`);
    
  } catch (error) {
    console.error('マイグレーションエラー:', error);
  } finally {
    await client.close();
    console.log('MongoDB接続を閉じました');
  }
}

// スクリプト実行
if (require.main === module) {
  migrateAvailabilityTypes()
    .then(() => {
      console.log('マイグレーションスクリプト実行完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('マイグレーションスクリプト実行エラー:', error);
      process.exit(1);
    });
}

module.exports = { migrateAvailabilityTypes }; 