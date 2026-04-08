import type { FreeFitAuth, FreeFitResponse } from "../types/api.js";
import type {
  Category,
  Club,
  ClubDetail,
  Lesson,
  MobileFullData,
} from "../types/club.js";

const BASE_URL =
  "https://ffservice.freefit.co.il/MobileManagementService";

function parseData<T>(response: FreeFitResponse): T {
  if (response.Error !== 0) {
    throw new Error(
      `FreeFit API error ${response.Error}: ${response.Message}`
    );
  }
  return JSON.parse(response.Data) as T;
}

async function post(
  endpoint: string,
  body: Record<string, unknown>
): Promise<FreeFitResponse> {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "FFApp/3.3.13",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from FreeFit API: ${endpoint}`);
  }

  return res.json() as Promise<FreeFitResponse>;
}

async function get(endpoint: string): Promise<FreeFitResponse> {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    headers: { "User-Agent": "FFApp/3.3.13" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from FreeFit API: ${endpoint}`);
  }

  return res.json() as Promise<FreeFitResponse>;
}

export class FreeFitClient {
  constructor(private auth: FreeFitAuth) {}

  private authBody(extra: Record<string, unknown> = {}) {
    return {
      Phone: this.auth.Phone,
      ID: this.auth.ID,
      Token: this.auth.Token,
      ...extra,
    };
  }

  async getMetadata() {
    const resp = await get("Metadata");
    return parseData<{ AndroidMinVersion: string; IosMinVersion: string }>(
      resp
    );
  }

  async getMobileFullData(): Promise<MobileFullData> {
    const resp = await post(
      "GetMobileFullData",
      this.authBody({ BinID: this.auth.BinID })
    );
    return parseData<MobileFullData>(resp);
  }

  async getClubCategoryList(): Promise<Category[]> {
    const resp = await post(
      "GetClubCategoryList",
      this.authBody({ BinID: this.auth.BinID })
    );
    return parseData<Category[]>(resp);
  }

  async getClubsIdsByCategory(
    categoryId: number
  ): Promise<{ ClubsList: number[]; AreasList: number[] }> {
    const resp = await post(
      "GetMobileClubsIdsByCategory",
      this.authBody({ BinID: this.auth.BinID, CategoryID: categoryId })
    );
    return parseData<{ ClubsList: number[]; AreasList: number[] }>(resp);
  }

  async getDetailedClubInfo(clubId: number): Promise<ClubDetail> {
    const resp = await post(
      "GetDetailedClubInfoByID",
      this.authBody({ ClubID: clubId })
    );
    return parseData<ClubDetail>(resp);
  }

  async getClubLessons(
    clubId: number
  ): Promise<Lesson[]> {
    const resp = await post(
      "GetClubLessonList",
      this.authBody({ ClubID: clubId, BinID: this.auth.BinID })
    );
    return parseData<Lesson[]>(resp);
  }
}
