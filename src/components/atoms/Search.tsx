import { useRef } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

interface SearchProps {
  query: string;
  setQuery: (q: string) => void;
  isAllowedPage: boolean;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

const Search = (props: SearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, isAllowedPage, focused, setFocused } = props;
  const shouldExpand = focused || query.length > 0;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to parent
    setQuery("");
    setFocused(false);
    // Also blur the input to ensure it loses focus
    inputRef.current?.blur();
  };

  const handleContainerClick = () => {
    // Only focus if we're not clicking the clear button
    inputRef.current?.focus();
  };

  return (
    <div
      className={`
        flex items-center rounded-full
        transition-all duration-400 ease-in-out
        overflow-hidden
        justify-center
        ${
          shouldExpand
            ? "w-60 sm:w-[260px] px-1.5 h-10 border border-[#228EE5]"
            : "w-10 h-10 justify-center "
        }
        ${focused ? "border-[#228EE5] shadow-sm " : "border-[#228EE5]"}
        cursor-pointer
      `}
      onClick={handleContainerClick}
    >
      <IoSearchOutline
        className={`transition-colors duration-300 text-2xl min-w-5
        ${shouldExpand ? "text-[#228EE5] ml-1" : "text-white/75"}`}
      />

      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={isAllowedPage ? "Search Movies" : "Search Live Matches"}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          mx-1 bg-transparent text-sm font-normal sm:text-sm 
          focus:outline-none transition-all duration-300 py-3 cursor-pointer 
          text-white/75
          ${shouldExpand ? "opacity-100 w-full" : "opacity-0 w-0"}
        `}
      />

      {shouldExpand && query.length > 0 && (
        <RxCross2
          className="text-2xl text-white/75 cursor-pointer mr-1"
          onClick={handleClear}
        />
      )}
    </div>
  );
};

export default Search;