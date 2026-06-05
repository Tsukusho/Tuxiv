"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [mutedTags, setMutedTags] = useState("");
  const [message, setMessage] = useState("");
  const [showNSFW, setShowNSFW] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const router = useRouter();

  // TODO: ReactQueryにする
  useEffect(() => {
    const fetchUserData = async () => {
      const res = await fetch("/api/users/me", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
        setFullName(data.fullName);
        setStudentId(data.studentId ?? "");
        setMutedTags(data.mutedTags.join(", "));
        setShowNSFW(data.showNSFW);
        setProfileImageUrl(data.profileImageUrl);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async (
    e: React.FormEvent,
    field: "username" | "fullName" | "password" | "mutedTags" | "showNSFW",
  ) => {
    e.preventDefault();
    setMessage("");

    let body;
    switch (field) {
      case "username":
        body = { username };
        break;
      case "fullName":
        body = { fullName };
        break;
      case "password":
        body = { password };
        break;
      case "mutedTags":
        body = { mutedTags: mutedTags.split(",").map((t) => t.trim()) };
        break;
      case "showNSFW":
        body = { showNSFW };
        break;
    }

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (res.ok) {
      setMessage(`${field}を更新しました。`);
      if (field === "password") setPassword("");
    } else {
      const data = await res.json();
      setMessage(`エラー: ${data.error}`);
    }
  };

  const handleStudentIdUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
      credentials: "include",
    });

    if (res.ok) {
      setMessage("学籍番号を更新しました。");
    } else {
      const data = await res.json();
      setMessage(`エラー: ${data.error}`);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setMessage("");

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await fetch("/api/users/me/profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("プロフィール画像をアップロードしました。");
        // 新しい画像URLを取得するためにユーザーデータを再取得
        const userRes = await fetch("/api/users/me", { credentials: "include" });
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfileImageUrl(userData.profileImageUrl);
        }
      } else {
        setMessage(`エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage("アップロード中にエラーが発生しました。");
    } finally {
      setIsUploadingImage(false);
      // ファイル入力をリセット
      e.target.value = "";
    }
  };

  const handleProfileImageDelete = async () => {
    if (!window.confirm("プロフィール画像を削除しますか？")) return;

    setMessage("");

    try {
      const res = await fetch("/api/users/me/profile-image", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("プロフィール画像を削除しました。");
        setProfileImageUrl(null);
      } else {
        setMessage(`エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage("削除中にエラーが発生しました。");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("本当にアカウントを削除しますか？この操作は元に戻せません。")) {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (res.ok) {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        router.push("/");
        router.refresh();
      } else {
        alert("アカウントの削除に失敗しました。");
      }
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">設定</h1>
      {message && <p className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">{message}</p>}

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">プロフィール画像</h2>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="プロフィール画像"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-2xl font-bold text-gray-500">{username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                <div>
                  <label htmlFor="profile-image-upload" className="cursor-pointer">
                    <span
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block ${
                        isUploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isUploadingImage ? "アップロード中..." : "画像を選択"}
                    </span>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {profileImageUrl && (
                  <div>
                    <button
                      type="button"
                      onClick={handleProfileImageDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      画像を削除
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500">JPG、PNG、GIF形式（5MB以下）</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => handleUpdate(e, "username")}>
          <h2 className="text-xl font-semibold mb-2">ユーザー名変更</h2>
          <p className="text-sm text-gray-500 mb-2">他のユーザーから見える表示名です。</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            更新
          </button>
        </form>

        {/* フルネーム変更機能はフロント側には出さない。登録時間違えたユーザーは運営側が直接クエリ叩くか、怖い場合はこのコメントアウトを外してください
        <form onSubmit={(e) => handleUpdate(e, 'fullName')}>
          <h2 className="text-xl font-semibold mb-2">フルネーム変更</h2>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border rounded-md mb-2" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">更新</button>
        </form>*/}

        <form onSubmit={handleStudentIdUpdate}>
          <h2 className="text-xl font-semibold mb-2">学籍番号</h2>
          <p className="text-sm text-gray-500 mb-2">
            s以降の20**~から始まる9桁の数字を入力してください。ログイン時に使用します。
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{9}"
            maxLength={9}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
            required
            placeholder="ex:202312345"
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            更新
          </button>
        </form>

        <form onSubmit={(e) => handleUpdate(e, "password")}>
          <h2 className="text-xl font-semibold mb-2">パスワード変更</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="新しいパスワード"
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            更新
          </button>
        </form>

        <form onSubmit={(e) => handleUpdate(e, "mutedTags")}>
          <h2 className="text-xl font-semibold mb-2">ミュートタグ設定</h2>
          <p className="text-sm text-gray-500 mb-2">
            カンマ区切りで入力してください。これらのタグが含まれる作品はフォロータイムラインに表示されなくなります。
          </p>
          <input
            type="text"
            value={mutedTags}
            onChange={(e) => setMutedTags(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
            更新
          </button>
        </form>

        <div>
          <h2 className="text-xl font-semibold mb-2">コンテンツ表示設定</h2>
          <div className="flex items-center space-x-3">
            <input
              id="show-nsfw"
              type="checkbox"
              checked={showNSFW}
              onChange={async (e) => {
                const newValue = e.target.checked;
                setShowNSFW(newValue);
                // NOTE: チェックボックスは即時反映させるため、onChangeイベントで直接更新APIを呼ぶ
                const res = await fetch("/api/users/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ showNSFW: newValue }),
                  credentials: "include",
                });
                if (res.ok) {
                  setMessage("NSFW設定を更新しました。");
                } else {
                  const data = await res.json();
                  setMessage(`エラー: ${data.error}`);
                }
              }}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="show-nsfw" className="text-gray-700">
              NSFWコンテンツを表示する
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">アカウント削除</h2>
          <p className="text-sm text-gray-500 mb-2">
            この操作は元に戻せません。アカウントに関連する全てのデータ（投稿作品、いいね、ブックマーク）が完全に削除されます。
          </p>
          <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-md">
            アカウントを削除する
          </button>
        </div>
      </div>
    </main>
  );
}
