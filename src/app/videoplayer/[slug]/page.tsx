"use client";

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react";
import Spinner from "@/components/atoms/Spinner";
import { MovieDetails } from "@/app/details/[slug]/page";
import MovieDetailsAtPlayer from "@/components/layout/MovieDetailsAtPlayer";


const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!
const TORRENT_BACKEND_URL = process.env.NEXT_PUBLIC_TORRENT_BACKEND_URL

export interface Torrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  video_width?: number;
  video_height?: number;
}

export interface SubtitleLanguage {
  code: string;
  name: string;
}

export default function ProfessionalVideoPlayer() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [loading, setLoading] = useState(true);
  //const [error, setError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  //const [bufferProgress, setBufferProgress] = useState(0); 

  const [showSettings, setShowSettings] = useState(false);

  const [subtitleLanguages, setSubtitleLanguages] = useState<SubtitleLanguage[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("en");
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [subtitleSize, setSubtitleSize] = useState<number>(20);

  const [movieInfo, setMovieInfo] = useState<MovieDetails>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string | null>(null);
  const loadMovieData = useCallback(async () => {
    try {
      setLoading(true);

      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${slug}?api_key=${API_KEY}`);
      const movieData = await movieRes.json();

      if (!movieData.imdb_id) throw new Error('IMDb ID not found. Cannot fetch torrents.');

      const ytsRes = await fetch(`https://yts.mx/api/v2/movie_details.json?imdb_id=${movieData.imdb_id}`);
      const ytsData = await ytsRes.json();
      const torrentsList = ytsData?.data?.movie?.torrents || [];

      if (torrentsList.length === 0) {
        router.push('/error?message=' + encodeURIComponent(`${movieData.title} not found or links broken.`));
        throw new Error('No torrents found for this movie');
      }

      const sortedTorrents = torrentsList
        .sort((a: Torrent, b: Torrent) => {
          const qualityOrder: { [key: string]: number } = { '2160p': 1, '1080p': 2, '720p': 3, '480p': 4, '360p': 5 };
          const aQuality = qualityOrder[a.quality] || 0;
          const bQuality = qualityOrder[b.quality] || 0;

          if (bQuality !== aQuality) return bQuality - aQuality;
          return b.seeds - a.seeds;
        });
      const filteredTorrents = sortedTorrents.filter((torrent: Torrent) => torrent.seeds !== 0 && torrent.peers !== 0);

      setTorrents(filteredTorrents);
      setSelectedTorrent(sortedTorrents[0]);
      setMovieInfo(movieData);
      
      const subsRes = await fetch(`${TORRENT_BACKEND_URL}/subs/languages`);
      if (subsRes.ok) {
        const languages: SubtitleLanguage[] = await subsRes.json();
        setSubtitleLanguages(languages);
        
        setSelectedSubtitle(languages.find(l => l.code === 'en')?.code || (languages[0]?.code || ""));
      }

    } catch (err) {
      console.error("Failed to get movie data:", err);
      //setError(err instanceof Error ? err.message : "Failed to load movie");
      router.push('/error?message=' + encodeURIComponent(`Movie not found or links broken.`));
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  const handleProgress = () => {
    if (videoRef.current && duration > 0) {
        if (videoRef.current.buffered.length > 0) {
            //const bufferedEnd = videoRef.current.buffered.end(0);
            //const progress = (bufferedEnd / duration) * 100;
            //setBufferProgress(Math.min(100, Math.round(progress)));
        }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.volume = volume;

    setIsPlaying(false);
    setShowControls(true);
    setBuffering(false); 
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      handleProgress(); 
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (!buffering) setShowControls(false); 
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true); 
  };

  const handleWaiting = () => {
    setBuffering(true);
    setShowControls(true);
  };
  const handlePlaying = () => setBuffering(false);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = useCallback(() => {
  if (videoRef.current) {
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);

    if (!newMuted && volume === 0) {
      handleVolumeChange(0.5);
    }
  }
}, [volume, handleVolumeChange]); 

 const resetTimeout = useCallback(() => {
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !buffering) {
        setShowControls(false);
      }
    }, 3000);
  }, [buffering]);


  const togglePlay = useCallback(() => {
  if (videoRef.current) {
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    setShowControls(true); 
    resetTimeout();
  }
}, [resetTimeout]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => {
            setIsFullscreen(true); 
        })
        .catch(err => {
            console.error("Fullscreen request failed:", err);
        });
    } else {
      document.exitFullscreen()
        .then(() => {
            setIsFullscreen(false); 
        })
        .catch(err => console.error("Exit fullscreen failed:", err));
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      setShowControls(true); 
      resetTimeout();
    }
  };

  const handleTorrentSelect = (torrent: Torrent) => {
    setSelectedTorrent(torrent);
    if (videoRef.current) {
      videoRef.current.load(); 

      setIsPlaying(false);
      setShowControls(true);
      setBuffering(true); 
    }
  };

  const handleOffsetChange = (newOffset: number) => {
    const roundedOffset = Math.round(newOffset * 10) / 10;
    setSubtitleOffset(roundedOffset);
  };

  const handleSubtitleSizeChange = (newSize: number) => {
    setSubtitleSize(newSize);
  };

  const resetSubtitleSettings = () => {
    setSubtitleOffset(0);
    setSubtitleSize(20);
  };

  const quickSeek = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setShowControls(true);
      resetTimeout();
    }
  };

  const getStreamUrl = (torrent: Torrent) => {
    return `${TORRENT_BACKEND_URL}/stream?torrent=${encodeURIComponent(torrent.url)}`;
  };

  const getSubtitleUrl = useCallback((torrent: Torrent, lang: string) => {
    const imdbId = movieInfo?.imdb_id;
    const url = `${TORRENT_BACKEND_URL}/subs?torrent=${encodeURIComponent(torrent.url)}&lang=${lang}${imdbId ? `&imdbId=${imdbId}` : ''}&offset=${subtitleOffset.toFixed(1)}`;
    return url;
  }, [movieInfo?.imdb_id, subtitleOffset]);

  useEffect(() => {
    const styleId = 'custom-video-cue-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    const baseSize = Math.max(12, Math.min(38, subtitleSize)); 
    const responsiveSize = isFullscreen ? `clamp(${baseSize}px, 3vw, ${baseSize * 1.5}px)` : `${baseSize}px`;

    style.textContent = `
      video::cue {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif !important; 
        bottom: 10% !important; 
        top: auto !important;
        color: #FFFFFF !important;
        font-size: ${responsiveSize} !important; 
        line-height: 1.2 !important;
        text-shadow:
          0px 0px 1px rgba(0, 0, 0, 0.4), 
          -1px -1px 1px rgba(0, 0, 0, 0.6),
          1px 1px 1px rgba(0, 0, 0, 0.6);
        background: none !important;
        padding: 6px 10px !important;
        margin: 0 !important;
        border-radius: 4px !important;
      }
    `;
  }, [subtitleSize, isFullscreen]); 

 const showControlsTemporarily = () => {
    setShowControls(true);
    resetTimeout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInSettings = settingsRef.current?.contains(event.target as Node);
      
      if (!isClickInSettings && !containerRef.current?.contains(event.target as Node)) {
        setShowControls(false);
        setShowSettings(false);
      } else if (!isClickInSettings && showSettings) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    if (slug) {
      loadMovieData();
    }
    return () => {
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [slug, loadMovieData]);

  useEffect(() => {
  const loadSubtitle = async () => {
    if (!selectedTorrent || !selectedSubtitle) return;
    try {
      const res = await fetch(getSubtitleUrl(selectedTorrent, selectedSubtitle));
      if (!res.ok) throw new Error("Subtitle fetch failed");
      const vttText = await res.text();
      const blob = new Blob([vttText], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);
      setSubtitleBlobUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  loadSubtitle();

  return () => {
    if (subtitleBlobUrl) URL.revokeObjectURL(subtitleBlobUrl);
  };
}, [selectedTorrent, selectedSubtitle, subtitleOffset]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      const isInsideSettings = settingsRef.current?.contains(target);
      
      if (isTyping && isInsideSettings) return; 
      
      switch (event.key.toLowerCase()) {
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'k':
        case ' ': // Spacebar for play/pause
          event.preventDefault();
          togglePlay();
          break;
        case 'm':
          event.preventDefault();
          toggleMute();
          break;
        default:
          if (!isPlaying && !buffering && !showControls) {
              setShowControls(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [toggleFullscreen, togglePlay, toggleMute, isPlaying, buffering, showControls, resetTimeout]);
  

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.cursor = "default";
      return;
    }

    let cursorTimeout: NodeJS.Timeout;

    const showCursor = () => {
      document.body.style.cursor = "default";
      setShowControls(true);
      clearTimeout(cursorTimeout);

      cursorTimeout = setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused && !buffering) {
          document.body.style.cursor = "none";
          setShowControls(false);
        }
      }, 1800);
    };


    document.addEventListener("mousemove", showCursor);

    return () => {
      document.removeEventListener("mousemove", showCursor);
      document.body.style.cursor = "default";
      clearTimeout(cursorTimeout);
    };
  }, [isFullscreen, buffering]);



  const handleDownloadVideo = useCallback(async () => {
  if (!selectedTorrent || !movieInfo) return;

  try {
    // Ensure the torrent URL is properly encoded once
    const torrentUrl = encodeURIComponent(selectedTorrent.url);
    
    const params = new URLSearchParams({
      torrent: torrentUrl,
      quality: selectedTorrent.quality,
      title: movieInfo.title,
      imdbId: movieInfo.imdb_id || '',
      type: 'video/mp4'
    });

    const downloadUrl = `${TORRENT_BACKEND_URL}/download?${params.toString()}`;
    
    console.log('🔗 Download URL:', downloadUrl);
    
    // Test if the endpoint is reachable first
    const testResponse = await fetch(`${TORRENT_BACKEND_URL}/health`);
    if (!testResponse.ok) {
      throw new Error('Download server is not available');
    }

    // Create and trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.style.display = 'none';
    a.target = '_blank'; // Open in new tab to avoid navigation issues
    
    const fileExtension = selectedTorrent.type === 'bluray' ? 'mkv' : 'mp4';
    a.download = `${movieInfo.title} (${selectedTorrent.quality}).${fileExtension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('❌ Download failed:', error);
    alert(`Download failed: ${error}. Please try again later.`);
  }
}, [selectedTorrent, movieInfo]);


  return (
    <div className="mt-30 text-white flex justify-center items-start
                   sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-2 sm:px-0
                   flex-row flex-wrap border-t border-gray-800/40">
      <div 
        ref={containerRef}
        className="relative group w-full max-h-[500px] rounded-xl overflow-hidden" 
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => !buffering && setShowControls(false)}
        style={{ aspectRatio: '16/9', maxWidth: '1600px' }} 
      >
        
        {selectedTorrent && showControls && (
            <div className="absolute top-4 right-4 z-30 text-xs sm:text-sm bg-black/50 text-white/90 px-2 py-2 rounded-sm backdrop-blur-sm">
                {movieInfo?.title} - {selectedTorrent.quality} 
            </div>
        )}

        {buffering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50">
            <Spinner />
          </div>
        )}

         {showControls && torrents.length > 1 && (
          <div className="absolute bottom-16 right-4 rounded-md z-30">
            <select
              value={selectedTorrent?.quality}
              onChange={(e) => {
                const newTorrent = torrents.find((t) => t.quality === e.target.value);
                if (newTorrent) handleTorrentSelect(newTorrent);
              }}
              className="bg-black/50 text-white text-xs rounded-md px-2 pr-6 py-2 appearance-none relative"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'><path d='M5.5 7l4.5 4.5L14.5 7z'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1rem",
              }}
            >
              {torrents.map((torrent) => (
                <option key={torrent.hash} value={torrent.quality}>
                  {torrent.quality} ({torrent.type})
                </option>
              ))}
            </select>

          </div>
        )}

        
        <video
          ref={videoRef}
          className="w-full h-full border border-gray-800/20"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress} 
          onClick={togglePlay}
          crossOrigin="anonymous" 
          controls
        >
          {selectedTorrent && (
            <source
              src={getStreamUrl(selectedTorrent)}
              type="video/mp4"
            />
          )}
          {subtitleBlobUrl && (
            <track
              kind="subtitles"
              src={subtitleBlobUrl}
              srcLang={selectedSubtitle}
              label={subtitleLanguages.find(l => l.code === selectedSubtitle)?.name || selectedSubtitle}
              default
            />
          )}
        </video>
      </div>

     <MovieDetailsAtPlayer 
        movieInfo={movieInfo!} 
        subtitleLanguages={subtitleLanguages} 
        loading={loading}
        onDownload={handleDownloadVideo}
        isDownloadable={!!selectedTorrent && !!movieInfo}
     />
    </div>
  );
}