import { MovieDetails } from "../../app/details/[slug]/page";
import { numberToHourMinute } from "../../utils/numberToHourMinute";
import dayjs from "dayjs";
import { FaPlay } from "react-icons/fa";
import { GoThumbsdown, GoThumbsup } from "react-icons/go";
import { HiOutlineBookmark } from "react-icons/hi2";
import Link from "next/link";
import Spinner from "../atoms/Spinner";

interface Props {
  selectedMovie: MovieDetails
  loading: boolean
  handleDownloadVideo: () => Promise<void>;
  notAvailable: boolean
  generatingLoading: boolean
}

export default function DetailsInfoOnHero(props : Props) {
  const {selectedMovie, loading, handleDownloadVideo, notAvailable, generatingLoading} = props;

  const handleDownloadClick = () => {

    /*
    const a = document.createElement("a");
    a.href = "/api/redirect-ads"; // should return the AdFly shortened URL
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();*/

    if (handleDownloadVideo) {
      handleDownloadVideo();
    } 
  };


  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full z-50">
      <div className="flex-1 lg:pr-8">
        <div className="">
          <h1 className="font-oswald text-4xl text-white font-bold">{selectedMovie?.title}</h1>
          <div className="text-white mt-2">
            <span>{numberToHourMinute(selectedMovie?.runtime || 0)}</span>
            {" - "}
            <span>{dayjs(selectedMovie?.release_date).format("YYYY") || ""}</span>
            {" - "}
            <span>{selectedMovie?.origin_country?.[0] ?? ""}</span>
          </div>
         
          <div className="flex flex-row items-center gap-3">
            <Link
              target="_blank"
              href="/api/redirect-ads"
              className="bg-black p-2 border border-[#228EE5]/60 text-white flex 
              justify-center flex-row items-center mt-4 rounded-full hover:bg-[#228EE5] transition duration-300 ease-in-out"
            >
              <HiOutlineBookmark className="inline h-5 w-5 text-white"/>
            </Link>
            <Link
              target="_blank"
              href="/api/redirect-ads"
              className="bg-black p-2 border border-[#228EE5]/70 text-white flex 
                justify-center flex-row items-center mt-4 rounded-full hover:bg-[#228EE5] transition duration-300 ease-in-out"
            >
              <GoThumbsup className="inline h-5 w-5 text-white"/>
            </Link>
              <Link
                target="_blank"
                href="/api/redirect-ads"
                className="bg-black p-2 border border-[#228EE5]/70 text-white flex 
                  justify-center flex-row items-center mt-4 rounded-full hover:bg-[#228EE5] transition duration-300 ease-in-out"
            >
              <GoThumbsdown className="inline h-5 w-5 text-white"/>
            </Link>
          </div>
        </div>
      </div>
      {
        notAvailable && <p className="absolute left-1/2 -translate-x-1/2 bottom-0 sm:text-sm 
                                      text-xs text-white/20
                                      transition duration-400 ease-in-out">This movie has any related links.</p>
      }
      <div className="min-h-20 ">
      {
        !notAvailable && !loading && 
          <div className="flex flex-row items-center mt-8 sm:mt-0 min-h-10">
            <Link className="text-white flex flex-row items-center sm:text-md text-sm
                              bg-[#228EE5] hover:bg-[#1b6fb8] transition-colors 
                              duration-300 px-5 py-2 rounded-md font-medium"
                href={`/videoplayer/${selectedMovie?.id}`}>
              <FaPlay className="inline mr-1 h-3 w-4"/>
              Watch Now
            </Link>
            {
              loading ? <Spinner className="ml-5 h-full"/> : (
                <button
                  className="border border-[#228EE5]/60 text-white 
                            flex flex-row items-center sm:text-md text-sm
                            hover:bg-white/10 transition-colors duration-300 
                            px-5 py-2 rounded-md font-medium ml-4
                            cursor-pointer hover:border-[#228EE5]"
                  onClick={handleDownloadClick}
                  disabled={generatingLoading} 
                >
                  {generatingLoading && (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  )}
                  {generatingLoading ? "Generating" : "Download"}
                </button>
              ) 
            }
        </div>
      }
      </div>
    </div>
  );
}