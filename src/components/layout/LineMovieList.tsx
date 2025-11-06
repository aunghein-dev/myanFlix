"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { GoArrowRight } from "react-icons/go";
import MovieCard from "../cards/MovieCard";
import { Movie } from "../../types/movie";
import Spinner from "../atoms/Spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LineMovieListProps {
  moviesList: Movie[];
  title?: string;
  link?: string;
  loading?: boolean;
}

export default function LineMovieList({
  moviesList,
  title,
  link,
  loading,
}: LineMovieListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);


  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    handleScroll(); 
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [moviesList]);

  const scroll = (dir: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.95; 
    const target =
      dir === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <div className="w-full flex-1 relative">
      {title && (
        <div className="flex justify-between items-center py-3 px-1 sm:px-0">
          <h1 className="font-oswald text-white sm:text-2xl text-lg font-semibold">{title}</h1>

          {link && (
            <Link
              href={link}
              className="inline-flex items-center text-[#228EE5] text-sm
                        underline-offset-2 transition-all duration-300
                        decoration-2 ease-in-out hover:underline select-none"
            >
              <span className="flex items-center gap-1">
                See More
                <GoArrowRight className="h-5 w-5" />
              </span>
            </Link>
          )}
        </div>
      )}


      <div
        ref={scrollRef}
        className="flex flex-row py-1 min-h-[270.5px] overflow-x-auto scrollbar-hide space-x-3 scroll-smooth"
      >
        {loading && (
          <div className="w-full min-w-full min-h-[265px] sm:min-h-[270.5px] flex justify-center items-center">
            <Spinner />
          </div>
        )}
        {!loading &&
          moviesList.map((movie) => (
            <Link
              key={movie.id}
              className="inline-block"
              href={`/details/${movie.id}`}
            >
              <MovieCard movie={movie} />
            </Link>
          ))}
      </div>

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
