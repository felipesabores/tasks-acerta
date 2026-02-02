import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyPosition {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface CompanySector {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithDetails extends Company {
  sectors: CompanySector[];
  positions: CompanyPosition[];
}

export function useCompanies() {
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        setLoading(false);
        return;
      }

      // Fetch sectors and positions for each company
      const companiesWithDetails: CompanyWithDetails[] = [];
      
      for (const company of companiesData || []) {
        const [sectorsResult, positionsResult] = await Promise.all([
          supabase
            .from('sectors')
            .select('*')
            .eq('company_id', company.id)
            .order('name'),
          supabase
            .from('company_positions')
            .select('*')
            .eq('company_id', company.id)
            .order('name'),
        ]);

        companiesWithDetails.push({
          ...company,
          sectors: sectorsResult.data || [],
          positions: positionsResult.data || [],
        });
      }

      setCompanies(companiesWithDetails);
    } catch (error) {
      console.error('Error in fetchCompanies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async (
    name: string, 
    sectorNames: string[], 
    positionNames: string[]
  ) => {
    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name })
      .select()
      .single();

    if (companyError) throw companyError;
    if (!company) throw new Error('Failed to create company');

    // Create sectors
    if (sectorNames.length > 0) {
      const sectorsToInsert = sectorNames.map(sectorName => ({
        name: sectorName,
        company_id: company.id,
      }));
      
      const { error: sectorsError } = await supabase
        .from('sectors')
        .insert(sectorsToInsert);

      if (sectorsError) {
        console.error('Error creating sectors:', sectorsError);
      }
    }

    // Create positions
    if (positionNames.length > 0) {
      const positionsToInsert = positionNames.map(positionName => ({
        name: positionName,
        company_id: company.id,
      }));
      
      const { error: positionsError } = await supabase
        .from('company_positions')
        .insert(positionsToInsert);

      if (positionsError) {
        console.error('Error creating positions:', positionsError);
      }
    }

    await fetchCompanies();
    return company;
  };

  const updateCompany = async (
    id: string, 
    name: string, 
    sectorNames: string[], 
    positionNames: string[]
  ) => {
    // Update company name
    const { error: updateError } = await supabase
      .from('companies')
      .update({ name })
      .eq('id', id);

    if (updateError) throw updateError;

    // Delete existing sectors and positions for this company
    await Promise.all([
      supabase.from('sectors').delete().eq('company_id', id),
      supabase.from('company_positions').delete().eq('company_id', id),
    ]);

    // Re-create sectors
    if (sectorNames.length > 0) {
      const sectorsToInsert = sectorNames.map(sectorName => ({
        name: sectorName,
        company_id: id,
      }));
      
      await supabase.from('sectors').insert(sectorsToInsert);
    }

    // Re-create positions
    if (positionNames.length > 0) {
      const positionsToInsert = positionNames.map(positionName => ({
        name: positionName,
        company_id: id,
      }));
      
      await supabase.from('company_positions').insert(positionsToInsert);
    }

    await fetchCompanies();
  };

  const deleteCompany = async (id: string) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchCompanies();
  };

  const fetchSectorsByCompany = useCallback(async (companyId: string) => {
    console.log('Fetching sectors for company:', companyId);
    const { data, error } = await supabase
      .from('sectors')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      console.error('Error fetching sectors by company:', error);
      return [];
    }

    console.log('Sectors fetched:', data);
    return data || [];
  }, []);

  const fetchPositionsByCompany = useCallback(async (companyId: string) => {
    console.log('Fetching positions for company:', companyId);
    const { data, error } = await supabase
      .from('company_positions')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      console.error('Error fetching positions by company:', error);
      return [];
    }

    console.log('Positions fetched:', data);
    return data || [];
  }, []);

  const addSector = useCallback(async (companyId: string, name: string) => {
    const { data, error } = await supabase
      .from('sectors')
      .insert({ name, company_id: companyId })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error adding sector:', error);
      throw error;
    }

    return data;
  }, []);

  const addPosition = useCallback(async (companyId: string, name: string) => {
    const { data, error } = await supabase
      .from('company_positions')
      .insert({ name, company_id: companyId })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error adding position:', error);
      throw error;
    }

    return data;
  }, []);

  return {
    companies,
    loading,
    addCompany,
    updateCompany,
    deleteCompany,
    fetchSectorsByCompany,
    fetchPositionsByCompany,
    addSector,
    addPosition,
    refetch: fetchCompanies,
  };
}
