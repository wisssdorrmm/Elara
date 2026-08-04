import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
  right?: ReactNode;
}

export function Navbar({ title, showBack = false, right }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-5 py-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
          >
            <ChevronLeft className="h-5 w-5 text-text" />
          </button>
        )}
        {title && <h1 className="text-lg font-semibold text-text">{title}</h1>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
