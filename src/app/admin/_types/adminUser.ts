// 卒業フラグ管理のドロップダウン用ユーザー (最小情報)
export interface AdminUser {
  _id: string;
  username: string;
  fullName: string;
  isGraduated: boolean;
}
