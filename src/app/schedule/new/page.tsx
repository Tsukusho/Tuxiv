'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

//NOTE:このページで唯一のイベントIDをここで定義しています　ハードコーディングダメ絶対ですがサークルのテスト用なので
//todo:必ず将来的にはイベントIDを複数設けます
const SINGLE_EVENT_ID = "68a1861f489482534ae40977"; // ここにMongoDBの実際のイベントIDを入れてください

export default function ScheduleHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

    // このページはもはやイベント作成フォームではないので、
    // ページが読み込まれたらすぐに唯一のイベントが存在するか確認します。
  useEffect(() => {
    // 実際にはここでAPIを叩いてイベントIDが存在するか確認するのが理想ですが、
    // 今回はシンプルにIDが設定されているかだけチェックします。
    if (SINGLE_EVENT_ID) {
      setIsLoading(false);
    } else {
      // もしIDが未設定ならエラーメッセージを表示
      console.error("単一のイベントIDが設定されていません。");
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">日程調整</h1>
        <p className="text-lg text-gray-600 mb-10">
          サークルの活動予定を調整します。
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* 予定を入力/変更するボタン */}
          <button
            onClick={() => router.push(`/schedule/event/${SINGLE_EVENT_ID}`)}
            className="bg-indigo-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-indigo-700 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            予定を入力 / 変更する
          </button>
          
          {/* 入力者の予定を確認するボタン */}
          <button
            onClick={() => router.push(`/schedule/event/${SINGLE_EVENT_ID}/results`)}
            className="bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-gray-800 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            みんなの予定を確認する
          </button>
        </div>
      </div>
    </div>
  );
}