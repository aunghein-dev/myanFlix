"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Minimize, Maximize, RotateCw, Video, Server, X } from "lucide-react";
import Hls, { type ErrorData } from "hls.js";
import Spinner from "../atoms/Spinner";

// Interfaces
export interface StreamServer {
  name: string;
  stream_url: string;
  id?: number;
  serverName?: string;
}

export interface FootballMatch {
  servers: StreamServer[];
  home_team_name: string;
  away_team_name: string;
  league_name: string;
  match_time: string;
  match_status: string;
  home_team_logo: string;
  away_team_logo: string;
  match_score?: string;
  ht_score?: string;
}

export interface GroupedStreams {
  [quality: string]: StreamServer[];
}

// Ad Configuration Interface
interface AdConfig {
  enabled: boolean;
  vastUrl: string;
  adFrequency: number; // in minutes
  skipOffset: number; // in seconds
}

// Default ad configuration
const defaultAdConfig: AdConfig = {
  enabled: true,
  vastUrl: "https://vivid-wave.com/dKm.F/z/dEGIN/vqZPGWUI/Me/m/9/uVZqUilNkkPoTWYk2KO/T/M/x/NpT/Y/twNPjEYC5/M/z/EM1oNyyeZCsCaFWc1ApJdUDK0gxv",
  adFrequency: 20, // Show ad every 20 minutes
  skipOffset: 5 // Allow skip after 5 seconds
};

// --- Utilities ---
const groupServers = (servers: StreamServer[]): GroupedStreams => {
  const grouped: GroupedStreams = {};
  servers.forEach((server, index) => {
    const quality = (server.name.toLowerCase().match(/(\d+p)/) || [null, ''])[1] || 'auto'; 
    if (!grouped[quality]) grouped[quality] = [];
    grouped[quality].push({ 
      ...server, 
      id: index, 
      serverName: `Server ${grouped[quality].length + 1}` 
    });
  });
  return grouped;
};

// VAST Parser
class VASTParser {
  static async parse(vastUrl: string): Promise<{ mediaUrl: string; duration: number; skipOffset: number } | null> {
    try {
      const response = await fetch(vastUrl);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Extract media file URL
      const mediaFile = xmlDoc.querySelector('MediaFile');
      const mediaUrl = mediaFile?.textContent;
      
      // Extract duration
      const durationElem = xmlDoc.querySelector('Duration');
      const durationText = durationElem?.textContent || '00:00:30';
      const duration = this.parseDuration(durationText);
      
      // Extract skip offset
      const skipable = xmlDoc.querySelector('Linear[skipoffset]');
      const skipOffset = skipable ? this.parseDuration(skipable.getAttribute('skipoffset') || '00:00:05') : 5;

      if (mediaUrl) {
        return { mediaUrl, duration, skipOffset };
      }
    } catch (error) {
      console.error('VAST parsing error:', error);
    }
    return null;
  }

  static parseDuration(duration: string): number {
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    }
    return parseInt(duration) || 30;
  }
}

// --- useHlsPlayer Hook (FIXED HLS ERROR HANDLING) ---
const useHlsPlayer = (videoRef: React.RefObject<HTMLVideoElement | null>, streamUrl: string | undefined) => {
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const retryInterval = 3000;

  const setupStream = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0; 
        // This is the correct place to call play()
        video.play().catch(e => console.log("Autoplay blocked (HLS):", e));
      });

      // --- FIXED: Robust HLS Error Handling to Prevent Looping ---
      hls.on(Hls.Events.ERROR, (_, data: ErrorData) => {
        console.warn("HLS Error:", data.type, data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // For fatal network errors, try to load the source again.
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                console.log(`Fatal HLS Network Error. Retry attempt ${retryCountRef.current}/${maxRetries} in ${retryInterval}ms...`);
                // Use setupStream to fully restart the HLS instance
                setTimeout(setupStream, retryInterval); 
              } else {
                console.error("Max network retries reached, stream is unrecoverable.");
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // For fatal media errors, try to recover media, but NOT restart the stream.
              console.warn("Fatal HLS Media Error, attempting media recovery.");
              hls.recoverMediaError(); // Let HLS try to fix the media buffer
              break;
            default:
              // Other fatal errors (like PARSING_ERROR)
              console.error(`Unrecoverable fatal HLS Error: ${data.type}`);
              hls.destroy();
              break;
          }
        }
      });
      // --- END FIXED HLS Error Handling ---
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      // This play() call is fine as it's for native HLS
      video.play().catch(e => console.log("Autoplay blocked (native):", e));
    } else {
      console.error("HLS not supported in this browser");
    }
  }, [streamUrl, videoRef]);

  useEffect(() => {
    setupStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [setupStream]);

  const refreshStream = () => setupStream();
  const reloadStream = () => setupStream();

  return { refreshStream, reloadStream };
};

