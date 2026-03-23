import { UtensilsCrossed } from 'lucide-react';

interface RestaurantLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function RestaurantLogo({ size = 'md', showText = true }: RestaurantLogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} bg-orange-500 rounded-full flex items-center justify-center shadow-lg`}
      >
        <UtensilsCrossed
          className={`${
            size === 'lg'
              ? 'w-12 h-12'
              : size === 'md'
              ? 'w-8 h-8'
              : 'w-5 h-5'
          } text-white`}
        />
      </div>
      {showText && (
        <div className="text-center">
          <h1 className={`font-display font-bold ${textSizeClasses[size]} text-foreground`}>
            La Bella
          </h1>
          <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
            Itale restuarent
          </p>
        </div>
      )}
    </div>
  );
}
