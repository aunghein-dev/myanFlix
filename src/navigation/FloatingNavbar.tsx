import NavbarData from "@/data/navbar.data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function FloatingNavbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar when scrolling down, hide when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px threshold
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Add throttle to improve performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-sm 
                 border-t border-gray-600/50 block sm:hidden flex items-center justify-around
                 transition-transform duration-300 ease-in-out ${
                   isVisible ? "translate-y-0" : "translate-y-full"
                 }`}
      style={{
        height: 'calc(58px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
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
            className={`relative flex flex-col items-center text-xs font-medium transition-all duration-200
                        hover:text-white/90 flex-1 mx-1 p-2 rounded-lg hover:bg-white/5 ${
                          isActive ? "text-[#228EE5]" : "text-white/95"
                        }`}
          >
            <Icon size={20} />
            <span className="mt-1">{item.name}</span>
          
          </Link>
        );
      })}
    </nav>
  );
}