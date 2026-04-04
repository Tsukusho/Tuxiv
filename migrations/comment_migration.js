// comment_migration.js
// コメント機能のためのデータベースマイグレーション
// 実行方法: mongosh "<MONGODB_URI>" < comment_migration.js

console.log("🚀 Starting Comment Feature Migration...");

//================================================
// 1. Comments Collection の作成
//================================================
console.log("  [1/3] Creating 'comments' collection...");
db.createCollection("comments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["artworkId", "userId", "text", "createdAt", "updatedAt"],
      properties: {
        artworkId: { 
          bsonType: "objectId", 
          description: "ID of the artwork this comment belongs to" 
        },
        userId: { 
          bsonType: "objectId", 
          description: "ID of the user who posted the comment" 
        },
        text: { 
          bsonType: "string", 
          maxLength: 500,
          description: "Comment text content, max 500 characters" 
        },
        createdAt: { bsonType: "date", description: "Comment creation timestamp" },
        updatedAt: { bsonType: "date", description: "Comment last update timestamp" },
      },
    },
  },
});

// インデックスの作成
db.collection("comments").createIndex({ artworkId: 1 }); // 特定作品のコメント取得用
db.collection("comments").createIndex({ artworkId: 1, createdAt: -1 }); // 作品のコメント一覧（新しい順）
db.collection("comments").createIndex({ userId: 1 }); // ユーザーのコメント一覧用
console.log("  ✅ 'comments' collection created successfully.");

//================================================
// 2. Artworks Collection のスキーマ更新
//================================================
console.log("  [2/3] Updating 'artworks' collection schema...");

// 既存のバリデーションを削除
db.runCommand({ collMod: "artworks", validator: {} });

// 新しいバリデーションを追加（commentCountフィールドを含む）
db.runCommand({
  collMod: "artworks",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "title", "images", "tags", "isNSFW", "isAnonymous", "createdAt", "updatedAt"],
      properties: {
        userId: { bsonType: "objectId" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        images: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["path", "mimeType", "size", "order"],
            properties: {
              path: { bsonType: "string" },
              mimeType: { bsonType: "string" },
              size: { bsonType: "number" },
              order: { bsonType: "number" },
            },
          },
        },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        isNSFW: { bsonType: "bool" },
        isAnonymous: { bsonType: "bool" },
        viewCount: { bsonType: "number" },
        likeCount: { bsonType: "number" },
        commentCount: { bsonType: "number" }, // ✨ 追加！
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});
console.log("  ✅ 'artworks' collection schema updated with commentCount field.");

//================================================
// 3. 既存データの更新
//================================================
console.log("  [3/3] Updating existing artwork documents...");

// 既存の作品にcommentCountフィールドを追加（デフォルト値: 0）
const result = db.collection("artworks").updateMany(
  { commentCount: { $exists: false } }, // commentCountフィールドが存在しないドキュメント
  { $set: { commentCount: 0 } } // commentCountを0で初期化
);

console.log(`  ✅ Updated ${result.modifiedCount} artwork documents with commentCount field.`);

console.log("\n🎉 Comment Feature Migration completed successfully!");
console.log("📝 Summary:");
console.log("   - Comments collection created with proper validation");
console.log("   - Artworks schema updated to include commentCount field");
console.log("   - Existing artworks updated with commentCount = 0");
console.log("\n💡 Now you can use the comment feature!"); 