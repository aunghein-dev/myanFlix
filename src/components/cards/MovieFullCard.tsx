import { Movie } from "../../types/movie";
import { RiMovie2Fill } from "react-icons/ri";
import { FaStar } from "react-icons/fa";
import dayjs from "dayjs";
import { FaPlay } from "react-icons/fa";
import Link from "next/link";
import GlobalImage from "../atoms/GlobalImage";

export const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export default function MovieFullCard({ movie, rank }: { movie: Movie, rank: number }) {

  const styles = () => {
    switch (rank) {
      case 1:
        return "bg-[linear-gradient(224deg,#fd3ab4,#ff2e62)]";
      case 2:
        return "bg-[linear-gradient(225deg,#ff5140,#f59133)]";
      case 3:
        return "bg-[linear-gradient(225deg,#ff9625,#ffba1f)]";
      default:
        return "bg-black/60";
    }
  }

  return (
    <div className="h-auto shrink-0 group relative cursor-pointer w-full flex flex-row gap-4">
      <div className="relative max-w-28 min-w-28 sm:max-w-40 sm:min-w-40 h-40 sm:h-56 select-none overflow-hidden rounded-lg will-change-transform">
        <GlobalImage 
          fill
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover shadow-lg rounded-lg transition-transform duration-200 ease-out group-hover:bg-black/20"
        />
        <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors duration-150 ease-out pointer-events-none"/>
      </div>

      <span className={`${styles()} text-white absolute top-0 left-0 rounded-tl-lg rounded-br-lg px-2.5 py-0.5
                       font-extrabold text-xl`}>{rank}</span>
      <Link 
        href={`/videoplayer/${movie?.id}`}
        className="bg-gray-400 text-black/90 absolute bottom-2 sm:left-44 left-32 sm:px-10 px-4 sm:py-2 py-1.5 rounded-md font-bold cursor-pointer hover:bg-gray-300 transition-colors duration-150 ease-out sm:text-md text-sm">
        <FaPlay className="inline mb-1 sm:w-4 sm:h-4 mr-1 w-3 h-3" />
        Play
      </Link>
      <div className="flex flex-col items-left gap-1 max-w-[260px] sm:max-w-[480px] md:max-w-[320px] sm:w-full">
        <Link className="font-oswald font-bold text-white/90 sm:text-md text-sm leading-snug select-none line-clamp-1 hover:underline"
          href={`/details/${movie.id}`}>
          {movie.title}
        </Link>
        <div className="line-clamp-1 flex items-center gap-1">
          <span className="flex items-center h-2.5 border-r border-gray-500/70 pr-2 mr-1">
            <RiMovie2Fill className="text-gray-400 w-4 h-4" />
          </span>


          <span className="text-[#CC9A04] flex flex-row items-center h-2.5 border-r border-gray-500/70 pr-2 mr-1">
            <FaStar className="inline mb-1 w-4 h-4 mr-1" />
            <span className="font-medium text-sm">{movie.vote_average.toFixed(1)}</span>
          </span>

          <span className="text-sm text-gray-400 flex items-center h-2.5 border-r border-gray-500/70 pr-2 mr-1">
            {dayjs(movie.release_date).format("YYYY")}
          </span>

          <span
            className="text-sm text-gray-400 truncate max-w-[150px] inline-block align-middle"
            title={movie.genre_ids.map((id) => genreMap[id]).join(", ")} // hover full text
          >
            {movie.genre_ids
              .slice(0, 5)
              .map((id) => genreMap[id])
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
        <p className="text-gray-400 sm:text-sm text-xs mt-1 sm:line-clamp-5 line-clamp-3 hover:underline">
          {movie.overview || "No description available."}
        </p>
      </div>
    </div>
  );
}