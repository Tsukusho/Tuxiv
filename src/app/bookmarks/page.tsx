// /src/app/bookmarks/page.tsx
import BookmarkList from "@/components/BookmarkList";

export default function BookmarksPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">ブックマーク一覧</h1>
      <BookmarkList />
    </main>
  );
}