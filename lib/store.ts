import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { parseBodyType, parseDoors } from "./catalog";
import type { Admin, Car, SpecRow, Staff, Store } from "./types";
import { seedStore } from "./seed";
import {
  supabaseAdmin,
  supabaseAdminConfigured,
  supabaseAnonConfigured,
  supabaseConfigured,
  supabasePublic,
} from "./supabase";
export { uid } from "./id";

const STORE_PATH = join(process.cwd(), "data", "store.json");
let jsonCache: Store | null = null;

function emptyStore(): Store {
  return { admin: null, staff: [], cars: [], sessions: [] };
}

function persistJson(store: Store): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, STORE_PATH);
}

function getJsonStore(): Store {
  if (jsonCache) return jsonCache;
  if (!existsSync(STORE_PATH)) {
    jsonCache = seedStore(emptyStore());
    persistJson(jsonCache);
    return jsonCache;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
  jsonCache = {
    admin: parsed.admin ?? null,
    staff: parsed.staff ?? [],
    cars: (parsed.cars ?? []).map(normalizeCar),
    sessions: parsed.sessions ?? [],
  };
  return jsonCache;
}

function rowToStaff(row: Record<string, unknown>): Staff {
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ""),
    role: String(row.role ?? ""),
    lineUrl: String(row.line_url ?? ""),
    lineId: String(row.line_id ?? ""),
    note: String(row.note ?? ""),
    lineUserId: String(row.line_user_id ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ""),
  };
}

function asSpecs(value: unknown): SpecRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const rec = row as { label?: unknown; value?: unknown };
      const label = String(rec.label ?? "").trim();
      if (!label) return null;
      return { label, value: String(rec.value ?? "") };
    })
    .filter((row): row is SpecRow => Boolean(row));
}

function normalizeCar(car: Partial<Car> & Record<string, unknown>): Car {
  const options = Array.isArray(car.options) ? car.options.map(String) : [];
  const equipment = Array.isArray(car.equipment) ? car.equipment.map(String) : options;
  return {
    id: String(car.id),
    slug: String(car.slug),
    make: String(car.make ?? ""),
    makeEn: String(car.makeEn ?? car.make_en ?? ""),
    model: String(car.model ?? ""),
    year: Number(car.year ?? 0),
    price: Number(car.price ?? 0),
    mileage: Number(car.mileage ?? 0),
    color: String(car.color ?? ""),
    interior: String(car.interior ?? ""),
    engine: String(car.engine ?? ""),
    displacement: String(car.displacement ?? car.engine ?? ""),
    horsepower: Number(car.horsepower ?? 0),
    transmission: String(car.transmission ?? ""),
    drivetrain: String(car.drivetrain ?? ""),
    doors: parseDoors(car.doors),
    bodyType: parseBodyType(car.bodyType ?? car.body_type),
    options,
    specs: asSpecs(car.specs),
    equipment,
    story: String(car.story ?? ""),
    status: (car.status as Car["status"]) || "available",
    published: Boolean(car.published),
    featured: Boolean(car.featured),
    photos: Array.isArray(car.photos) ? (car.photos as Car["photos"]) : [],
    createdAt: String(car.createdAt ?? car.created_at ?? ""),
    updatedAt: String(car.updatedAt ?? car.updated_at ?? ""),
  };
}

function rowToCar(row: Record<string, unknown>): Car {
  return normalizeCar(row);
}

async function getSupabaseStore(): Promise<Store> {
  const db = supabaseAdmin();
  const [adminRes, staffRes, carsRes] = await Promise.all([
    db.from("admin").select("*").eq("id", 1).maybeSingle(),
    db.from("staff").select("*").order("sort_order"),
    db.from("cars").select("*").order("created_at", { ascending: false }),
  ]);
  if (adminRes.error) throw adminRes.error;
  if (staffRes.error) throw staffRes.error;
  if (carsRes.error) throw carsRes.error;
  const adminRow = adminRes.data as { password_hash: string; created_at: string } | null;
  const admin: Admin | null = adminRow
    ? { passwordHash: adminRow.password_hash, createdAt: adminRow.created_at }
    : null;
  return {
    admin,
    staff: (staffRes.data ?? []).map((row) => rowToStaff(row as Record<string, unknown>)),
    cars: (carsRes.data ?? []).map((row) => rowToCar(row as Record<string, unknown>)),
    sessions: [],
  };
}

