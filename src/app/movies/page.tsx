"use client";

import LineMovieList from "../../components/layout/LineMovieList";
import { Movie } from "../../types/movie";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";
import { useMemo } from "react";
import AdsterraAdsBanner from "@/components/ads/AdsterraAdsBanner";


const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const BASE_URL = "https://api.themoviedb.org/3";

interface TMDBResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

interface TMDBCompanySearchResult {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

interface TMDBKeywordSearchResult {
  id: number;
  name: string;
}

interface TMDBCompanySearchResponse {
  results: TMDBCompanySearchResult[];
}

interface TMDBKeywordSearchResponse {
  results: TMDBKeywordSearchResult[];
}

type TMDBCategoryKind = "trending" | "top_rated" | "now_playing" | "discover";

interface FetchCategoryConfig {
  kind?: TMDBCategoryKind;
  discoverOptions?: Record<string, string | number>;
  companyName?: string;
  keywordName?: string;
  trendingMedia?: "movie" | "all";
}

function normalizeMovies(items?: Movie[], limit = 20): Movie[] {
  if (!items?.length) return [];

  const onlyMovies = items.filter(
    (m) => m && (m.media_type === "movie" || typeof m.title === "string")
  );

  const unique = Array.from(new Map(onlyMovies.map((m) => [m.id, m])).values());
  return unique.slice(0, limit);
}

async function tmdbFetch<T>(url: string): Promise<T> {
  const res = await fetcher(url);
  return res as T;
}

async function resolveCompanyId(name: string): Promise<number | null> {
  const url = `${BASE_URL}/search/company?api_key=${API_KEY}&query=${encodeURIComponent(name)}`;
  const res = await tmdbFetch<TMDBCompanySearchResponse>(url);
  return res?.results?.[0]?.id ?? null;
}

async function resolveKeywordId(keyword: string): Promise<number | null> {
  const url = `${BASE_URL}/search/keyword?api_key=${API_KEY}&query=${encodeURIComponent(keyword)}`;
  const res = await tmdbFetch<TMDBKeywordSearchResponse>(url);
  return res?.results?.[0]?.id ?? null;
}

async function fetchCategory(config: FetchCategoryConfig): Promise<Movie[]> {
  const { kind = "discover", discoverOptions, companyName, keywordName, trendingMedia = "movie" } = config;

  try {
    if (kind === "trending") {
      const url = `${BASE_URL}/trending/${trendingMedia}/day?api_key=${API_KEY}`;
      const res = await tmdbFetch<TMDBResponse>(url);
      return normalizeMovies(res.results);
    }

    if (kind === "top_rated") {
      const url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`;
      const res = await tmdbFetch<TMDBResponse>(url);
      return normalizeMovies(res.results);
    }

    if (kind === "now_playing") {
      const url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`;
      const res = await tmdbFetch<TMDBResponse>(url);
      return normalizeMovies(res.results);
    }

    const params: Record<string, string> = {
      api_key: API_KEY,
      include_adult: "false",
      page: "1",
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

    const url = `${BASE_URL}/discover/movie?${new URLSearchParams(params).toString()}`;
    const res = await tmdbFetch<TMDBResponse>(url);
    return normalizeMovies(res.results);
  } catch (err) {
    console.error(`fetchCategory error (${kind}):`, err);
    return [];
  }
}

interface CategoryConfig {
  key: string;
  title: string;
  fetcherConfig: FetchCategoryConfig;
}

const currentYear = new Date().getFullYear();
export const oscarYear = currentYear;

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: "trending", title: "Trending Movies", fetcherConfig: { kind: "trending" } },
  { key: "topBoxOffice", title: "Top Box Office", fetcherConfig: { kind: "discover", discoverOptions: { sort_by: "revenue.desc" } } },
  { key: "newReleases", title: "New Releases", fetcherConfig: { kind: "now_playing" } },
  { key: "action", title: "Action", fetcherConfig: { kind: "discover", discoverOptions: { with_genres: "28", sort_by: "popularity.desc" } } },
  { key: "marvel", title: "Marvel Movies", fetcherConfig: { kind: "discover", companyName: "Marvel Studios", discoverOptions: { sort_by: "popularity.desc" } } },
  { key: "dc", title: "DC Movies", fetcherConfig: { kind: "discover", companyName: "DC Comics", discoverOptions: { sort_by: "popularity.desc" } } },
  { key: "romanticComedies", title: "Romantic Comedies", fetcherConfig: { kind: "discover", discoverOptions: { with_genres: "35,10749", sort_by: "popularity.desc" } } },
  { key: "zombies", title: "Zombies Attacking!", fetcherConfig: { kind: "discover", keywordName: "zombie", discoverOptions: { sort_by: "popularity.desc" } } },
  {
    key: `oscar${oscarYear}`,
    title: `Oscar ${oscarYear}`,
    fetcherConfig: {
      kind: "discover",
      discoverOptions: {
        primary_release_year: String(oscarYear),
        sort_by: "vote_average.desc",
        "vote_count.gte": "50",
      },
    },
  },
];


