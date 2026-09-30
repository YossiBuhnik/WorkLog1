'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SubNavTab {
  href: string;
  label: string;
  badge?: number;
}

/** Section tabs under the header (manager / office areas). Scrolls sideways on narrow phones. */
export default function SubNav({ title, tabs }: { title: string; tabs: SubNavTab[] }) {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <nav className="-mx-4 px-4 mt-3 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative shrink-0 flex items-center gap-1.5 px-3.5 pb-3 pt-1 text-sm font-medium transition-colors ${
                  active ? 'text-brand-navy' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {!!tab.badge && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand-blue" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
