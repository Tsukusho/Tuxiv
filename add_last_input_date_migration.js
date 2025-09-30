// add_last_input_date_migration.js
// lastInputDateフィールドを既存のavailabilityドキュメントに追加するマイグレーション

console.log("=== lastInputDate フィールド追加マイグレーション開始 ===");

// 既存のavailabilityドキュメント数を確認
const totalDocs = db.availabilities.countDocuments();
console.log(`総availability数: ${totalDocs}`);

// lastInputDateフィールドがないドキュメントを検索
const docsWithoutLastInputDate = db.availabilities.find({
  'lastInputDate': { $exists: false }
}).toArray();

console.log(`lastInputDateフィールドが欠けているavailability数: ${docsWithoutLastInputDate.length}`);

if (docsWithoutLastInputDate.length === 0) {
  console.log('マイグレーション不要: 全てのavailabilityにlastInputDateフィールドが存在します');
} else {
  // 各ドキュメントにlastInputDateフィールドを追加
  let updatedCount = 0;
  
  docsWithoutLastInputDate.forEach(function(doc) {
    let lastInputDate = null;
    
    if (doc.availableSlots && doc.availableSlots.length > 0) {
      // availableSlotsから最後の日時を取得
      let maxDate = new Date(0); // 初期値として最小日付
      
      doc.availableSlots.forEach(function(slot) {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        
        if (startDate > maxDate) maxDate = startDate;
        if (endDate > maxDate) maxDate = endDate;
      });
      
      // 日付のみ（時間を00:00:00にリセット）
      if (maxDate > new Date(0)) {
        lastInputDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      }
    }
    
    db.availabilities.updateOne(
      { _id: doc._id },
      { 
        $set: { 
          lastInputDate: lastInputDate 
        } 
      }
    );
    
    updatedCount++;
    if (updatedCount % 10 === 0) {
      console.log(`進捗: ${updatedCount}/${docsWithoutLastInputDate.length} 更新完了`);
    }
  });
  
  console.log(`マイグレーション完了: ${updatedCount}件のドキュメントを更新しました`);
}

// 結果確認
const remainingDocsWithoutLastInputDate = db.availabilities.find({
  'lastInputDate': { $exists: false }
}).count();

const docsWithLastInputDate = db.availabilities.find({
  'lastInputDate': { $exists: true, $ne: null }
}).count();

const docsWithNullLastInputDate = db.availabilities.find({
  'lastInputDate': null
}).count();

console.log(`\n=== マイグレーション統計 ===`);
console.log(`lastInputDateが設定されたドキュメント: ${docsWithLastInputDate}件`);
console.log(`lastInputDateがnullのドキュメント: ${docsWithNullLastInputDate}件`);
console.log(`lastInputDateフィールドが欠けているドキュメント数: ${remainingDocsWithoutLastInputDate}`);
console.log(`総ドキュメント数: ${totalDocs}件`);

console.log("=== lastInputDate フィールド追加マイグレーション完了 ===");
