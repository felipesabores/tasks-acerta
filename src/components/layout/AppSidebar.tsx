import { LayoutDashboard, ListTodo, LogOut, Users, ClipboardList } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const LOGO_URL = "https://iteasvfrtzlzxifvnpkk.supabase.co/storage/v1/object/public/logos//acerta mais branco.png";
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { role, isAdmin, canCreateTasks } = useUserRole();
  const isCollapsed = state === 'collapsed';

  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.name || userEmail;
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'task_editor':
        return 'Editor';
      default:
        return 'Usuário';
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-center w-full">
          <img 
            src={LOGO_URL} 
            alt="AcertaMais Logo" 
            className="h-8 w-auto"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* My Tasks - visible to all users */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Todas as tarefas diárias">
                  <NavLink
                    to="/my-tasks"
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                  >
                    <ClipboardList className="h-4 w-4" />
                    {!isCollapsed && <span>Todas as tarefas diárias</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Dashboard - visible to admins and task editors */}
              {canCreateTasks && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <NavLink
                      to="/"
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {!isCollapsed && <span>Dashboard</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* All Tasks - visible to admins and task editors */}
              {canCreateTasks && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Todas as Tarefas">
                    <NavLink
                      to="/tasks"
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <ListTodo className="h-4 w-4" />
                      {!isCollapsed && <span>Todas as Tarefas</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Users Management - visible to admins only */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Usuários">
                    <NavLink
                      to="/users"
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <Users className="h-4 w-4" />
                      {!isCollapsed && <span>Usuários</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName}
                </p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {getRoleLabel()}
                </Badge>
              </div>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
