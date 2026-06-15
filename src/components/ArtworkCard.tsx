import Link from "next/link";
import type { ArtworkItem } from "@/app/api/timeline/_artworks";

export default function ArtworkCard({ artwork }: { artwork: ArtworkItem }) {
  return (
    <Link href={`/artworks/${artwork.id}`} className="group block">
      <div className="card overflow-hidden">
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
          {artwork.imageUrl && (
            // biome-ignore lint/performance/noImgElement: 署名URLは動的なため next/image 未使用（既存方針に追従）
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors break-words">
            {artwork.title}
          </h3>
          <div className="flex items-center justify-between">
            {artwork.author && (
              <div className="flex items-center space-x-1">
                {artwork.author.profileImageUrl ? (
                  // biome-ignore lint/performance/noImgElement: 署名URLは動的なため next/image 未使用（既存方針に追従）
                  <img src={artwork.author.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {artwork.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500 break-words">{artwork.author.username}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{artwork.likeCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{artwork.commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
