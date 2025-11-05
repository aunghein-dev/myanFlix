"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Spinner from "@/components/atoms/Spinner";
import { MovieDetails } from "@/app/details/[slug]/page";
import MovieDetailsAtPlayer from "@/components/layout/MovieDetailsAtPlayer";
import { X } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const TORRENT_BACKEND_URL = process.env.NEXT_PUBLIC_TORRENT_BACKEND_URL;

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

// Ad Configuration Interface
interface AdConfig {
  enabled: boolean;
  vastUrl: string;
  adFrequency: number; // in minutes
  skipOffset: number; // in seconds
  preRoll: boolean;
  midRoll: boolean;
  postRoll: boolean;
}

// Default ad configuration
const defaultAdConfig: AdConfig = {
  enabled: true,
  vastUrl:
"https://euphoricreplacement.com/d.mrFMzld/GqNFvQZvGcUY/VeLmr9iucZ/UPldkUP/T/YI2/O/TFMfx/NwTBYBtpNKjUYk5xMBzREF1RNmy/ZYs/a_WH1XpCdyDr0/xg",
  adFrequency: 50,
  skipOffset: 10,
  preRoll: true,
  midRoll: true,
  postRoll: true,
};

// --- VASTParser (UPDATED for ClickTracking) ---
class VASTParser {
  static async parse(vastUrl: string, maxWrappers = 5): Promise<{
    mediaUrl: string;
    duration: number;
    skipOffset: number;
    impressions: string[];
    // NOTE: 'clickThrough' is added to trackingEvents for simplicity
    trackingEvents: { [event: string]: string[] };
  } | null> {
    if (maxWrappers <= 0) {
      console.error("VAST wrapper limit reached");
      return null;
    }

    try {
      const response = await fetch(vastUrl);
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Check for Wrapper
      const wrapperAdTag = xmlDoc.querySelector("VASTAdTagURI");
      if (wrapperAdTag?.textContent) {
        const nextVastUrl = wrapperAdTag.textContent.trim();
        // Recurse, but also collect wrapper impressions & tracking
        const wrappedData = await this.parse(nextVastUrl, maxWrappers - 1);
        if (!wrappedData) return null; // Failed down the line

        // Collect impressions & tracking from THIS wrapper
        const impressions = this.getTrackingUrls(xmlDoc, "Impression");
        const trackingEvents = this.getLinearTrackingEvents(xmlDoc);

        // Merge with data from the final inline ad
        return {
          ...wrappedData,
          impressions: [...impressions, ...wrappedData.impressions],
          trackingEvents: this.mergeTracking(trackingEvents, wrappedData.trackingEvents),
        };
      }

      // --- This is an Inline response ---
      
      // Media file
      // Prioritize webm (better compatibility in some cases) then progressive MP4
      const mediaFiles = Array.from(xmlDoc.querySelectorAll("MediaFile"));
      const webmMedia = mediaFiles.find(mf => mf.getAttribute('type') === 'video/webm');
      const mp4Media = mediaFiles.find(mf => mf.getAttribute('type') === 'video/mp4' && mf.getAttribute('delivery') === 'progressive');
      const mediaFile = webmMedia || mp4Media || mediaFiles[0];
      const mediaUrl = mediaFile?.textContent?.trim();

      if (!mediaUrl) {
         console.warn("No compatible MediaFile found in VAST inline response.");
         return null;
      }

      // Duration
      const durationElem = xmlDoc.querySelector("Duration");
      const durationText = durationElem?.textContent || "00:00:30";
      const duration = this.parseDuration(durationText);

      // Skip offset
      const linear = xmlDoc.querySelector("Linear");
      const skipOffsetRaw = linear?.getAttribute("skipoffset");
      const skipOffset = skipOffsetRaw ? this.parseDuration(skipOffsetRaw) : 5;

      // Impressions
      const impressions = this.getTrackingUrls(xmlDoc, "Impression");

      // Tracking Events (includes click tracking and click through)
      const trackingEvents = this.getLinearTrackingEvents(xmlDoc);
      
      // Add ClickThrough and ClickTracking to the general tracking events
      const clickThroughElem = xmlDoc.querySelector("ClickThrough");
      const clickThrough = clickThroughElem?.textContent?.trim();
      if (clickThrough) {
        trackingEvents['clickThrough'] = [clickThrough];
      }
      
      const clickTrackingElems = xmlDoc.querySelectorAll("ClickTracking");
      const clickTrackingUrls = Array.from(clickTrackingElems)
        .map((e) => e.textContent?.trim())
        .filter(Boolean) as string[];
        
      if (clickTrackingUrls.length > 0) {
        trackingEvents['clickTracking'] = clickTrackingUrls;
      }

      return { mediaUrl, duration, skipOffset, impressions, trackingEvents };
    } catch (error) {
      console.error("VAST parsing error:", error);
      return null;
    }
  }
  
