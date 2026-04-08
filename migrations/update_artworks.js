// update_validator.js
console.log("Updating validator for 'users' collection...");

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

console.log("Validator updated successfully.");