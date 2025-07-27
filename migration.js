
console.log("  [1/5] Configuring 'users' collection...");
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "hashedPassword", "createdAt", "updatedAt"],
      properties: {
        username: { bsonType: "string", description: "must be a string and is required" },
        email: { bsonType: "string", description: "must be a string and is required" },
        hashedPassword: { bsonType: "string", description: "must be a string and is required" },
        mutedTags: {
          bsonType: "array",
          description: "Array of muted tag strings",
          items: { bsonType: "string" }
        },
        createdAt: { bsonType: "date", description: "must be a date and is required" },
        updatedAt: { bsonType: "date", description: "must be a date and is required" },
      },
    },
  },
});
db.collection("users").createIndex({ username: 1 }, { unique: true });
db.collection("users").createIndex({ email: 1 }, { unique: true });
console.log("  ✅ 'users' collection configured.");

//================================================
// 2. Artworks Collection
//================================================
console.log("  [2/5] Configuring 'artworks' collection...");
db.createCollection("artworks", {
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
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});
db.collection("artworks").createIndex({ userId: 1 });
db.collection("artworks").createIndex({ tags: 1 }); // AND検索($all)でもこのインデックスが効率的に利用されます
db.collection("artworks").createIndex({ likeCount: -1 });
db.collection("artworks").createIndex({ createdAt: -1 }); // タイムラインのソートで利用
console.log("  ✅ 'artworks' collection configured.");

//================================================
// 3. Bookmarks Collection
//================================================
console.log("  [3/5] Configuring 'bookmarks' collection...");
db.createCollection("bookmarks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "artworkId", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        artworkId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
      },
    },
  },
});
db.collection("bookmarks").createIndex({ userId: 1, artworkId: 1 }, { unique: true });
db.collection("bookmarks").createIndex({ userId: 1, createdAt: -1 });
console.log("  ✅ 'bookmarks' collection configured.");

//================================================
// 4. Follows Collection
//================================================
console.log("  [4/5] Configuring 'follows' collection...");
db.createCollection("follows", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["followerId", "followingId", "createdAt"],
      properties: {
        followerId: { bsonType: "objectId" },
        followingId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
      },
    },
  },
});
db.collection("follows").createIndex({ followerId: 1, followingId: 1 }, { unique: true });
db.collection("follows").createIndex({ followerId: 1, createdAt: -1 });
console.log("  ✅ 'follows' collection configured.");


//================================================
// 5. Likes Collection (New ✨)
//================================================
console.log("  [5/5] Configuring 'likes' collection...");
db.createCollection("likes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "artworkId", "createdAt"],
      properties: {
        userId: { bsonType: "objectId", description: "ID of the user who liked" },
        artworkId: { bsonType: "objectId", description: "ID of the artwork that was liked" },
        createdAt: { bsonType: "date", description: "Timestamp of when the like occurred" },
      },
    },
  },
});
// ユーザーが同じ作品に複数回いいねできないようにするためのユニークインデックス
db.collection("likes").createIndex({ userId: 1, artworkId: 1 }, { unique: true });
// 特定の作品のいいね一覧や、特定のユーザーがいいねした一覧を高速に取得するためのインデックス
db.collection("likes").createIndex({ artworkId: 1, createdAt: -1 });
console.log("  ✅ 'likes' collection configured.");


console.log("\n🎉 Migration finished successfully! All collections are ready.");