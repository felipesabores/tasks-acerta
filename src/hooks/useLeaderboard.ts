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
  isPending: boolean;
}

export function useLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    // First get all user points
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

    // Check pending status for each user
    const entriesWithPendingStatus = await Promise.all(
      (data || []).map(async (entry) => {
        const { data: hasPending } = await supabase
          .rpc('has_pending_tasks', { p_profile_id: entry.profile_id });

        return {
          ...entry,
          isPending: hasPending || false,
        };
      })
    );

    // Filter out pending users from ranking and assign ranks
    const activeUsers = entriesWithPendingStatus.filter(e => !e.isPending);
    const pendingUsers = entriesWithPendingStatus.filter(e => e.isPending);

    // Assign ranks only to active users
    const rankedActive = activeUsers.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Pending users get rank 0 (unranked)
    const rankedPending = pendingUsers.map(entry => ({
      ...entry,
      rank: 0,
    }));

    // Combine: active users first (ranked), then pending users (unranked)
    const rankedData = [...rankedActive, ...rankedPending] as LeaderboardEntry[];

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
    if (rank === 0) return null; // Pending users don't get medals
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
