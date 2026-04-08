import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ClubSearchResult } from "@freefitui/shared";

interface ClubCardProps {
  club: ClubSearchResult;
}

function DefaultGymIcon() {
  return (
    <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
      <svg
        className="w-6 h-6 text-stone-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.708-5.282"
        />
      </svg>
    </div>
  );
}

export default function ClubCard({ club }: ClubCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const showFallback = !club.logoUrl || imgError;

  return (
    <button
      onClick={() => navigate(`/club/${club.id}`)}
      className="w-full text-right bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex gap-3 items-start cursor-pointer"
    >
      {showFallback ? (
        <DefaultGymIcon />
      ) : (
        <img
          src={club.logoUrl!}
          alt={club.name}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
          onError={() => setImgError(true)}
        />
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-stone-900 truncate">{club.name}</h3>
        <p className="text-sm text-stone-500 truncate">{club.areaName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {club.clubTypeName && (
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              {club.clubTypeName}
            </span>
          )}
          {club.distance != null && (
            <span className="text-xs text-stone-400">
              {club.distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      {club.price != null && (
        <div className="shrink-0 text-left">
          <span className="text-emerald-600 font-semibold text-sm">
            {club.price} ₪
          </span>
        </div>
      )}
    </button>
  );
}
