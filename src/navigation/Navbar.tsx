"use client";

import NavbarData from "../data/navbar.data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Search from "@/components/atoms/Search";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { FootballMatch } from "@/components/player/LiveStreamPlayerApp";
import { fetcher } from "@/lib/fetcher";
import SearchModal from "@/components/model/SearchModal";
import GlobalImage from "@/components/atoms/GlobalImage";
import Spinner from "@/components/atoms/Spinner";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;

export interface MovieSearchResult {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

const LIVE = process.env.NEXT_PUBLIC_TORRENT_BACKEND_URL + "/live";

export default function Navbar() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const [result, setResult] = useState<MovieSearchResult[]>([]);
  const [liveResult, setLiveResult] = useState<FootballMatch[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const searchApiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;

  // Preload images on component mount
  useEffect(() => {
    const preloadImages = async () => {
      const images = ["/logo.png", "/logo-only.png"];
      
      const loadPromises = images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(src);
          img.onerror = () => resolve(src); // Resolve even on error
        });
      });

      await Promise.all(loadPromises);
      setImagesLoaded(true);
    };

    preloadImages();
  }, []);

  const fetchSuggestions = async (query: string) => {
    const res = await fetch(searchApiUrl + query);
    const data = await res.json();
    setResult(data.results);
    return data.results;
  };

  const { data: liveMatches, error, isLoading } = useSWR<FootballMatch[]>(
    LIVE,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000,
      errorRetryCount: 3,
    }
  );

  const searchLiveMatches = (query: string) => {
    if (!liveMatches) return;
    const res = liveMatches.filter((m) => 
      m.away_team_name.toLowerCase().includes(query.toLowerCase()) || 
      m.home_team_name.toLowerCase().includes(query.toLowerCase())
    );
    setLiveResult(res);
  };

  const allowRoutes = ["/", "/movies", "/videoplayer", "/details"];

  const isAllowedPage =
    allowRoutes.includes(pathname) ||
    pathname.startsWith("/details/") ||
    pathname.startsWith("/videoplayer/");

  useEffect(() => {
    if (!isAllowedPage) {
      if (query.trim().length > 0 && !isLoading) searchLiveMatches(query);
      else setLiveResult([]);
      return;
    }
      
    const timer = setTimeout(() => {
      if (query.trim().length > 0) fetchSuggestions(query);
      else setResult([]);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, pathname, liveMatches, isLoading]);

  // Determine which logo to show
  const mobileLogoSrc = focused ? "/logo-only.png" : "/logo.png";
  const mobileLogoClass = focused 
    ? "w-[60px] h-[60px] transition-all duration-300 ease-in-out" 
    : "ml-10 w-[72px] h-[72px] transition-all duration-300 ease-in-out";

  return (
    <div
      className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl sm:mx-auto py-1
                sm:rounded-3xl mb-6 fixed top-0 sm:top-4
                left-0 right-0
                bg-black/10
                backdrop-blur-[30px]
                flex items-center justify-between
                border-b border-[#228EE5]/20
                sm:border sm:border-[#228EE5]/40
                hover:shadow-lg shadow-white/15
                transition-shadow duration-300
                cursor-pointer
                sm:min-h-[78px]
                min-h-[72px]
                max-h-[72px]
                z-1000
                pl-2
                sm:mx-1"
    >
      <div className="-my-2 flex items-center justify-between w-full">
        <div className="flex items-center">
          {/* Desktop Logo - Always visible */}
          <Link href="/" className="hidden sm:block">
            <GlobalImage
              width={72}
              height={72}
              unoptimized
              src="/logo.png"
              alt="App logo"
              className="object-contain scale-200 select-none mr-10 ml-10 w-[72px] h-[72px]"
            />
          </Link>
          
          {/* Mobile Logo - Changes based on focus */}
          <Link href="/" className="block sm:hidden">
            <div className="relative">
              {!imagesLoaded ? (
                // Loading placeholder with same dimensions
                <Spinner className="ml-8"/>
              ) : (
                <GlobalImage
                  width={focused ? 60 : 72}
                  height={focused ? 60 : 72}
                  unoptimized
                  src={mobileLogoSrc}
                  alt="App logo"
                  className={`object-contain scale-200 select-none mr-10 ${mobileLogoClass}`}
                />
              )}
            </div>
          </Link>
          
          {/* Navigation Links */}
          <div className="ml-6 sm:flex space-x-6 hidden">
            {NavbarData.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== "/");

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative font-medium transition-colors duration-300
                              hover:text-[#228EE5] ${
                                isActive ? "text-[#228EE5]" : "text-white/95"
                              }`}
                >
                  {item.name}
                  <span
                    className={`absolute left-0 -bottom-1 h-[5px] rounded-full bg-[#228EE5] transition-all duration-300
                                ${isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full"}`}
                  ></span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center pr-3 relative">
          <div className="flex items-center">
            <Search 
              focused={focused}
              setFocused={setFocused}
              setQuery={setQuery} 
              query={query} 
              isAllowedPage={isAllowedPage}
            />
          </div>
        
          {query.length > 0 && (
            <SearchModal 
              result={result} 
              liveResult={liveResult} 
              query={query} 
              isAllowedPage={isAllowedPage} 
              setQuery={setQuery} 
            />
          )}
        </div>
      </div>
    </div>
  );
}