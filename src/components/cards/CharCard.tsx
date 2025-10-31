import GlobalImage from "../atoms/GlobalImage";
import { Person } from "../layout/LineCharacterList";

export default function CharCard({ person }: { person: Person }) {
  return (
    <div
      className="relative flex flex-col items-center text-center text-white transition-all ease-in duration-300 group"
    >
      <GlobalImage
        width={100}
        height={100}
        key={person.id}
        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
        alt={person.name}
        className="max-w-25 h-25 min-w-25 rounded-full object-cover mb-2 transition-transform duration-200"
      />
       <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors duration-150 ease-out pointer-events-none"/>
      <p className="text-xs font-medium truncate text-slate-200/50">{person.name}</p>
    </div>
  )
}