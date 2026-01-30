import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/hooks/useCompanies';
import { Loader2, Pencil, Save, Building2, Briefcase, MapPin, User } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

interface Sector {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

export interface UserToEdit {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  whatsapp?: string;
  company_id?: string;
  position_id?: string;
  is_active: boolean;
  role: AppRole;
  sector_id?: string;
}

interface UserEditDialogProps {
  user: UserToEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isGodMode: boolean;
}

// Phone mask function (Brazilian format)
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

const isValidWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11;
};

export function UserEditDialog({ user, open, onOpenChange, onSuccess, isGodMode }: UserEditDialogProps) {
  const { toast } = useToast();
  const { companies, fetchSectorsByCompany, fetchPositionsByCompany } = useCompanies();
  
  const [saving, setSaving] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [role, setRole] = useState<AppRole>('user');

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setWhatsapp(user.whatsapp || '');
      setCompanyId(user.company_id || '');
      setSectorId(user.sector_id || '');
      setPositionId(user.position_id || '');
      setIsActive(user.is_active);
      setRole(user.role);
    }
  }, [user]);

  // Load sectors and positions when company changes
  useEffect(() => {
    const loadCompanyData = async () => {
      if (companyId) {
        // Fetch sectors
        setLoadingSectors(true);
        const sectorsData = await fetchSectorsByCompany(companyId);
        setSectors(sectorsData);
        setLoadingSectors(false);

        // Fetch positions
        setLoadingPositions(true);
        const positionsData = await fetchPositionsByCompany(companyId);
        setPositions(positionsData);
        setLoadingPositions(false);
        
        // Reset sector and position if company changed (unless initial load)
        if (user && companyId !== user.company_id) {
          setSectorId('');
          setPositionId('');
        }
      } else {
        setSectors([]);
        setPositions([]);
      }
    };

    loadCompanyData();
  }, [companyId, fetchSectorsByCompany, fetchPositionsByCompany, user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Validations
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, preencha o nome completo.',
        variant: 'destructive',
      });
      return;
    }
    
    if (whatsapp && !isValidWhatsApp(whatsapp)) {
      toast({
        title: 'WhatsApp inválido',
        description: 'O número deve ter 11 dígitos (DDD + número).',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          username: username.trim() || null,
          whatsapp: whatsapp || null,
          company_id: companyId || null,
          position_id: positionId || null,
          is_active: isActive,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update sector assignment
      if (sectorId) {
        // Delete existing sector assignments
        await supabase
          .from('profile_sectors')
          .delete()
          .eq('profile_id', user.id);

        // Insert new sector
        const { error: sectorError } = await supabase
          .from('profile_sectors')
          .insert({
            profile_id: user.id,
            sector_id: sectorId,
          });

        if (sectorError) {
          console.error('Error updating sector:', sectorError);
        }
      }

      // Update role if changed
      if (role !== user.role) {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.user_id)
          .maybeSingle();

        if (existingRole) {
          await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', user.user_id);
        } else {
          await supabase
            .from('user_roles')
            .insert({ user_id: user.user_id, role });
        }
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Os dados do usuário foram atualizados com sucesso.',
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    user: 'Usuário',
    task_editor: 'Editor de Tarefas',
    admin: 'Administrador',
    gestor_setor: 'Gestor de Setor',
    gestor_geral: 'Gestor Geral',
    god_mode: 'God Mode',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Atualize os dados do usuário. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome Completo *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="Ex: joao_silva"
            />
            <p className="text-xs text-muted-foreground">
              Usado para login. Apenas letras minúsculas, números e underscore.
            </p>
          </div>

          {/* WhatsApp */}
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              maxLength={16}
            />
            {whatsapp && !isValidWhatsApp(whatsapp) && (
              <p className="text-sm text-destructive">WhatsApp deve ter 11 dígitos</p>
            )}
          </div>

          {/* Company */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sector */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Setor
            </Label>
            <Select 
              value={sectorId} 
              onValueChange={setSectorId}
              disabled={!companyId || loadingSectors}
            >
              <SelectTrigger>
                {loadingSectors ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={
                    !companyId 
                      ? "Selecione uma empresa primeiro" 
                      : "Selecione um setor"
                  } />
                )}
              </SelectTrigger>
              <SelectContent>
                {sectors.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum setor disponível
                  </SelectItem>
                ) : (
                  sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Cargo
            </Label>
            <Select 
              value={positionId} 
              onValueChange={setPositionId}
              disabled={!companyId || loadingPositions}
            >
              <SelectTrigger>
                {loadingPositions ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={
                    !companyId 
                      ? "Selecione uma empresa primeiro" 
                      : "Selecione um cargo"
                  } />
                )}
              </SelectTrigger>
              <SelectContent>
                {positions.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum cargo disponível
                  </SelectItem>
                ) : (
                  positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="grid gap-2">
            <Label>Papel no Sistema</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="gestor_setor">Gestor de Setor</SelectItem>
                <SelectItem value="gestor_geral">Gestor Geral</SelectItem>
                <SelectItem value="task_editor">Editor de Tarefas</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                {isGodMode && (
                  <SelectItem value="god_mode">God Mode</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3 rounded-md border p-4">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="isActive" className="cursor-pointer">
                Usuário ativo
              </Label>
              <p className="text-sm text-muted-foreground">
                Usuários inativos não podem fazer login no sistema
              </p>
            </div>
            {!isActive && (
              <Badge variant="destructive" className="ml-auto">Inativo</Badge>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
