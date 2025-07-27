// migrate_email_to_fullname.js
// usersコレクションのemailフィールドをfullNameに移行するための完全なスクリプト

print("--- Starting migration: email to fullName ---");

// ステップ1：データベースのバリデーションルールを更新する
print("Step 1: Updating collection validator...");
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "fullName", "hashedPassword", "createdAt", "updatedAt"],
      properties: {
        username: { bsonType: "string" },
        fullName: { bsonType: "string" },
        hashedPassword: { bsonType: "string" },
        mutedTags: { bsonType: "array", items: { bsonType: "string" } },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});
print(" -> Validator updated successfully.");

// ステップ2：古いemailフィールドのユニーク制約（インデックス）を削除する
print("Step 2: Dropping old 'email_1' index...");
try {
    db.getCollection("users").dropIndex("email_1");
    print(" -> Index 'email_1' dropped.");
} catch (e) {
    if (e.codeName === 'IndexNotFound') {
        print(" -> Index 'email_1' not found, skipping drop.");
    } else {
        throw e;
    }
}

// ステップ3：'email'フィールドを'fullName'に改名する
print("Step 3: Renaming field from 'email' to 'fullName'...");
const result = db.getCollection("users").updateMany(
  { email: { $exists: true } },
  { $rename: { "email": "fullName" } }
);
print(` -> ${result.modifiedCount} documents updated.`);

// ステップ4：新しいfullNameフィールドにユニーク制約を設定する
print("Step 4: Creating new unique index on 'fullName'...");
db.getCollection("users").createIndex({ fullName: 1 }, { unique: true });
print(" -> Index 'fullName_1' created.");

print("\n--- Migration complete! ---");