import { Movie } from "../../types/movie";
import dayjs from "dayjs";
import GlobalImage from "../atoms/GlobalImage";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <div className="w-40 h-auto flex-shrink-0 group relative cursor-pointer">
      {/* Poster */}
      <div className="relative w-full h-56 select-none overflow-hidden rounded-lg will-change-transform">
        <GlobalImage
          fill
          key={movie.id}
          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
          alt={movie.title || "Movie poster"}
          className="w-full h-full object-cover shadow-lg rounded-lg transition-transform duration-200 ease-out"
        />

        {/* Rating badge */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md select-none">
          {movie.vote_average.toFixed(1)} ★
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors duration-150 ease-out flex flex-col justify-end p-2 pointer-events-none">
          <span className="text-white/40 text-xs mt-1 select-none">
            {dayjs(movie.release_date).format("YYYY")}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white/60 text-xs sm:text-sm line-clamp-2 leading-snug mt-2 select-none">
        {movie.title}
      </h3>
    </div>
  );
}
