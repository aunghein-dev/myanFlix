"use client";

import { Movie } from "../../../types/movie";
import { useParams } from "next/navigation";
import DetailsInfoOnHero from "../../../components/layout/DetailsInfoOnHero";
import DetailsFooter from "../../../components/layout/DetailsFooter";
import { useMovieDetails } from "@/hook/useMovieDetails";
import Spinner from "@/components/atoms/Spinner";
import dynamic from 'next/dynamic';

const HilltopAds = dynamic(() => import('@/components/ads/HilltopAds'), { ssr: false });

interface Images {
  backdrops: { file_path: string }[];
  posters: { file_path: string }[];
  logos: { file_path: string }[];
}

interface Genres {
  id: number;
  name: string;
}

export interface Credits {
  cast: {
    id: number;
    character: string;
    credit_id: string;
    gender: number;
    name: string;
    original_name: string;
    profile_path: string | null;
  }[],
  crew: { 
    id: number;
    credit_id: string;
    gender: number;
    name: string;
    original_name: string;
    job: string;
    profile_path: string | null;
  }[];
}

export interface MovieDetails extends Movie {
  runtime: number;
  origin_country: string[];
  images: Images;
  genres: Genres[];
  credits: Credits;
}

export default function Details() {
  const { slug } = useParams();
  const { selectedMovie, suggestedMovies , isLoading, isMovieLoading} = useMovieDetails(slug as string | number | undefined);
  
  return (
    <section>
      <div className="relative h-[500px] select-none overflow-hidden">
        {isMovieLoading && <Spinner className="h-[100vh]"/>}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${selectedMovie?.backdrop_path})`,
          }}
        />
        <div className={`absolute left-0 top-0 w-[60px] h-full z-[10] ${isLoading ? "bg-transparent" : "bg-gradient-to-r"} from-black/70 to-transparent`}/>
        <div className={`absolute right-0 top-0 w-[60px] h-full z-[10] ${isLoading ? "bg-transparent" : "bg-gradient-to-l"} from-black/70 to-transparent`}/>
        <div className={`absolute inset-0 ${isLoading ? "bg-transparent" : "bg-gradient-to-r"} from-black/80 via-black/40 to-transparent`}/>
        
        <div className="relative h-full flex items-end z-20">
          <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-4 sm:px-2 h-full w-full flex flex-col justify-end pb-8">
          {selectedMovie &&  <DetailsInfoOnHero selectedMovie={selectedMovie}/>}
         </div>
        </div>
      </div>

      <DetailsFooter
       isMovieLoading={isMovieLoading}
       selectedMovie={selectedMovie!} suggestedMovies={suggestedMovies || []} />

       <HilltopAds/>
    </section>
  );
}