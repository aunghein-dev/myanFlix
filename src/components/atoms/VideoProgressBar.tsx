import { formatTime } from "../player/VideoPlayerNavigator";


export default function VideoProgressBar({ currentTime, duration, handleSeek} : { currentTime: number, duration: number, handleSeek: (time: number) => void }) {
  return (
    <div className="group/progress">
      <div className="relative">
        <div className="w-full h-1.5 bg-gray-600/70 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }} 
          ></div>
          <div 
            className="h-full bg-[#228EE5] rounded-full transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="absolute left-0 top-0 h-1.5 w-full cursor-pointer opacity-0 hover:opacity-50 focus:opacity-50"
            style={{ zIndex: 10 }} 
          />
        </div>
      </div>
      <div className="flex justify-between text-xs sm:text-sm text-gray-300 mt-1 px-1">
        <span className="font-medium">{formatTime(currentTime)}</span>
        <span className="text-gray-400">{formatTime(duration)}</span>
      </div>
    </div>
  );
}