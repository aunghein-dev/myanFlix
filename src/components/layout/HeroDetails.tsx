"use client";

import { useEffect, useState } from "react";
import { Movie } from "../../types/movie";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { LiaImdb } from "react-icons/lia";
import Spinner from "../atoms/Spinner";

export default function HeroDetails({ activeMovie, hasTorrent }: { activeMovie: Movie, hasTorrent: boolean }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [activeMovie]);

  return (
    <>
      {activeMovie && <div>
        <h1 className="font-oswald text-4xl font-bold mb-2 text-white line-clamp-1">{activeMovie.title}</h1>
        <p className="font-inter max-w-lg text-white/75 leading-snug mb-2 line-clamp-3 text-sm sm:text-md">
          {activeMovie.overview}
        </p>

        <div className="flex flex-row items-center mt-1 min-h-[30px] pl-[0.5px]">
          <Link href={'https://www.google.com/search?q=imdb'}
                target="_blank">
              <LiaImdb className="w-11 h-11 mr-2 text-white"/>
          </Link>
          <span className="text-[#f89c02] text-3xl font-bold relative">{activeMovie.vote_average.toFixed(1)}
            <span className="absolute text-white text-lg -bottom-[1px] -right-7 font-medium">/10</span>
          </span>
        </div>

        {/* Buttons Section */}
          <div className="mt-1.5 min-h-[42px] flex flex-row items-center justify-start">
            {loading ? (
              <Spinner className="text-white ml-[0.5px]" size={25}/> 
            ) : hasTorrent ? (
              <div className="flex flex-row items-center gap-3">
                <Link
                  className="text-white sm:text-md text-sm flex items-center 
                             bg-[#228EE5] hover:bg-[#1b6fb8] transition-colors 
                             duration-300 px-5 py-2 rounded-3xl font-medium cursor-pointer"
                  href={`/videoplayer/${activeMovie.id}`}
                >
                  <FaPlay className="inline mr-1 h-3 w-4"/>
                  Watch Movie
                </Link>
                <Link
                  className="border-[1px] sm:text-md text-sm border-[#228EE5] text-white flex items-center 
                             hover:bg-white/10 transition-colors duration-300 px-5 py-2 rounded-3xl font-medium cursor-pointer"
                  href={`/details/${activeMovie.id}`}
                >
                  More Info
                  <FaArrowRightLong className="inline ml-1 h-3 w-3"/>
                </Link>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-3">
                <Link
                  className="border-[1px] sm:text-md text-sm border-[#228EE5] 
                             text-white flex items-center 
                             hover:bg-white/10 transition-colors duration-300 px-5 py-2 rounded-3xl font-medium cursor-pointer"
                  href={`/details/${activeMovie.id}`}
                >
                  More Info
                  <FaArrowRightLong className="inline ml-1 h-3 w-3"/>
                </Link>
              </div>
            )}
          </div>
       </div>
      }
    </>
  );
}