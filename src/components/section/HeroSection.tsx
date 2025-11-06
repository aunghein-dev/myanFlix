import { Movie } from "../../types/movie";
import Carousel from "../layout/MovieCarousel";
import HeroDetails from "../layout/HeroDetails";
import Spinner from "../atoms/Spinner";

interface HeroSectionProps {
  movies: Movie[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  activeMovie: Movie;
  loading: boolean;
  torrentAvailableIds: Set<number>;
}

export default function HeroSection({ movies, activeIndex, setActiveIndex, activeMovie, loading, torrentAvailableIds }: HeroSectionProps) {

  const hasTorrent = activeMovie && torrentAvailableIds.has(activeMovie.id);
  return (
    <>
      {loading && <Spinner className="min-h-[600px]"/>}
      {
        activeMovie &&
        <section className="relative h-[600px] select-none overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${activeMovie.backdrop_path})`,
            }}
          />
          <div className="absolute left-0 top-0 w-[60px] h-full bg-gradient-to-r from-background/10 to-transparent"></div>
              <div className="absolute right-0 top-0 w-[60px] h-full bg-gradient-to-l from-background/10 to-transparent"></div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent"></div>

          <div className="relative h-full flex items-end">
            <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-4 sm:px-2 h-full w-full flex flex-col justify-end pb-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full ">

                <div className="flex-1 lg:pr-8">
                  <div className="lg:hidden mb-4">  
                    <Carousel movies={movies} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
                  </div>
                  <HeroDetails activeMovie={activeMovie} hasTorrent={hasTorrent} />
                </div>

              <div className="hidden lg:block flex-shrink-0 ml-4">  
                <Carousel movies={movies} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
              </div>
              </div>
            </div>
          </div>
        </section>
      }
    </>
    
  );
}