  static parseDuration(duration: string): number {
    if (duration.includes(":")) {
      const parts = duration.split(":");
      if (parts.length === 3) {
        return (
          parseInt(parts[0]) * 3600 +
          parseInt(parts[1]) * 60 +
          parseFloat(parts[2])
        );
      }
    }
    // Handle percentage-based skipoffset (e.g., "15%") - treat as 15s for simplicity
    if (duration.includes("%")) {
         return parseFloat(duration.replace('%', '')) || 5; 
    }
    return parseFloat(duration) || 30; // Use parseFloat
  }

  // Helper to get <Impression> or other URL tags
  static getTrackingUrls(xmlDoc: Document, tagName: string): string[] {
    return Array.from(xmlDoc.querySelectorAll(tagName))
      .map((e) => e.textContent?.trim())
      .filter(Boolean) as string[];
  }

  // Helper to get <Tracking event="..."> tags
  static getLinearTrackingEvents(xmlDoc: Document): { [event: string]: string[] } {
    const events: { [event: string]: string[] } = {};
    const trackingElems = xmlDoc.querySelectorAll("Linear > TrackingEvents > Tracking");
    
    trackingElems.forEach(elem => {
      const eventName = elem.getAttribute("event");
      const url = elem.textContent?.trim();
      if (eventName && url) {
        if (!events[eventName]) events[eventName] = [];
        events[eventName].push(url);
      }
    });
    return events;
  }
  
  // Helper to merge tracking events from wrappers
  static mergeTracking(
    wrapperEvents: { [event: string]: string[] },
    inlineEvents: { [event: string]: string[] }
  ): { [event: string]: string[] } {
    const merged = { ...inlineEvents };
    for (const eventName in wrapperEvents) {
      merged[eventName] = [
        ...(merged[eventName] || []),
        ...wrapperEvents[eventName],
      ];
    }
    return merged;
  }
}

