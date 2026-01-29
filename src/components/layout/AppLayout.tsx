import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 w-full">
          <header className="h-14 border-b bg-card flex items-center gap-4 px-4 shrink-0">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg truncate">{title}</h1>
          </header>
          <div className="flex-1 p-4 md:p-6 overflow-auto w-full max-w-full">{children}</div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
}
