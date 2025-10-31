"use client";

import { useRef, useState, useEffect } from "react";
import { MovieDetails } from "@/app/details/[slug]/page";
import Link from "next/link";
import GlobalImage from "../atoms/GlobalImage";
import { ChevronLeft, ChevronRight } from "lucide-react";


export default function CharCardListAtDetail({
  selectedMovie,
  isMovieLoading,
}: {
  selectedMovie: MovieDetails;
  isMovieLoading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

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
  }, [selectedMovie]);

  const castList = selectedMovie?.credits?.cast?.slice(0, 20) ?? [];

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold text-white mt-8">
        {!isMovieLoading && "Characters"}
      </h2>

      {castList.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-4 mt-4 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {castList.map((member) => (
            <Link
              key={member.credit_id}
              className="flex-shrink-0 w-24 cursor-pointer relative group"
              href={`/person/${member.id}`}
            >
              <GlobalImage
                width={96}
                height={96}
                src={`https://image.tmdb.org/t/p/w200${member.profile_path}`}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover transition-transform duration-200"
              />
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors duration-150 ease-out pointer-events-none" />
              <p className="text-white text-sm mt-2 line-clamp-1">{member.name}</p>
              <p className="text-gray-400 text-xs line-clamp-1">
                {member.character}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 mt-4">
          {!isMovieLoading && "No character information available"}
        </p>
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
