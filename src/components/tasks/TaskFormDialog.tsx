import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, TaskFormData } from '@/hooks/useTasks';
import { Plus, X, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Máximo 100 caracteres'),
  description: z.string().min(1, 'Descrição é obrigatória').max(500, 'Máximo 500 caracteres'),
  assignedToId: z.string().min(1, 'Responsável é obrigatório'),
  criticality: z.enum(['low', 'medium', 'high', 'critical'] as const),
  isMandatory: z.boolean(),
});

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => void;
  task?: Task | null;
  users: Array<{ id: string; name: string }>;
}

interface UserSector {
  sector_id: string;
  sector_name: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  task,
  users,
}: TaskFormDialogProps) {
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [userSector, setUserSector] = useState<UserSector | null>(null);
  const [loadingSector, setLoadingSector] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedToId: '',
      criticality: 'medium',
      isMandatory: false,
    },
  });

  const selectedUserId = form.watch('assignedToId');

  // Fetch user's sector when user is selected
  useEffect(() => {
    const fetchUserSector = async () => {
      if (!selectedUserId) {
        setUserSector(null);
        return;
      }

      setLoadingSector(true);
      const { data, error } = await supabase
        .from('profile_sectors')
        .select(`
          sector_id,
          sector:sectors!profile_sectors_sector_id_fkey(name)
        `)
        .eq('profile_id', selectedUserId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setUserSector({
          sector_id: data.sector_id,
          sector_name: (data.sector as { name: string })?.name || 'Sem nome',
        });
      } else {
        setUserSector(null);
      }
      setLoadingSector(false);
    };

    fetchUserSector();
  }, [selectedUserId]);

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        assignedToId: task.assigned_to || '',
        criticality: task.criticality || 'medium',
        isMandatory: task.is_mandatory || false,
      });
      loadChecklistItems(task.id);
    } else {
      form.reset({
        title: '',
        description: '',
        assignedToId: '',
        criticality: 'medium',
        isMandatory: false,
      });
      setChecklistItems([]);
      setUserSector(null);
    }
  }, [task, form, open]);

  const loadChecklistItems = async (taskId: string) => {
    const { data } = await supabase
      .from('task_checklist_items')
      .select('title')
      .eq('task_id', taskId)
      .order('position');
    
    if (data) {
      setChecklistItems(data.map(item => item.title));
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Fetch points based on criticality
    const { data: criticalityData } = await supabase
      .from('criticality_points')
      .select('default_points')
      .eq('criticality', values.criticality)
      .maybeSingle();

    const points = criticalityData?.default_points || 0;

    onSubmit({
      title: values.title,
      description: values.description,
      status: 'pending', // Always starts as pending
      assignedToId: values.assignedToId,
      sectorId: userSector?.sector_id,
      criticality: values.criticality,
      isMandatory: values.isMandatory,
      points: points,
      checklistItems: checklistItems,
      isTemplate: !task, // New tasks are templates
    });
    onOpenChange(false);
    form.reset();
    setChecklistItems([]);
    setUserSector(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a tarefa (obrigatório)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-filled Sector Display */}
            {selectedUserId && (
              <div className="space-y-2">
                <FormLabel className="text-sm text-muted-foreground">Setor (automático)</FormLabel>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {loadingSector ? (
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  ) : userSector ? (
                    <Badge variant="secondary">{userSector.sector_name}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Usuário não está vinculado a nenhum setor
                    </span>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="criticality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Criticidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a criticidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    A pontuação será calculada automaticamente baseada na criticidade
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isMandatory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Tarefa obrigatória
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Checklist Section */}
            <div className="space-y-3">
              <FormLabel>Checklist (opcional)</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar item ao checklist"
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {checklistItems.length > 0 && (
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <span className="flex-1 text-sm">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeChecklistItem(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!userSector && !!selectedUserId}>
                {task ? 'Salvar' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
