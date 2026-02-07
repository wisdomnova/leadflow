import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFBFB] p-8 text-center font-jakarta">
      <div className="w-24 h-24 bg-[#745DF3]/5 rounded-[32px] flex items-center justify-center mb-8 border border-[#745DF3]/10 shadow-[0_0_40px_-10px_rgba(116,93,243,0.2)] animate-in zoom-in duration-500">
        <FileQuestion className="w-10 h-10 text-[#745DF3]" />
      </div>
      
      <h1 className="text-8xl font-black text-[#101828]/5 select-none absolute top-1/2 -translate-y-1/2 -z-10 blur-sm pointer-events-none tracking-tighter">
        404
      </h1>

      <h2 className="text-3xl font-black text-[#101828] mb-3 tracking-tight relative z-10">
        Page not found
      </h2>
      
      <p className="text-gray-500 font-medium max-w-md mb-10 leading-relaxed relative z-10">
        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
      </p>

      <div className="flex items-center gap-4 relative z-10">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-[#101828] text-white rounded-2xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200 group"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <Link 
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
