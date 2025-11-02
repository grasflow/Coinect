import { Home, Clock, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Czas",
    href: "/time-entries",
    icon: Clock,
  },
  {
    label: "Klienci",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Faktury",
    href: "/invoices",
    icon: FileText,
  },
];

export function BottomNavigation() {
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    // Set initial path
    setCurrentPath(window.location.pathname);

    // Listen for navigation changes (for client-side navigation)
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);

    // Also observe for changes in the URL (for Astro view transitions)
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      observer.disconnect();
    };
  }, [currentPath]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bottom nav */}
      <div className="h-16 max-[899px]:block hidden" aria-hidden="true" />

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 max-[899px]:block hidden safe-area-bottom"
        aria-label="Główna nawigacja"
      >
        <div className="grid grid-cols-4 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all duration-200 relative group",
                  "hover:bg-gray-50 active:bg-gray-100",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                  active ? "text-blue-600" : "text-gray-600"
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Active indicator */}
                <div
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-200",
                    active ? "w-12 bg-blue-600" : "w-0 bg-transparent"
                  )}
                  aria-hidden="true"
                />

                {/* Icon with subtle animation */}
                <Icon
                  className={cn("w-6 h-6 transition-transform duration-200", active && "scale-110")}
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden="true"
                />

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    active ? "opacity-100" : "opacity-70"
                  )}
                >
                  {item.label}
                </span>

                {/* Ripple effect on touch */}
                <span
                  className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-10 group-active:bg-blue-600 transition-opacity duration-150"
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
