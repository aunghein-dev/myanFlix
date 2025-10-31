import { MovieDetails } from "@/app/details/[slug]/page";
import { SubtitleLanguage } from "@/app/videoplayer/[slug]/page";
import { numberToHourMinute } from "@/utils/numberToHourMinute";
import dayjs from "dayjs";
import { FaStar } from "react-icons/fa";
import { MdSubtitles } from "react-icons/md";
import { PiFilmReelFill } from "react-icons/pi";
import { RiDownloadLine } from "react-icons/ri";
import Spinner from "../atoms/Spinner";


export default function MovieDetailsAtPlayer({ movieInfo, subtitleLanguages, loading} : { movieInfo: MovieDetails, subtitleLanguages: SubtitleLanguage[], loading: boolean }) {
  return (
    <>
      {loading ? (

        <Spinner className="min-h-[100px] flex items-center justify-center mt-20"/>
      ) : (
      <div className="flex flex-col items-left justify-center mb-8 border-t border-gray-800/40 pt-4  w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold mt-6 mb-2 text-white">{movieInfo?.title}</h1>
            <span className="text-sm text-gray-300/70">{(movieInfo?.release_date)}  / {numberToHourMinute(movieInfo?.runtime || 0)}</span>
          </div>
          <div className="sm:border-l border-gray-300/20 sm:pl-4 gap-1 mt-2 sm:mt-0">
            <span className="flex flex-row items-baseline gap-1">
              <FaStar className="sm:w-8 sm:h-8 w-5 h-5 text-[#F2CF66]"/>
              <span className="sm:text-4xl text-2xl text-[#F2CF66] font-extrabold">
                {movieInfo?.vote_average.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-gray-300/70">/ 10</span>
            </span>
            <span className="text-sm text-gray-300/70">{movieInfo?.vote_count} people voted</span>
          </div>
          
          <div className="flex flex-col mt-6 space-y-1 mb-6">
            <div className="flex flex-row items-center">
              <span className="mr-2 border-r pr-2 border-gray-300/30 text-gray-300/70 text-sm flex flex-row items-center gap-1">
                <PiFilmReelFill className="w-5 h-5"/>{movieInfo?.origin_country[0]}
              </span>
              {movieInfo?.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="inline-block text-gray-300/70 text-sm rounded-2xl mr-2
                                cursor-pointer hover:bg-transparent hover:border border border-transparent
                                transition-all duration-300"
                  >
                    {genre.name}
                  </span>
                ))}
                
            </div>
            <span className="flex flex-row gap-2 items-center text-sm text-gray-300/70">
              <MdSubtitles className="w-5 h-5 "/> Subtitles: {" "}
              {
                subtitleLanguages.map(lang => (
                  <span key={lang.code} className="text-sm">{lang.name}</span>
                ))
              }
            </span>
          </div>
        </div>
        <span className="text-gray-300/70 text-sm mb-6">{movieInfo?.overview}</span>
        <button className="bg-gray-800 w-50 gap-2 p-2 rounded-md
                            flex flex-row items-center justify-center
                          text-slate-400 text-sm hover:bg-gray-900 transition-all ease-in-out
                          duration-300 cursor-pointer">
          <RiDownloadLine className="w-4 h-4" />
          Download this video
        </button>
      </div>
      )}
    </>
  )
}