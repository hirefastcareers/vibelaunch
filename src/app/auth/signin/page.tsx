"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to VibeLaunch</h1>
        <p className="text-gray-600 mb-8">
          Connect your X account to start launching.
        </p>
        <button
          onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
          className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
        >
          Sign in with X
        </button>
      </div>
    </main>
  );
}
