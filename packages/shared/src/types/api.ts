export interface FreeFitResponse {
  Error: number;
  Message: string;
  Data: string;
}

export interface FreeFitAuth {
  Token: string;
  Phone: string;
  ID: string;
  BinID: string;
}

export interface ClubSearchParams {
  q?: string;
  city?: number;
  category?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: number;
  page?: number;
  limit?: number;
  sort?: "distance" | "name" | "price";
}

export interface ClubSearchResult {
  id: number;
  name: string;
  address: string;
  areaName: string;
  price: number | null;
  latitude: number;
  longitude: number;
  logoUrl: string | null;
  clubTypeName: string | null;
  clubTypeId: number | null;
  isClassSchedule: boolean;
  distance?: number;
}

export interface ClubSearchResponse {
  clubs: ClubSearchResult[];
  total: number;
  page: number;
  limit: number;
}
