"use client";

import { CATEGORY_CONFIGS, oscarYear } from "../../page";
import { fetcher } from "../../../../lib/fetcher";
import { Movie } from "../../../../types/movie";
import MovieFullCard from "../../../../components/cards/MovieFullCard";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Spinner from "@/components/atoms/Spinner";


const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const BASE_URL = "https://api.themoviedb.org/3";

// TMDB API response types
interface TMDBCompanySearchResult {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

interface TMDBCompanySearchResponse {
  results: TMDBCompanySearchResult[];
}

interface TMDBKeywordSearchResult {
  id: number;
  name: string;
}

interface TMDBKeywordSearchResponse {
  results: TMDBKeywordSearchResult[];
}

interface TMDBMovieResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}

// Category config types
interface DiscoverOptions {
  with_genres?: string | number;
  sort_by?: string;
  "vote_average.gte"?: number;
  "vote_count.gte"?: number;
  with_original_language?: string;
  [key: string]: string | number | undefined;
}

interface CategoryFetcherConfig {
  kind?: "discover" | "trending" | "top_rated" | "now_playing";
  discoverOptions?: DiscoverOptions;
  companyName?: string;
  keywordName?: string;
  trendingMedia?: string;
}

// Helper to fetch TMDB data
async function tmdbFetch<T>(url: string): Promise<T> {
  const res = await fetcher(url);
  return res as T;
}

// Resolve company / keyword IDs
async function resolveCompanyId(name: string): Promise<number | null> {
  const res = await tmdbFetch<TMDBCompanySearchResponse>(
    `${BASE_URL}/search/company?api_key=${API_KEY}&query=${encodeURIComponent(name)}`
  );
  return res?.results?.[0]?.id ?? null;
}

async function resolveKeywordId(keyword: string): Promise<number | null> {
  const res = await tmdbFetch<TMDBKeywordSearchResponse>(
    `${BASE_URL}/search/keyword?api_key=${API_KEY}&query=${encodeURIComponent(keyword)}`
  );
  return res?.results?.[0]?.id ?? null;
}

