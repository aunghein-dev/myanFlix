import { Movie } from "../../types/movie";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import Image from "next/image";

export default function HeroDetails({ activeMovie }: { activeMovie: Movie }) {
  return (
    <>
      {activeMovie && <div>
        <h1 className="font-oswald text-4xl font-bold mb-2 text-white line-clamp-1">{activeMovie.title}</h1>
        <p className="font-inter max-w-lg text-white/75 leading-snug mb-2 line-clamp-3 text-sm sm:text-md">
          {activeMovie.overview}
        </p>

        <div className="flex flex-row items-center space-x-1 mt-1 min-h-[30px] ">
          <Image width={100} height={20} unoptimized src="/rates.svg" alt="Rates Logo"/>
          <Image width={36} height={20} unoptimized src="/imdb.svg" alt="Imdb Logo"/>
          <span className="text-white">{activeMovie.vote_average.toFixed(1)}</span>
        </div>

        <div className="mt-1.5 flex flex-row items-center gap-3">
          <Link className="text-white sm:text-md text-sm flex flex-row items-center 
                            bg-[#228EE5] hover:bg-[#1b6fb8] transition-colors 
                            duration-300 px-5 py-2 rounded-3xl font-medium z-100 cursor-pointer"
                href={`/videoplayer/${activeMovie.id}`}>
            <FaPlay className="inline mr-1 h-3 w-4"/>
            Watch Movie
          </Link>
          <Link className="border-[1px] sm:text-md text-sm border-[#228EE5] text-white flex flex-row items-center 
                            hover:bg-white/10 transition-colors 
                            duration-300 px-5 py-2 rounded-3xl font-medium z-100 cursor-pointer"
                href={`/details/${activeMovie.id}`}>
            More Info
            <FaArrowRightLong className="inline ml-1 h-3 w-3"/>
          </Link>
        </div>
       </div>
      }
    </>
  );
}