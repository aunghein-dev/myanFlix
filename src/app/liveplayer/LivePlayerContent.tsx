"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import LiveStreamPlayerApp, { FootballMatch } from "@/components/player/LiveStreamPlayerApp";
import { Zap } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import GlobalImage from "@/components/atoms/GlobalImage";
import Spinner from "@/components/atoms/Spinner";

const LIVE_API = process.env.NEXT_PUBLIC_LIVE_API;

function LivePlayerContent() {
  const searchParams = useSearchParams();
  const info = searchParams.get("info") ?? "No info provided";

  const {
    data: liveMatches,
    error,
    isLoading,
  } = useSWR<FootballMatch[]>(
    LIVE_API,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000, 
      errorRetryCount: 3,
    }
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const infoParts = info.split("]");
  const [homeTeam = "", awayTeam = "", league = "", matchTime = ""] = infoParts;

  // Find the match
  const selectedMatch = liveMatches?.find(
    (m) =>
      m.home_team_name === homeTeam &&
      m.away_team_name === awayTeam &&
      m.league_name === league &&
      m.match_time === matchTime
  );

  useEffect(()=> {
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const y =
        scrollRef.current.getBoundingClientRect().top + window.scrollY - 200;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }, [selectedMatch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 text-white">
        <h1 className="text-2xl mb-4">Error loading matches</h1>
        <p className="text-gray-400">Please try again later</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 text-white">
        <Spinner />
      </div>
    );
  }

  if (!selectedMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 text-white">
        <h1 className="mb-4 text/white/20 text-sm">Match not found or not live</h1>
      </div>
    );
  }

  const currentScore =
    selectedMatch.match_score ?? selectedMatch.ht_score ?? "VS";

  return (
    <div 
      ref={scrollRef}
      className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto mt-30 px-2 sm:px-0">

      <Suspense fallback={<Spinner />}>
        {selectedMatch && <LiveStreamPlayerApp match={selectedMatch} />}
      </Suspense>

      <div className="w-full h-30 mb-4 mt-8 bg-gray-800/20 rounded-xl shadow-lg border border-gray-700/20 flex flex-row items-center justify-between sm:mx-0">
        <div className="flex items-center space-x-3 mb-3 sm:mb-0 w-50 pl-2">
          <Zap className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-sm font-bold text-red-500 uppercase">
            {selectedMatch.match_status}
          </span>
          <span className="text-sm text-gray-400">
            | {selectedMatch.league_name}
          </span>
        </div>

        <div className="flex items-center justify-center space-x-6 w-full sm:w-auto">
          {/* Home Team */}
          <div className="flex flex-col items-center sm:w-24 w-18">
            <GlobalImage
              src={selectedMatch.home_team_logo}
              alt={selectedMatch.home_team_name}
              className="w-10 h-10 object-contain rounded-full bg-white p-1 shadow"
              unoptimized
              width={100}
              height={100}
            />
            <span className="text-xs font-medium text-white/40 mt-2 text-center truncate w-full">
              {selectedMatch.home_team_name}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center px-4">
            <div className="text-3xl font-extrabold text-white">
              {currentScore}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center sm:w-24 w-18">
            <GlobalImage
              src={selectedMatch.away_team_logo}
              alt={selectedMatch.away_team_name}
              className="w-10 h-10 object-contain rounded-full bg-white p-1 shadow"
              unoptimized
              width={100}
              height={100}
            />
            <span className="text-xs font-medium text-white/40 mt-2 text-center truncate w-full">
              {selectedMatch.away_team_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LivePlayerContent;