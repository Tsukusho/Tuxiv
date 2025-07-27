// /src/app/following/page.tsx
import FollowingArtworkList from "@/components/FollowingArtworkList";

export default function FollowingPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">フォロー中の作品</h1>
      <FollowingArtworkList />
    </main>
  );
}