import { Bell, Plane, Search } from 'lucide-react';
import Link from 'next/link';

type HeaderProps = {
  locale: string;
};

// Mobile native header - logo left, actions right
export function Header({ locale }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Logo - Left */}
        <Link href={`/${locale}`} className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold">AeroTravel</span>
        </Link>

        {/* Actions - Right */}
        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/packages`}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </Link>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {/* Notification dot */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
