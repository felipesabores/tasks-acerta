import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Calendar, Sparkles } from 'lucide-react';

export function UserGreeting() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const firstName = userName.split(' ')[0];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formattedDate = format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(currentTime, 'HH:mm:ss');

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 transition-all duration-300 hover:shadow-md">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg className="w-full h-full">
          <pattern id="greeting-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#greeting-grid)" />
        </svg>
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-6">
          {/* Avatar Size: Fixed 150px on desktop. Padding increased to p-3 for visible gap. */}
          <Avatar className="h-24 w-24 md:h-[150px] md:w-[150px] border-4 border-primary/20 shadow-md hidden sm:flex p-3 bg-background/50 backdrop-blur-sm">
            <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover rounded-full" />
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
              {firstName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {getGreeting()}, {firstName}! 👋
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mt-3">
              <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1.5">
                <Calendar className="h-4 w-4 text-primary/70" />
                <span className="capitalize text-sm">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1.5">
                <Clock className="h-4 w-4 text-primary/70" />
                <span className="font-mono text-sm">{formattedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
