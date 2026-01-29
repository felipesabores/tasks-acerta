import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  id: string;
  profile_id: string;
  total_points: number;
  tasks_completed: number;
  tasks_not_completed: number;
  tasks_no_demand: number;
  profile: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  rank: number;
}

export function useLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_points')
      .select(`
        *,
        profile:profiles!user_points_profile_id_fkey(id, name, avatar_url)
      `)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }

    const rankedData = (data || []).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })) as LeaderboardEntry[];

    setLeaderboard(rankedData);

    // Find current user's rank
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        const userEntry = rankedData.find(e => e.profile_id === profileData.id);
        setCurrentUserRank(userEntry || null);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const getMedalColor = (rank: number): string | null => {
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'bronze';
      default:
        return null;
    }
  };

  return {
    leaderboard,
    loading,
    currentUserRank,
    getMedalColor,
    refetch: fetchLeaderboard,
  };
}