function useCategoryMovies() {
  const trending = useSWR<Movie[]>(
    'movies:trending', 
    () => fetchCategory(CATEGORY_CONFIGS[0].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const topBoxOffice = useSWR<Movie[]>(
    'movies:topBoxOffice', 
    () => fetchCategory(CATEGORY_CONFIGS[1].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const newReleases = useSWR<Movie[]>(
    'movies:newReleases', 
    () => fetchCategory(CATEGORY_CONFIGS[2].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const action = useSWR<Movie[]>(
    'movies:action', 
    () => fetchCategory(CATEGORY_CONFIGS[3].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const marvel = useSWR<Movie[]>(
    'movies:marvel', 
    () => fetchCategory(CATEGORY_CONFIGS[4].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const dc = useSWR<Movie[]>(
    'movies:dc', 
    () => fetchCategory(CATEGORY_CONFIGS[5].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const romanticComedies = useSWR<Movie[]>(
    'movies:romanticComedies', 
    () => fetchCategory(CATEGORY_CONFIGS[6].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const zombies = useSWR<Movie[]>(
    'movies:zombies', 
    () => fetchCategory(CATEGORY_CONFIGS[7].fetcherConfig),
    { revalidateOnFocus: false }
  );
  
  const oscar = useSWR<Movie[]>(
    `movies:oscar${oscarYear}`, 
    () => fetchCategory(CATEGORY_CONFIGS[8].fetcherConfig),
    { revalidateOnFocus: false }
  );

  return {
    trending,
    topBoxOffice,
    newReleases,
    action,
    marvel,
    dc,
    romanticComedies,
    zombies,
    oscar,
  };
}

export default function MoviesPage() {
  const {
    trending,
    topBoxOffice,
    newReleases,
    action,
    marvel,
    dc,
    romanticComedies,
    zombies,
    oscar,
  } = useCategoryMovies();

  const lists = useMemo(
    () => ({
      trending: trending.data ?? [],
      topBoxOffice: topBoxOffice.data ?? [],
      newReleases: newReleases.data ?? [],
      action: action.data ?? [],
      marvel: marvel.data ?? [],
      dc: dc.data ?? [],
      romanticComedies: romanticComedies.data ?? [],
      zombies: zombies.data ?? [],
      [`oscar${oscarYear}`]: oscar.data ?? [],
    }),
    [trending, topBoxOffice, newReleases, action, marvel, dc, romanticComedies, zombies, oscar]
  );

  const loadings = {
    trending: trending.isLoading,
    topBoxOffice: topBoxOffice.isLoading,
    newReleases: newReleases.isLoading,
    action: action.isLoading,
    marvel: marvel.isLoading,
    dc: dc.isLoading,
    romanticComedies: romanticComedies.isLoading,
    zombies: zombies.isLoading,
    [`oscar${oscarYear}`]: oscar.isLoading,
  };

  return (
    <section className="mx-auto mb-8 max-w-6xl px-1 sm:px-2 md:max-w-3xl lg:max-w-5xl">
      <div className="sm:min-h-[110px] min-h-20"></div>
      <div className="">
        <AdsterraAdsBanner/>
        {CATEGORY_CONFIGS.map((c) => (
          <LineMovieList
            key={c.key}
            title={c.title}
            moviesList={lists[c.key as keyof typeof lists] ?? []}
            link={`/movies/categories/${c.key}`}
            loading={loadings[c.key as keyof typeof loadings] ?? false}
          />
        ))}
      </div>

    </section>
  );
}