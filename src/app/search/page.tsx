import SearchResultsList from "@/components/SearchResultsList";
import { Suspense } from "react";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const tags = typeof resolvedSearchParams.tags === 'string' ? resolvedSearchParams.tags : '';

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
    return <SearchResultsList tags={tags} />;
}