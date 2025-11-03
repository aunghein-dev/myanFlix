"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Movie } from "@/types/movie";
import PersonRelateGrid from "@/components/layout/PersonRelateGrid";
import RelatedCeleGrid from "@/components/layout/RelatedCeleGrid";
import { Person } from "@/components/layout/LineCharacterList";
import GlobalImage from "@/components/atoms/GlobalImage";
import useSWR from "swr";
import Spinner from "@/components/atoms/Spinner";
import dynamic from 'next/dynamic';

const HilltopAds = dynamic(() => import('@/components/ads/HilltopAds'), { ssr: false });

interface PersonDetails {
  biography: string;
  birthday: string;
  deathday: string;
  gender: number;
  id: number;
  imdb_id: string;
  known_for_department: string;
  name: string;
  place_of_birth: string;
  popularity: number;
  profile_path: string;
}

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PersonPage() {
  const { slug } = useParams() as { slug: string };
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: personData,
    isLoading: isPersonLoading,
  } = useSWR<PersonDetails>(
    slug ? `https://api.themoviedb.org/3/person/${slug}?api_key=${API_KEY}` : null,
    fetcher
  );

  const {
    data: movieCredits,
    isLoading: isMoviesLoading,
  } = useSWR<{ cast: Movie[]; crew: Movie[] }>(
    slug
      ? `https://api.themoviedb.org/3/person/${slug}/combined_credits?api_key=${API_KEY}&language=en-US`
      : null,
    fetcher
  );

  const movies: Movie[] = useMemo(() => {
    if (!movieCredits?.cast && !movieCredits?.crew) return [];
    const all = movieCredits.cast.concat(movieCredits.crew);
    return Array.from(new Map(
      all
        .filter((m: Movie) => m.media_type === "movie" && m.poster_path)
        .map((m: Movie) => [m.id, m])
    ).values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 60);
  }, [movieCredits]);

  const {
    data: relatedCelebrities,
    isLoading: isRelatedLoading,
  } = useSWR(
    movies.length
      ? [`related-${slug}`, movies.slice(0, 3)]
      : null,
    async ([, selectedMovies]) => {
      const relatedSet = new Map<number, Person>();

      for (const movie of selectedMovies) {
        const res = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
        );

        res.data.cast.forEach((p: Person) => {
          if (p.id !== Number(slug)) {
            relatedSet.set(p.id, p);
          }
        });
      }

      return Array.from(relatedSet.values())
        .filter((p) => p.profile_path)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 14);
    }
  );

  useEffect(() => {
    if (!slug) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const y =
        scrollRef.current.getBoundingClientRect().top + window.scrollY - 200;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }, [slug]);

  return (
    <div
      ref={scrollRef}
      className="mx-auto max-w-6xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl px-4 sm:px-2 mt-30"
    >
      {isPersonLoading ? (
        <div className="flex items-center justify-center min-h-[196px]">
         <Spinner/>
        </div>
      ) : (
        personData && (
          <div className="flex flex-row flex-wrap items-center gap-6">
            <GlobalImage
              width={130}
              height={130}
              src={`https://image.tmdb.org/t/p/w185${personData.profile_path}`}
              alt={personData?.name || "Person photo"}
              className="w-34 h-34 rounded-full object-cover object-center"
            />
            <div className="flex flex-col flex-1">
              <h1 className="text-xl font-bold text-white">{personData?.name}</h1>
              <h3 className="text-sm text-white my-1">
                {personData?.known_for_department === "Directing"
                  ? "Director"
                  : personData?.gender === 1 ? "Actress" : "Actor"}
              </h3>
              <p className="text-sm text-white/50 line-clamp-7">
                {personData?.biography}
              </p>
            </div>
          </div>
        )
      )}

      <PersonRelateGrid movies={movies} isLoading={isMoviesLoading} />
      <RelatedCeleGrid celebrities={relatedCelebrities ?? []} isLoading={isMoviesLoading || isRelatedLoading}/>
      <HilltopAds/>
    </div>
  );
}
