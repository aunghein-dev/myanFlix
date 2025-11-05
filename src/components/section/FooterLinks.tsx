import { FaChevronRight } from "react-icons/fa";

const links = [
  "Get the myanFlix App",
  "Help",
  "Site Index",
  "myanFlix Developer",
  "Jobs",
  "Privacy Policy",
  "myanFlix Pro",
  "Advertising",
];


export default function FooterLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-7 mt-16 max-w-3xl mx-auto px-2">
      {links.map((link) => (
        <span
          key={link}
          className="text-sm text-white/50 flex items-center cursor-pointer
                     hover:underline hover:underline-offset-4
                     decoration-2
                     transition-all duration-300 ease-in-out"
        >
          {link} <FaChevronRight className="ml-1 w-2.5 h-2.5" />
        </span>
      ))}
    </div>
  );
}
