// /src/app/page.tsx
import ArtworkList from "@/components/ArtworkList";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">みんなの作品</h1>
        </div>
        <Suspense fallback={
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">作品を読み込み中...</p>
          </div>
        }>
          <ArtworkList />
        </Suspense>
      </div>
    </main>
  );
}