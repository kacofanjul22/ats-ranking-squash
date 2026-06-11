import { initials } from '../lib/data';
import type { Category } from '../types';

interface PlayerAvatarProps {
  nombre: string;
  photoUrl?: string;
  categoria?: Category;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm:  { outer: 'w-8 h-8',   font: 'text-xs'  },
  md:  { outer: 'w-11 h-11', font: 'text-sm'  },
  lg:  { outer: 'w-14 h-14', font: 'text-base' },
  xl:  { outer: 'w-20 h-20', font: 'text-xl'  },
};

const ringMap: Record<string, string> = {
  A: 'border-[#E8521A]',
  B: 'border-[#f5a623]',
  C: 'border-[#4fc3f7]',
  D: 'border-[#81c784]',
  '': 'border-surface-4',
};

export function PlayerAvatar({ nombre, photoUrl, categoria = '', size = 'md', className = '' }: PlayerAvatarProps) {
  const { outer, font } = sizeMap[size];
  const ring = ringMap[categoria] || ringMap[''];
  const ini = initials(nombre);

  return (
    <div
      className={`${outer} rounded-full border-2 ${ring} bg-surface-2 flex-shrink-0 overflow-hidden flex items-center justify-center ${font} font-bold text-text-subtle uppercase ${className}`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={nombre}
          className="w-full h-full object-cover"
          onError={e => {
            const t = e.currentTarget;
            t.style.display = 'none';
            if (t.parentElement) t.parentElement.textContent = ini;
          }}
        />
      ) : (
        ini
      )}
    </div>
  );
}
