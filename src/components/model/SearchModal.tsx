import { MovieSearchResult } from "@/navigation/Navbar"
import { FootballMatch } from "../player/LiveStreamPlayerApp"
import Link from "next/link";
import GlobalImage from "../atoms/GlobalImage";
import dayjs from "dayjs";

interface Props {
  result: MovieSearchResult[],
  liveResult: FootballMatch[],
  query: string,
  isAllowedPage: boolean,
  setQuery: (q: string) => void
}

export default function SearchModal(props : Props) {
  const { result, liveResult, query, isAllowedPage, setQuery } = props;
  return (
    <>
      <div className="absolute left-0 top-16 right-0 bg-black/90 min-h-20
                            z-50 hover:shadow-lg shadow-white/15
                            rounded-xl flex flex-col overflow-y-scroll max-h-[400px]">
        {
          result.length === 0 && liveResult.length === 0 && isAllowedPage ? (
            <p className="text-white/30 text-sm p-2 flex items-center justify-center mt-2">No results found</p>
          ) : (
            <div>
              {
                result.map((movie) => (
                  <Link href={`/details/${movie.id}`} key={movie.id} className="flex items-center p-2 hover:bg-[#228EE5]/50 transition-colors duration-300 "
                    onClick={() => setQuery("")}>
                    <GlobalImage
                      width={80}
                      height={80}
                      unoptimized
                      src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                      alt={movie.title}
                      className="min-w-20 max-h-18 object-cover rounded-lg object-center select-none"
                    />
                    <div className="ml-4 spax-y-1">
                      <h3 className="text-sm font-semibold text-white line-clamp-1">{movie.title}</h3>
                      <p className="text-xs text-white/50">{dayjs(movie.release_date).format("YYYY")}</p>

                      <p className="text-xs text-white/30 line-clamp-3">{movie.overview}</p>
                    </div>
                  </Link>
                ))
              }
            </div>
          )
        }

        {
          result.length === 0 && liveResult.length === 0 && !isAllowedPage ? (
            <p className="text-white/30 text-sm p-2 flex items-center justify-center mt-2">No Matches Found</p>
          ) : (
            <div className="">
              {
                liveResult.map((match, index) => (
                  <Link 
                      href={'/liveplayer?info=' + encodeURIComponent(`${match.home_team_name}]${match.away_team_name}]${match.league_name}]${match.match_time}`)}
                      key={`${match.home_team_name}-${index}`} 
                      className="flex items-center justify-between p-2 hover:bg-[#228EE5]/50 transition-colors duration-300 min-h-20"
                      onClick={() => setQuery("")}>
                      <div className="flex flex-col items-center space-y-1 min-w-30">
                          <GlobalImage
                              width={50}
                              height={50}
                              unoptimized
                              src={match.home_team_logo}
                              alt={match.home_team_name}
                              className="min-w-10 min-h-10 max-w-10 max-h-10 object-cover rounded-lg object-center select-none"
                          />
                          <span className="text-white/80 text-xs text-center font-medium max-w-20 truncate">{match.home_team_name}</span>
                      </div>

                      <p
                          className="text-white/75 font-semibold bg-white/10 px-2.5 py-2 rounded-full min-w-max"
                          >
                          {match.match_status.toUpperCase()}
                      </p>

                      <div className="flex flex-col items-center space-y-1 min-w-30">
                          <GlobalImage
                              width={50}
                              height={50}
                              unoptimized
                              src={match.away_team_logo}
                              alt={match.away_team_name}
                              className="min-w-10 min-h-10 max-w-10 max-h-10 object-cover rounded-lg object-center select-none"
                          />
                          <span className="text-white/80 text-xs text-center font-medium max-w-20 truncate">{match.away_team_name}</span>
                      </div>

                  </Link>
                ))
              }
            </div>
          )
        }
    </div>
    </>
  )
}