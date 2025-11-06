"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import LineFbMatchList from "@/components/layout/LineFbMatchList";
import type { FootballMatch } from "@/components/cards/FootballMatchCard";
import { PicksResponse } from "@/types/matchpick";
import MatchPickCarousel from "@/components/layout/MatchPickCarousel";
import React from "react";
import Spinner from "@/components/atoms/Spinner";
import ErrorView from "@/components/ErrorView";

const LIVE = process.env.NEXT_PUBLIC_TORRENT_BACKEND_URL + "/live";

export const uniqueMatches = (matches: FootballMatch[] = []) => {
  const seen = new Set<string>();
  return matches.filter((m) => {
    const key = `${m.home_team_name}-${m.away_team_name}-${m.league_name}-${m.match_time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function LivePage() {

  const [activeIndex, setActiveIndex] = React.useState(0);
  const {
    data: liveMatches,
    error,
    isLoading,
  } = useSWR<FootballMatch[]>(
    LIVE,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000, 
      errorRetryCount: 3,
    }
  );

  const {
    data: picksData,
    isLoading: picksLoading,
  } = useSWR<PicksResponse>("/api/picks", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    errorRetryCount: 3,
  });

  const picks = picksData?.matches.filter(
      (m) => m.home !== "Live Game" && m.away !== "Live Game"
    ) ?? [];
  

  if (error) {
    return (
      <ErrorView
        title="Matches not found"
        description="We searched everywhere but couldn’t find what you’re looking for."
      />
    );
  }


  const liveMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.match_status === "live")
  );

  const upComingMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.match_status === "vs")
  );

  const uefaMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "UEFA CL")
  );

  const uefaECLMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "UEFA ECL")
  );

  const uefaELMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "UEFA EL")
  );

  const engPRMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "ENG PR")
  );

  const itaSAMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "ITA D1")
  );

  const spaD1MatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "SPA D1")
  );

  const gerD1MatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "GER D1")
  );

  const fraD1MatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "FRA D1")
  );

  
  return (
    <section className="relative">
      {picksLoading ? <Spinner className="min-h-[580px] sm:h-[600px]"/> : (
        <div className="relative h-[580px] sm:h-[600px] select-none overflow-hidden ">
          <div
            className="absolute inset-0 bg-cover bg-bottom transition-all duration-500"
            style={{ backgroundImage: `url(/fbhero.avif)` }}
          />
          
          <div className="absolute left-0 top-0 w-[60px] h-full z-10 bg-gradient-to-r from-background/10 to-transparent" />
          <div className="absolute right-0 top-0 w-[60px] h-full z-10 bg-gradient-to-l from-background/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />


          <div className="relative h-full flex items-end">
            <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-4 sm:px-2 h-full w-full flex flex-col justify-end pb-2">
              <MatchPickCarousel picks={picks} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-1 sm:px-2 mt-3 mb-4">
        {isLoading && <Spinner className="min-h-[200px]"/>}
        {liveMatchesToShow.length > 0 &&
           <LineFbMatchList 
            liveMatchesList={liveMatchesToShow} 
            title="Live Now" 
            link="/live" 
           />
        }
        {
          uefaMatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={uefaMatchesToShow}
              title="UEFA Champions League"
              logo="/cl-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          uefaELMatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={uefaELMatchesToShow}
              title="UEFA Europa League"
              logo="/el-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          uefaECLMatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={uefaECLMatchesToShow}
              title="UEFA Conference League"
              logo="/ecl-logo.png"
              link="/live"
              titleDisable
            />
        } 
        {
          engPRMatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={engPRMatchesToShow}
              title="England Premier League"
              logo="/epl-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          itaSAMatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={itaSAMatchesToShow}
              title="Italy Serie A"
              logo="/itasa-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          spaD1MatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={spaD1MatchesToShow}
              title="Spain La Liga"
              logo="/spad1-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          gerD1MatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={gerD1MatchesToShow}
              title="Germany Bundesliga"
              logo="/gerd1-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          fraD1MatchesToShow.length > 0 && 
            <LineFbMatchList
              liveMatchesList={fraD1MatchesToShow}
              title="France Ligue 1"
              logo="/frad1-logo.png"
              link="/live"
              titleDisable
            />
        }
        {
          upComingMatchesToShow.length > 0 && 
          <LineFbMatchList liveMatchesList={upComingMatchesToShow} title="Upcoming" link="/live" />
        }
      </div>

    </section>
  );
}
