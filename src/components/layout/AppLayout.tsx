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
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card flex items-center gap-4 px-4 shrink-0">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg truncate">{title}</h1>
          </header>
          <div className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">{children}</div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
}
