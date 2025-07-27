import UserArtworkList from '@/components/UserArtworkList';
import { Suspense } from 'react';

type Props = {
  params: { username: string };
}

export default function UserPage({ params }: Props) {
  const { username } = params;

  const decodedUsername = decodeURIComponent(username);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">
        {decodedUsername}さんの作品
      </h1>
      <Suspense fallback={<p className="text-center">読み込み中...</p>}>
        {/* ArtworkListを再利用し、新しいAPIのエンドポイントを渡す */}
        <UserArtworkList username={decodedUsername} />
      </Suspense>
    </main>
  );
}