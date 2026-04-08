import { useParams, useNavigate } from "react-router-dom";
import { useClubDetail } from "@/hooks/useClubDetail";
import { useLessons } from "@/hooks/useLessons";
import type { Lesson } from "@freefitui/shared";

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-5 w-32 bg-stone-200 rounded" />
      <div className="h-64 bg-stone-200 rounded-xl" />
      <div className="bg-white rounded-xl p-6 space-y-4">
        <div className="h-6 w-3/4 bg-stone-200 rounded" />
        <div className="h-4 w-1/2 bg-stone-200 rounded" />
        <div className="h-4 w-1/3 bg-stone-200 rounded" />
        <div className="h-20 bg-stone-200 rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Opening hours
// ---------------------------------------------------------------------------

function OpeningHours({
  sunThu,
  friday,
  saturday,
}: {
  sunThu: string | null;
  friday: string | null;
  saturday: string | null;
}) {
  if (!sunThu && !friday && !saturday) return null;

  const rows = [
    { label: "ראשון - חמישי", value: sunThu },
    { label: "שישי", value: friday },
    { label: "שבת", value: saturday },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-bold text-stone-900 text-lg mb-3">שעות פעילות</h2>
      <div className="divide-y divide-stone-100">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between py-2 text-sm">
            <span className="text-stone-500">{row.label}</span>
            <span className="text-stone-900 font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lessons / class schedule
// ---------------------------------------------------------------------------

interface GroupedLessons {
  dayLabel: string;
  dateKey: string;
  lessons: Lesson[];
}

function groupLessonsByDay(lessons: Lesson[]): GroupedLessons[] {
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const groups = new Map<string, Lesson[]>();

  for (const lesson of lessons) {
    const date = new Date(lesson.LessonStartDate);
    const dateKey = date.toISOString().slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(lesson);
    groups.set(dateKey, existing);
  }

  const sorted = Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return sorted.map(([dateKey, dayLessons]) => {
    const date = new Date(dateKey + "T00:00:00");
    const dayName = dayNames[date.getDay()];
    const formatted = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
    return {
      dayLabel: formatted,
      dateKey,
      lessons: dayLessons.sort(
        (a, b) =>
          new Date(a.LessonStartDate).getTime() -
          new Date(b.LessonStartDate).getTime()
      ),
    };
  });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const startTime = formatTime(lesson.LessonStartDate);
  const endTime = formatTime(lesson.LessonEndDate);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-stone-100 last:border-0">
      <div className="shrink-0 text-sm font-medium text-stone-900 w-24 text-center">
        {startTime} - {endTime}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 truncate">
          {lesson.LessonName}
        </p>
        {lesson.CoachName && (
          <p className="text-xs text-stone-500 truncate">{lesson.CoachName}</p>
        )}
      </div>
      <div className="shrink-0">
        {lesson.IsLessonFull ? (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
            מלא
          </span>
        ) : (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
            {lesson.SlotsAvailable} מקומות
          </span>
        )}
      </div>
    </div>
  );
}

function ClassSchedule({ clubId }: { clubId: string }) {
  const { data, isLoading } = useLessons(clubId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 animate-pulse">
        <div className="h-5 w-40 bg-stone-200 rounded" />
        <div className="h-4 w-full bg-stone-200 rounded" />
        <div className="h-4 w-full bg-stone-200 rounded" />
        <div className="h-4 w-3/4 bg-stone-200 rounded" />
      </div>
    );
  }

  const lessons = (Array.isArray(data) ? data : []) as Lesson[];

  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-stone-900 text-lg mb-3">לוח שיעורים</h2>
        <p className="text-stone-500 text-sm">אין שיעורים קרובים</p>
      </div>
    );
  }

  const grouped = groupLessonsByDay(lessons);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-bold text-stone-900 text-lg mb-4">לוח שיעורים</h2>
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.dateKey}>
            <h3 className="text-sm font-semibold text-emerald-600 mb-1">
              {group.dayLabel}
            </h3>
            <div>
              {group.lessons.map((lesson, idx) => (
                <LessonCard key={`${group.dateKey}-${idx}`} lesson={lesson} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

function Rules({ rules }: { rules: string[] }) {
  if (!rules || rules.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-bold text-stone-900 text-lg mb-3">חשוב לדעת</h2>
      <ul className="space-y-2">
        {rules.map((rule, i) => (
          <li key={i} className="flex gap-2 text-sm text-stone-700">
            <span className="shrink-0 text-emerald-500 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3" />
              </svg>
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper to safely access club fields (API returns camelCase)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClubData = Record<string, any>;

// ---------------------------------------------------------------------------
// Main ClubPage
// ---------------------------------------------------------------------------

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: club, isLoading, isError } = useClubDetail(id!) as {
    data: ClubData | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !club) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto p-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-stone-500 hover:text-stone-700 transition mb-6"
          >
            <svg
              className="w-4 h-4 rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15 19-7-7 7-7"
              />
            </svg>
            חזרה לחיפוש
          </button>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-stone-500">לא ניתן לטעון את פרטי המועדון</p>
          </div>
        </div>
      </div>
    );
  }

  // API returns camelCase fields
  const name = club.name || "";
  const areaName = club.areaName || "";
  const address = club.address || "";
  const clubTypeName = club.clubTypeName;
  const price = club.price;
  const phone = club.phone;
  const email = club.email;
  const parking = club.parking;
  const description = club.description;
  const hoursSunThu = club.hoursSunThu || null;
  const hoursFriday = club.hoursFriday || null;
  const hoursSaturday = club.hoursSaturday || null;
  const isClassSchedule = club.isClassSchedule;
  const rules = club.rules as string[] | null;
  const images = club.images as string[] | null;
  const logoUrl = club.logoUrl;

  const heroImage = images && images.length > 0 ? images[0] : null;

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-stone-500 hover:text-stone-700 transition"
        >
          <svg
            className="w-4 h-4 rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15 19-7-7 7-7"
            />
          </svg>
          חזרה לחיפוש
        </button>

        {/* Hero image / gradient placeholder */}
        {heroImage ? (
          <div className="relative h-64 rounded-xl overflow-hidden">
            <img
              src={heroImage}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-64 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <span className="text-white/80 text-6xl font-bold">
                {name.charAt(0)}
              </span>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
            <p className="text-stone-500 text-sm mt-1">
              {areaName} &middot; {address}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {clubTypeName && (
              <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full font-medium">
                {clubTypeName}
              </span>
            )}
            {price != null && (
              <span className="text-sm font-semibold text-emerald-600">
                {price} ₪
              </span>
            )}
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {email}
              </a>
            )}
            {parking && (
              <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h4.5a3.5 3.5 0 0 1 0 7H8V4Zm0 7v6" />
                  <rect x="2" y="2" width="20" height="20" rx="3" strokeLinecap="round" />
                </svg>
                חניה זמינה
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="pt-2 border-t border-stone-100">
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Opening hours */}
        <OpeningHours
          sunThu={hoursSunThu}
          friday={hoursFriday}
          saturday={hoursSaturday}
        />

        {/* Class schedule */}
        {isClassSchedule && id && <ClassSchedule clubId={id} />}

        {/* Rules */}
        <Rules rules={rules ?? []} />
      </div>
    </div>
  );
}
