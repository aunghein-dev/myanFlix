"use client";

import HeroSection from "../components/section/HeroSection";
import LineMovieList from "../components/layout/LineMovieList";
import { Movie } from "../types/movie";
import useSWR from "swr";
import { fetcher } from "../lib/fetcher";
import { useEffect, useMemo, useState } from "react";
import LineCharacterList from "@/components/layout/LineCharacterList";
import LineFbMatchList from "@/components/layout/LineFbMatchList";
import type { FootballMatch } from "@/components/cards/FootballMatchCard";
import Spinner from "@/components/atoms/Spinner";
import { uniqueMatches } from "./live/page";

export interface TMDBResponse<T> {
  results: T[];
}

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const BASE_URL = "https://api.themoviedb.org/3";

async function fetchPages<T>(url: string): Promise<TMDBResponse<T>> {
  const [page1, page2,] = await Promise.all([
    fetch(`${url}&page=1`).then(res => res.json()),
    fetch(`${url}&page=2`).then(res => res.json()),
  ]);

  return {
    results: [...(page1.results || []), ...(page2.results || [])],
  };
}


export const endpoints = {
  hero: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
  trending: `${BASE_URL}/trending/all/day?api_key=${API_KEY}`,
  action: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc`,
  adventure: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=12&sort_by=popularity.desc`,
  kDrama: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc`,
  indian: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc`,
  anime: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ja&with_genres=16&sort_by=popularity.desc`,
  animation: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc`,
  topRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
};


const filterRecentMovies = (movie: Movie) => {
  if (!movie.release_date) return false;
  const releaseYear = new Date(movie.release_date).getFullYear();
  const currentYear = new Date().getFullYear();
  return releaseYear >= currentYear - 5;
};

const LIVE = process.env.NEXT_PUBLIC_TORRENT_BACKEND_URL + "/live";