async function saveSupabaseStore(store: Store): Promise<void> {
  const db = supabaseAdmin();
  if (store.admin) {
    const { error } = await db.from("admin").upsert({
      id: 1,
      password_hash: store.admin.passwordHash,
      created_at: store.admin.createdAt,
    });
    if (error) throw error;
  }
  const { error: staffErr } = await db.from("staff").upsert(
    store.staff.map((person) => ({
      id: person.id,
      display_name: person.displayName,
      role: person.role,
      line_url: person.lineUrl,
      line_id: person.lineId,
      note: person.note,
      line_user_id: person.lineUserId,
      sort_order: person.sortOrder,
      created_at: person.createdAt,
    }))
  );
  if (staffErr) throw staffErr;
  const remoteStaff = await db.from("staff").select("id");
  const keepStaff = new Set(store.staff.map((s) => s.id));
  const extraStaff = (remoteStaff.data ?? []).map((r) => r.id).filter((id) => !keepStaff.has(id));
  if (extraStaff.length) await db.from("staff").delete().in("id", extraStaff);

  const { error: carsErr } = await db.from("cars").upsert(
    store.cars.map((car) => ({
      id: car.id,
      slug: car.slug,
      make: car.make,
      make_en: car.makeEn,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      color: car.color,
      interior: car.interior,
      engine: car.engine,
      horsepower: car.horsepower,
      transmission: car.transmission,
      drivetrain: car.drivetrain,
      doors: car.doors,
      body_type: car.bodyType,
      displacement: car.displacement,
      options: car.options,
      specs: car.specs,
      equipment: car.equipment,
      story: car.story,
      status: car.status,
      published: car.published,
      featured: car.featured,
      photos: car.photos,
      created_at: car.createdAt,
      updated_at: car.updatedAt,
    }))
  );
  if (carsErr) throw carsErr;
  const remoteCars = await db.from("cars").select("id");
  const keepCars = new Set(store.cars.map((c) => c.id));
  const extraCars = (remoteCars.data ?? []).map((r) => r.id).filter((id) => !keepCars.has(id));
  if (extraCars.length) await db.from("cars").delete().in("id", extraCars);
}

export async function getStore(): Promise<Store> {
  if (supabaseAdminConfigured()) return getSupabaseStore();
  if (supabaseConfigured()) {
    const published = await listPublishedCars();
    const staff = await listPublicStaff();
    return { admin: null, staff, cars: published, sessions: [] };
  }
  return getJsonStore();
}

export async function listPublishedCars(): Promise<Car[]> {
  if (supabaseAnonConfigured()) {
    const { data, error } = await supabasePublic()
      .from("cars")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => rowToCar(row as Record<string, unknown>));
  }
  if (supabaseAdminConfigured()) {
    return (await getSupabaseStore()).cars.filter((car) => car.published);
  }
  return getJsonStore().cars.filter((car) => car.published);
}

export async function getPublishedCar(slug: string): Promise<Car | null> {
  if (supabaseAnonConfigured()) {
    const { data, error } = await supabasePublic()
      .from("cars")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToCar(data as Record<string, unknown>) : null;
  }
  if (supabaseAdminConfigured()) {
    return (await getSupabaseStore()).cars.find((car) => car.slug === slug && car.published) ?? null;
  }
  return getJsonStore().cars.find((car) => car.slug === slug && car.published) ?? null;
}

export async function listPublicStaff(): Promise<Staff[]> {
  if (supabaseAnonConfigured()) {
    const { data, error } = await supabasePublic().from("staff").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []).map((row) => rowToStaff(row as Record<string, unknown>));
  }
  if (supabaseAdminConfigured()) {
    return [...(await getSupabaseStore()).staff].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return [...getJsonStore().staff].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveStore(store: Store): Promise<void> {
  if (supabaseAdminConfigured()) {
    await saveSupabaseStore(store);
    return;
  }
  if (supabaseConfigured()) {
    throw new Error("Admin writes need SUPABASE_SERVICE_ROLE_KEY");
  }
  jsonCache = store;
  persistJson(store);
}
