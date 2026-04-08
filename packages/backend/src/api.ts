import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  eq,
  and,
  ilike,
  sql,
  count,
  gte,
  lte,
  desc,
  asc,
  inArray,
} from "drizzle-orm";
import { getDb } from "./db/client.js";
import {
  clubs,
  cities,
  categories,
  subcategories,
  clubCategories,
  syncLog,
} from "./db/schema.js";
import { haversineDistance, boundingBox } from "./lib/geo.js";
import { FreeFitClient } from "@freefitui/shared";
import type { ClubSearchResult } from "@freefitui/shared";

const app = new Hono();

app.use("/*", cors());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFreeFitClient() {
  return new FreeFitClient({
    Token: process.env.FREEFIT_TOKEN!,
    Phone: process.env.FREEFIT_PHONE!,
    ID: process.env.FREEFIT_ID!,
    BinID: process.env.FREEFIT_BINID!,
  });
}

function parseIntParam(v: string | undefined): number | undefined {
  if (v == null) return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseFloatParam(v: string | undefined): number | undefined {
  if (v == null) return undefined;
  const n = parseFloat(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Convert FreeFit date "DD.MM.YYYY HH:mm" to ISO string */
function freefitDateToISO(dateStr: string): string {
  const match = dateStr.match(
    /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/
  );
  if (!match) return dateStr;
  const [, dd, mm, yyyy, hh, min] = match;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

// ---------------------------------------------------------------------------
// GET /api/clubs — search / filter clubs
// ---------------------------------------------------------------------------

app.get("/api/clubs", async (c) => {
  try {
    const db = getDb();

    const q = c.req.query("q");
    const cityId = parseIntParam(c.req.query("city"));
    const categoryId = parseIntParam(c.req.query("category"));
    const lat = parseFloatParam(c.req.query("lat"));
    const lng = parseFloatParam(c.req.query("lng"));
    const radius = parseFloatParam(c.req.query("radius")) ?? 10;
    const page = Math.max(1, parseIntParam(c.req.query("page")) ?? 1);
    const limit = Math.min(
      500,
      Math.max(1, parseIntParam(c.req.query("limit")) ?? 50)
    );
    const sort = c.req.query("sort") as
      | "distance"
      | "name"
      | "price"
      | undefined;

    // Map viewport bounds (optional)
    const north = parseFloatParam(c.req.query("north"));
    const south = parseFloatParam(c.req.query("south"));
    const east = parseFloatParam(c.req.query("east"));
    const west = parseFloatParam(c.req.query("west"));

    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [];
    let fuzzyMode = false;

    if (q) {
      // Use word_similarity for fuzzy substring matching (requires pg_trgm)
      // This handles typos like גןרדון → גורדון by comparing against each word in the name
      conditions.push(
        sql`(${clubs.name} ILIKE ${"%" + q + "%"} OR word_similarity(${q}, ${clubs.name}) > 0.3)`
      );
      fuzzyMode = true;
    }

    if (cityId != null) {
      conditions.push(eq(clubs.areaId, cityId));
    }

    // Geo bounding-box pre-filter
    if (lat != null && lng != null) {
      const box = boundingBox(lat, lng, radius);
      conditions.push(gte(clubs.latitude, box.minLat));
      conditions.push(lte(clubs.latitude, box.maxLat));
      conditions.push(gte(clubs.longitude, box.minLng));
      conditions.push(lte(clubs.longitude, box.maxLng));
    }

    // Map viewport bounds filter (only when no text query)
    if (!q && north != null && south != null && east != null && west != null) {
      conditions.push(gte(clubs.latitude, south));
      conditions.push(lte(clubs.latitude, north));
      conditions.push(gte(clubs.longitude, west));
      conditions.push(lte(clubs.longitude, east));
    }

    // Category filter — filter by clubTypeId
    if (categoryId != null) {
      conditions.push(eq(clubs.clubTypeId, categoryId));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [{ total: totalCount }] = await db
      .select({ total: count() })
      .from(clubs)
      .where(whereClause);

    // Determine ordering
    let orderBy: ReturnType<typeof asc> | undefined;
    if (sort === "name") {
      orderBy = asc(clubs.name);
    } else if (sort === "price") {
      orderBy = asc(clubs.price);
    } else if (fuzzyMode && q) {
      orderBy = sql`word_similarity(${q}, ${clubs.name}) DESC`;
    } else {
      orderBy = asc(clubs.id);
    }

    // Fetch rows — for distance sort, fetch all in bounding box then sort in JS
    let rows: typeof allRows;
    const allRows = await db
      .select({
        id: clubs.id,
        name: clubs.name,
        address: clubs.address,
        areaName: clubs.areaName,
        price: clubs.price,
        latitude: clubs.latitude,
        longitude: clubs.longitude,
        logoUrl: clubs.logoUrl,
        clubTypeName: clubs.clubTypeName,
        clubTypeId: clubs.clubTypeId,
        isClassSchedule: clubs.isClassSchedule,
      })
      .from(clubs)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(sort === "distance" && lat != null && lng != null ? 10000 : limit)
      .offset(
        sort === "distance" && lat != null && lng != null ? 0 : (page - 1) * limit
      );

    // If distance sort, compute haversine and sort + paginate in JS
    if (sort === "distance" && lat != null && lng != null) {
      const withDistance = allRows
        .map((row) => ({
          ...row,
          distance: haversineDistance(lat, lng, row.latitude, row.longitude),
        }))
        .filter((r) => r.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      const total = withDistance.length;
      const paged = withDistance.slice((page - 1) * limit, page * limit);

      const results: ClubSearchResult[] = paged.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        areaName: r.areaName,
        price: r.price,
        latitude: r.latitude,
        longitude: r.longitude,
        logoUrl: r.logoUrl,
        clubTypeName: r.clubTypeName,
        clubTypeId: r.clubTypeId,
        isClassSchedule: r.isClassSchedule ?? false,
        distance: Math.round(r.distance * 100) / 100,
      }));

      return c.json({ clubs: results, total, page, limit });
    }

    // Non-distance response
    rows = allRows;
    const results: ClubSearchResult[] = rows.map((r) => {
      const result: ClubSearchResult = {
        id: r.id,
        name: r.name,
        address: r.address,
        areaName: r.areaName,
        price: r.price,
        latitude: r.latitude,
        longitude: r.longitude,
        logoUrl: r.logoUrl,
        clubTypeName: r.clubTypeName,
        clubTypeId: r.clubTypeId,
        isClassSchedule: r.isClassSchedule ?? false,
      };
      if (lat != null && lng != null) {
        result.distance =
          Math.round(
            haversineDistance(lat, lng, r.latitude, r.longitude) * 100
          ) / 100;
      }
      return result;
    });

    return c.json({
      clubs: results,
      total: totalCount,
      page,
      limit,
    });
  } catch (err) {
    console.error("GET /api/clubs error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/clubs/:id — single club detail (lazy hydrate)
// ---------------------------------------------------------------------------

app.get("/api/clubs/:id", async (c) => {
  try {
    const db = getDb();
    const clubId = parseInt(c.req.param("id"), 10);
    if (Number.isNaN(clubId)) {
      return c.json({ error: "Invalid club ID" }, 400);
    }

    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    if (!club) {
      return c.json({ error: "Club not found" }, 404);
    }

    // Check if we need to hydrate details
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const needsHydration =
      club.detailFetchedAt == null || club.detailFetchedAt < sevenDaysAgo;

    if (needsHydration) {
      try {
        const client = getFreeFitClient();
        const detail = await client.getDetailedClubInfo(clubId);

        const updateData = {
          description: detail.TextAbout || null,
          images: detail.Images
            ? (detail.Images.map((img) => img.Path) as unknown as Record<
                string,
                unknown
              >)
            : null,
          hoursSunThu: detail.OpeningHoursSundayToThursday || null,
          hoursFriday: detail.OpeningHoursFriday || null,
          hoursSaturday: detail.OpeningHoursSaturday || null,
          parking: detail.Parking ?? null,
          email: detail.Email || null,
          rules: detail.IsImportantToNoteList
            ? (detail.IsImportantToNoteList as unknown as Record<
                string,
                unknown
              >)
            : null,
          detailFetchedAt: new Date(),
        };

        await db.update(clubs).set(updateData).where(eq(clubs.id, clubId));

        // Return merged data
        return c.json({ ...club, ...updateData });
      } catch (hydrationErr) {
        console.error(
          `Failed to hydrate club ${clubId}:`,
          hydrationErr
        );
        // Return what we have even if hydration fails
        return c.json(club);
      }
    }

    return c.json(club);
  } catch (err) {
    console.error("GET /api/clubs/:id error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/clubs/:id/lessons — proxy to FreeFit API
// ---------------------------------------------------------------------------

app.get("/api/clubs/:id/lessons", async (c) => {
  try {
    const clubId = parseInt(c.req.param("id"), 10);
    if (Number.isNaN(clubId)) {
      return c.json({ error: "Invalid club ID" }, 400);
    }

    const client = getFreeFitClient();
    const lessons = await client.getClubLessons(clubId);

    // Transform dates from "DD.MM.YYYY HH:mm" to ISO
    const transformed = lessons.map((lesson) => ({
      ...lesson,
      LessonStartDate: freefitDateToISO(lesson.LessonStartDate),
      LessonEndDate: freefitDateToISO(lesson.LessonEndDate),
    }));

    return c.json({ lessons: transformed });
  } catch (err) {
    console.error("GET /api/clubs/:id/lessons error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/cities
// ---------------------------------------------------------------------------

app.get("/api/cities", async (c) => {
  try {
    const db = getDb();
    const allCities = await db
      .select()
      .from(cities)
      .orderBy(asc(cities.name));

    c.header("Cache-Control", "public, max-age=3600");
    return c.json({ cities: allCities });
  } catch (err) {
    console.error("GET /api/cities error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/categories
// ---------------------------------------------------------------------------

app.get("/api/categories", async (c) => {
  try {
    const db = getDb();

    // Use actual club types (with counts) instead of the categories table,
    // since clubTypeId is what we filter on and maps directly to clubs
    const clubTypes = await db
      .select({
        id: clubs.clubTypeId,
        name: clubs.clubTypeName,
        count: count(),
      })
      .from(clubs)
      .groupBy(clubs.clubTypeId, clubs.clubTypeName)
      .orderBy(desc(count()));

    const result = clubTypes
      .filter((ct) => ct.id != null && ct.name != null && ct.count > 0)
      .map((ct) => ({
        id: ct.id!,
        name: ct.name!,
        count: Number(ct.count),
        subcategories: [],
      }));

    c.header("Cache-Control", "public, max-age=3600");
    return c.json({ categories: result });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

app.get("/api/health", async (c) => {
  try {
    const db = getDb();

    const [lastSync] = await db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.id))
      .limit(1);

    const [{ total: clubCount }] = await db
      .select({ total: count() })
      .from(clubs);

    return c.json({
      status: "ok",
      clubCount,
      lastSync: lastSync
        ? {
            id: lastSync.id,
            status: lastSync.status,
            startedAt: lastSync.startedAt,
            completedAt: lastSync.completedAt,
            clubsCount: lastSync.clubsCount,
            citiesCount: lastSync.citiesCount,
            categoriesCount: lastSync.categoriesCount,
            errorMessage: lastSync.errorMessage,
          }
        : null,
    });
  } catch (err) {
    console.error("GET /api/health error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500
    );
  }
});

export default app;
