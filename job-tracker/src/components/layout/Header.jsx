'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '@/lib/hooks/useAuth';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen || userMenuOpen) {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen, userMenuOpen]);

  // Close menus on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    setMobileMenuOpen(!mobileMenuOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                JobTracker
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`${
                  pathname === '/'
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              {isAuthenticated() && (
                <>
                  <Link
                    href="/dashboard"
                    className={`${
                      pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/jobs"
                    className={`${
                      pathname === '/dashboard/jobs' || pathname.startsWith('/dashboard/jobs/')
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Jobs
                  </Link>
                </>
              )}
              <Link
                href="/about"
                className={`${
                  pathname === '/about'
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                About
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {!loading && isAuthenticated() ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white dark:bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={toggleUserMenu}
                  >
                    <span className="sr-only">Open user menu</span>
                    <span className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </button>
                </div>
                {userMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex="-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      Signed in as
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {user?.name || 'User'}
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link href="/auth/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu" onClick={(e) => e.stopPropagation()}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`${
                pathname === '/'
                  ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Home
            </Link>
            {isAuthenticated() && (
              <>
                <Link
                  href="/dashboard"
                  className={`${
                    pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/jobs"
                  className={`${
                    pathname === '/dashboard/jobs' || pathname.startsWith('/dashboard/jobs/')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Jobs
                </Link>
              </>
            )}
            <Link
              href="/about"
              className={`${
                pathname === '/about'
                  ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              About
            </Link>
          </div>
          {!loading && isAuthenticated() ? (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <span className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 text-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-3 px-4">
                <Link href="/auth/login" className="btn-secondary w-full text-center">
                  Sign in
                </Link>
                <Link href="/auth/register" className="btn-primary w-full text-center">
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}