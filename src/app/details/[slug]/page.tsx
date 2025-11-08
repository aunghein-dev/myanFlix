"use client";

import { Movie } from "../../../types/movie";
import { useParams } from "next/navigation";
import DetailsInfoOnHero from "../../../components/layout/DetailsInfoOnHero";
import DetailsFooter from "../../../components/layout/DetailsFooter";
import { useMovieDetails } from "@/hook/useMovieDetails";
import Spinner from "@/components/atoms/Spinner";
import { useCallback, useEffect, useState } from "react";
import { Torrent, TORRENT_BACKEND_URL } from "@/app/videoplayer/[slug]/page";

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
  const [loading, setLoading] = useState(true);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const notAvailable = (selectedTorrent === undefined || null );
  const [generatingLoading, setGeneratingLoading] = useState(false);

  const loadMovieData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!selectedMovie?.imdb_id)
        throw new Error("IMDb ID not found. Cannot fetch torrents.");
        
      const ytsRes = await fetch(
        `https://yts.mx/api/v2/movie_details.json?imdb_id=${selectedMovie.imdb_id}`
      );
      const ytsData = await ytsRes.json();
      const torrentsList = ytsData?.data?.movie?.torrents || [];

      const sortedTorrents = torrentsList.sort((a: Torrent, b: Torrent) => {
        const qualityOrder: { [key: string]: number } = {
          "2160p": 1,
          "1080p": 2,
          "720p": 3,
          "480p": 4,
          "360p": 5,
        };
        const aQuality = qualityOrder[a.quality] || 0;
        const bQuality = qualityOrder[b.quality] || 0;

        if (bQuality !== aQuality) return bQuality - aQuality;
        return b.seeds - a.seeds;
      });
      setSelectedTorrent(sortedTorrents[0]);
    } catch (err) {
      console.error("Failed to get movie data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMovie]);


 const handleDownloadVideo = useCallback(async () => {
    setGeneratingLoading(true);
    if (!selectedTorrent || !selectedMovie) return;

    try {
      const torrentUrl = encodeURIComponent(selectedTorrent.url);
      const params = new URLSearchParams({
        torrent: torrentUrl,
        quality: selectedTorrent.quality,
        title: selectedMovie.title,
        imdbId: selectedMovie.imdb_id || "",
        type: "video/mp4",
      });

      const downloadUrl = `${TORRENT_BACKEND_URL}/download?${params.toString()}`;

      // Check backend server health
      const healthRes = await fetch(`${TORRENT_BACKEND_URL}/health`);
      if (!healthRes.ok) throw new Error("Download server is not available");

      // Call server-side shorten API WITHOUT alias (let AdFly generate one)
      const shortenRes = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: downloadUrl 
          // No alias parameter - AdFly will auto-generate
        }),
      });
      
      if (!shortenRes.ok) {
        const errorData = await shortenRes.json();
        throw new Error(errorData.error || "Failed to shorten URL");
      }

      const shortenData = await shortenRes.json();
      const adflyUrl = shortenData.shortUrl;
      console.log("✅ AdFly Short URL:", adflyUrl);

      const a = document.createElement("a");
      a.href = adflyUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(`Download failed: ${error}. Please try again later.`);
    } finally {
      setGeneratingLoading(false);
    }
  }, [selectedTorrent, selectedMovie]);



  useEffect(() => {
    if (selectedMovie?.imdb_id) {
      loadMovieData();
    }
  }, [selectedMovie, loadMovieData]);

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
        <div className={`absolute left-0 top-0 w-[60px] h-full z-[10] ${isLoading ? "bg-transparent" : "bg-gradient-to-r"} from-black/10 to-transparent`}/>
        <div className={`absolute right-0 top-0 w-[60px] h-full z-[10] ${isLoading ? "bg-transparent" : "bg-gradient-to-l"} from-black/10 to-transparent`}/>
        
        <div className={`absolute inset-0 ${isLoading ? "bg-transparent" : "bg-gradient-to-r"} from-black/20 via-black/20 to-transparent`}/>
        
        <div className="relative h-full flex items-end z-20">
          <div className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-4 sm:px-2 h-full w-full flex flex-col justify-end pb-8">
          {selectedMovie &&  
            <DetailsInfoOnHero 
              selectedMovie={selectedMovie}
              loading={loading}
              handleDownloadVideo={handleDownloadVideo}
              notAvailable={notAvailable!}
              generatingLoading={generatingLoading}
            />
          }
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-background via-black/5 to-transparent"></div>
        </div>
      </div>

      <DetailsFooter
       isMovieLoading={isMovieLoading}
       selectedMovie={selectedMovie!} suggestedMovies={suggestedMovies || []} />

    </section>
  );
}