"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import type { FastAverageColorResult } from "fast-average-color";
import * as FAC from "fast-average-color";
import { MdLiveTv } from "react-icons/md";
import { MdOutlineNotStarted } from "react-icons/md";

type HexColor = `#${string}`;

export interface Server {
  name: string;
  url: string;
}

export interface FootballMatch {
  match_time: string;
  match_status: string;
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  match_score: string | null;
  ht_score: string | null;
  servers: Server[];
  debug: {
    original_league: string;
    original_home: string;
    original_away: string;
    ibet_match: string;
  };
}

// Simple brightness check without complex HSL conversion
function isColorTooDark(hex: HexColor): boolean {
  if (!hex || hex === "#000000") return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 60; // Higher threshold for darkness
}

function adjustColorForBackground(hex: HexColor): HexColor {
  if (!hex || hex === "#000000" || hex === "#ffffff") {
    return "#334155" as HexColor; // Better fallback color
  }

  // Simple RGB adjustment instead of complex HSL conversion
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);

  const toHex = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor;
}

function generateFallbackColor(text: string): HexColor {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 40%)` as HexColor;
}

// Pre-defined cache for colors to avoid re-computation
const colorCache = new Map<string, HexColor>();


export default function FootballMatchCard({ match }: { match: FootballMatch }) {
  const [homeColor, setHomeColor] = useState<HexColor>("#334155");
  const [awayColor, setAwayColor] = useState<HexColor>("#334155");
  const [imageErrors, setImageErrors] = useState<{ home: boolean; away: boolean }>({ 
    home: false, 
    away: false 
  });
  const [colorsLoaded, setColorsLoaded] = useState(false);

  const extractColor = useCallback(async (url: string, teamName: string): Promise<HexColor> => {

    const cacheKey = `${url}-${teamName}`;
    if (colorCache.has(cacheKey)) {
      return colorCache.get(cacheKey)!;
    }

    try {
      const fac = new FAC.FastAverageColor();
      
      const result: FastAverageColorResult = await fac.getColorAsync(url, {
        algorithm: "simple", 
        step: 10, 
        ignoredColor: [
          [0, 0, 0, 255, 10],  
          [255, 255, 255, 255, 10], 
          [0, 0, 0, 0, 10]    
        ],
        mode: "speed"
      });
      
      fac.destroy();

      if (!result.hex || !/^#[0-9A-F]{6}$/i.test(result.hex)) {
        const fallback = generateFallbackColor(teamName);
        colorCache.set(cacheKey, fallback);
        return fallback;
      }
      
      const hexColor = result.hex as HexColor;
      const adjustedColor = isColorTooDark(hexColor) 
        ? adjustColorForBackground(hexColor)
        : hexColor;

      colorCache.set(cacheKey, adjustedColor);
      return adjustedColor;
    } catch (err) {
      const fallback = generateFallbackColor(teamName);
      colorCache.set(cacheKey, fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadColors = async () => {
      try {
        const [home, away] = await Promise.all([
          extractColor(match.home_team_logo, match.home_team_name),
          extractColor(match.away_team_logo, match.away_team_name)
        ]);
        
        if (isMounted && !controller.signal.aborted) {
          setHomeColor(home);
          setAwayColor(away);
          setColorsLoaded(true);
        }
      } catch (error) {
        if (isMounted) {
          setColorsLoaded(true);
        }
      }
    };


    const timer = setTimeout(() => {
      loadColors();
    }, 100);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [match.home_team_logo, match.away_team_logo, match.home_team_name, match.away_team_name, extractColor]);

  const handleImageError = (team: "home" | "away") => {
    setImageErrors(prev => ({ ...prev, [team]: true }));
  };

  return (
    <div
      style={{ "--border-color": homeColor } as React.CSSProperties}
      className="w-[340px] h-52 flex-shrink-0 group relative cursor-pointer border rounded-lg overflow-hidden flex flex-row 
                transition-all duration-500 ease-out 
                hover:[border-color:var(--border-color)] hover:[box-shadow:0_0_3px_var(--border-color)]"
    >
      {colorsLoaded && (
        <div
          style={{
            background: `
              linear-gradient(
                110deg,
                ${homeColor}99 0%,
                ${homeColor}66 30%,
                ${awayColor}66 70%,
                ${awayColor}99 100%
              )
            `,
          }}
          className="absolute inset-0 transition-all duration-500 ease-out"
        />
      )}
      
      {/* Additional overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />
      {match.match_status === "live" || match.servers.length > 0 ? 
        (<span className="absolute top-2 right-2 text-[0.5rem] flex flex-col items-center justify-center text-white/90 animate-pulse">
            <MdLiveTv className=" text-2xl text-white/90 
                           w-5 h-5"/>
            Live
          </span>) :
        (<MdOutlineNotStarted className="absolute top-2 right-2 text-2xl text-white/10"/>)
      }
      
      <span className="absolute top-2 left-2 text-white/80 text-xs bg-black/50 rounded-lg px-1
                       border-[1px] border-[#228EE5]/10">{match.match_time}</span>
      
      {/* Content */}
      <div className="relative z-10 flex w-full items-center justify-between p-4">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-[35%] max-w-[35%]">
          <div className="w-20 h-20 flex items-center justify-center ">
            {!imageErrors.home ? (
              <Image
                width={60}
                height={60}
                unoptimized
                src={match.home_team_logo}
                alt={match.home_team_name}
                className="object-contain h-auto max-h-16 hover:scale-105 transition-transform duration-300"
                onError={() => handleImageError("home")}
                priority // Add priority for above-the-fold images
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-white text-center px-2 font-medium">
                  {match.home_team_name}
                </span>
              </div>
            )}
          </div>
          <span className="text-white text-xs font-medium mt-2 text-center max-w-[120px] truncate">
            {match.home_team_name}
          </span>
        </div>


        <div className="flex flex-col items-center justify-center px-4">
          <div className="bg-white/20 backdrop-blur-xs rounded-full w-16 h-16 flex items-center justify-center border border-white/30">
            <span className="text-white font-extrabold">
              {match.match_status === "vs" ? "VS" : match.match_score===null ? match.ht_score === null ? "LIVE" : match.ht_score : match.match_score}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center justify-center  min-w-[35%] max-w-[35%]">
          <div className="w-20 h-20 flex items-center justify-center">
            {!imageErrors.away ? (
              <Image
                width={60}
                height={60}
                unoptimized
                src={match.away_team_logo}
                alt={match.away_team_name}
                className="object-contain h-auto max-h-16 hover:scale-105 transition-transform duration-300"
                onError={() => handleImageError("away")}
                priority // Add priority for above-the-fold images
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-white text-center px-2 font-medium">
                  {match.away_team_name}
                </span>
              </div>
            )}
          </div>
          <span className="text-white text-xs font-medium mt-2 text-center max-w-[120px] truncate">
            {match.away_team_name}
          </span>
        </div>
      </div>

      {/* League name at bottom */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-white/80 text-xs font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
          {match.league_name}
        </span>
      </div>
    </div>
  );
}