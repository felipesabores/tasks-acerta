import { useState } from 'react';
import { useTaskTemplates, TaskTemplate, TaskTemplateFormData } from '@/hooks/useTaskTemplates';
import { useSectors } from '@/hooks/useSectors';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, FileText, Search, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskTemplateManagement() {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useTaskTemplates();
  const { sectors } = useSectors();
  const { isAdmin, isGodMode, isTaskEditor } = useUserRole();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<TaskTemplate | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSectorId, setFormSectorId] = useState('');

  const canManageTemplates = isAdmin || isGodMode || isTaskEditor;
  const canDeleteTemplates = isAdmin || isGodMode;

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || template.sector_id === filterSector;
    return matchesSearch && matchesSector;
  });

  const handleOpenNew = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormDescription('');
    setFormSectorId('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormDescription(template.description);
    setFormSectorId(template.sector_id);
    setDialogOpen(true);
  };

  const handleOpenDelete = (template: TaskTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formDescription.trim() || !formSectorId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    const data: TaskTemplateFormData = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      sectorId: formSectorId,
    };

    let success: boolean;
    if (editingTemplate) {
      success = await updateTemplate(editingTemplate.id, data);
      if (success) {
        toast({
          title: 'Modelo atualizado',
          description: 'O modelo de tarefa foi atualizado com sucesso.',
        });
      }
    } else {
      success = await addTemplate(data);
      if (success) {
        toast({
          title: 'Modelo criado',
          description: 'O novo modelo de tarefa foi criado com sucesso.',
        });
      }
    }

    if (success) {
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    const success = await deleteTemplate(templateToDelete.id);
    if (success) {
      toast({
        title: 'Modelo excluído',
        description: 'O modelo de tarefa foi removido com sucesso.',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canManageTemplates && (
          <Button onClick={handleOpenNew} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Novo Modelo
          </Button>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum modelo encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchTerm || filterSector !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Crie seu primeiro modelo de tarefa para agilizar a criação de tarefas recorrentes.'}
            </p>
            {canManageTemplates && !searchTerm && filterSector === 'all' && (
              <Button onClick={handleOpenNew} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Modelo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{template.title}</CardTitle>
                  {canManageTemplates && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDeleteTemplates && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-3 mt-1">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 mt-auto">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">
                    {template.sector?.name || 'Sem setor'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Modelo' : 'Novo Modelo de Tarefa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Limpeza da sala de reunião"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formTitle.length}/100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva os detalhes da tarefa..."
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formDescription.length}/500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Setor *</Label>
              <Select value={formSectorId} onValueChange={setFormSectorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(sector => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingTemplate ? 'Salvar' : 'Criar Modelo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo "{templateToDelete?.title}" será
              permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