// iOS Fullscreen Types
interface WebKitVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

interface WebKitDocument extends Document {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;
}

// --- Component ---
interface Props {
  match: FootballMatch;
  adConfig?: Partial<AdConfig>;
}

const LiveStreamPlayerApp: React.FC<Props> = ({ match, adConfig = {} }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Merge provided ad config with defaults
  const finalAdConfig: AdConfig = { ...defaultAdConfig, ...adConfig };

  const groupedStreams = groupServers(match.servers);
  const availableQualities = Object.keys(groupedStreams).sort((a, b) => {
    if (a === 'auto') return 1;
    if (b === 'auto') return -1;
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numB - numA;
  });

  const defaultQuality = availableQualities.includes('480p') ? '480p' : availableQualities[0] || 'auto';
  const defaultServer = groupedStreams[defaultQuality]?.[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [volume, setVolume] = useState(0.8);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Ad states
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adMediaUrl, setAdMediaUrl] = useState<string | null>(null);
  const [adDuration, setAdDuration] = useState(0);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adSkipOffset, setAdSkipOffset] = useState(5);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  const [selectedQuality, setSelectedQuality] = useState(defaultQuality);
  const [selectedServerId, setSelectedServerId] = useState(defaultServer?.id ?? 0);

  const activeServer = groupedStreams[selectedQuality]?.find(s => s.id === selectedServerId);
  const activeStreamUrl = activeServer?.stream_url;

  const { refreshStream, reloadStream } = useHlsPlayer(videoRef, activeStreamUrl);
  
  const playTimeRef = useRef(0);
  // --- FIX: Use a ref for prerollPlayed to ensure it only happens once ---
  const prerollPlayedRef = useRef(false);

  // Load and play ad
  const playAd = useCallback(async () => {
    if (!finalAdConfig.enabled || isAdPlaying) return;

    try {
      const adData = await VASTParser.parse(finalAdConfig.vastUrl);
      if (adData) {
        playTimeRef.current = 0;
        setIsAdPlaying(true);
        setAdMediaUrl(adData.mediaUrl);
        setAdDuration(adData.duration);
        setAdSkipOffset(adData.skipOffset);
        setCanSkipAd(false);
        setAdCurrentTime(0);
        setAdProgress(0);

        // Pause main content
        if (videoRef.current && isPlaying) {
          videoRef.current.pause();
        }
      }
    } catch (error) {
      console.error('Failed to load ad:', error);
      setIsAdPlaying(false);
    }
  }, [finalAdConfig, isAdPlaying, isPlaying]);


  // Skip ad
  const skipAd = useCallback(() => {
    // NEW: Ensure the adVideoRef current element exists before operating
    const adVideo = adVideoRef.current;
    if (adVideo) {
      adVideo.pause();
      // Ensure ad video source is cleared to prevent accidental reloads
      adVideo.src = "";
      adVideo.load(); // Call load() to stop fetching the old source
    }

    // Only set the flag to false *after* the video element is cleaned up
    setIsAdPlaying(false);
    setAdMediaUrl(null); // This is what triggers the removal from the DOM

    // Resume main content
    if (videoRef.current) {
        // Attempt to play if it was playing before the ad
        if (isPlaying) { 
             videoRef.current.play().catch(console.error);
        } else if (videoRef.current.paused) {
             // If video was paused before the ad, keep it paused, but ensure it's loaded
        }
    }
  }, [isPlaying]); // No change to dependencies

  // Handle ad time update
  const handleAdTimeUpdate = useCallback(() => {
    if (adVideoRef.current) {
      const currentTime = adVideoRef.current.currentTime;
      setAdCurrentTime(currentTime);
      setAdProgress((currentTime / adDuration) * 100);

      if (currentTime >= adSkipOffset && !canSkipAd) {
        setCanSkipAd(true);
      }

      if (currentTime >= adDuration) {
        skipAd();
      }
    }
  }, [adDuration, adSkipOffset, canSkipAd, skipAd]);

