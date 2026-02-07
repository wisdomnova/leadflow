'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center font-jakarta">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 border border-red-100 shadow-sm animate-in zoom-in duration-300">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      
      <h2 className="text-3xl font-black text-[#101828] mb-3 tracking-tight">
        Something went wrong
      </h2>
      
      <p className="text-gray-500 font-medium max-w-md mb-8 leading-relaxed">
        We encountered an unexpected error while loading this page. Our team has been notified.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </button>
        
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
      
      {error.digest && (
        <p className="mt-8 text-xs font-mono text-gray-300">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
