import { UserMenu } from "./UserMenu";

interface MainNavbarProps {
  userName: string;
  userEmail: string;
}

export function MainNavbar({ userName, userEmail }: MainNavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40" aria-label="Górna nawigacja">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img src="/logo.svg" alt="Coinect" className="h-8 w-auto" />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden min-[900px]:flex items-center space-x-8">
            <a
              href="/dashboard"
              className="flex items-center h-10 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/time-entries"
              className="flex items-center h-10 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Wpisy czasu
            </a>
            <a
              href="/clients"
              className="flex items-center h-10 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Klienci
            </a>
            <a
              href="/invoices"
              className="flex items-center h-10 text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Faktury
            </a>
            <UserMenu userName={userName} userEmail={userEmail} />
          </div>

          {/* Mobile - Only User Menu */}
          <div className="max-[899px]:flex hidden items-center">
            <UserMenu userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </div>
    </nav>
  );
}
