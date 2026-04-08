
console.log("Renaming 'email' field to 'fullName' in users collection...");

const result = db.getCollection("users").updateMany(
  { email: { $exists: true } },         // "email"フィールドが存在する全てのドキュメントを対象
  { $rename: { "email": "fullName" } }  // "email"フィールドを"fullName"に改名する
);

console.log(`${result.modifiedCount} documents updated.`);
console.log("Rename complete.");