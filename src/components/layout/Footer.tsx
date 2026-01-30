import { Logo } from '@/components/ui/logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-4">
      <div className="container flex flex-col items-center justify-center gap-2">
        <Logo size="sm" />
        <p className="text-sm text-muted-foreground">
          © {currentYear} AcertaMais. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
