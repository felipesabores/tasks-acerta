import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Calendar } from 'lucide-react';

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
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 border border-primary/20">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {getGreeting()}, {firstName}! 👋
      </h1>
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-mono">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
