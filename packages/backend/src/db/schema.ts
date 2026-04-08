import {
  boolean,
  decimal,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const clubs = pgTable(
  "clubs",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    enName: text("en_name"),
    areaId: integer("area_id").notNull(),
    areaName: text("area_name").notNull(),
    address: text("address").notNull(),
    phone: text("phone"),
    price: doublePrecision("price"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    logoUrl: text("logo_url"),
    clubTypeId: integer("club_type_id"),
    clubTypeName: text("club_type_name"),
    isStudio: boolean("is_studio").default(false),
    isClassSchedule: boolean("is_class_schedule").default(false),
    maxDistance: integer("max_distance"),
    terminalId: integer("terminal_id"),
    binType: integer("bin_type"),
    studioFlags: jsonb("studio_flags"),
    rawData: jsonb("raw_data"),
    // Detail fields — lazy hydrated
    description: text("description"),
    images: jsonb("images"),
    hoursSunThu: text("hours_sun_thu"),
    hoursFriday: text("hours_friday"),
    hoursSaturday: text("hours_saturday"),
    parking: boolean("parking"),
    email: text("email"),
    rules: jsonb("rules"),
    detailFetchedAt: timestamp("detail_fetched_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_clubs_area_id").on(t.areaId),
    index("idx_clubs_club_type_id").on(t.clubTypeId),
    index("idx_clubs_lat_lng").on(t.latitude, t.longitude),
  ]
);

export const cities = pgTable("cities", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subcategories = pgTable(
  "subcategories",
  {
    id: integer("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_subcategories_category_id").on(t.categoryId)]
);

export const clubCategories = pgTable(
  "club_categories",
  {
    clubId: integer("club_id")
      .notNull()
      .references(() => clubs.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
  },
  (t) => [
    primaryKey({ columns: [t.clubId, t.categoryId] }),
    index("idx_club_categories_category").on(t.categoryId),
  ]
);

export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  clubsCount: integer("clubs_count"),
  citiesCount: integer("cities_count"),
  categoriesCount: integer("categories_count"),
  status: text("status").notNull().default("running"),
  errorMessage: text("error_message"),
});
