// NOTE: MongoDBは、Duplicate制約違反だとエラーコード"11000"というマジックナンバーを返す
// また、重複しているプロパティはkeyPattern(Record<string, number>)として返ってくる
// なおKeyValue(Record<string, unknown>)として実際の値も返ってくる（使っていない）

export function isDuplicateKeyError(
  error: unknown,
): error is { code: 11000; keyPattern: Record<string, number> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000 &&
    "keyPattern" in error
  );
}
