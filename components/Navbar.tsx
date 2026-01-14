'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDark(!dark);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
      <Link
        href="/"
        className="font-bold text-lg text-black dark:text-white"
      >
        Trade Journal
      </Link>

      <div className="flex items-center space-x-6">
        <Link
          href="/dashboard"
          className="text-gray-700 dark:text-gray-300"
        >
          Dashboard
        </Link>

        <button
          onClick={toggleTheme}
          className="text-xl"
          title="Toggle theme"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
