import { cn } from '@/lib/utils';

interface ServerIconProps {
  name: string;
  icon?: string | null;
  isActive?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

/**
 * Server icon in the left sidebar. Shows image if available, otherwise
 * renders an abbreviation from the server name.
 */
export function ServerIcon({
  name,
  icon,
  isActive = false,
  size = 'md',
  onClick,
}: ServerIconProps) {
  const abbreviation = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const sizeClasses = size === 'md' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <div className="group relative flex items-center justify-center">
      {/* Active indicator pill */}
      <div
        className={cn(
          'absolute left-0 w-1 rounded-r-full bg-discord-text-primary transition-all',
          isActive ? 'h-10' : 'h-0 group-hover:h-5',
        )}
      />

      <button
        onClick={onClick}
        className={cn(
          sizeClasses,
          'flex items-center justify-center overflow-hidden transition-all duration-200',
          isActive
            ? 'rounded-xl bg-discord-blurple'
            : 'rounded-2xl bg-discord-bg-primary hover:rounded-xl hover:bg-discord-blurple',
        )}
        title={name}
      >
        {icon ? (
          <img
            src={icon}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={cn(
              'font-medium text-discord-text-primary',
              size === 'md' ? 'text-sm' : 'text-xs',
            )}
          >
            {abbreviation}
          </span>
        )}
      </button>

      {/* Tooltip */}
      <div className="pointer-events-none absolute left-full z-50 ml-4 hidden whitespace-nowrap rounded-md bg-discord-bg-floating px-3 py-2 text-sm font-medium text-discord-text-primary shadow-lg group-hover:block">
        {name}
      </div>
    </div>
  );
}