export default function ProfessionalVideoPlayer() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [selectedTorrent, setSelectedTorrent] = useState<Torrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [subtitleLanguages, setSubtitleLanguages] = useState<SubtitleLanguage[]>(
    []
  );
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("en");
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [subtitleSize, setSubtitleSize] = useState<number>(20);

  const [movieInfo, setMovieInfo] = useState<MovieDetails>();

  // Ad states
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adMediaUrl, setAdMediaUrl] = useState<string | null>(null);
  const [adDuration, setAdDuration] = useState(0);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adSkipOffset, setAdSkipOffset] = useState(5);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adConfig] = useState<AdConfig>(defaultAdConfig);
  // NEW: Store all VAST tracking events, including ClickTracking and ClickThrough
  const [adTrackingEvents, setAdTrackingEvents] = useState<{ [event: string]: string[] }>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string | null>(null);

  // Ad timer refs
  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playTimeRef = useRef(0);
  const lastAdTimeRef = useRef(0);
  const hasPlayedPreRollRef = useRef(false);

  const loadMovieData = useCallback(async () => {
    try {
      setLoading(true);

      const movieRes = await fetch(
        `https://api.themoviedb.org/3/movie/${slug}?api_key=${API_KEY}`
      );
      const movieData = await movieRes.json();

      if (!movieData.imdb_id)
        throw new Error("IMDb ID not found. Cannot fetch torrents.");

      const ytsRes = await fetch(
        `https://yts.mx/api/v2/movie_details.json?imdb_id=${movieData.imdb_id}`
      );
      const ytsData = await ytsRes.json();
      const torrentsList = ytsData?.data?.movie?.torrents || [];

      if (torrentsList.length === 0) {
        router.push(
          "/error?message=" +
            encodeURIComponent(`${movieData.title} not found or links broken.`)
        );
        throw new Error("No torrents found for this movie");
      }

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
      const filteredTorrents = sortedTorrents.filter(
        (torrent: Torrent) => torrent.seeds !== 0 && torrent.peers !== 0
      );

      setTorrents(filteredTorrents);
      setSelectedTorrent(sortedTorrents[0]);
      setMovieInfo(movieData);

      const subsRes = await fetch(`${TORRENT_BACKEND_URL}/subs/languages`);
      if (subsRes.ok) {
        const languages: SubtitleLanguage[] = await subsRes.json();
        setSubtitleLanguages(languages);

        setSelectedSubtitle(
          languages.find((l) => l.code === "en")?.code ||
            languages[0]?.code ||
            ""
        );
      }
    } catch (err) {
      console.error("Failed to get movie data:", err);
      router.push(
        "/error?message=" +
          encodeURIComponent(`Movie not found or links broken.`)
      );
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // NEW: Helper function to fire VAST tracking URLs
  const fireTrackingUrls = useCallback((event: string) => {
      const urls = adTrackingEvents[event];
      if (urls && urls.length > 0) {
          urls.forEach(url => fetch(url, { method: "GET", mode: "no-cors" }));
      }
  }, [adTrackingEvents]);

  // Load and play ad
  const playAd = useCallback(
    async (adType: "preRoll" | "midRoll" | "postRoll" = "midRoll") => {
      if (!adConfig.enabled || isAdPlaying) return;

      try {
        const adData = await VASTParser.parse(adConfig.vastUrl);
        if (adData) {
          // IMPORTANT FIX: DO NOT fire impressions here. Fire on 'playing' event.
          // adData.impressions.forEach((url) => fetch(url, { method: "GET", mode: "no-cors" }));
          
          setIsAdPlaying(true);
          setAdMediaUrl(adData.mediaUrl);
          setAdDuration(adData.duration);
          setAdSkipOffset(adData.skipOffset);
          setCanSkipAd(false);
          setAdCurrentTime(0);
          setAdProgress(0);
          
          // Store all tracking data (including impressions)
          setAdTrackingEvents({ 
            ...adData.trackingEvents, 
            'impression': adData.impressions // Use a standard key for impressions
          });


          // Pause main content
          if (videoRef.current && isPlaying) {
            videoRef.current.pause();
          }

          // For post-roll, mark that we've reached the end
          if (adType === "postRoll") {
            if (videoRef.current) {
              videoRef.current.currentTime = videoRef.current.duration;
            }
          }
        }
      } catch (error) {
        console.error("Failed to load ad:", error);
        setIsAdPlaying(false);
        // Resume main content if ad fails to load
        if (videoRef.current && isPlaying) {
          videoRef.current.play().catch(console.error);
        }
      }
    },
    [adConfig, isAdPlaying, isPlaying]
  );

  // Skip ad
  const skipAd = useCallback(() => {
    // Fire Skip tracking event
    fireTrackingUrls('skip');
    
    if (adVideoRef.current) {
      adVideoRef.current.pause();
      adVideoRef.current.src = ""; // Clear source
      adVideoRef.current.load(); // Stop fetching
    }
    
    // Clear all ad states
    setIsAdPlaying(false);
    setAdMediaUrl(null);
    setAdTrackingEvents({});
    
    // Resume main content if it was playing
    if (videoRef.current && isPlaying) {
      videoRef.current.play().catch(console.error);
    }
  }, [isPlaying, fireTrackingUrls]);
  
  // NEW: Ad Click Handler
  const handleAdClick = useCallback(() => {
    const clickThroughUrl = adTrackingEvents['clickThrough']?.[0];
    if (!adVideoRef.current || !clickThroughUrl) return;
    
    adVideoRef.current.pause();
    
    // 1. Fire Click Tracking URLs (Crucial for fixing "n/a")
    fireTrackingUrls('clickTracking');
    
    // 2. Open the ClickThrough URL
    window.open(clickThroughUrl, '_blank');
    
    // 3. Skip the ad and resume content
    skipAd();

  }, [adTrackingEvents, fireTrackingUrls, skipAd]);

  // NEW: Ad Play/Impression Handler
  const handleAdPlaying = useCallback(() => {
    // Fire Impression
    fireTrackingUrls('impression');
    // Fire Start event
    fireTrackingUrls('start');
  }, [fireTrackingUrls]);


  // Handle ad time update
  const handleAdTimeUpdate = useCallback(() => {
    if (adVideoRef.current) {
      const currentTime = adVideoRef.current.currentTime;
      setAdCurrentTime(currentTime);
      
      const duration = adDuration > 0 ? adDuration : 30; // Use 30s as fallback
      setAdProgress((currentTime / duration) * 100);

      if (currentTime >= adSkipOffset && !canSkipAd) {
        setCanSkipAd(true);
      }

      // Fire quartiles
      if (currentTime >= duration * 0.25 && adTrackingEvents['firstQuartile']) {
          fireTrackingUrls('firstQuartile');
          delete adTrackingEvents['firstQuartile']; // Fire only once
      }
      if (currentTime >= duration * 0.5 && adTrackingEvents['midpoint']) {
          fireTrackingUrls('midpoint');
          delete adTrackingEvents['midpoint'];
      }
      if (currentTime >= duration * 0.75 && adTrackingEvents['thirdQuartile']) {
          fireTrackingUrls('thirdQuartile');
          delete adTrackingEvents['thirdQuartile'];
      }

      if (currentTime >= duration) {
        // VAST 'complete' event is usually fired on 'ended', but skipAd handles it.
        // We ensure a 'complete' event is fired here if the browser ends it first.
        fireTrackingUrls('complete');
        skipAd();
      }
    }
  }, [adDuration, adSkipOffset, canSkipAd, skipAd, adTrackingEvents, fireTrackingUrls]);

  // Play ad video after mediaUrl is set
  useEffect(() => {
    const adVideo = adVideoRef.current;
    if (isAdPlaying && adMediaUrl && adVideo) {
        try {
            // VAST standard suggests starting muted if pre-roll
            adVideo.muted = true;
            adVideo.volume = 1;
            
            // Set source and load before playing
            adVideo.src = adMediaUrl;
            adVideo.load();
            
            // We use the onPlaying event to fire impressions
            adVideo.play().catch(error => {
                console.error("Ad autoplay failed:", error);
                // Clean up and skip on failure
                adVideo.pause();
                adVideo.src = "";
                adVideo.load();
                skipAd();
            });
        } catch (error) {
            console.error("Ad video setup failed:", error);
            skipAd();
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdPlaying, adMediaUrl]);


  // Schedule mid-roll ads based on play time
  useEffect(() => {
    if (!adConfig.enabled || !isPlaying || isAdPlaying || !adConfig.midRoll)
      return;

    const interval = setInterval(() => {
      playTimeRef.current += 1;

      // Check if it's time to show a mid-roll ad
      const timeSinceLastAd =
        (playTimeRef.current - lastAdTimeRef.current) / 60; // Convert to minutes
      if (timeSinceLastAd >= adConfig.adFrequency) {
        playAd("midRoll");
        lastAdTimeRef.current = playTimeRef.current;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isAdPlaying, adConfig, playAd]);

  // Handle pre-roll ad
  useEffect(() => {
    if (
      adConfig.enabled &&
      adConfig.preRoll &&
      !hasPlayedPreRollRef.current &&
      selectedTorrent &&
      !loading
    ) {
      // Small delay to ensure video is ready
      const timer = setTimeout(() => {
        playAd("preRoll");
        hasPlayedPreRollRef.current = true;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [selectedTorrent, loading, adConfig, playAd]);

  // Handle post-roll ad
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !adConfig.enabled || !adConfig.postRoll) return;

    const handleEnded = () => {
      if (!isAdPlaying) {
        playAd("postRoll");
      }
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [isAdPlaying, adConfig, playAd]);

  const handleProgress = () => {
    if (videoRef.current && duration > 0) {
      if (videoRef.current.buffered.length > 0) {
        // Buffer progress logic if needed
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
      // Update play time for ad scheduling
      if (isPlaying) {
        playTimeRef.current = Math.floor(videoRef.current.currentTime);
      }
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

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
    },
    [videoRef]
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;

      if (!newMuted && volume === 0) {
        handleVolumeChange(0.5);
      }
    }
  }, [volume, handleVolumeChange]);

  const resetTimeout = useCallback(() => {
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (
        videoRef.current &&
        !videoRef.current.paused &&
        !buffering &&
        !isAdPlaying
      ) {
        setShowControls(false);
      }
    }, 3000);
  }, [buffering, isAdPlaying]);

  const togglePlay = useCallback(() => {
    if (isAdPlaying) return; // Don't allow play/pause during ads

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setShowControls(true);
      resetTimeout();
    }
  }, [resetTimeout, isAdPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Fullscreen request failed:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => console.error("Exit fullscreen failed:", err));
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleTorrentSelect = (torrent: Torrent) => {
    setSelectedTorrent(torrent);
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
      setShowControls(true);
      setBuffering(true);

      // Reset ad tracking for new content
      hasPlayedPreRollRef.current = false;
      playTimeRef.current = 0;
      lastAdTimeRef.current = 0;
    }
  };

  const getStreamUrl = (torrent: Torrent) => {
    return `${TORRENT_BACKEND_URL}/stream?torrent=${encodeURIComponent(
      torrent.url
    )}`;
  };

  const getSubtitleUrl = useCallback(
    (torrent: Torrent, lang: string) => {
      const imdbId = movieInfo?.imdb_id;
      const url = `${TORRENT_BACKEND_URL}/subs?torrent=${encodeURIComponent(
        torrent.url
      )}&lang=${lang}${
        imdbId ? `&imdbId=${imdbId}` : ""
      }&offset=${subtitleOffset.toFixed(1)}`;
      return url;
    },
    [movieInfo?.imdb_id, subtitleOffset]
  );

  useEffect(() => {
    const styleId = "custom-video-cue-styles";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    const baseSize = Math.max(12, Math.min(38, subtitleSize));
    const responsiveSize = isFullscreen
      ? `clamp(${baseSize}px, 3vw, ${baseSize * 1.5}px)`
      : `${baseSize}px`;

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
      const isClickInSettings = settingsRef.current?.contains(
        event.target as Node
      );

      if (
        !isClickInSettings &&
        !containerRef.current?.contains(event.target as Node)
      ) {
        setShowControls(false);
        setShowSettings(false);
      } else if (!isClickInSettings && showSettings) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    if (slug) {
      loadMovieData();
    }
    return () => {
      clearTimeout(controlsTimeoutRef.current);
      if (adTimerRef.current) clearTimeout(adTimerRef.current);
    };
  }, [slug, loadMovieData]);

  useEffect(() => {
    const loadSubtitle = async () => {
      if (!selectedTorrent || !selectedSubtitle) return;
      try {
        const res = await fetch(
          getSubtitleUrl(selectedTorrent, selectedSubtitle)
        );
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
    // FIX 1: Removed `subtitleBlobUrl` from dependency array to prevent loop
  }, [selectedTorrent, selectedSubtitle, subtitleOffset, getSubtitleUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";
      const isInsideSettings = settingsRef.current?.contains(target);

      if (isTyping && isInsideSettings) return;

      // Don't process keys during ads except for specific ad controls
      if (isAdPlaying) {
        if (event.key.toLowerCase() === "s" && canSkipAd) {
          event.preventDefault();
          skipAd();
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case "f":
          event.preventDefault();
          toggleFullscreen();
          break;
        case "k":
        case " ": // Spacebar for play/pause
          event.preventDefault();
          togglePlay();
          break;
        case "m":
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [
    toggleFullscreen,
    togglePlay,
    toggleMute,
    isPlaying,
    buffering,
    showControls,
    resetTimeout,
    isAdPlaying,
    canSkipAd,
    skipAd,
  ]);

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
        if (
          videoRef.current &&
          !videoRef.current.paused &&
          !buffering &&
          !isAdPlaying
        ) {
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
  }, [isFullscreen, buffering, isAdPlaying]);

  const handleDownloadVideo = useCallback(async () => {
    if (!selectedTorrent || !movieInfo) return;

    try {
      const torrentUrl = encodeURIComponent(selectedTorrent.url);

      const params = new URLSearchParams({
        torrent: torrentUrl,
        quality: selectedTorrent.quality,
        title: movieInfo.title,
        imdbId: movieInfo.imdb_id || "",
        type: "video/mp4",
      });

      const downloadUrl = `${TORRENT_BACKEND_URL}/download?${params.toString()}`;

      console.log("🔗 Download URL:", downloadUrl);

      const testResponse = await fetch(`${TORRENT_BACKEND_URL}/health`);
      if (!testResponse.ok) {
        throw new Error("Download server is not available");
      }

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.style.display = "none";

      const fileExtension =
        selectedTorrent.type === "bluray" ? "mkv" : "mp4";
      a.download = `${movieInfo.title} (${selectedTorrent.quality}).${fileExtension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(`Download failed: ${error}. Please try again later.`);
    }
  }, [selectedTorrent, movieInfo]);

  return (
    <div
      className="sm:mt-30 mt-25 text-white flex justify-center items-start
                   sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-2 sm:px-0
                   flex-row flex-wrap"
    >
      <div
        ref={containerRef}
        className="relative group w-full max-h-[500px] rounded-xl overflow-hidden border border-gray-600/30" 
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() =>
          !buffering && !isAdPlaying && setShowControls(false)
        }
        style={{ aspectRatio: "16/9", maxWidth: "1600px" }}
      >
        {/* Ad Overlay (UPDATED for Click Tracking) */}
        {isAdPlaying && adMediaUrl && (
          <div 
              className="absolute inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
              onClick={handleAdClick} // <<< NEW: BIND CLICK HANDLER
          >
            <div className="relative w-full h-full">
              <video
                ref={adVideoRef}
                src={adMediaUrl}
                autoPlay
                muted={false}
                onTimeUpdate={handleAdTimeUpdate}
                onEnded={skipAd}
                onPlaying={handleAdPlaying} // <<< NEW: FIRE IMPRESSION AND START EVENT
                onClick={(e) => e.stopPropagation()} // Prevent video click from triggering the wrapper click
                className="w-full h-full object-contain pointer-events-none" // <<< pointer-events-none ensures wrapper handles click
                playsInline
                style={{ aspectRatio: "16/9" }}
              />

              {/* Ad Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                <div className="flex items-center space-x-2 bg-black/70 rounded-lg px-2 py-1 pointer-events-auto">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    Advertisement
                  </span>
                </div>

                {canSkipAd && (
                  <button
                    onClick={(e) => {e.stopPropagation(); skipAd();}} // Stop propagation to prevent ad click handler from triggering skipAd twice
                    className="text-xs flex items-center gap-x-2 bg-black/70 text-white rounded-lg px-2 py-1 hover:bg-black/90 transition-colors pointer-events-auto"
                  >
                    <span>Skip Ad (S)</span>
                    <X size={14} />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {selectedTorrent && showControls && !isAdPlaying && (
          <div className="absolute top-4 right-4 z-30 text-xs sm:text-sm bg-black/50 text-white/90 px-2 py-2 rounded-lg backdrop-blur-sm">
            {movieInfo?.title} - {selectedTorrent.quality}
          </div>
        )}

        {buffering && !isAdPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50">
            <Spinner />
          </div>
        )}

        {showControls && torrents.length > 1 && !isAdPlaying && (
          <div className="absolute bottom-16 right-4 rounded-lg z-30">
            <select
              value={selectedTorrent?.quality}
              onChange={(e) => {
                const newTorrent = torrents.find(
                  (t) => t.quality === e.target.value
                );
                if (newTorrent) handleTorrentSelect(newTorrent);
              }}
              className="bg-black/50 text-white text-xs sm:text-sm rounded-lg px-2 pr-6 py-2 appearance-none relative"
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

        {/* Main Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress}
          onClick={isAdPlaying ? undefined : togglePlay}
          crossOrigin="anonymous"
          controls // Keep controls for easy debugging, but consider removing for clean custom UI
          autoPlay
          style={{ aspectRatio: "16/9" }}
        >
          {selectedTorrent && (
            <source src={getStreamUrl(selectedTorrent)} type="video/mp4" />
          )}
          {subtitleBlobUrl && !isAdPlaying && (
            <track
              kind="subtitles"
              src={subtitleBlobUrl}
              srcLang={selectedSubtitle}
              label={
                subtitleLanguages.find((l) => l.code === selectedSubtitle)
                  ?.name || selectedSubtitle
              }
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