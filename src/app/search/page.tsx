import ArtworkList from "@/components/ArtworkList";
import { Suspense } from "react";

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default function SearchPage({ searchParams }: Props) {
    const tags = typeof searchParams.tags === 'string' ? searchParams.tags : '';

    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 border-b pb-2">
                検索結果: <span className="text-blue-600">{tags}</span>
            </h1>
            <Suspense fallback={<p className="text-center">読み込み中...</p>}>
                {/* 検索クエリがある場合のみ結果を表示 */}
                {tags ? (
                    <SearchResults tags={tags} />
                ) : (
                    <p>検索タグを指定してください。</p>
                )}
            </Suspense>
        </main>
    );
}

async function SearchResults({ tags }: { tags: string }) {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/artworks/search?tags=${encodeURIComponent(tags)}`;
    return <ArtworkList apiUrl={apiUrl} />;
}