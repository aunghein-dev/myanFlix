"use client";

import HeroSection from "../components/section/HeroSection";
import LineMovieList from "../components/layout/LineMovieList";
import { Movie } from "../types/movie";
import useSWR from "swr";
import { fetcher } from "../lib/fetcher";
import { useMemo, useState } from "react";
import LineCharacterList from "@/components/layout/LineCharacterList";
import LineFbMatchList from "@/components/layout/LineFbMatchList";
import type { FootballMatch } from "@/components/cards/FootballMatchCard";
import Spinner from "@/components/atoms/Spinner";
import { uniqueMatches } from "./live/page";
import BannerAd from "@/components/ads/BannerAd";


export interface TMDBResponse<T> {
  results: T[];
}

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const BASE_URL = "https://api.themoviedb.org/3";

export const endpoints = {
  hero: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`,
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
  return releaseYear >= currentYear - 10; 
 }


  const LIVE = process.env.NEXT_PUBLIC_TORRENT_BACKEND_URL + "/live";
export default function Home() {
  const [activeIndex, setActiveIndex] = useState(2);

  const { data: heroData, isLoading: heroLoading } = useSWR<TMDBResponse<Movie>>(endpoints.hero, fetcher);
  const { data: trendingData, isLoading: trendingLoading } = useSWR<TMDBResponse<Movie>>(endpoints.trending, fetcher);
  const { data: actionData, isLoading: actionLoading } = useSWR<TMDBResponse<Movie>>(endpoints.action, fetcher);
  const { data: adventureData, isLoading: adventureLoading } = useSWR<TMDBResponse<Movie>>(endpoints.adventure, fetcher);
  const { data: kDramaData, isLoading: kDramaLoading } = useSWR<TMDBResponse<Movie>>(endpoints.kDrama, fetcher);
  const { data: indianData, isLoading: indianLoading } = useSWR<TMDBResponse<Movie>>(endpoints.indian, fetcher);
  const { data: animeData, isLoading: animeLoading } = useSWR<TMDBResponse<Movie>>(endpoints.anime, fetcher);
  const { data: animationData, isLoading: animationLoading } = useSWR<TMDBResponse<Movie>>(endpoints.animation, fetcher);
  const { data: topRatedData, isLoading: topRatedLoading } = useSWR<TMDBResponse<Movie>>(endpoints.topRated, fetcher);

  const {
    data: liveMatches,
    error,
    isLoading: liveMatchesLoading,
  } = useSWR<FootballMatch[]>(
    LIVE,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000, 
      errorRetryCount: 3,
    }
  );

  const heroMovies = heroData?.results.slice(0, 5) ?? [];

  if (heroMovies.length > 1) {
    const first = heroMovies.shift(); 
    if (first) {
      heroMovies.splice(2, 0, first);
    }
  }

  const activeMovie = heroMovies[activeIndex];

  const trendingMovies = useMemo(
    () => trendingData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [trendingData]
  );
  const actionMovies = useMemo(
    () => actionData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [actionData]
  );
  const adventureMovies = useMemo(
    () => adventureData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [adventureData]
  );
  const kDramaMovies = useMemo(
    () => kDramaData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [kDramaData]
  );
  const indianMovies = useMemo(
    () => indianData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [indianData]
  );
  const animeMovies = useMemo(
    () => animeData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [animeData]
  );
  const animationMovies = useMemo(
    () => animationData?.results.filter(filterRecentMovies).slice(0, 20) ?? [],
    [animationData]
  );
  const topRatedMovies = topRatedData?.results.slice(0, 20) ?? [];

  const liveMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.match_status === "live")
  );

  const engPRMatchesToShow = uniqueMatches(
    liveMatches?.filter((m) => m.league_name === "ENG PR")
  );

  return (
    <div>
      <HeroSection
        loading={heroLoading}
        movies={heroMovies}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        activeMovie={activeMovie}
      />

      <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-1 sm:px-2 pt-3">
        <LineMovieList title="Trending" moviesList={trendingMovies} link="/movies/categories/trending" loading={trendingLoading}/>
        <LineMovieList title="Action" moviesList={actionMovies} link="/movies/categories/action" loading={actionLoading}/>
        {
          liveMatchesLoading ? <Spinner className="min-h-[280px]"/> : (
            liveMatchesToShow.length > 0 &&
            <div className="mb-4">
              <LineFbMatchList 
                liveMatchesList={liveMatchesToShow} 
                title="Live Now" 
                link="/live" 
                />
            </div>
          )
        }

        <LineMovieList title="Adventure" moviesList={adventureMovies} link="/movies/categories/adventure" loading={adventureLoading} />
        <LineMovieList title="K-Drama" moviesList={kDramaMovies} link="/movies/categories/kdrama" loading={kDramaLoading}/>
        <LineMovieList title="Bollywood" moviesList={indianMovies} link="/movies/categories/indian" loading={indianLoading}/>
        <LineMovieList title="Anime" moviesList={animeMovies} link="/movies/categories/anime" loading={animeLoading}/>
        <LineMovieList title="Animation" moviesList={animationMovies} link="/movies/categories/animation" loading={animationLoading}/>
        <LineMovieList title="Top Rated" moviesList={topRatedMovies} link="/movies/categories/toprated" loading={topRatedLoading}/>
        <LineCharacterList/>
         {
          liveMatchesLoading ? <Spinner className="min-h-[280px]"/> : (
            engPRMatchesToShow.length > 0 &&
            <div className="mb-4">
              <LineFbMatchList 
                liveMatchesList={engPRMatchesToShow} 
                title="English Premier League" 
                link="/live" 
                logo="/epl-logo.png"
                />
            </div>
          )
        }
      </div>
    </div>
  );
}