async function hasTorrent(imdbId?: string): Promise<boolean> {
  if (!imdbId) return false;
    try {
      const res = await fetch(`https://yts.mx/api/v2/movie_details.json?imdb_id=${imdbId}`);
      if (!res.ok) return false;
      const data = await res.json();
      const torrents = data?.data?.movie?.torrents ?? [];
      return torrents.length > 0;
    } catch {
      return false;
    }
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [torrentAvailableIds, setTorrentAvailableIds] = useState<Set<number>>(new Set());

  const { data: heroData, isLoading: heroLoading } = useSWR<TMDBResponse<Movie>>(endpoints.hero, fetchPages);
  const { data: trendingData, isLoading: trendingLoading } = useSWR<TMDBResponse<Movie>>(endpoints.trending, fetchPages);
  const { data: actionData, isLoading: actionLoading } = useSWR<TMDBResponse<Movie>>(endpoints.action, fetchPages);
  const { data: adventureData, isLoading: adventureLoading } = useSWR<TMDBResponse<Movie>>(endpoints.adventure, fetchPages);
  const { data: kDramaData, isLoading: kDramaLoading } = useSWR<TMDBResponse<Movie>>(endpoints.kDrama, fetchPages);
  const { data: indianData, isLoading: indianLoading } = useSWR<TMDBResponse<Movie>>(endpoints.indian, fetchPages);
  const { data: animeData, isLoading: animeLoading } = useSWR<TMDBResponse<Movie>>(endpoints.anime, fetchPages);
  const { data: animationData, isLoading: animationLoading } = useSWR<TMDBResponse<Movie>>(endpoints.animation, fetchPages);
  const { data: topRatedData, isLoading: topRatedLoading } = useSWR<TMDBResponse<Movie>>(endpoints.topRated, fetchPages);

  const {
    data: liveMatches,
    isLoading: liveMatchesLoading,
  } = useSWR<FootballMatch[]>(LIVE, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60_000,
    errorRetryCount: 3,
  });

  const heroMovies = useMemo(
    () => heroData?.results.slice(0, 5) ?? [], 
    [heroData]
  );

  useEffect(() => {
    // Run as soon as heroMovies are available
    if (heroMovies.length === 0) return;

    const fetchHeroTorrents = async () => {
      // 1. Get IMDb IDs for all candidates
      const imdbPromises = heroMovies.map(async (movie) => {
        try {
          const res = await fetch(`${BASE_URL}/movie/${movie.id}/external_ids?api_key=${API_KEY}`);
          const data = await res.json();
          return { ...movie, imdb_id: data.imdb_id };
        } catch {
          return movie;
        }
      });
      const withImdb = await Promise.all(imdbPromises);

      // 2. Check for torrents in chunks (to be kind to YTS)
      const limit = 3;
      for (let i = 0; i < withImdb.length; i += limit) {
        const chunk = withImdb.slice(i, i + limit);
        
        const results = await Promise.all(
          chunk.map(async (m) => {
            const has = await hasTorrent(m.imdb_id);
            return has ? m : null;
          })
        );
        
        const validMovies = results.filter(Boolean) as Movie[];
        
        if (validMovies.length > 0) {
          setTorrentAvailableIds(prevSet => {
            const newSet = new Set(prevSet);
            validMovies.forEach(m => newSet.add(m.id));
            return newSet;
          });
        }
      }
    };

    fetchHeroTorrents();
  }, [heroMovies]);

  const activeMovie = heroMovies[activeIndex];

  // Memoized movie lists
  const trendingMovies = useMemo(
    () => trendingData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [trendingData]
  );
  const actionMovies = useMemo(
    () => actionData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [actionData]
  );
  const adventureMovies = useMemo(
    () => adventureData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [adventureData]
  );
  const kDramaMovies = useMemo(
    () => kDramaData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [kDramaData]
  );
  const indianMovies = useMemo(
    () => indianData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [indianData]
  );
  const animeMovies = useMemo(
    () => animeData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [animeData]
  );
  const animationMovies = useMemo(
    () => animationData?.results.filter(filterRecentMovies).slice(0, 60) ?? [],
    [animationData]
  );
  const topRatedMovies = topRatedData?.results.slice(0, 60) ?? [];

  const liveMatchesToShow = uniqueMatches(liveMatches?.filter((m) => m.match_status === "live"));
  const engPRMatchesToShow = uniqueMatches(liveMatches?.filter((m) => m.league_name === "ENG PR"));


  return (
    <div>
      <HeroSection
        loading={heroLoading}
        movies={heroMovies}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        activeMovie={activeMovie}
        torrentAvailableIds={torrentAvailableIds}
      />

      <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-1 sm:px-2 pt-3">
        <LineMovieList title="Trending" moviesList={trendingMovies} link="/movies/categories/trending" loading={trendingLoading}/>
        <LineMovieList title="Action" moviesList={actionMovies} link="/movies/categories/action" loading={actionLoading}/>
        {liveMatchesLoading ? (
          <Spinner className="min-h-[280px]" />
        ) : (
          liveMatchesToShow.length > 0 && (
            <div className="mb-4">
              <LineFbMatchList liveMatchesList={liveMatchesToShow} title="Live Now" link="/live" />
            </div>
          )
        )}

        <LineMovieList title="Adventure" moviesList={adventureMovies} link="/movies/categories/adventure" loading={adventureLoading} />
        <LineMovieList title="K-Drama" moviesList={kDramaMovies} link="/movies/categories/kdrama" loading={kDramaLoading}/>
        <LineMovieList title="Bollywood" moviesList={indianMovies} link="/movies/categories/indian" loading={indianLoading}/>
        <LineMovieList title="Anime" moviesList={animeMovies} link="/movies/categories/anime" loading={animeLoading}/>
        <LineMovieList title="Animation" moviesList={animationMovies} link="/movies/categories/animation" loading={animationLoading}/>
        <LineMovieList title="Top Rated" moviesList={topRatedMovies} link="/movies/categories/toprated" loading={topRatedLoading}/>
        <LineCharacterList/>

        {liveMatchesLoading ? (
          <Spinner className="min-h-[280px]" />
        ) : (
          engPRMatchesToShow.length > 0 && (
            <div className="mb-4">
              <LineFbMatchList 
                liveMatchesList={engPRMatchesToShow}
                title="English Premier League"
                link="/live"
                logo="/epl-logo.png"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
