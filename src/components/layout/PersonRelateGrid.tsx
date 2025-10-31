import { Movie } from "@/types/movie";
import Link from "next/link";
import MovieCard from "../cards/MovieCard";
import Spinner from "../atoms/Spinner";

interface PersonRelateGridProps {
  movies: Movie[],
  isLoading?: boolean
}

export default function PersonRelateGrid({ movies, isLoading }: PersonRelateGridProps) {
  return(
    <>
      <h2 className="text-lg font-bold text-white mt-6 mb-3 select-none">Flimography</h2>
      {
        isLoading ? <Spinner className="min-h-[200px]"/> : (
        <div className="grid grid-cols-2 
                        min-[500px]:grid-cols-3 
                        min-[600px]:grid-cols-4
                        min-[1018px]:grid-cols-6 gap-2">
          {
            movies.map((movie) => (
              <Link href={`/details/${movie.id}`}
                    key={movie.id}>
                <MovieCard movie={movie} />
              </Link>
            ))
          }
      </div>)
      }
    </>
  )
}