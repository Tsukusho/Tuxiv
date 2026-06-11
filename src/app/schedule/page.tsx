"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchClient } from "@/lib/fetchClient";

type CurrentEventResponse = { event: { _id: string } | null };

export default function ScheduleHomePage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", "current"],
    queryFn: () => fetchClient<CurrentEventResponse>("/api/schedule"),
  });
  const eventId = data?.event?._id ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">日程調整</h1>
          <p className="text-lg text-gray-600">調整中のイベントがありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">日程調整</h1>
        <p className="text-lg text-gray-600 mb-10">サークルの活動予定を調整します。</p>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* 予定を入力/変更するボタン */}
          <button
            onClick={() => router.push(`/schedule/event/${eventId}`)}
            className="bg-indigo-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-indigo-700 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            予定を入力 / 変更する
          </button>

          {/* 入力者の予定を確認するボタン */}
          <button
            onClick={() => router.push(`/schedule/event/${eventId}/results`)}
            className="bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-gray-800 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            みんなの予定を確認する
          </button>
        </div>
      </div>
    </div>
  );
}
