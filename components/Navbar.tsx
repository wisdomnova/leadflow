'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return pathname === '/' && typeof window !== 'undefined' && window.location.hash === path.substring(1);
    }
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navLinks = [
    { name: 'Product', href: '/product' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
      <div className="flex items-center justify-between w-full max-w-5xl px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full pointer-events-auto">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image 
              src="/leadflow-black.png" 
              alt="LeadFlow Logo" 
              width={110} 
              height={32} 
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link 
                key={link.name}
                href={link.href} 
                className={`transition-colors font-bold uppercase tracking-widest text-[11px] ${
                  active 
                    ? 'text-[#745DF3]' 
                    : 'text-[#101828]/50 hover:text-[#101828]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/signin" className="hidden sm:block text-[#101828]/70 hover:text-primary font-medium px-4 py-2 transition-colors text-sm">
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-5 py-2.5 bg-[#101828] text-white text-sm font-semibold rounded-full hover:bg-[#101828]/90 transition-all active:scale-95 shadow-lg shadow-[#101828]/10"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
