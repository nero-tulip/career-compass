"use client";

import { useAuth } from "@/app/providers/AuthProvider";

export default function UserMenuClient() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading…</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          // Tiny avatar
          <img
            src={user.photoURL}
            alt="avatar"
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <span className="text-sm text-gray-700">
          {user.displayName || user.email}
        </span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-100"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a href="/login" className="hover:underline">
        Log in
      </a>
      <a
        href="/signup"
        className="bg-black text-white px-3 py-1.5 rounded-lg"
      >
        Sign up
      </a>
    </div>
  );
}