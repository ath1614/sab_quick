"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-2xl font-black text-brand-black">Something went wrong</p>
      <p className="text-sm text-gray-500">An unexpected error occurred. Please try again.</p>
      <button onClick={reset}
        className="bg-brand-green text-white font-bold px-8 py-3.5 rounded-2xl shadow-green">
        Try again
      </button>
    </div>
  );
}
