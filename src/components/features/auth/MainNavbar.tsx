import { useState } from "react";
import { UserMenu } from "./UserMenu";

interface MainNavbarProps {
  userName: string;
  userEmail: string;
}

export function MainNavbar({ userName, userEmail }: MainNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b" aria-label="Główna nawigacja">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-gray-900">
              Coinect
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/time-entries"
              className="text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Wpisy czasu
            </a>
            <a
              href="/clients"
              className="text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Klienci
            </a>
            <a
              href="/invoices"
              className="text-gray-600 hover:text-gray-900 rounded-md text-sm font-medium transition-colors"
            >
              Faktury
            </a>
            <UserMenu userName={userName} userEmail={userEmail} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-expanded={isMobileMenuOpen}
              aria-label="Otwórz menu główne"
            >
              <div className="relative w-6 h-6">
                <svg
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen
                      ? 'rotate-180 opacity-0 scale-75'
                      : 'rotate-0 opacity-100 scale-100'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen
                      ? 'rotate-0 opacity-100 scale-100'
                      : '-rotate-180 opacity-0 scale-75'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'max-h-96 opacity-100 border-t shadow-lg'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
            <a
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1"
              onClick={closeMobileMenu}
            >
              Dashboard
            </a>
            <a
              href="/time-entries"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1"
              onClick={closeMobileMenu}
            >
              Wpisy czasu
            </a>
            <a
              href="/clients"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1"
              onClick={closeMobileMenu}
            >
              Klienci
            </a>
            <a
              href="/invoices"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 transform hover:translate-x-1"
              onClick={closeMobileMenu}
            >
              Faktury
            </a>
            <div className="px-3 py-2 transition-all duration-200 transform hover:translate-x-1">
              <UserMenu userName={userName} userEmail={userEmail} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