// Schedule ads based on play time (Mid-roll)
  useEffect(() => {
    if (!finalAdConfig.enabled || !isPlaying || isAdPlaying) {
      // If not playing or ad is playing, do nothing
      return; 
    }

    // This interval counts up the seconds of content watched
    const interval = setInterval(() => {
      playTimeRef.current += 1;
      
      const timeSinceLastAd = playTimeRef.current / 60; // Convert to minutes
      
      if (timeSinceLastAd >= finalAdConfig.adFrequency) {
        playAd(); // playAd will reset the timer to 0
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isAdPlaying, finalAdConfig.adFrequency, playAd]); // Added adFrequency dependency

  // --- FIX: Corrected Pre-roll Ad Logic ---
  useEffect(() => {
    // Only run this effect once on mount. The dependencies are just for enabling it.
    if (finalAdConfig.enabled && !prerollPlayedRef.current) {
        // We only check for activeStreamUrl once to start the process
        if (activeStreamUrl) {
            prerollPlayedRef.current = true; // Mark pre-roll as played immediately
            playAd(); // Play the ad
        }
    }
  }, [activeStreamUrl, finalAdConfig.enabled, playAd]);
  // --- END FIX ---
  
  // Note: The original 'Reset play time when not playing' effect was removed as it was redundant with the mid-roll effect's cleanup.

  
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const newGrouped = groupServers(match.servers);
    const newQualities = Object.keys(newGrouped).sort((a, b) => {
        if (a === 'auto') return 1;
        if (b === 'auto') return -1;
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numB - numA;
    });
    const newDefaultQuality = newQualities.includes('480p') ? '480p' : newQualities[0] || 'auto';
    const newDefaultServer = newGrouped[newDefaultQuality]?.[0];
    
    setSelectedQuality(newDefaultQuality);
    setSelectedServerId(newDefaultServer?.id ?? 0);
  }, [match]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleVolumeChange = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scheduleHide = () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => {
        if (isPlaying && !showSettings && !showServerPicker && !isAdPlaying) { 
          setIsControlsVisible(false);
        }
      }, 3000);
    };

    const handleInteraction = () => {
      setIsControlsVisible(true);
      scheduleHide();
    };
    
    const container = containerRef.current;

    container?.addEventListener("mousemove", handleInteraction);
    container?.addEventListener("touchstart", handleInteraction);
    container?.addEventListener("mouseleave", scheduleHide);

    if (isPlaying) scheduleHide();

    return () => {
      container?.removeEventListener("mousemove", handleInteraction);
      container?.removeEventListener("touchstart", handleInteraction);
      container?.removeEventListener("mouseleave", scheduleHide);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [isPlaying, showSettings, showServerPicker, isAdPlaying]);

  const toggleFullScreen = useCallback(() => {
    const video = videoRef.current as WebKitVideoElement | null;
    const doc = document as WebKitDocument;

    if (!video) return;

    const isVideoInFullScreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (isVideoInFullScreen) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(console.error);
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    } else {
      if (video.requestFullscreen) {
        video.requestFullscreen({ navigationUI: "auto" })
          .catch((err) => {
            console.warn("Standard requestFullscreen failed, trying webkit...", err);
            if (video.webkitEnterFullscreen) {
              video.webkitEnterFullscreen();
            }
          });
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else {
        console.error("Fullscreen API not supported in this browser.");
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as WebKitDocument;
      setIsFullScreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    if (isFullScreen) {
        container.style.cursor = isControlsVisible ? 'default' : 'none';
    } else {
        container.style.cursor = 'pointer';
    }
  }, [isFullScreen, isControlsVisible]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play().catch(console.error);
  }, [isPlaying]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val > 0 && isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleQualityChange = (quality: string) => {
    if (quality === selectedQuality) {
      setShowSettings(false); 
      return;
    }
    const newServer = groupedStreams[quality]?.[0];
    if (newServer) {
      setSelectedQuality(quality);
      setSelectedServerId(newServer.id ?? 0);
      setShowSettings(false);
    }
  };
  
  const handleServerChange = (serverId: number) => {
    if (serverId === selectedServerId) {
      setShowServerPicker(false); 
      return;
    }
    const currentServers = groupedStreams[selectedQuality];
    const newServer = currentServers?.find(s => s.id === serverId);
    
    if (newServer) {
      setSelectedServerId(serverId);
      setShowServerPicker(false);
    }
  };

  // LiveStreamPlayerApp.tsx:842 - Modified playAdVideo
  const playAdVideo = useCallback(async () => {
    const adVideo = adVideoRef.current;
    if (isAdPlaying && adMediaUrl && adVideo) {
      try {
        adVideo.muted = true;
        adVideo.volume = 1;

        await adVideo.play();
      } catch (error) {
        // Check if the error is the specific AbortError from removal
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn("Ad play aborted due to media removal/interrupt. Skipping ad.");
        } else {
          console.error("Ad autoplay failed:", error);
        }
        
        // FIX: Manually pause and clear source before calling skipAd to clean up
        // This ensures the video element's state is quiescent before unmounting.
        adVideo.pause();
        adVideo.src = "";
        adVideo.load();
        
        skipAd();
      }
    }
  }, [isAdPlaying, adMediaUrl, skipAd]);

  useEffect(() => {
    // We call this effect when adMediaUrl changes (when an ad is loaded)
    playAdVideo();
  }, [playAdVideo]);
  // --- END FIXED AD LOGIC ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'KeyF') { e.preventDefault(); toggleFullScreen(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullScreen]);

  if (!match || !activeStreamUrl) {
    return (
      <div className="w-full bg-black rounded-xl aspect-video flex items-center justify-center text-white/75">
        No stream available.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full bg-black rounded-xl overflow-hidden aspect-video group transition-all duration-300 border border-gray-600/20 ${
          isControlsVisible ? '' : 'cursor-none' 
      }`}
    >
      {/* Main Video */}
      <video
        ref={videoRef}
        onClick={(e) => {
          if (!isAdPlaying) {
            setIsControlsVisible(true); 
            togglePlay();
          }
        }}
        className="w-full h-full object-contain cursor-pointer bg-black"
        playsInline
        autoPlay
        muted={isMuted} 
      />

      {/* Ad Overlay */}
      {isAdPlaying && adMediaUrl && (
        <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <video
              ref={adVideoRef}
              src={adMediaUrl}
              autoPlay 
              onTimeUpdate={handleAdTimeUpdate}
              onEnded={skipAd}
              className="w-full h-full object-contain"
              playsInline 
              // IMPORTANT: The ad video must be able to respect volume/mute controls 
              // from the main component state. If it is permanently muted here, 
              // the user cannot unmute it. We let the playAdVideo function handle 
              // the initial muted start for autoplay.
              muted={false} 
            />
            
            {/* Ad Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <div className="flex items-center space-x-2 bg-black/70 rounded-lg px-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Advertisement</span>
              </div>
              
              {canSkipAd && (
                <button
                  onClick={skipAd}
                  className="text-xs flex items-center gap-x-2 bg-black/70 text-white rounded-lg px-2 py-1 hover:bg-black/90 transition-colors"
                >
                  <span>Skip Ad</span>
                  <X size={16} />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {isBuffering && !isAdPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Spinner />
        </div>
      )}

      {/* Main Controls - Hidden during ads */}
      {!isAdPlaying && (
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            isControlsVisible ? 'opacity-100 ' : 'opacity-0 pointer-events-none group-hover:opacity-100'
          }`}
        >
          {isControlsVisible && (
              <div className="pointer-events-auto w-full h-full relative"> 
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-1">
                      <div className="w-2 h-2 bg-[#228EE5] rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium">LIVE</span>
                    </div>
                    <span className="text-white text-sm bg-black/50 rounded-lg px-3 py-1">{selectedQuality}</span>
                  </div>

                 <div className="h-[100px] absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-transparent to-transparent"/>
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button onClick={togglePlay} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <div className="w-24 hidden sm:block">
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#228EE5]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <button
                            onClick={() => { setShowServerPicker(p => !p); setShowSettings(false); }}
                            className="text-white hover:bg-white/20 rounded-lg px-3 py-2 transition-colors flex items-center space-x-2"
                          >
                            <Server size={16} />
                            <span className="text-sm hidden sm:inline">Server</span>
                          </button>
                          {showServerPicker && (
                            <div className="absolute bottom-full right-0 mb-2 bg-gray-900/50 border border-gray-700/50 rounded-lg p-1 min-w-32 shadow-xl z-10 max-h-[150px] overflow-y-scroll scrollbar-hide">
                              {groupedStreams[selectedQuality]?.map(server => (
                                <button
                                  key={server.id}
                                  onClick={() => handleServerChange(server.id!)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                                    server.id === selectedServerId ? 'bg-[#228EE5] text-white' : 'text-gray-300 hover:bg-black/40'
                                  }`}
                                >
                                  {server.serverName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => { setShowSettings(p => !p); setShowServerPicker(false); }}
                            className="text-white hover:bg-white/20 rounded-lg px-3 py-2 transition-colors flex items-center space-x-2"
                          >
                            <Video size={22} />
                            <span className="text-sm hidden sm:inline">Quality</span>
                          </button>
                          {showSettings && (
                            <div className="absolute bottom-full right-0 mb-2 bg-gray-900/50 border border-gray-700/50 rounded-lg p-1 min-w-24 shadow-xl z-10 max-h-[200px] overflow-y-auto">
                              {availableQualities.map(quality => (
                                <button
                                  key={quality}
                                  onClick={() => handleQualityChange(quality)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                                    quality === selectedQuality ? 'bg-[#228EE5] text-white' : 'text-gray-300 hover:bg-black/40'
                                  }`}
                                >
                                  {quality}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button onClick={refreshStream} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" title="Refresh Stream">
                          <RotateCw size={20} />
                        </button>

                        <button onClick={toggleFullScreen} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" title={isFullScreen ? "Exit Fullscreen (f)" : "Enter Fullscreen (f)"}>
                          {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayerApp;