// /src/app/profile/page.tsx
import MyProfile from "@/components/MyProfile";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <MyProfile />
      </div>
    </main>
  );
}