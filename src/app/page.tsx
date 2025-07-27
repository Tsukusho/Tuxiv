// /src/app/page.tsx
import ArtworkList from "@/components/ArtworkList";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">みんなの作品</h1>
      <Suspense fallback={<p className="text-center">読み込み中...</p>}>
        <ArtworkList />
      </Suspense>
    </main>
  );
}