# Anson Top Car

台中中古車商官網：公開庫存、車輛詳情、LINE / Instagram 諮詢，以及員工後台。

- UI：繁體中文（台灣），白底黑字
- 資料：本機 JSON，或生產環境 **Supabase Postgres + Storage**
- 部署：GitHub (`peakplusai-cpu/anson-top-car`) + 獨立 Vercel / Supabase 專案

## 本機執行（JSON，無需資料庫）

```bash
npm install
cp .env.example .env
npm run dev
```

http://localhost:3000 — 員工後台 `/admin`，密碼 `anson-admin-2026`（`ADMIN_PASSWORD`）。

## 環境變數

| 變數 | 用途 |
| --- | --- |
| `ADMIN_PASSWORD` | 員工後台密碼 |
| `SESSION_SECRET` | 登入 cookie 簽名（生產務必更換） |
| `NEXT_PUBLIC_SITE_URL` | 正式網址（sitemap / OG） |
| `NEXT_PUBLIC_LINE_URL` | LINE 佔位網址（可被後台覆寫） |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Instagram 佔位網址（可被後台覆寫） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL（一設就走 Postgres，不寫 `data/*.json`） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開讀取。可填 JWT `anon`（`eyJ…`）或 `sb_publishable_…` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 可選別名，等同 anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | 後台寫入、照片上傳。可填 JWT `service_role` 或 `sb_secret_…`（**不可**暴露到瀏覽器） |
| `SUPABASE_SECRET_KEY` | 可選別名，等同 service_role / secret |

新專案 Dashboard 預設給 `sb_publishable_` / `sb_secret_`，可貼進上列變數。舊 JWT 仍可用。Vercel 唯讀檔案系統上不會建立 `data/store.json`；沒有車輛時前台顯示空庫存，不再 500。

## Supabase

1. 建立專案 → SQL Editor 依序執行 `supabase/schema.sql`、`supabase/seed.sql`（或 `supabase/migrations/20261024_anson_top_car.sql`）。
2. Settings → API Keys 複製 Project URL，以及 publishable（或舊 anon JWT）與 secret（或舊 service_role JWT）。
3. 本機或 CI：

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
npm run seed:supabase   # 可選；seed.sql 已含示範車
```

RLS：`anon` 只能 `select` `published = true` 的 `cars`、以及 `staff` / `site_settings`。`admin` 表無公開政策。寫入與 Storage 上傳走 service role（Next.js server actions）。未上架車輛前台 404。

## Vercel

此 repo 已含 `vercel.json`（Next.js）。把 GitHub repo 接上 Vercel 後，在專案 Environment Variables 填上表變數，`NEXT_PUBLIC_SITE_URL` 設成 `https://你的專案.vercel.app`。

本機 CLI（需登入）：

```bash
npx vercel login
npx vercel --prod
```

此 Cloud Agent 環境 **沒有** Vercel / Supabase 登入 token，無法代替你建立專案或寫入正式環境變數。

## 員工後台

`/admin`：車輛 CRUD、上架／下架、大小規格、配備、照片、LINE / Instagram 網址。
