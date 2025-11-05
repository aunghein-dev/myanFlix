import FooterLinks from "@/components/section/FooterLinks";
import Logo, { LogoName } from "@/logo/Logo";

const logos: { name: LogoName; color: string }[] = [
  { name: "hbo", color: "#000" },
  { name: "wb", color: "#000" },
  { name: "appletv", color: "#000" },
  { name: "disneyplus", color: "#000" },
  { name: "marvel", color: "#000" },
  { name: "dc", color: "#000" },
  { name: "hulu", color: "#000" },
  { name: "netflix", color: "#000" },
  { name: "paramount", color: "#000" },
  { name: "sony", color: "#000" },
];


const contact: { name: LogoName; color: string }[] = [
  { name: "linkedin", color: "#000" },
  { name: "instagram", color: "#000" },
  { name: "facebook", color: "#000" },
  { name: "youtube", color: "#000" },
  { name: "telegram", color: "#000" },
];

export default function Footer(){
  return (
    <nav className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-w-6xl mx-auto px-1 sm:px-2
                    flex items-center justify-center flex-col">
      <h1 className="font-oswald text-3xl text-white font-semibold mt-6">Studios</h1>
      <div className="grid grid-cols-5 gap-x-4 sm:gap-x-10 gap-y-7 mt-5">
        {logos.map((logo) => (
          <Logo
            key={logo.name}
            name={logo.name}
            width={60}
            height={60}
            className="px-2 py-3 bg-white/90 rounded-xl hover:bg-white/80 transition-colors duration-300 ease-in-out cursor-pointer text-slate-800"
            color={logo.color}
          />
        ))}
      </div>

      <FooterLinks />

      <div className="flex flex-rows gap-x-6 mt-14 mb-20 sm:mb-7">
        {
          contact.map((logo) => (
            <Logo
              key={logo.name}
              name={logo.name}
              width={40}
              height={40}
              className="p-1 bg-white/90 rounded-xl hover:bg-white/80 transition-colors duration-300 ease-in-out cursor-pointer text-slate-800"
              color={logo.color}
            />
          ))
        }
      </div>
    </nav>
  )
}