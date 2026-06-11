// 公演種類 / 役職 の共通マスタ型 (PerformanceType / RoleType は同形)
export interface MasterTypeItem {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
}
