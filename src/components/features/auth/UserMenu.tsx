import * as React from "react";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserMenuProps {
  userName: string;
  userEmail: string;
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Zamknij menu po kliknięciu poza nim
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        alert("Wystąpił błąd podczas wylogowywania");
      }
    } catch {
      alert("Wystąpił błąd podczas wylogowywania");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="plain"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-2"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
        >
          <User className="h-5 w-5" />
          <span className="hidden sm:inline">{userName || userEmail}</span>
        </Button>

        {isMenuOpen && (
          <div
            className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-gray-500 truncate">{userEmail}</p>
            </div>

            <div className="py-1">
              <a
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Settings className="h-4 w-4 mr-3" />
                Ustawienia
              </a>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLogoutDialogOpen(true);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Wyloguj
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wylogowanie</DialogTitle>
            <DialogDescription>Czy na pewno chcesz się wylogować?</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="gray" onClick={() => setIsLogoutDialogOpen(false)} disabled={isLoggingOut}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
