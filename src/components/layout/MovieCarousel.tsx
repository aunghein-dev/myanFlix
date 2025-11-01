import { Movie } from "@/types/movie";
import GlobalImage from "../atoms/GlobalImage";

export default function MovieCarousel({ movies, activeIndex, setActiveIndex }: { movies: Movie[]; activeIndex: number; setActiveIndex: (index: number) => void }) {
  return (
      <div className="flex-shrink-0 mt-6 lg:mt-0">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center -space-x-2">
            {movies.map((movie, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={movie.id}
                  className={`
                    relative transition-all duration-300 ease-out cursor-pointer
                    ${isActive 
                      ? "scale-120 z-20 transform -translate-y-2" 
                      : "scale-95 opacity-100 hover:scale-100 hover:opacity-100"
                    }
                  `}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="relative">
                    <GlobalImage
                      width={20}
                      height={22}
                      unoptimized
                      src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                      alt={movie.title}
                      className={`
                        rounded-lg shadow-2xl transition-all duration-300
                        object-center object-cover border-[#228EE5]/80 border
                        ${isActive 
                          ? "w-20 h-22 scale-120 z-20 transform -translate-y-2" 
                          : "w-20 h-22"
                        }
                      `}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center items-center gap-2">
            {movies.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === activeIndex 
                    ? "bg-white scale-125" 
                    : "bg-white/40 hover:bg-white/60"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
  )
}