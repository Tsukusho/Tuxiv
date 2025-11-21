/**
 * マイグレーションスクリプト: 役職データの正規化
 *
 * 目的: 全角カンマ（、）を含む役職データを半角カンマ（,）に統一し、
 *      配列として正しく分割されるように修正する
 *
 * 実行方法:
 *   npx ts-node scripts/migrate-normalize-roles.ts
 *
 * または:
 *   npm run migrate:roles
 */

import mongoose from 'mongoose';
import Availability from '../src/models/availability';
import dbConnect from '../src/lib/dbConnect';

interface MigrationResult {
  total: number;
  updated: number;
  unchanged: number;
  errors: number;
  details: {
    _id: string;
    name: string;
    oldRoles: string[];
    newRoles: string[];
  }[];
}

/**
 * 役職配列を正規化する関数
 * 全角カンマを含む文字列を検出し、正しく分割する
 */
function normalizeRoles(roles: string[]): string[] {
  const normalized: string[] = [];

  for (const role of roles) {
    // 全角カンマが含まれている場合、分割して正規化
    if (role.includes('、')) {
      const splitRoles = role
        .replace(/、/g, ',')  // 全角カンマを半角に変換
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      normalized.push(...splitRoles);
    } else {
      // 全角カンマが含まれていない場合はそのまま
      normalized.push(role.trim());
    }
  }

  // 重複を削除
  return [...new Set(normalized)];
}

/**
 * 役職データが正規化が必要かチェック
 */
function needsNormalization(roles: string[]): boolean {
  return roles.some(role => role.includes('、'));
}

/**
 * メイン処理: すべてのAvailabilityドキュメントを正規化
 */
async function migrateNormalizeRoles(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    details: []
  };

  try {
    // データベース接続
    await dbConnect();
    console.log('✅ データベースに接続しました');

    // すべてのAvailabilityドキュメントを取得
    const availabilities = await Availability.find({});
    result.total = availabilities.length;

    console.log(`\n📊 合計 ${result.total} 件のドキュメントを処理します...\n`);

    // 各ドキュメントを処理
    for (const availability of availabilities) {
      try {
        const oldRoles = availability.roles;

        // 正規化が必要かチェック
        if (needsNormalization(oldRoles)) {
          const newRoles = normalizeRoles(oldRoles);

          // データベースを更新
          await Availability.updateOne(
            { _id: availability._id },
            { $set: { roles: newRoles } }
          );

          result.updated++;
          result.details.push({
            _id: availability._id.toString(),
            name: availability.name,
            oldRoles,
            newRoles
          });

          console.log(`✏️  更新: ${availability.name} (${availability._id})`);
          console.log(`   変更前: [${oldRoles.join(', ')}]`);
          console.log(`   変更後: [${newRoles.join(', ')}]`);
        } else {
          result.unchanged++;
        }
      } catch (error) {
        result.errors++;
        console.error(`❌ エラー: ${availability.name} (${availability._id})`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 マイグレーション完了');
    console.log('='.repeat(60));
    console.log(`合計:       ${result.total} 件`);
    console.log(`更新:       ${result.updated} 件`);
    console.log(`未変更:     ${result.unchanged} 件`);
    console.log(`エラー:     ${result.errors} 件`);
    console.log('='.repeat(60));

    // 詳細をファイルに出力（オプション）
    if (result.details.length > 0) {
      const detailsJson = JSON.stringify(result.details, null, 2);
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'migration-roles-result.json');
      fs.writeFileSync(outputPath, detailsJson);
      console.log(`\n📄 詳細な変更内容を保存しました: ${outputPath}`);
    }

  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error);
    throw error;
  } finally {
    // データベース接続を閉じる
    await mongoose.connection.close();
    console.log('\n✅ データベース接続を閉じました');
  }

  return result;
}

// スクリプトを直接実行した場合のみ実行
if (require.main === module) {
  migrateNormalizeRoles()
    .then((result) => {
      console.log('\n✨ マイグレーションが正常に完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 マイグレーションが失敗しました:', error);
      process.exit(1);
    });
}

export default migrateNormalizeRoles;
