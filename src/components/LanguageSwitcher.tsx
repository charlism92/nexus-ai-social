'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const LOCALES = [
  { code: 'en-us', label: 'English', flag: '🇺🇸' },
  { code: 'es-es', label: 'Español', flag: '🇪🇸' },
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Detect current locale from URL
  const currentLocale = LOCALES.find(l => pathname.startsWith(`/${l.code}`))?.code || 'en-us';

  const switchLocale = (newLocale: string) => {
    // Remove current locale prefix if present
    let cleanPath = pathname;
    for (const l of LOCALES) {
      if (cleanPath.startsWith(`/${l.code}`)) {
        cleanPath = cleanPath.slice(`/${l.code}`.length) || '/';
        break;
      }
    }
    router.push(`/${newLocale}${cleanPath}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-dark-800/50 transition-colors text-sm text-dark-300 hover:text-white"
      >
        <Globe className="w-4 h-4" />
        <span>{LOCALES.find(l => l.code === currentLocale)?.flag}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-1 min-w-[140px]">
            {LOCALES.map(locale => (
              <button
                key={locale.code}
                onClick={() => switchLocale(locale.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-700 transition-colors ${
                  currentLocale === locale.code ? 'text-nexus-400' : 'text-dark-300'
                }`}
              >
                <span>{locale.flag}</span>
                <span>{locale.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
