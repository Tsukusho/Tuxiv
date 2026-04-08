//本来はMigrationフォルダに入れるべきだが、面倒なので直下に入れています 引き継ぎの方ごめんなさい
// online_status_migration_mongosh.js

try {
    console.log("--------------------------------------------------");
    console.log(`Starting migration on database: '${db.getName()}'`);
    console.log("Target collection: 'availabilities'");
    console.log("--------------------------------------------------");
  
    // 1. スキーマバリデーションを一時的に無効化
    // これにより、既存のバリデーションルールを安全に上書きできます。
    console.log("Step 1: Temporarily disabling current schema validator...");
    db.runCommand({
      collMod: "availabilities",
      validator: {},
    });
    console.log(" -> Validator disabled successfully.");
  
    // 2. 'online' ステータスを含む新しいスキーマバリデーションを設定
    console.log("Step 2: Setting new schema validator with 'online' status...");
    db.runCommand({
      collMod: "availabilities",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "eventId",
            "userId",
            "name",
            "grade",
            "roles",
            "availableSlots",
          ],
          properties: {
            eventId: { bsonType: "objectId" },
            userId: { bsonType: "objectId" },
            name: { bsonType: "string" },
            grade: { bsonType: "string" },
            roles: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
            availableSlots: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["start", "end", "type"],
                properties: {
                  start: { bsonType: "date" },
                  end: { bsonType: "date" },
                  type: {
                    bsonType: "string",
                    enum: ["available", "undecided", "online"], // 'online' を追加
                  },
                },
              },
            },
          },
        },
      },
    });
    console.log(" -> New validator set successfully.");
    console.log("\n✅ Migration completed!");
  
  } catch (e) {
    console.error("\n❌ An error occurred during migration:", e.message);
  }