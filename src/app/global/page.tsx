// /src/app/page.tsx
import ArtworkList from "@/components/ArtworkList";

export default function GlobalPage() {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/timeline/global`;
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">みんなの作品</h1>
      <ArtworkList apiUrl={apiUrl} />
    </main>
  );
}