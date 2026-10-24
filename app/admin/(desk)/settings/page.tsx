import { saveContacts } from "@/app/actions/settings";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const settings = await getSettings();

  return (
    <>
      <p className="engraved">Site</p>
      <h1>聯絡設定</h1>
      <p className="mute" style={{ maxWidth: 520, lineHeight: 1.7, marginBottom: 28 }}>
        LINE 與 Instagram 為全站按鈕連結，官網首頁、車輛頁、頁尾都會使用。可填完整網址，或 LINE ID /
        Instagram 帳號。留空則不顯示該按鈕。
      </p>
      {saved ? <p className="flash">已儲存。</p> : null}
      {error === "line" ? <p className="flash">LINE 網址格式不正確。</p> : null}
      {error === "instagram" ? <p className="flash">Instagram 網址格式不正確。</p> : null}
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
        </div>
        <button className="btn" type="submit">
          儲存
        </button>
      </form>
    </>
  );
}
