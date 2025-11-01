"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Minimize, Maximize, RotateCw, Video, Server } from "lucide-react";
import Hls, { type ErrorData } from "hls.js";
import Spinner from "../atoms/Spinner";

// Interfaces (Keep as is)
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

// --- Utilities --- (Keep as is)
const groupServers = (servers: StreamServer[]): GroupedStreams => {
  const grouped: GroupedStreams = {};
  servers.forEach((server, index) => {
    // Corrected quality extraction to handle formats like "720p HD" or "1080P"
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

// =========================================================================
// 🚀 FIXED useHlsPlayer HOOK FOR PERSISTENT RETRIES
// =========================================================================
const useHlsPlayer = (videoRef: React.RefObject<HTMLVideoElement | null>, streamUrl: string | undefined) => {
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10; // Max attempts before stopping
  const retryInterval = 3000; // 3 seconds between attempts

  const setupStream = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // Destroy existing HLS instance before loading a new stream
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Attempt to start playing immediately (even before manifest parsed, HLS will attach)
    video.play().catch(e => console.log("Autoplay attempt:", e));

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // SUCCESS: Reset the retry counter
        retryCountRef.current = 0; 
        video.play().catch(e => console.log("Autoplay blocked (HLS):", e));
      });

      hls.on(Hls.Events.ERROR, (_, data: ErrorData) => {
        console.warn("HLS Error:", data.type, data);

        if (!data.fatal) return; // Only handle fatal errors

        // Persistent Retry Logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Fatal HLS Error. Retry attempt ${retryCountRef.current}/${maxRetries} in ${retryInterval}ms...`);
          
          // Use setTimeout to pause before calling setupStream again (full reload)
          setTimeout(setupStream, retryInterval); 
        } else {
          console.error("Max retries reached, stream is unrecoverable.");
          hls.destroy();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native browser playback (e.g., Safari)
      video.src = streamUrl;
      video.play().catch(e => console.log("Autoplay blocked (native):", e));
    } else {
      console.error("HLS not supported in this browser");
    }
  }, [streamUrl, videoRef]);

  // Initial stream setup and cleanup on unmount/streamUrl change
 useEffect(() => {
    setupStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [setupStream]);

  // Expose setupStream as refreshStream and reloadStream
  const refreshStream = () => setupStream();
  const reloadStream = () => setupStream();

  return { refreshStream, reloadStream };
};


// --- Component ---
interface Props {
  match: FootballMatch;
}

const LiveStreamPlayerApp: React.FC<Props> = ({ match }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const groupedStreams = groupServers(match.servers);
  // Sort: descending by number, 'auto' last
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
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const [selectedQuality, setSelectedQuality] = useState(defaultQuality);
  const [selectedServerId, setSelectedServerId] = useState(defaultServer?.id ?? 0);

  const activeServer = groupedStreams[selectedQuality]?.find(s => s.id === selectedServerId);
  const activeStreamUrl = activeServer?.stream_url;

  const { refreshStream, reloadStream } = useHlsPlayer(videoRef, activeStreamUrl);
  
  // Force reload when server or quality changes (using the aggressive reloadStream)
  // We remove the defaultQuality/defaultServer checks here to ensure state changes trigger reload
  useEffect(() => {
    if (activeStreamUrl) {
      reloadStream();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStreamUrl, selectedServerId, selectedQuality]); 
  
  // Initialize video element properties
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle re-grouping/defaults when `match` prop updates
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


  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    // HLS playing/waiting events are critical for buffering indicator
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

  // Controls Visibility (Autohide) - Kept as is
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
   const scheduleHide = () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => {
        if (isPlaying && !showSettings && !showServerPicker) { 
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
  }, [isPlaying, showSettings, showServerPicker]);



  const toggleFullScreen = useCallback(() => {
    const video = videoRef.current; 
    const container = containerRef.current;

    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    } else {
      video.requestFullscreen({ navigationUI: "auto" }) 
            .then(() => {
            })
            .catch((err) => {
                console.warn("Failed to enter fullscreen via JS:", err);
            });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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


  // Play/pause, Mute/volume, Quality/Server Handlers - Kept as is
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

  // Keyboard shortcuts - Kept as is
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

  // --- JSX Rendering (Kept as is) ---
  return (
    <div 
      ref={containerRef} 
      className={`relative w-full bg-black rounded-xs overflow-hidden aspect-video group transition-all duration-300 ${
          isControlsVisible ? '' : 'cursor-none' 
      }`}
    >
      <video
        ref={videoRef}
        onClick={(e) => {
        setIsControlsVisible(true); 
        togglePlay();
        }}
        className="w-full h-full object-contain cursor-pointer bg-black"
        playsInline
        autoPlay
        muted={isMuted} 
      />

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Spinner />
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100 ' : 'opacity-0 pointer-events-none group-hover:opacity-100'
        }`}
      >
        {isControlsVisible && (
            <div className="pointer-events-auto w-full h-full relative"> 
                {/* Top Controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-1">
                    <div className="w-2 h-2 bg-[#228EE5] rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">LIVE</span>
                  </div>
                  <span className="text-white text-sm bg-black/50 rounded-lg px-3 py-1">{selectedQuality}</span>
                </div>

               <div className="h-[100px] absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-transparent to-transparent"/>
                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-transparent to-transparent">
                  <div className="flex items-center justify-between">
                    {/* Left Controls */}
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

                    {/* Right Controls */}
                    <div className="flex items-center space-x-2">
                      {/* Server Picker */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowServerPicker(p => !p); setShowSettings(false); }}
                          className="text-white hover:bg-white/20 rounded-lg px-3 py-2 transition-colors flex items-center space-x-2"
                        >
                          <Server size={16} />
                          <span className="text-sm hidden sm:inline">Server</span>
                        </button>
                        {showServerPicker && (
                          <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 min-w-32 shadow-xl z-10">
                            {groupedStreams[selectedQuality]?.map(server => (
                              <button
                                key={server.id}
                                onClick={() => handleServerChange(server.id!)}
                                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                                  server.id === selectedServerId ? 'bg-[#228EE5] text-white' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {server.serverName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quality Picker */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowSettings(p => !p); setShowServerPicker(false); }}
                          className="text-white hover:bg-white/20 rounded-lg px-3 py-2 transition-colors flex items-center space-x-2"
                        >
                          <Video size={22} />
                          <span className="text-sm hidden sm:inline">Quality</span>
                        </button>
                        {showSettings && (
                          <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 min-w-24 shadow-xl z-10">
                            {availableQualities.map(quality => (
                              <button
                                key={quality}
                                onClick={() => handleQualityChange(quality)}
                                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                                  quality === selectedQuality ? 'bg-[#228EE5] text-white' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {quality}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Refresh */}
                      <button onClick={refreshStream} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" title="Refresh Stream">
                        <RotateCw size={20} />
                      </button>

                      {/* Fullscreen */}
                      <button onClick={toggleFullScreen} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" title={isFullScreen ? "Exit Fullscreen (f)" : "Enter Fullscreen (f)"}>
                        {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamPlayerApp;