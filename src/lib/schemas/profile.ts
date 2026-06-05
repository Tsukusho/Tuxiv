import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(2, "ユーザー名は2文字以上で入力してください。")
  .max(50, "ユーザー名が長すぎます。");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "本名は2文字以上で入力してください。")
  .max(100, "本名が長すぎます。");

export const studentIdSchema = z.string().regex(/^\d{9}$/, "学籍番号は9桁の数字で入力してください。");

export const passwordSchema = z
  .string()
  .min(6, "パスワードは6文字以上で入力してください。")
  .max(200, "パスワードが長すぎます。");
