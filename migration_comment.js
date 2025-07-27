// migration_comment.js (修正版)

console.log("Creating 'comments' collection...");
db.createCollection("comments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["artworkId", "userId", "text", "createdAt", "updatedAt"],
      properties: {
        artworkId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        text: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});

db.getCollection("comments").createIndex({ artworkId: 1, createdAt: -1 });

console.log("'comments' collection created.");