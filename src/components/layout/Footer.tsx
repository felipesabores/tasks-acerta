const LOGO_URL = "https://iteasvfrtzlzxifvnpkk.supabase.co/storage/v1/object/public/logos//acerta mais azul.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-4">
      <div className="container flex flex-col items-center justify-center gap-2">
        <img 
          src={LOGO_URL} 
          alt="AcertaMais Logo" 
          className="h-6 w-auto"
        />
        <p className="text-sm text-muted-foreground">
          © {currentYear} AcertaMais. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
