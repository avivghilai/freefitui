import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchStore } from "@/stores/searchStore";
import type { ClubSearchResult } from "@freefitui/shared";

interface ClubCardProps {
  club: ClubSearchResult;
  index?: number;
}

function DefaultGymIcon() {
  return (
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0">
      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    </div>
  );
}

export default function ClubCard({ club, index = 0 }: ClubCardProps) {
  const navigate = useNavigate();
  const setSelectedClubId = useSearchStore((s) => s.setSelectedClubId);
  const selectedClubId = useSearchStore((s) => s.selectedClubId);
  const [imgError, setImgError] = useState(false);

  const showFallback = !club.logoUrl || imgError;
  const isSelected = selectedClubId === club.id;

  return (
    <button
      onClick={() => navigate(`/club/${club.id}`)}
      onMouseEnter={() => setSelectedClubId(club.id)}
      onMouseLeave={() => setSelectedClubId(null)}
      className={`animate-card-in w-full text-right bg-white rounded-2xl p-4 flex gap-3.5 items-center cursor-pointer transition-all duration-200 group border ${
        isSelected
          ? "border-emerald-400/50 shadow-md shadow-emerald-500/10 scale-[1.01]"
          : "border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-warm-200/80"
      }`}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Logo */}
      {showFallback ? (
        <DefaultGymIcon />
      ) : (
        <img
          src={club.logoUrl!}
          alt=""
          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-warm-100"
          onError={() => setImgError(true)}
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="font-semibold text-warm-900 truncate text-[15px] leading-tight group-hover:text-emerald-700 transition-colors">
          {club.name}
        </h3>
        <p className="text-[13px] text-warm-800/50 truncate">{club.areaName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {club.clubTypeName && (
            <span className="text-[11px] bg-warm-100 text-warm-800/70 px-2 py-0.5 rounded-md font-medium">
              {club.clubTypeName}
            </span>
          )}
          {club.distance != null && (
            <span className="text-[11px] text-warm-800/40 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {club.distance.toFixed(1)} ק״מ
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      {club.price != null && (
        <div className="shrink-0 flex flex-col items-center">
          <span className="text-emerald-600 font-bold text-lg leading-none">
            {club.price}
          </span>
          <span className="text-[10px] text-emerald-600/60 font-medium">₪</span>
        </div>
      )}
    </button>
  );
}
