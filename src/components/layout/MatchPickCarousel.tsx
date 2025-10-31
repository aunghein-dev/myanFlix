import { PickMatch } from "@/types/matchpick";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MatchPickCard from "../cards/MatchPickCard";


interface MatchPickCarouselProps {
  picks: PickMatch[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export default function MatchPickCarousel({ picks, activeIndex, setActiveIndex }: MatchPickCarouselProps) {
  const nextSlide = () => {
    setActiveIndex((activeIndex + 1) % picks.length);
  };

  const prevSlide = () => {
    setActiveIndex((activeIndex - 1 + picks.length) % picks.length);
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  if (picks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white/60">
        <div className="text-6xl mb-4">⚽</div>
        <p className="text-xl font-medium">No matches available</p>
        <p className="text-sm mt-2">Check back later for new predictions</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Main Carousel Container */}
      <div className="relative overflow-hidden">
        
        {/* Navigation Arrows */}
        {picks.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/40 group"
              aria-label="Previous match"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/40 group"
              aria-label="Next match"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
            </button>
          </>
        )}

        {/* Carousel Track */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {picks.map((match, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <MatchPickCard match={match} isActive={index === activeIndex} />
              </div>
            ))}
          </div>
        </div>

        <div className="px-2 py-2">
          <div className="flex items-center justify-between text-xs text-white/60 mb-3">
            <span>Match {activeIndex + 1} of {picks.length}</span>
            <span className="font-medium">{picks[activeIndex]?.league}</span>
          </div>
          

          <div className="flex items-center justify-center space-x-3 py-1">
            {picks.map((match, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`group relative flex flex-col items-center transition-all duration-300 ${
                  index === activeIndex ? 'scale-110' : 'scale-100 hover:scale-105'
                }`}
                aria-label={`Go to match ${index + 1}: ${match.home} vs ${match.away}`}
              >
                {/* Active Indicator Dot */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                    index === activeIndex
                      ? 'bg-cyan-400/80 border-cyan-400/80 shadow-lg shadow-cyan-400/25'
                      : 'bg-white/30 border-white/40 hover:bg-white/40 hover:border-white/60'
                  }`}
                />
                
                {/* Team Preview on Hover */}
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="backdrop-blur-[1px] border border-white/20 rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-medium truncate max-w-[80px] text-white">{match.home}</span>
                      <span className="text-white/60">vs</span>
                      <span className="font-medium truncate max-w-[80px] text-white">{match.away}</span>
                    </div>
                    <div className="text-[10px] text-white mt-1 text-center">
                      {match.win_pick === '1' ? match.home : match.away} to win
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}