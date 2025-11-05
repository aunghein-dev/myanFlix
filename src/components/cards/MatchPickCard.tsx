import { PickMatch } from "@/types/matchpick";
import { TrendingUp, Target, BarChart3 } from "lucide-react";
import GlobalImage from "../atoms/GlobalImage";
import dayjs from "dayjs";


interface MatchPickCardProps {
  match: PickMatch;
  isActive?: boolean;
}

export function getFullImageUrl(nextImageUrl?: string): string {
  if (!nextImageUrl) return "/placeholder-team.png"; 
  const url = new URL(nextImageUrl, "https://mygameodds.com");
  const encoded = url.searchParams.get("url");
  return encoded ? decodeURIComponent(encoded) : nextImageUrl;
}

export default function MatchPickCard({ match, isActive = true }: MatchPickCardProps) {
  const getConfidenceColor = (percent: string) => {
    const value = parseInt(percent);
    if (value >= 70) return "text-white/100";
    if (value >= 60) return "text-white/100";
    if (value >= 50) return "text-white/80";
    return "text-white/80";
  };

  return (
    <div 
      className={`flex flex-col items-center text-white text-center transition-all duration-500 ${
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
      }`}
    >
      <div className="relative w-full flex items-center justify-between max-w-2xl mb-8">
        {/* Home Team */}
        <div className="flex flex-col items-center space-y-3 flex-1">
          <div className="relative group">
            <div className="absolute -inset-2 bg-cyan-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <GlobalImage
              unoptimized
              src={getFullImageUrl(match.home_logo)}
              alt={`${match.home} logo`}
              width={100}
              height={100}
              className="relative z-10 transition-all duration-300 group-hover:scale-105  h-15 w-15 sm:h-[100px] sm:w-[100px]"
            />
          </div>
          <div className="text-center">
            <h3 className="sm:text-xl text-sm font-bold truncate max-w-[140px]">{match.home}</h3>
            {match.win_pick === "1" && (
              <div className="inline-flex items-center space-x-1 mt-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold text-green-400">Favorite</span>
              </div>
            )}
          </div>
        </div>

        {/* VS Badge */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full" />
          <div className="relative border border-white/20 rounded-full px-4.5 py-4 shadow-2xl">
            <span className="text-2xl font-black bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              VS
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center space-y-3 flex-1">
          <div className="relative group">
            <div className="absolute -inset-2 bg-blue-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <GlobalImage
              unoptimized
              src={getFullImageUrl(match.away_logo)}
              alt={`${match.away} logo`}
              width={100}
              height={100}
              className="relative z-10 transition-all duration-300 group-hover:scale-105 h-15 w-15 sm:h-[100px] sm:w-[100px]"
            />
          </div>
          <div className="text-center">
            <h3 className="sm:text-xl text-sm font-bold truncate max-w-[140px]">{match.away}</h3>
            {match.win_pick === "2" && (
              <div className="inline-flex items-center space-x-1 mt-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold text-green-400">Favorite</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-col items-center space-y-1">
        <span className="text-slate-300/80 sm:text-sm text-xs">{match.date_time==="Invalid Date" ? "" : match.date_time}</span>
        <span className="sm:text-xl text-sm font-extrabold">{match.league}</span>
      </div>

      <div className="w-full">
        <div className="flex flex-row items-center overflow-x-auto scrollbar-hide gap-4 lg:grid grid-cols-5">
          <div className={`p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-[2px] min-w-[160px]`}>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="sm:text-sm text-xs font-semibold">Winner</span>
            </div>
            <div className={`sm:text-lg text-sm  font-bold line-clamp-1 ${getConfidenceColor(match.win_percent)}`}>
              {match.win_pick === "1" ? match.home : match.away}
            </div>
            <div className="text-xs text-white/70 mt-1">{match.win_percent} confidence</div>
          </div>

          {/* BTTS Prediction */}
          <div className={`p-4 rounded-2xl border border-white/10 bg-white/10 min-w-[160px]`}>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="sm:text-sm text-xs font-semibold">BTTS</span>
            </div>
            <div className={`sm:text-lg text-sm font-bold ${getConfidenceColor(match.btts_percent)}`}>
              {match.btts_pick}
            </div>
            <div className="text-xs text-white/70 mt-1">{match.btts_percent} confidence</div>
          </div>

          {/* Correct Score */}
          <div className={`p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-[2px] min-w-[160px]`}>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="sm:text-sm text-xs font-semibold">Correct Score</span>
            </div>
            <div className={`sm:text-lg text-sm font-bold ${getConfidenceColor(match.cs_percent)}`}>
              {match.cs_pick}
            </div>
            <div className="text-xs text-white/70 mt-1">{match.cs_percent} confidence</div>
          </div>

          {/* Over/Under 2.5 */}
          <div className={`p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-[2px] min-w-[160px]`}>
            <div className="sm:text-sm text-xs font-semibold mb-2">O/U 2.5</div>
            <div className={`sm:text-lg text-sm  font-bold ${getConfidenceColor(match.ou_2_5_percent)}`}>
              {match.ou_2_5_pick}
            </div>
            <div className="text-xs text-white/70 mt-1">{match.ou_2_5_percent} confidence</div>
          </div>


          <div className={`p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-[2px] min-w-[160px]`}>
            <div className="sm:text-sm text-xs  font-semibold mb-2">O/U 3.5</div>
            <div className={`sm:text-lg text-sm font-bold ${getConfidenceColor(match.ou_3_5_percent)}`}>
              {match.ou_3_5_pick}
            </div>
            <div className="text-xs text-white/70 mt-1">{match.ou_3_5_percent} confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}