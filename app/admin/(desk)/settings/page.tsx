import { saveContacts } from "@/app/actions/settings";
import { requireDeskAuth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireDeskAuth();
  const { saved, error } = await searchParams;
  const settings = await getSettings();

  return (
    <>
      <p className="engraved">Site</p>
      <h1>聯絡設定</h1>
      <p className="mute" style={{ maxWidth: 520, lineHeight: 1.7, marginBottom: 28 }}>
        LINE 與 Instagram 為全站按鈕連結。介紹影片只要貼一則 Instagram Reels／貼文或抖音連結，首頁只顯示這一格；換成新片改這裡即可。
      </p>
      {saved ? <p className="flash">已儲存。</p> : null}
      {error === "line" ? <p className="flash">LINE 網址格式不正確。</p> : null}
      {error === "instagram" ? <p className="flash">Instagram 網址格式不正確。</p> : null}
      {error === "video" ? <p className="flash">請貼 Instagram 貼文／Reels 或抖音影片連結。</p> : null}
      {error === "save" ? <p className="flash">儲存失敗，請稍後再試。</p> : null}

      <form action={saveContacts}>
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="lineUrl">LINE 網址或 ID</label>
            <input
              id="lineUrl"
              name="lineUrl"
              defaultValue={settings.lineUrl}
              placeholder="https://line.me/R/ti/p/@帳號"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="field wide">
            <label htmlFor="instagramUrl">Instagram 網址或帳號</label>
            <input
              id="instagramUrl"
              name="instagramUrl"
              defaultValue={settings.instagramUrl}
              placeholder="https://instagram.com/帳號"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="field wide">
            <label htmlFor="featuredVideoUrl">最新介紹影片（Instagram 或抖音，一格）</label>
            <input
              id="featuredVideoUrl"
              name="featuredVideoUrl"
              defaultValue={settings.featuredVideoUrl}
              placeholder="https://www.instagram.com/reel/…… 或 https://www.tiktok.com/@帳號/video/……"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="field wide">
            <label htmlFor="featuredVideoCaption">影片說明（選填）</label>
            <input
              id="featuredVideoCaption"
              name="featuredVideoCaption"
              defaultValue={settings.featuredVideoCaption}
              placeholder="例如：省油耐操的代名詞，車壇不滅的國民神車。"
              autoComplete="off"
            />
          </div>
        </div>
        <button className="btn" type="submit">
          儲存
        </button>
      </form>
    </>
  );
}
