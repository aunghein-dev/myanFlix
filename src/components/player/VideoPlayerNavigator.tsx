import { SubtitleLanguage, Torrent } from "@/app/videoplayer/[slug]/page";
import { BackwardIcon, ForwardIcon, FullscreenExitIcon, FullscreenIcon, PauseIcon, PlayIcon, ResetIcon, SettingsIcon, SubtitlesIcon, TextSizeIcon, VolumeOffIcon, VolumeUpIcon } from "@/data/iconfactory";
import { MdOutlineHighQuality } from "react-icons/md";
import { useState } from "react"; // Added for settings page state
import { GoChevronLeft, GoChevronRight } from "react-icons/go"; // Added for menu navigation icons

export const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins.toString().padStart(hrs > 0 ? 2 : 1, '0');
  const formattedSecs = secs.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${formattedMins}:${formattedSecs}`;
  }
  return `${mins}:${formattedSecs}`;
};
interface Props {
  togglePlay: () => void;
  isPlaying: boolean;
  quickSeek: (arg0: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  handleVolumeChange: (arg0: number) => void;
  handleOffsetChange: (arg0: number) => void;
  subtitleOffset: number;
  resetSubtitleSettings: () => void;
  settingsRef: React.RefObject<HTMLDivElement | null>;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  torrents: Torrent[];
  selectedTorrent: Torrent | null;
  handleTorrentSelect: (torrent: Torrent) => void;
  subtitleLanguages: SubtitleLanguage[];
  selectedSubtitle: string;
  setSelectedSubtitle: (lang: string) => void;
  subtitleSize: number;
  handleSubtitleSizeChange: (size: number) => void;
}

export default function VideoPlayerNavigator(props : Props){

    const {
    togglePlay,
    isPlaying,
    quickSeek,
    toggleMute,
    isMuted,
    volume,
    currentTime,
    duration,
    handleVolumeChange,
    subtitleOffset,
    handleOffsetChange,
    resetSubtitleSettings,
    showSettings,
    setShowSettings,
    settingsRef,
    torrents,
    selectedTorrent,
    handleTorrentSelect,
    subtitleLanguages,
    selectedSubtitle,
    setSelectedSubtitle,
    subtitleSize,
    handleSubtitleSizeChange,
    isFullscreen,
    toggleFullscreen
  } = props;
  
  // State for settings sub-menus
  const [settingsPage, setSettingsPage] = useState('main'); // 'main', 'quality', 'subtitles'

  // Wrapper for toggling settings to reset page state
  const toggleSettings = () => {
    if (showSettings) {
      // It's about to close, reset to main page
      setSettingsPage('main');
    }
    setShowSettings(!showSettings);
  }

  // New handler for subtitle selection to navigate back
  const handleSubtitleSelectAndGoBack = (langCode: string) => {
    setSelectedSubtitle(langCode);
    setSettingsPage('main'); // Go back to main settings
  }

  // New handler for torrent selection to navigate back
  const handleQualitySelectAndGoBack = (torrent: Torrent) => {
    handleTorrentSelect(torrent);
    setSettingsPage('main'); // Go back to main settings
  }

  return (
    <div className="flex items-center justify-between">
        {/* Left Controls: Play, Seek, Volume, Time */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={togglePlay}
            className="p-1 sm:p-2 hover:bg-white/10 rounded transition-colors"
            title={isPlaying ? "Pause (k)" : "Play (k)"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => quickSeek(-10)}
              className="p-1 sm:p-2 hover:bg-white/10 rounded transition-colors"
              title="Rewind 10s (J)"
            >
              <BackwardIcon />
            </button>
            <button
              onClick={() => quickSeek(10)}
              className="p-1 sm:p-2 hover:bg-white/10 rounded transition-colors"
              title="Forward 10s (L)"
            >
              <ForwardIcon />
            </button>
          </div>
          

          <div className="flex items-center space-x-2 group/volume">
            <button onClick={toggleMute} className="p-1 sm:p-2 hover:bg-white/10 rounded transition-colors" title={isMuted ? "Unmute" : "Mute (m)"}>
              {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </button>
            <div className="w-16 sm:w-20 relative h-4 hidden sm:block">
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-[#228EE5] rounded-full transition-all"
                  style={{ width: `${volume * 100}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01" 
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="absolute top-0 left-0 w-full h-1 opacity-0 hover:opacity-100 focus:opacity-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          <div className="text-sm hidden md:block">
            <span className="font-medium text-white">{formatTime(currentTime)}</span>
            <span className="text-gray-400"> / {formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls: Offset, Settings, Fullscreen */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Subtitle Offset Controls */}
          <div className="flex items-center space-x-1 bg-black/70 border border-gray-700 rounded-lg px-2 py-1 text-sm">
              <span className="text-xs text-gray-300 mr-1 hidden lg:inline">Offset:</span>
              <button
                onClick={() => handleOffsetChange(subtitleOffset - 0.1)}
                className="hover:text-[#228EE5] transition-colors px-1 text-xs"
                title="Delay -0.1s"
              >
                -0.1s
              </button>
              <span className="w-10 text-center text-xs text-[#228EE5]">
                {subtitleOffset >= 0 ? '+' : ''}{subtitleOffset.toFixed(1)}
              </span>
              <button
                onClick={() => handleOffsetChange(subtitleOffset + 0.1)}
                className="hover:text-[#228EE5] transition-colors px-1 text-xs"
                title="Delay +0.1s"
              >
                +0.1s
              </button>
                <button
                onClick={resetSubtitleSettings}
                className="p-1 hover:bg-white/10 rounded transition-colors ml-1"
                title="Reset subtitle settings"
              >
                <ResetIcon />
              </button>
            </div>

          {/* Settings Menu */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={toggleSettings} 
              className="p-1 sm:p-2 hover:bg-white/10 rounded transition-colors"
              title="Settings"
            >
              <SettingsIcon />
            </button>

            {/* NEW YOUTUBE-STYLE SETTINGS PANEL */}
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 bg-black/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                
                {/* Panel Container for Main Page */}
                {/* This panel slides out of view to the left */}
                <div className={`transition-transform duration-200 ease-in-out ${settingsPage !== 'main' ? '-translate-x-full' : 'translate-x-0'}`}>
                  <div className="p-4">
                    <div className="space-y-2">
                      
                      {/* Quality Button: Navigates to 'quality' page */}
                      <button
                        onClick={() => setSettingsPage('quality')}
                        className="w-full flex justify-between items-center bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center space-x-2 text-[#228EE5]">
                          <MdOutlineHighQuality />
                          <span className="text-sm font-bold">Quality</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <span>{selectedTorrent?.quality || 'Auto'}</span>
                          <GoChevronRight className="w-5 h-5" />
                        </div>
                      </button>

                      {/* Subtitles Button: Navigates to 'subtitles' page */}
                      {subtitleLanguages.length > 0 && (
                        <button
                          onClick={() => setSettingsPage('subtitles')}
                          className="w-full flex justify-between items-center bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center space-x-2 text-[#228EE5]">
                            <SubtitlesIcon />
                            <span className="text-sm font-bold">Subtitles</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            {/* Find the name of the selected language, or show 'Off' */}
                            <span>{selectedSubtitle ? subtitleLanguages.find(s => s.code === selectedSubtitle)?.name : 'Off'}</span>
                            <GoChevronRight className="w-5 h-5" />
                          </div>
                        </button>
                      )}

                      {/* Subtitle Size Section (remains on main page) */}
                      <div className="bg-white/5 p-3 rounded-lg space-y-3">
                        <div>
                          <div className="flex items-center space-x-2 text-[#228EE5] mb-2 mt-2">
                            <TextSizeIcon />
                            <span className="text-sm font-medium">Size: {subtitleSize}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={subtitleSize}
                            onChange={(e) => handleSubtitleSizeChange(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Panel Container for Sub-Pages (Quality, Subtitles) */}
                {/* This panel slides in from the right */}
                <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-200 ease-in-out ${settingsPage === 'main' ? 'translate-x-full' : 'translate-x-0'}`}>
                  
                  {/* Quality Page */}
                  {settingsPage === 'quality' && (
                    <div className="p-4 h-full">
                      {/* Back Button */}
                      <button
                        onClick={() => setSettingsPage('main')}
                        className="flex items-center space-x-2 text-gray-300 hover:text-white mb-3"
                      >
                        <GoChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-bold">Quality</span>
                      </button>
                      {/* Quality Options List */}
                      <div className="flex flex-col space-y-1 max-h-60 overflow-y-auto">
                        {torrents.map((torrent) => (
                          <button
                            key={torrent.hash}
                            onClick={() => handleQualitySelectAndGoBack(torrent)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedTorrent?.hash === torrent.hash ? 'bg-[#228EE5] text-white' : 'hover:bg-white/10 text-gray-200'}`}
                          >
                            {torrent.quality}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtitles Page */}
                  {settingsPage === 'subtitles' && (
                    <div className="p-4 h-full">
                      {/* Back Button */}
                      <button
                        onClick={() => setSettingsPage('main')}
                        className="flex items-center space-x-2 text-gray-300 hover:text-white mb-3"
                      >
                        <GoChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-bold">Subtitles</span>
                      </button>
                      {/* Subtitles Options List */}
                      <div className="flex flex-col space-y-1 max-h-60 overflow-y-auto">
                        <button
                          onClick={() => handleSubtitleSelectAndGoBack("")}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedSubtitle === "" ? 'bg-[#228EE5] text-white' : 'hover:bg-white/10 text-gray-200'}`}
                        >
                          Off
                        </button>
                        {subtitleLanguages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleSubtitleSelectAndGoBack(lang.code)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedSubtitle === lang.code ? 'bg-[#228EE5] text-white' : 'hover:bg-white/10 text-gray-200'}`}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
            {/* END NEW SETTINGS PANEL */}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1 sm:p-2 hover:bg-white/10 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen (f)" : "Fullscreen (f)"}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </button>
        </div>
      </div>
  )
}