// Fetch movies based on config
async function fetchCategory(config: CategoryFetcherConfig, page: number = 1): Promise<Movie[]> {
  const { kind = "discover", discoverOptions, companyName, keywordName, trendingMedia = "movie" } = config;

  try {
    let url = "";

    if (kind === "trending") {
      url = `${BASE_URL}/trending/${trendingMedia}/day?api_key=${API_KEY}&page=${page}`;
    } else if (kind === "top_rated") {
      url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}`;
    } else if (kind === "now_playing") {
      url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`;
    } else {
      const params: Record<string, string> = {
        api_key: API_KEY,
        include_adult: "false",
        page: String(page),
        ...Object.fromEntries(
          Object.entries(discoverOptions ?? {}).map(([k, v]) => [k, String(v)])
        ),
      };

      if (companyName) {
        const id = await resolveCompanyId(companyName);
        if (id) params.with_companies = String(id);
      }

      if (keywordName) {
        const id = await resolveKeywordId(keywordName);
        if (id) params.with_keywords = String(id);
      }

      url = `${BASE_URL}/discover/movie?${new URLSearchParams(params).toString()}`;
    }

    const res = await tmdbFetch<TMDBMovieResponse>(url);

    // Filter out all series / TV shows
    const onlyMovies = res.results.filter(
      (m) => m && (!("media_type" in m) || m.media_type === "movie")
    );

    return onlyMovies;
  } catch (err) {
    console.error(`fetchCategory error (${kind}):`, err);
    return [];
  }
}

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };

  const homeCategoryEndpoints: Record<string, string> = {
    trending: `${BASE_URL}/trending/movie/day?api_key=${API_KEY}`,
    action: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc`,
    adventure: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=12&sort_by=popularity.desc`,
    kdrama: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc`,
    indian: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc`,
    anime: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ja&with_genres=16&sort_by=popularity.desc`,
    animation: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc`,
    toprated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
  };

  // MoviesPage categories (from CATEGORY_CONFIGS)
  const moviesPageCategories: Record<string, CategoryFetcherConfig> = Object.fromEntries(
    CATEGORY_CONFIGS.map((cfg) => [cfg.key.toLowerCase(), cfg.fetcherConfig as CategoryFetcherConfig])
  );

  const isHomeCategory = slug.toLowerCase() in homeCategoryEndpoints;
  const isMoviesPageCategory = slug.toLowerCase() in moviesPageCategories;

  const selectedEndpoint = isHomeCategory ? homeCategoryEndpoints[slug.toLowerCase()] : null;
  const selectedConfig = isMoviesPageCategory ? moviesPageCategories[slug.toLowerCase()] : null;

  // Fetch data
  const { data: homeData, error: homeError, isLoading: homeLoading } = useSWR<TMDBMovieResponse[]>(
    selectedEndpoint
      ? [
          `${selectedEndpoint}&page=1`,
          `${selectedEndpoint}&page=2`,
          `${selectedEndpoint}&page=3`,
        ]
      : null,
    (...urls: string[]) => Promise.all(urls.map((u) => tmdbFetch<TMDBMovieResponse>(u)))
  );

  const { data: moviesPageData, error: moviesPageError, isLoading: moviesPageLoading } = useSWR<Movie[][]>(
    selectedConfig
      ? [
          `movies-page-${slug}-page-1`,
          `movies-page-${slug}-page-2`,
          `movies-page-${slug}-page-3`,
        ]
      : null,
    () =>
      Promise.all([
        fetchCategory(selectedConfig!, 1),
        fetchCategory(selectedConfig!, 2),
        fetchCategory(selectedConfig!, 3),
      ])
  );

  const isLoading = isHomeCategory ? homeLoading : moviesPageLoading;
  const error = isHomeCategory ? homeError : moviesPageError;

  const movies = useMemo(() => {
    if (isHomeCategory && homeData) {
      const allMovies = homeData.flatMap((page) => page.results ?? []);
      const filtered = allMovies.filter((m) => (!("media_type" in m) || m.media_type === "movie"));
      const unique = Array.from(new Map(filtered.map((m) => [m.id, m])).values());
      return unique.slice(0, 56);
    }

    if (isMoviesPageCategory && moviesPageData) {
      const allMovies = moviesPageData.flat();
      const filtered = allMovies.filter((m) => m && (!("media_type" in m) || m.media_type === "movie"));
      const unique = Array.from(new Map(filtered.map((m) => [m.id, m])).values());
      return unique.slice(0, 56);
    }

    return [];
  }, [homeData, moviesPageData, isHomeCategory, isMoviesPageCategory]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <Spinner />
      </div>
    );
  }

  if (error || (!isHomeCategory && !isMoviesPageCategory)) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div>Category not found or failed to load</div>
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div>No movies found</div>
      </div>
    );
  }

  const formatHeader = () => {
    const categoryMap: Record<string, string> = {
      trending: "Trending",
      action: "Action",
      adventure: "Adventure",
      kdrama: "K-Drama",
      indian: "Bollywood",
      anime: "Anime",
      animation: "Animation",
      toprated: "Top Rated",
      topboxoffice: "Top Box Office",
      newreleases: "New Releases",
      marvel: "Marvel Movies",
      dc: "DC Movies",
      romanticcomedies: "Romantic Comedies",
      zombies: "Zombies Attacking!",
      [`oscar${oscarYear}`]: `Oscar ${oscarYear}`,
    };
    return categoryMap[slug.toLowerCase()] || slug.replace(/_/g, " ");
  };

  return (
    <section className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-1 sm:px-2 sm:mt-30 mt-24 mb-4">
      <h1 className="sm:text-xl text-lg font-semibold text-white mb-4 capitalize tracking-wide">
        {formatHeader()} Movies
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {movies.map((movie, idx) => (
          <div key={movie.id}>
            <MovieFullCard movie={movie} rank={idx + 1} />
          </div>
        ))}
      </div>

    </section>
  );
}