export interface ClubCoordinate {
  ID: number;
  ClubID: number;
  latitude: number;
  longitude: number;
  IsMainCoordinates: boolean;
}

export interface Club {
  RecordID: number;
  Name: string;
  EnName: string;
  AreaID: number;
  AreaName: string;
  Address: string;
  Phone: string;
  IsLimitedToCompanies: number;
  Price: number;
  TerminalID: number;
  BinType: number;
  latitude: number;
  longitude: number;
  IsFavorite: boolean;
  MaxDistanceFromClub: number;
  MobClubLogoPath: string;
  OrderCancellationTime: number;
  PreOrderAllowTime: number;
  IsOrderCancellationAllowed: boolean;
  IsStudio: boolean;
  IsStudioRbox: boolean;
  IsStudioFizikal: boolean;
  IsStudioBoostapp: boolean;
  IsStudioLeap: boolean;
  IsIgnoreDistanceToClub: boolean;
  IsVenueClub: boolean;
  IsClassSchedule: boolean;
  ClubTypeID: number;
  ClubTypeName: string;
  ClubCoordinates: ClubCoordinate[];
  IsMinorAllowed: boolean;
  IsLimitToRechargeCards: boolean;
}

export interface ClubDetail extends Club {
  Parking: boolean;
  InvalidParking: boolean;
  Email: string;
  TextAbout: string;
  Images: { Path: string }[];
  OpeningHoursSundayToThursday: string;
  OpeningHoursFriday: string;
  OpeningHoursSaturday: string;
  IsImportantToNoteList: string[];
  MainCatList: { ID: number; Name: string }[];
}

export interface City {
  RecordID: number;
  Name: string;
  AreaLatitude: number;
  AreaLongitude: number;
}

export interface Category {
  ID: number;
  Name: string;
  SubCategoryList: { ID: number; Name: string }[];
}

export interface Lesson {
  LessonStartDate: string;
  LessonEndDate: string;
  IsUserBooked: boolean;
  IsLessonFull: boolean;
  IsReadOnly: boolean;
  SlotsAvailable: number;
  RegistrationTime: number;
  ArboxCancelationAllow: boolean;
  RboxLessonID: number;
  LessonName: string;
  CoachName: string;
  CancelationTime: number;
  IsCancelAllow: boolean;
}

export interface MobileFullData {
  CityList: City[];
  ClubList: Club[];
  VoucherClubList: unknown[];
}
