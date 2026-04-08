import { eq, sql } from "drizzle-orm";
import { FreeFitClient } from "@freefitui/shared";
import { getDb } from "../db/client.js";
import {
  categories,
  cities,
  clubCategories,
  clubs,
  subcategories,
  syncLog,
} from "../db/schema.js";
import type { Club, Category } from "@freefitui/shared";

function getFreeFitClient() {
  return new FreeFitClient({
    Token: process.env.FREEFIT_TOKEN!,
    Phone: process.env.FREEFIT_PHONE!,
    ID: process.env.FREEFIT_ID!,
    BinID: process.env.FREEFIT_BINID!,
  });
}

function clubToRow(c: Club) {
  return {
    id: c.RecordID,
    name: c.Name,
    enName: c.EnName || null,
    areaId: c.AreaID,
    areaName: c.AreaName,
    address: c.Address,
    phone: c.Phone || null,
    price: c.Price || null,
    latitude: c.latitude,
    longitude: c.longitude,
    logoUrl: c.MobClubLogoPath || null,
    clubTypeId: c.ClubTypeID,
    clubTypeName: c.ClubTypeName || null,
    isStudio: c.IsStudio,
    isClassSchedule: c.IsClassSchedule,
    maxDistance: c.MaxDistanceFromClub,
    terminalId: c.TerminalID,
    binType: c.BinType,
    studioFlags: {
      rbox: c.IsStudioRbox,
      fizikal: c.IsStudioFizikal,
      boostapp: c.IsStudioBoostapp,
      leap: c.IsStudioLeap,
    },
    rawData: c as unknown as Record<string, unknown>,
    syncedAt: new Date(),
  };
}

async function syncClubCategories(
  db: ReturnType<typeof getDb>,
  client: FreeFitClient,
  categoryList: Category[]
) {
  // Delete all existing mappings
  await db.delete(clubCategories);

  for (const cat of categoryList) {
    try {
      const result = await client.getClubsIdsByCategory(cat.ID);
      if (result.ClubsList && result.ClubsList.length > 0) {
        const rows = result.ClubsList.map((clubId) => ({
          clubId,
          categoryId: cat.ID,
        }));
        // Insert in batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          await db
            .insert(clubCategories)
            .values(batch)
            .onConflictDoNothing();
        }
        console.log(
          `  Category "${cat.Name}" (${cat.ID}): ${result.ClubsList.length} clubs`
        );
      }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.warn(`  Failed to sync category ${cat.ID}: ${err}`);
    }
  }
}

export async function runSync() {
  const db = getDb();
  const client = getFreeFitClient();

  // Create sync log entry
  const [logEntry] = await db
    .insert(syncLog)
    .values({ startedAt: new Date(), status: "running" })
    .returning();

  try {
    console.log("Starting sync...");

    // 1. Fetch all clubs and cities
    console.log("Fetching GetMobileFullData...");
    const fullData = await client.getMobileFullData();
    console.log(
      `  Got ${fullData.ClubList.length} clubs, ${fullData.CityList.length} cities`
    );

    // 2. Upsert cities
    console.log("Upserting cities...");
    for (let i = 0; i < fullData.CityList.length; i += 500) {
      const batch = fullData.CityList.slice(i, i + 500);
      await db
        .insert(cities)
        .values(
          batch.map((c) => ({
            id: c.RecordID,
            name: c.Name,
            latitude: c.AreaLatitude,
            longitude: c.AreaLongitude,
            syncedAt: new Date(),
          }))
        )
        .onConflictDoUpdate({
          target: cities.id,
          set: {
            name: sql`excluded.name`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            syncedAt: sql`excluded.synced_at`,
          },
        });
    }

    // 3. Upsert clubs
    console.log("Upserting clubs...");
    for (let i = 0; i < fullData.ClubList.length; i += 100) {
      const batch = fullData.ClubList.slice(i, i + 100);
      await db
        .insert(clubs)
        .values(batch.map(clubToRow))
        .onConflictDoUpdate({
          target: clubs.id,
          set: {
            name: sql`excluded.name`,
            enName: sql`excluded.en_name`,
            areaId: sql`excluded.area_id`,
            areaName: sql`excluded.area_name`,
            address: sql`excluded.address`,
            phone: sql`excluded.phone`,
            price: sql`excluded.price`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            logoUrl: sql`excluded.logo_url`,
            clubTypeId: sql`excluded.club_type_id`,
            clubTypeName: sql`excluded.club_type_name`,
            isStudio: sql`excluded.is_studio`,
            isClassSchedule: sql`excluded.is_class_schedule`,
            maxDistance: sql`excluded.max_distance`,
            terminalId: sql`excluded.terminal_id`,
            binType: sql`excluded.bin_type`,
            studioFlags: sql`excluded.studio_flags`,
            rawData: sql`excluded.raw_data`,
            syncedAt: sql`excluded.synced_at`,
          },
        });
    }

    // 4. Fetch and upsert categories
    console.log("Fetching GetClubCategoryList...");
    const categoryList = await client.getClubCategoryList();
    console.log(`  Got ${categoryList.length} categories`);

    for (const cat of categoryList) {
      await db
        .insert(categories)
        .values({ id: cat.ID, name: cat.Name, syncedAt: new Date() })
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            name: sql`excluded.name`,
            syncedAt: sql`excluded.synced_at`,
          },
        });

      if (cat.SubCategoryList) {
        for (const sub of cat.SubCategoryList) {
          await db
            .insert(subcategories)
            .values({
              id: sub.ID,
              categoryId: cat.ID,
              name: sub.Name,
              syncedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: subcategories.id,
              set: {
                categoryId: sql`excluded.category_id`,
                name: sql`excluded.name`,
                syncedAt: sql`excluded.synced_at`,
              },
            });
        }
      }
    }

    // 5. Sync club-category mappings
    console.log("Syncing club-category mappings...");
    await syncClubCategories(db, client, categoryList);

    // 6. Update sync log
    await db
      .update(syncLog)
      .set({
        completedAt: new Date(),
        clubsCount: fullData.ClubList.length,
        citiesCount: fullData.CityList.length,
        categoriesCount: categoryList.length,
        status: "success",
      })
      .where(eq(syncLog.id, logEntry.id));

    console.log("Sync completed successfully!");
    return {
      clubs: fullData.ClubList.length,
      cities: fullData.CityList.length,
      categories: categoryList.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Sync failed:", message);

    await db
      .update(syncLog)
      .set({
        completedAt: new Date(),
        status: "failed",
        errorMessage: message,
      })
      .where(eq(syncLog.id, logEntry.id));

    throw err;
  }
}

// Allow direct execution: pnpm --filter backend sync
if (process.argv[1]?.endsWith("sync.ts")) {
  const { config } = await import("dotenv");
  config({ path: "../../.env" });
  runSync()
    .then((result) => {
      console.log("Result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
