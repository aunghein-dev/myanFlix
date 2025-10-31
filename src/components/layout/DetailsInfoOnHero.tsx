import { MovieDetails } from "../../app/details/[slug]/page";
import { numberToHourMinute } from "../../utils/numberToHourMinute";
import dayjs from "dayjs";
import { FaPlay } from "react-icons/fa";
import { GoThumbsdown, GoThumbsup } from "react-icons/go";
import { HiOutlineBookmark } from "react-icons/hi2";
import Image from "next/image";
import Link from "next/link";

export default function DetailsInfoOnHero({ selectedMovie }: { selectedMovie: MovieDetails }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full ">
      <div className="flex-1 lg:pr-8">
        <div className="">
          <h1 className="text-4xl text-white font-bold">{selectedMovie?.title}</h1>
          <div className="text-white mt-2">
            <span>{numberToHourMinute(selectedMovie?.runtime || 0)}</span>
            {" - "}
            <span>{dayjs(selectedMovie?.release_date).format("YYYY") || ""}</span>
            {" - "}
            <span>{selectedMovie?.origin_country?.[0] ?? ""}</span>
          </div>
          <Image width={100} height={20} unoptimized src="/5stars.svg" alt="Imdb rates" className="mt-1 min-h-[26px]"/>
          <div className="flex flex-row items-center gap-4">
            <button
              className="bg-black p-2 border border-[#228EE5]/60 text-white flex 
              justify-center flex-row items-center mt-4 rounded-full hover:bg-[#228EE5] transition duration-300 ease-in-out"
            >
              <HiOutlineBookmark className="inline h-5 w-5 text-white"/>
            </button>
            <button
              className="bg-black p-2 border border-[#228EE5]/70 text-white flex 
                justify-center flex-row items-center mt-4 rounded-full hover:bg-[#228EE5] transition duration-300 ease-in-out"
            >
              <GoThumbsup className="inline h-5 w-5 text-white"/>
            </button>
              <button
              className="bg-black p-2 border border-[#228EE5]/70 text-white flex 
                justify-center flex-row items-center mt-4 rounded-full hover:bg-[#228EE5] transition duration-300 ease-in-out"
            >
              <GoThumbsdown className="inline h-5 w-5 text-white"/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center mt-8 sm:mt-0">
        <Link className="text-white flex flex-row items-center 
                          bg-[#228EE5] hover:bg-[#1b6fb8] transition-colors 
                          duration-300 px-5.5 py-1.5 rounded-md font-medium"
            href={`/videoplayer/${selectedMovie?.id}`}>
          <FaPlay className="inline mr-1 h-3 w-4"/>
          Watch Now
        </Link>
        <button className="border border-[#228EE5]/60 text-white flex flex-row items-center 
                          hover:bg-white/10 transition-colors 
                          duration-300 px-5.5 py-1.5 rounded-md font-medium ml-4">
          Preview
        </button>
      </div>
    </div>
  );
}