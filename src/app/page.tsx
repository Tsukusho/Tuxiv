// /src/app/page.tsx
import GlobalTimeline from "./_components/GlobalTimeline";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">みんなの作品</h1>
        </div>
        <GlobalTimeline />
      </div>
    </main>
  );
}
