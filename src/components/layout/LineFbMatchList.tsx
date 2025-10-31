import Link from "next/link";
import FootballMatchCard, { FootballMatch } from "../cards/FootballMatchCard";
import { GoArrowRight } from "react-icons/go";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LineFbMatchListProps {
  liveMatchesList: FootballMatch[];
  title?: string;
  link?: string;
  logo?: string;
  titleDisable?: boolean;
}

export default function LineFbMatchList({
  liveMatchesList,
  title,
  link,
  logo,
  titleDisable,
}: LineFbMatchListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Recalculate after DOM paints
    const checkScroll = () => handleScroll();
    requestAnimationFrame(checkScroll);

    // Recheck again after images/cards have loaded
    const timeout = setTimeout(checkScroll, 300);

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timeout);
    };
  }, [liveMatchesList]);

  const scroll = (dir: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.95;
    const target =
      dir === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <div>
      {!liveMatchesList || liveMatchesList.length === 0 ? (
        <div className="text-center text-gray-500">
          {!titleDisable ? `No ${title} Available.` : ""}
        </div>
      ) : (
        <div className="relative">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-white text-2xl font-semibold">
              {logo && (
                <Image
                  src={logo}
                  alt={`${title} Logo`}
                  width={30}
                  height={30}
                  className="inline-block mr-2 mb-1"
                />
              )}
              {title}
            </h1>
            {liveMatchesList && (
              <Link
                href={link || "/live"}
                className="inline-flex items-center text-[#228EE5] text-sm
                           underline-offset-2 transition-all duration-300
                           decoration-2 ease-in-out
                           hover:underline select-none"
              >
                <span className="flex items-center gap-1">
                  See More
                  <GoArrowRight className="h-5 w-5" />
                </span>
              </Link>
            )}
          </div>

          <div
            className="flex flex-row gap-4 overflow-x-auto scrollbar-hide"
            ref={scrollRef}
          >
            {liveMatchesList.map((match, index) => (
              <Link
                key={`${match.home_team_name}-${index}`}
                href={
                  "/liveplayer?info=" +
                  encodeURIComponent(
                    `${match.home_team_name}]${match.away_team_name}]${match.league_name}]${match.match_time}`
                  )
                }
              >
                <FootballMatchCard match={match} />
              </Link>
            ))}
          </div>
          {showLeft && (
             <button
              onClick={() => scroll("left")}
              className="absolute -left-7 top-1/2 p-2.5 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full border border-white/80 items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/60 group backdrop-blur-xs hidden md:block"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
            </button>
          )}

          {showRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-7 top-1/2 p-2.5 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full border border-white/80 items-center justify-center transition-all duration-300 hover:scale-110 hover:border-white/60 group backdrop-blur-xs hidden md:block"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-white/90 transition-colors" />
            </button>
          )}
        </div>  
      )}
    </div>
  );
}
