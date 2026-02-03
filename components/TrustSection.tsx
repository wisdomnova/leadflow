'use client';

import React from 'react';
import Image from 'next/image';

const TrustSection = () => {
  const brands = [
    '/brands/brand-01.png',
    '/brands/brand-02.png',
    '/brands/brand-03.png',
    '/brands/brand-04.png',
    '/brands/brand-05.png',
    '/brands/brand-06.png',
    '/brands/brand-07.png',
    '/brands/brand-08.png',
    '/brands/brand-09.png',
    '/brands/brand-10.png',
  ];

  const agencies = [
    '/agencies/agency-01.png',
    '/agencies/agency-02.png',
    '/agencies/agency-03.png',
    '/agencies/agency-04.png',
    '/agencies/agency-05.png',
    '/agencies/agency-06.png',
    '/agencies/agency-07.png',
    '/agencies/agency-08.png',
    '/agencies/agency-09.png',
    '/agencies/agency-10.png',
  ];

  return (
    <section className="py-24 md:py-32 bg-[#FBFBFB]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-xl md:text-2xl font-bold text-[#101828]/40 tracking-tight">
            Teams around <span className="text-[#101828]">the world trust LeadFlow</span>
          </h2>
        </div>

        <div className="relative bg-white border border-gray-100 rounded-[2.5rem] p-10 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          {/* Section Labels */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
            <span className="bg-white text-[#101828]/40 px-6 py-2 rounded-full text-sm font-bold border border-gray-100 shadow-sm">
              Brands
            </span>
            <div className="w-px h-8 bg-gray-100 self-center" />
            <span className="bg-white text-[#101828]/40 px-6 py-2 rounded-full text-sm font-bold border border-gray-100 shadow-sm">
              Agencies
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Brands Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-y-12 gap-x-8 items-center justify-items-center">
              {brands.map((logo, index) => (
                <div key={index} className="flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100 duration-500">
                  <Image
                    src={logo}
                    alt={`Brand ${index + 1}`}
                    width={100}
                    height={32}
                    className="h-7 md:h-8 w-auto object-contain"
                  />
                </div>
              ))}
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-40 bg-gray-100" />
            <div className="md:hidden w-full h-px bg-gray-100" />

            {/* Agencies Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-y-12 gap-x-8 items-center justify-items-center">
              {agencies.map((logo, index) => (
                <div key={index} className="flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100 duration-500">
                  <Image
                    src={logo}
                    alt={`Agency ${index + 1}`}
                    width={100}
                    height={32}
                    className="h-7 md:h-8 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
