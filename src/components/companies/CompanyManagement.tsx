import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useCompanies, CompanyWithDetails } from '@/hooks/useCompanies';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Building2, Plus, Pencil, Trash2, Loader2, X, Briefcase, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CompanyManagement() {
  const { companies, loading, addCompany, updateCompany, deleteCompany } = useCompanies();
  const { isGodMode } = useUserRole();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithDetails | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyWithDetails | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [newSector, setNewSector] = useState('');
  const [newPosition, setNewPosition] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setSectors([]);
    setPositions([]);
    setNewSector('');
    setNewPosition('');
    setEditingCompany(null);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (company: CompanyWithDetails) => {
    setEditingCompany(company);
    setCompanyName(company.name);
    setSectors(company.sectors.map(s => s.name));
    setPositions(company.positions.map(p => p.name));
    setDialogOpen(true);
  };

  const handleAddSector = () => {
    const trimmed = newSector.trim();
    if (trimmed && !sectors.includes(trimmed)) {
      setSectors([...sectors, trimmed]);
      setNewSector('');
    }
  };

  const handleRemoveSector = (sector: string) => {
    setSectors(sectors.filter(s => s !== sector));
  };

  const handleAddPosition = () => {
    const trimmed = newPosition.trim();
    if (trimmed && !positions.includes(trimmed)) {
      setPositions([...positions, trimmed]);
      setNewPosition('');
    }
  };

  const handleRemovePosition = (position: string) => {
    setPositions(positions.filter(p => p !== position));
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome da empresa.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, companyName.trim(), sectors, positions);
        toast({
          title: 'Empresa atualizada',
          description: 'A empresa foi atualizada com sucesso.',
        });
      } else {
        await addCompany(companyName.trim(), sectors, positions);
        toast({
          title: 'Empresa criada',
          description: 'A empresa foi criada com sucesso.',
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      await deleteCompany(companyToDelete.id);
      toast({
        title: 'Empresa excluída',
        description: 'A empresa foi excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a empresa.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setCompanyToDelete(null);
    }
  };

  const confirmDelete = (company: CompanyWithDetails) => {
    setCompanyToDelete(company);
    setDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            Empresas
          </CardTitle>
          {isGodMode && (
            <Button onClick={openNewDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma empresa cadastrada</p>
              {isGodMode && (
                <Button onClick={openNewDialog} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Empresa
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Setores</TableHead>
                    <TableHead>Cargos</TableHead>
                    {isGodMode && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map(company => (
                    <TableRow key={company.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {company.sectors.length === 0 ? (
                            <span className="text-muted-foreground text-sm">-</span>
                          ) : (
                            company.sectors.slice(0, 3).map(sector => (
                              <Badge key={sector.id} variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {sector.name}
                              </Badge>
                            ))
                          )}
                          {company.sectors.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{company.sectors.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {company.positions.length === 0 ? (
                            <span className="text-muted-foreground text-sm">-</span>
                          ) : (
                            company.positions.slice(0, 3).map(position => (
                              <Badge key={position.id} variant="secondary" className="text-xs">
                                <Briefcase className="h-3 w-3 mr-1" />
                                {position.name}
                              </Badge>
                            ))
                          )}
                          {company.positions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{company.positions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {isGodMode && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(company)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(company)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
            <DialogDescription>
              {editingCompany 
                ? 'Atualize os dados da empresa, seus setores e cargos.'
                : 'Cadastre uma nova empresa com seus setores e cargos.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Company Name */}
            <div className="grid gap-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Empresa ABC"
              />
            </div>

            {/* Sectors */}
            <div className="grid gap-2">
              <Label>Setores</Label>
              <div className="flex gap-2">
                <Input
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  placeholder="Nome do setor"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSector())}
                />
                <Button type="button" variant="outline" onClick={handleAddSector}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {sectors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-lg border">
                  {sectors.map((sector, index) => (
                    <Badge key={index} variant="outline" className="gap-1 pr-1">
                      <MapPin className="h-3 w-3" />
                      {sector}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-destructive/20"
                        onClick={() => handleRemoveSector(sector)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Positions */}
            <div className="grid gap-2">
              <Label>Cargos</Label>
              <div className="flex gap-2">
                <Input
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="Nome do cargo"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPosition())}
                />
                <Button type="button" variant="outline" onClick={handleAddPosition}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {positions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-lg border">
                  {positions.map((position, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      <Briefcase className="h-3 w-3" />
                      {position}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-destructive/20"
                        onClick={() => handleRemovePosition(position)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingCompany ? 'Salvar' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa "{companyToDelete?.name}"? 
              Esta ação irá remover também todos os setores e cargos associados. 
              Esta ação não pode ser desfeita.
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
    </>
  );
}
