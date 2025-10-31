import Link from "next/link";
import { Person } from "./LineCharacterList";
import CharCard from "../cards/CharCard";
import { nanoid } from "nanoid";
import Spinner from "../atoms/Spinner";

export default function RelatedCeleGrid({ celebrities, isLoading} : { celebrities : Person[], isLoading?: boolean }) {
  return (
    <div>
      <h1 className="text-lg font-bold text-white mt-4 mb-3 select-none">Related Celebrities</h1>
      {
        isLoading ? <Spinner className="min-h-[200px]"/> : (
          <div className="flex flex-row flex-wrap">
            {
            celebrities.map((person)=> {
              return (
                <Link 
                  className="mr-5 last:mr-0"
                  key={nanoid()} 
                  href={`/person/${person.id}`}
                  scroll={true}>
                  <CharCard person={person} />
                </Link>)
              })
            }
          </div>
        )
      }
    </div>
  )
}