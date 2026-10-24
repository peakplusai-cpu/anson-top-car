import Link from "next/link";
import { ContactButtons } from "@/components/ContactButtons";
import { LineLaunch } from "@/components/LineLaunch";
import { getSettings } from "@/lib/settings";
import type { Staff } from "@/lib/types";

export async function Footer({ staff }: { staff: Staff[] }) {
  const settings = await getSettings();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="wordmark">
            <span className="wordmark-zh">安森頂車</span>
            <span className="wordmark-en">Anson Top Car</span>
          </div>
          <p className="footer-note">
            嚴選中古車，實車在店、實價標示。賞車、估價、貸款請直接 LINE
            或 Instagram 私訊，我們會盡快回覆。
          </p>
          <ContactButtons lineUrl={settings.lineUrl} instagramUrl={settings.instagramUrl} />
        </div>
        <div>
          <p className="engraved">顧問</p>
          {staff.length ? (
            <ul className="staff-list">
              {staff.map((person) => (
                <li key={person.id}>
                  <LineLaunch lineUrl={person.lineUrl || settings.lineUrl} lineId={person.lineId}>
                    <span className="name">{person.displayName}</span>
                    <span className="role">{person.role}</span>
                    <span className="go">LINE</span>
                  </LineLaunch>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-line">可使用上方 LINE / Instagram 與我們聯繫。</p>
          )}
        </div>
      </div>
      <div className="colophon">
        <span>台中 · 預約賞車</span>
        <Link href="/admin">員工入口</Link>
      </div>
    </footer>
  );
}
