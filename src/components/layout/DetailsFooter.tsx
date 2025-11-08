import { MovieDetails } from "../../app/details/[slug]/page";
import { Movie } from "../../types/movie";
import MovieCard from "../cards/MovieCard";
import Link from "next/link";
import CharCardListAtDetail from "../cards/CharCardListAtDetail";
import GlobalImage from "../atoms/GlobalImage";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  isMovieLoading: boolean;
  selectedMovie: MovieDetails;
  suggestedMovies: Movie[];
}

export default function DetailsFooter({
  isMovieLoading,
  selectedMovie,
  suggestedMovies,
}: Props) {

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
  }, [suggestedMovies]);

  
  return (
    <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-4 sm:px-2">
      <div>
        {selectedMovie?.images?.backdrops?.length ? (
          <div className="">
            <div className="flex gap-3 min-h-[150px] mt-4 overflow-x-auto scrollbar-hide">
              {selectedMovie.images.backdrops.slice(0, 7).map((img, index) => (
                <GlobalImage
                  width={0}
                  height={0}
                  key={index}
                  src={`/api/tmdb-image/w300/${img.file_path}`}
                  alt={`Screenshot ${index + 1}`}
                  className="w-1/3 rounded-md object-cover max-w-[140px]"
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 mt-4">{!isMovieLoading && "No screenshots available"}</p>
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold mt-6 mb-2 text-white">{!isMovieLoading && "about "}<span className="font-oswald">{selectedMovie?.title}</span></h1>
        <p className="text-white/70 text-sm sm:text-md">{selectedMovie?.overview}</p>
      </div>

      <div>
        <h2 className="font-oswald text-2xl font-bold text-white mt-8">{!isMovieLoading && "Genres"}</h2>
        {selectedMovie?.genres.map((genre) => (
          <span
            key={genre.id}
            className="inline-block bg-[#EC5BAA] text-white px-3 py-1.5 text-xs rounded-2xl mr-2 mt-2
                        cursor-pointer hover:bg-transparent hover:border border border-transparent
                        hover:border-[#EC5BAA] transition-all duration-300"
          >
            {genre.name}
          </span>
        ))}
      </div>

      <CharCardListAtDetail selectedMovie={selectedMovie} isMovieLoading={isMovieLoading}/>

      <div>
        <h2 className="font-oswald text-2xl font-bold text-white mt-8">{!isMovieLoading && "Director"}</h2>
        {
          selectedMovie?.credits?.crew?.length ? (
            <div className="flex gap-4 mt-4 overflow-x-auto scrollbar-hide">
              {selectedMovie.credits.crew
                .filter((member) => member.job === "Director")
                .map((director) => (
                  <Link 
                    href={`/person/${director.id}`}
                    key={director.credit_id} className="relative flex-shrink-0 w-24 group">
                    <GlobalImage
                      width={24}
                      height={24}
                      key={director.id}
                      src={`/api/tmdb-image/w200/${director.profile_path}`}
                      alt={director.name}
                      className="w-24 h-24 rounded-full object-cover transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-150 ease-out pointer-events-none"/>
                    <p className="text-white/80 text-xs sm:text-sm mt-2 line-clamp-1">{director.name}</p>
                    <p className="text-white/40 text-xs line-clamp-1">{director.job}</p>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 mt-4">{!isMovieLoading && "No director information available"}</p>
          )
        }
      </div>

     <div className="mt-8 relative">
      {suggestedMovies.length > 0 && (
        <h2 className="font-oswald text-2xl text-white font-bold mb-3 line-clamp-1">
          Suggestion like &quot;{selectedMovie?.title}&quot;
        </h2>
      )}

        <div className="relative">
          {/* Scrollable list */}
          <div
            ref={scrollRef}
            className="flex flex-row overflow-x-auto scrollbar-hide gap-4 pb-4 scroll-smooth"
          >
            {suggestedMovies.map((movie) => (
              <Link href={`/details/${movie.id}`} key={movie.id}>
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>

          {showLeft && (
              <button
              onClick={() => scroll("left")}
              className="absolute -left-7 top-1/3 p-2.5 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full border border-white/80 items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/60 group backdrop-blur-xs hidden md:block"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
            </button>
          )}

          {showRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-7 top-1/3 p-2.5 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full border border-white/80 items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/60 group backdrop-blur-xs hidden md:block"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}