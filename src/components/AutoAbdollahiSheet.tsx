import React, { forwardRef } from 'react';
import { CarItem } from '../data/cars';
import { BrandBadge } from './BrandLogos';
import { CarRender } from './CarRenders';
import { Phone, MapPin, Instagram, Globe, Calendar, Car, ShieldCheck } from 'lucide-react';

interface SheetProps {
  cars: CarItem[];
  showLayoutGuide?: boolean;
  carImageWidth?: number; // 70 to 90px
  carImageHeight?: number; // 50 to 70px
  imageOffset?: number;
  highlightRow?: number | null;
  onSelectRow?: (row: number) => void;
  brandLogosPosition?: 'far_right';
}

export const AutoAbdollahiSheet = forwardRef<HTMLDivElement, SheetProps>(
  (
    {
      cars,
      showLayoutGuide = false,
      carImageWidth = 82,
      carImageHeight = 56,
      imageOffset = 0,
      highlightRow = null,
      onSelectRow,
    },
    ref
  ) => {
    // Bottom brand bar logos
    const bottomBrands = [
      'KMC',
      'XTRIM',
      'CHERY',
      'MVM',
      'SUZUKI',
      'HAVAL',
      'VOYA',
      'LUCANO',
    ];

    return (
      <div
        ref={ref}
        id="auto-abdollahi-page3-table"
        className="w-full max-w-[1100px] mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-300 overflow-hidden font-['Yekan',sans-serif] select-none print:shadow-none print:border-none print:rounded-none"
        style={{ fontFamily: "'Yekan', sans-serif" }}
        dir="rtl"
      >
        {/* HEADER SECTION */}
        <header className="relative bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-950 text-white p-5 border-b-4 border-amber-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Right: Dealership Logo & Name */}
            <div className="flex items-center gap-3 text-right">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border border-amber-300 text-neutral-950 font-black text-2xl font-mono">
                A
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-400 flex items-center gap-2">
                  <span>اتـو عـبـدالـلـهـی</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                    نمایشگاه خودرو
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 font-medium">
                  مرکز تخصصی کارشناسی، خرید و فروش خودروهای وارداتی و مونتاژ
                </p>
              </div>
            </div>

            {/* Center: Inventory Tag */}
            <div className="text-center px-4 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700">
              <span className="text-xs text-amber-400 font-bold block">لیست موجودی روز و قیمت</span>
              <span className="text-sm font-black text-white">خودروهای آماده تحویل فوری</span>
            </div>

            {/* Left: Page Info & Date (English numerals with font-en-num class) */}
            <div className="text-left md:text-left flex flex-col items-center md:items-end gap-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Calendar className="w-3.5 h-3.5" />
                <span>تاریخ: <strong className="font-en-num font-bold">1405/06/29</strong></span>
              </div>
              <div className="text-xs font-extrabold text-zinc-300">
                صفحه <span className="font-en-num text-amber-400 text-sm font-bold">3</span> از <span className="font-en-num font-bold">3</span>
              </div>
            </div>
          </div>

          {/* Guide Banner when verification mode is active */}
          {showLayoutGuide && (
            <div className="mt-3 py-2 px-3 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs text-amber-200 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                راهنمای چیدمان صحیح راست‌به‌چپ:
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">مشخصات</span>
                <span>←</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">کارکرد</span>
                <span>←</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">رنگ</span>
                <span>←</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">مدل</span>
                <span>←</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 font-bold border border-blue-500/50">
                  عکس خودرو 🚗
                </span>
                <span>←</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">نام خودرو</span>
                <span>←</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 font-bold border border-amber-500/50">
                  لوگوی برند (راست)
                </span>
              </div>
            </div>
          )}
        </header>

        {/* MAIN TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-sm">
            {/* Table Header Row */}
            <thead>
              <tr className="bg-neutral-900 text-zinc-200 text-xs font-black uppercase tracking-wider border-b-2 border-neutral-700">
                {/* 1. Far Right Column: Brand + Car Name + Car Image Area */}
                <th className="py-3 px-3 w-[42%] text-right font-black border-l border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400">خودرو و برند</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      [لوگو] ← [نام خودرو] ← [تصویر خودرو]
                    </span>
                  </div>
                </th>

                {/* 2. Model Year Column */}
                <th className="py-3 px-3 text-center w-[12%] font-black border-l border-neutral-800">
                  مدل (سال)
                </th>

                {/* 3. Color Column */}
                <th className="py-3 px-3 text-center w-[14%] font-black border-l border-neutral-800">
                  رنگ
                </th>

                {/* 4. Mileage Column */}
                <th className="py-3 px-3 text-center w-[14%] font-black border-l border-neutral-800">
                  کارکرد (KM)
                </th>

                {/* 5. Specifications / Trim Column (Far Left) */}
                <th className="py-3 px-3 text-center w-[18%] font-black">
                  مشخصات و آپشن
                </th>
              </tr>
            </thead>

            {/* Table Body - 13 Rows */}
            <tbody className="divide-y divide-slate-200">
              {cars.map((car, idx) => {
                const isEven = idx % 2 === 0;
                const isHighlighted = highlightRow === car.row;

                // Color display styling
                const isBlack = car.color === 'black';
                const isWhite = car.color === 'white';
                const isGray = car.color === 'gray';
                const isTwoTone = car.color === 'black_white';

                return (
                  <tr
                    key={car.row}
                    onClick={() => onSelectRow && onSelectRow(car.row)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isHighlighted
                        ? 'bg-amber-100/80 ring-2 ring-amber-500 ring-inset'
                        : isEven
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/80 hover:bg-slate-100'
                    }`}
                  >
                    {/* COLUMN 1: RIGHT-TO-LEFT COMBINED IDENTITY AREA
                        Critical requirement:
                        Order from RIGHT to LEFT:
                        1. Brand Logo (far right - DO NOT TOUCH)
                        2. Car Name text (Persian - DO NOT TOUCH)
                        3. Car Image (place HERE, to the left of car name)
                        Do NOT place cars over brand logos on far right!
                    */}
                    <td className="py-2 px-3 border-l border-slate-200 relative overflow-visible">
                      <div className="flex items-center justify-between gap-2 h-14">
                        {/* RIGHT SUB-BLOCK: Brand Logo + Persian Car Name */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* 1. Brand Logo (Far Right) */}
                          <div
                            className="flex-shrink-0"
                            title={`لوگوی ${car.logo}`}
                          >
                            <BrandBadge brand={car.logo} size={36} />
                          </div>

                          {/* 2. Persian Car Name (DO NOT TOUCH - perfectly legible) */}
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="font-black text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
                              {car.car_name_fa}
                            </span>
                            <span className="text-[11px] text-slate-600 font-sans tracking-wide truncate">
                              {car.car_model}
                            </span>
                          </div>
                        </div>

                        {/* 3. Car Image (Placed HERE: to the LEFT of Persian Car Name,
                            in the space between car name and مدل column) */}
                        <div
                          className="relative flex items-center justify-center flex-shrink-0"
                          style={{
                            transform: `translateX(${imageOffset}px)`,
                          }}
                        >
                          <CarRender
                            car={car}
                            width={carImageWidth}
                            height={carImageHeight}
                          />

                          {/* Verification Indicator Tag when guide is enabled */}
                          {showLayoutGuide && (
                            <span className="absolute -top-1.5 -left-1 px-1 py-0.2 rounded bg-emerald-600 text-[9px] text-white font-mono shadow">
                              موقعیت صحیح ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* COLUMN 2: مدل (Model Year) - NUMERIC CELL */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200">
                      <span className="font-en-num px-2.5 py-1 rounded bg-slate-100 border border-slate-200/80 font-bold text-xs sm:text-sm text-slate-800">
                        {car.year}
                      </span>
                    </td>

                    {/* COLUMN 3: رنگ (Color) */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-300 bg-white shadow-xs">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border border-slate-400/60 shadow-xs flex-shrink-0 ${
                            isBlack
                              ? 'bg-neutral-900'
                              : isWhite
                              ? 'bg-white'
                              : isGray
                              ? 'bg-slate-500'
                              : 'bg-gradient-to-r from-neutral-900 50% to-white 50%'
                          }`}
                        />
                        <span className="text-slate-800 text-xs">{car.color_fa}</span>
                      </div>
                    </td>

                    {/* COLUMN 4: کارکرد (Mileage) - NUMERIC CELL */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200">
                      {car.km === 0 ? (
                        <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                          صفر کیلومتر
                        </span>
                      ) : (
                        <span className="text-slate-900 text-xs sm:text-sm">
                          <span className="font-en-num font-bold">{car.km.toLocaleString('en-US')}</span>{' '}
                          <span className="text-[10px] text-slate-500 font-sans">کیلومتر</span>
                        </span>
                      )}
                    </td>

                    {/* COLUMN 5: مشخصات (Specifications / Trim - Far Left) */}
                    <td className="py-2.5 px-3 text-center font-medium text-xs text-slate-700">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-100/90 text-slate-800 font-semibold border border-slate-200">
                        {car.trim_fa}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION: Minimal Bottom with Dealership Contacts & Brand Logos */}
        <footer className="bg-gradient-to-b from-[#111216] to-[#0c0d10] text-zinc-300 border-t border-slate-200/90 p-4">
          {/* Minimal Contact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Phone className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="text-zinc-400 block text-[10px]">دفتر مرکزی:</span>
                <span className="font-en-num font-bold text-white text-xs sm:text-sm tracking-wide">021-22400000</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Phone className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="text-zinc-400 block text-[10px]">مدیریت فروش:</span>
                <span className="font-en-num font-bold text-white text-xs sm:text-sm tracking-wide">0912-0000000</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <Instagram className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="text-zinc-400 block text-[10px]">اینستاگرام:</span>
                <span className="font-bold text-white text-xs tracking-wide">@auto_abdollahi</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="text-zinc-400 block text-[10px]">موقعیت:</span>
                <span className="text-zinc-200 text-[11px] truncate">تهران، نیاوران، نبش خیابان یاس</span>
              </div>
            </div>
          </div>

          {/* Minimal Bottom Brand Logos Bar */}
          <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="text-[11px] text-zinc-400 font-medium">
              برندهای معتبر حاضر در نمایشگاه اتو عبداللهی:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {bottomBrands.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
                >
                  <BrandBadge brand={b} size={15} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    );
  }
);

AutoAbdollahiSheet.displayName = 'AutoAbdollahiSheet';
