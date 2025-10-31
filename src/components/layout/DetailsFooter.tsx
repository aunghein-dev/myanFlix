import { MovieDetails } from "../../app/details/[slug]/page";
import { Movie } from "../../types/movie";
import MovieCard from "../cards/MovieCard";
import Link from "next/link";
import CharCardListAtDetail from "../cards/CharCardListAtDetail";
import GlobalImage from "../atoms/GlobalImage";

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
                  src={`https://image.tmdb.org/t/p/w300${img.file_path}`}
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
        <h1 className="text-3xl font-bold mt-6 mb-2 text-white">{!isMovieLoading && "about "}{selectedMovie?.title}</h1>
        <p className="text-white text-sm">{selectedMovie?.overview}</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mt-8">{!isMovieLoading && "Genres"}</h2>
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
        <h2 className="text-2xl font-bold text-white mt-8">{!isMovieLoading && "Director"}</h2>
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
                      src={`https://image.tmdb.org/t/p/w200${director.profile_path}`}
                      alt={director.name}
                      className="w-24 h-24 rounded-full object-cover transition-transform duration-200"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors duration-150 ease-out pointer-events-none"/>
                    <p className="text-white text-sm mt-2 line-clamp-1">{director.name}</p>
                    <p className="text-gray-400 text-xs line-clamp-1">{director.job}</p>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 mt-4">{!isMovieLoading && "No director information available"}</p>
          )
        }
      </div>

      <div className="mt-8">
        { suggestedMovies.length > 0 && 
          <h2 className="text-2xl text-white font-bold mb-3 line-clamp-1">Suggestion like &quot;{selectedMovie?.title}&quot;</h2>
        }
        
        <div className="flex flex-row overflow-x-auto scrollbar-hide gap-4 pb-4">
          {
            suggestedMovies.map((movie) => (
              <Link href={`/details/${movie.id}`} key={movie.id}>
                <MovieCard movie={movie} />
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  )
}