import useSWR from "swr";
import axios from "axios";
import type { Movie } from "@/types/movie";
import { MovieDetails } from "@/app/details/[slug]/page";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY as string;

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await axios.get<T>(url);
  return response.data;
};

interface UseMovieDetailsReturn {
  selectedMovie?: MovieDetails;
  suggestedMovies?: Movie[];
  isLoading: boolean;
  isMovieLoading: boolean;
  isSuggestionLoading: boolean;
  error?: Error;
}

export function useMovieDetails(slug: string | number | undefined): UseMovieDetailsReturn {

  const {
    data: selectedMovie,
    error: movieError,
    isLoading: isMovieLoading,
  } = useSWR<MovieDetails>(
    slug
      ? `https://api.themoviedb.org/3/movie/${slug}?api_key=${API_KEY}&append_to_response=credits,images`
      : null,
    fetcher<MovieDetails>,
    { revalidateOnFocus: false }
  );


  const {
    data: suggestedMovies,
    error: suggestionError,
    isLoading: isSuggestionLoading,
  } = useSWR<Movie[]>(
    selectedMovie ? [`movie_suggestions_${slug}`, selectedMovie] as const : null,
    async ([, movie]: [string, MovieDetails]): Promise<Movie[]> => {

      const rec = await axios.get<{ results: Movie[] }>(
        `https://api.themoviedb.org/3/movie/${slug}/recommendations?api_key=${API_KEY}`
      );
      if (rec.data.results.length > 0) return rec.data.results;

      if (movie.genres?.length) {
        const genreIds = movie.genres.map((g) => g.id).join(",");
        const genre = await axios.get<{ results: Movie[] }>(
          `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=popularity.desc&page=1`
        );
        return genre.data.results;
      }

      return [];
    },
    { revalidateOnFocus: false }
  );


  return {
    selectedMovie,
    suggestedMovies,
    isLoading: isMovieLoading || isSuggestionLoading,
    isMovieLoading,
    isSuggestionLoading,
    error: movieError || suggestionError,
  };
}
