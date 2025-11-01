"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import axios from "axios";
import { nanoid } from "nanoid";
import CharCard from "../cards/CharCard";
import Link from "next/link";
import Spinner from "../atoms/Spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  job: string;
}

const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export default function LineCharacterList() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [directors, setDirectors] = useState<Person[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const options = ["Directors", "Actors"];

  const actorPages = [1, 2, 3];
  const { data: actorsData, error: actorsError } = useSWR<{ results: Person[] }[]>(
    actorPages.map(
      (page) =>
        `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=en-US&page=${page}`
    ),
    async (urls) => {
      const results = await Promise.all(urls.map(fetcher));
      return results;
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const moviePages = [1, 2, 3];
  const { data: moviesData, error: moviesError } = useSWR<{ results: { id: number }[] }[]>(
    moviePages.map(
      (page) =>
        `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${page}`
    ),
    async (urls) => {
      const results = await Promise.all(urls.map(fetcher));
      return results;
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  useEffect(() => {
    if (!moviesData) return;

    const fetchDirectors = async () => {
      const directorMap = new Map<number, Person>();
      const movies = moviesData.flatMap((page) => page.results);

      const promises = movies.map(async (movie) => {
        try {
          const creditsRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}`
          );
          const crew = creditsRes.data.crew as Person[];
          
          crew
            .filter((c) => c.job === "Director")
            .forEach((d) => {
              if (!directorMap.has(d.id)) {
                directorMap.set(d.id, {
                  id: d.id,
                  name: d.name,
                  profile_path: d.profile_path,
                  known_for_department: "Directing",
                  popularity: d.popularity || 0,
                  job: "Director",
                });
              }
            });
        } catch (err) {
          console.error("Credits fetch error:", err);
        }
      });

      await Promise.all(promises);

      const sortedDirectors = Array.from(directorMap.values())
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 50);

      setDirectors(sortedDirectors);
    };

    fetchDirectors();
  }, [moviesData]);

  const actors: Person[] = actorsData
    ? actorsData
        .flatMap((page) => page.results)
        .filter((p) => p.known_for_department === "Acting")
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 50)
    : [];

  const activeList = activeIndex === 0 ? directors : actors;


  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.95;
    const target =
      dir === "left" ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    handleScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeList]);

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-white sm:text-2xl text-lg font-semibold">Characters</h1>

        <div className="flex border border-[#228ee5]/80 rounded-3xl overflow-hidden">
          {options.map((option, index) => (
            <button
              key={nanoid()}
              className={`cursor-pointer py-2.5 px-3 text-sm font-medium transition-all duration-300 ${
                activeIndex === index
                  ? `bg-[#228EE5] text-white ${
                      index === 1
                        ? "rounded-l-[17.5px] border-l border-[#228ee5]/80"
                        : "rounded-r-[17.5px] border-r border-[#228ee5]/80"
                    }`
                  : "bg-transparent text-slate-200"
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {actorsError || moviesError ? (
        <div className="text-red-500">Failed to load data.</div>
      ) : !actorsData || (!directors.length && activeIndex === 0) ? (
        <Spinner className="py-8" />
      ) : activeList.length === 0 ? (
        <div className="text-gray-400">No {options[activeIndex]} found.</div>
      ) : (
        <div
          ref={scrollRef}
          className="flex flex-row overflow-x-auto gap-4 scrollbar-hide scroll-smooth"
        >
          {activeList.map((person) => (
            <Link
              className="mr-2 sm:mr-5 last:mr-0"
              key={nanoid()}
              href={`/person/${person.id}`}
              scroll={true}
            >
              <CharCard person={person} />
            </Link>
          ))}
        </div>
      )}


      {showLeft && (
          <button
          onClick={() => scroll("left")}
          className="absolute -left-7 top-1/2 p-2.5 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full border border-white/80 items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/60 group backdrop-blur-xs hidden md:block"
        >
          <ChevronLeft className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
        </button>
      )}

      {showRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-7 top-1/2 p-2.5 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full border border-white/80 items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/60 group backdrop-blur-xs hidden md:block"
        >
          <ChevronRight className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
        </button>
      )}
    </div>
  );
}
