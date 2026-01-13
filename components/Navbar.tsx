'use client';

import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <nav className="w-full border-b px-6 py-3 flex justify-between items-center">
      <Link href="/" className="font-bold text-lg">
        Trade Journal
      </Link>

      <div className="space-x-4">
        <Link href="/">Home</Link>

        {user && <Link href="/dashboard">Dashboard</Link>}

        {!user ? (
          <Link href="/login">Login</Link>
        ) : (
          <button onClick={logout} className="text-red-600">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
