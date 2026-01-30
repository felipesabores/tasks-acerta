import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const LOGO_BLUE_URL = "https://iteasvfrtzlzxifvnpkk.supabase.co/storage/v1/object/public/logos//acerta mais azul.png";
const LOGO_WHITE_URL = "https://iteasvfrtzlzxifvnpkk.supabase.co/storage/v1/object/public/logos//acerta mais branco.png";

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Force a specific variant regardless of theme */
  forceVariant?: 'light' | 'dark';
}

const sizeStyles = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-12',
};

export function Logo({ className, size = 'md', forceVariant }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use
  const getLogoUrl = () => {
    if (forceVariant === 'dark') return LOGO_WHITE_URL;
    if (forceVariant === 'light') return LOGO_BLUE_URL;
    
    // When not mounted, default to light to avoid flash
    if (!mounted) return LOGO_BLUE_URL;
    
    return resolvedTheme === 'dark' ? LOGO_WHITE_URL : LOGO_BLUE_URL;
  };

  return (
    <img
      src={getLogoUrl()}
      alt="AcertaMais Logo"
      className={cn('w-auto transition-opacity duration-300', sizeStyles[size], className)}
    />
  );
}
