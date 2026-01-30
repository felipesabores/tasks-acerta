import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileSector {
  id: string;
  profile_id: string;
  sector_id: string;
  created_at: string;
  sector?: Sector;
}

export function useSectors() {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [userSectors, setUserSectors] = useState<ProfileSector[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSectors = useCallback(async () => {
    const { data, error } = await supabase
      .from('sectors')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching sectors:', error);
    } else {
      setSectors(data || []);
    }
  }, []);

  const fetchUserSectors = useCallback(async () => {
    if (!user) {
      setUserSectors([]);
      return;
    }

    // First get user's profile id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      setUserSectors([]);
      return;
    }

    const { data, error } = await supabase
      .from('profile_sectors')
      .select(`
        *,
        sector:sectors(*)
      `)
      .eq('profile_id', profile.id);

    if (error) {
      console.error('Error fetching user sectors:', error);
    } else {
      setUserSectors(data || []);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSectors(), fetchUserSectors()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSectors, fetchUserSectors]);

  const addSector = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('sectors')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      console.error('Error adding sector:', error);
      throw error;
    }

    await fetchSectors();
    return data;
  };

  const updateSector = async (id: string, updates: Partial<Pick<Sector, 'name' | 'description'>>) => {
    const { error } = await supabase
      .from('sectors')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating sector:', error);
      throw error;
    }

    await fetchSectors();
  };

  const deleteSector = async (id: string) => {
    const { error } = await supabase
      .from('sectors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sector:', error);
      throw error;
    }

    await fetchSectors();
  };

  const assignUserToSector = async (profileId: string, sectorId: string) => {
    const { error } = await supabase
      .from('profile_sectors')
      .insert({ profile_id: profileId, sector_id: sectorId });

    if (error) {
      console.error('Error assigning user to sector:', error);
      throw error;
    }

    await fetchUserSectors();
  };

  const removeUserFromSector = async (profileId: string, sectorId: string) => {
    const { error } = await supabase
      .from('profile_sectors')
      .delete()
      .eq('profile_id', profileId)
      .eq('sector_id', sectorId);

    if (error) {
      console.error('Error removing user from sector:', error);
      throw error;
    }

    await fetchUserSectors();
  };

  // Get the sector IDs the current user belongs to
  const userSectorIds = userSectors.map(ps => ps.sector_id);

  return {
    sectors,
    userSectors,
    userSectorIds,
    loading,
    addSector,
    updateSector,
    deleteSector,
    assignUserToSector,
    removeUserFromSector,
    refetch: () => Promise.all([fetchSectors(), fetchUserSectors()]),
  };
}
