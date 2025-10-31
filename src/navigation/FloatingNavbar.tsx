import NavbarData from "@/data/navbar.data";
import Link from "next/link";
import { usePathname } from "next/navigation";


export default function FloatingNavbar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800/80 backdrop-blur-sm 
                 block sm:hidden h-[70px] flex items-center justify-around fixed-bottom-safe"
    >
      {NavbarData.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== "/");

        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`relative flex flex-col items-center text-sm font-medium transition-colors duration-300
                        hover:text-[#228EE5] ${
                          isActive ? "text-[#228EE5]" : "text-white/95"
                        }`}
          >
            <Icon size={24} />
            <span>{item.name}</span>

            
          </Link>
        );
      })}
    </nav>
  );
}