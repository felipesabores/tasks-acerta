import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { CriticalityBadge } from '@/components/tasks/CriticalityBadge';

type Criticality = 'low' | 'medium' | 'high' | 'critical';

interface CriticalityPoint {
  id: string;
  criticality: string;
  default_points: number;
}

export function CriticalityPointsTable() {
  const { toast } = useToast();
  const [points, setPoints] = useState<CriticalityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    const { data, error } = await supabase
      .from('criticality_points')
      .select('*')
      .order('default_points');

    if (error) {
      console.error('Error fetching criticality points:', error);
    } else {
      setPoints(data || []);
      const values: Record<string, number> = {};
      data?.forEach(p => {
        values[p.id] = p.default_points;
      });
      setEditedValues(values);
    }
    setLoading(false);
  };

  const handleSave = async (point: CriticalityPoint) => {
    const newValue = editedValues[point.id];
    if (newValue === point.default_points) return;

    setSaving(point.id);

    const { error } = await supabase
      .from('criticality_points')
      .update({ default_points: newValue })
      .eq('id', point.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Pontuação atualizada',
        description: `Criticidade ${getCriticalityLabel(point.criticality)} agora vale ${newValue} pontos.`,
      });
      fetchPoints();
    }

    setSaving(null);
  };

  const getCriticalityLabel = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return criticality;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criticidade</TableHead>
          <TableHead>Pontos Padrão</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {points.map(point => (
          <TableRow key={point.id}>
            <TableCell>
              <CriticalityBadge criticality={point.criticality as Criticality} />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min={0}
                value={editedValues[point.id] ?? point.default_points}
                onChange={(e) => setEditedValues(prev => ({
                  ...prev,
                  [point.id]: parseInt(e.target.value) || 0,
                }))}
                className="w-24"
              />
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSave(point)}
                disabled={saving === point.id || editedValues[point.id] === point.default_points}
              >
                {saving === point.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
