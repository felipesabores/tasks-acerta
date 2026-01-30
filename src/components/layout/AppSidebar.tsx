import { LayoutDashboard, ListTodo, LogOut, Users, ClipboardList, Trophy, Home, Zap } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const { role, isAdmin, isGodMode, canCreateTasks, canManageUsers } = useUserRole();
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
      case 'god_mode':
        return 'God Mode';
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
          {isCollapsed ? (
            <img 
              src="/favicon.ico" 
              alt="AcertaMais" 
              className="h-8 w-8"
            />
          ) : (
            <Logo size="md" forceVariant="dark" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home - visible to all users */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Início">
                  <NavLink
                    to="/"
                    end
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                  >
                    <Home className="h-4 w-4" />
                    {!isCollapsed && <span>Início</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* My Tasks - visible to users and task editors, NOT admin */}
              {!isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Minhas Tarefas">
                    <NavLink
                      to="/my-tasks"
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {!isCollapsed && <span>Minhas Tarefas</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Leaderboard - visible to all users */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ranking">
                  <NavLink
                    to="/leaderboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                  >
                    <Trophy className="h-4 w-4" />
                    {!isCollapsed && <span>Ranking</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* All Tasks - visible to admins and task editors */}
              {canCreateTasks && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Gerenciar Tarefas">
                    <NavLink
                      to="/tasks"
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <ListTodo className="h-4 w-4" />
                      {!isCollapsed && <span>Gerenciar Tarefas</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Users Management - visible to god_mode only */}
              {canManageUsers && (
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

              {/* God Mode - visible only to god_mode users */}
              {isGodMode && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="God Mode">
                    <NavLink
                      to="/god-mode"
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <Zap className="h-4 w-4" />
                      {!isCollapsed && <span>God Mode</span>}
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
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
