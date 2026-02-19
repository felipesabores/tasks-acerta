import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboboxWithCreate } from '@/components/ui/combobox-with-create';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/hooks/useCompanies';
import { Loader2, UserPlus } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

const userFormSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  username: z.string()
    .trim()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username muito longo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  whatsapp: z.string()
    .refine(val => !val || val.replace(/\D/g, '').length === 11, 'WhatsApp deve ter 11 dígitos')
    .optional(),
  role: z.enum(['user', 'task_editor', 'admin', 'gestor_setor', 'gestor_geral', 'god_mode']),
  companyId: z.string().min(1, 'Empresa é obrigatória'),
  sectorId: z.string().min(1, 'Setor é obrigatório'),
  positionId: z.string().min(1, 'Cargo é obrigatório'),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface Sector {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

interface UserRegistrationFormProps {
  onSuccess?: () => void;
}

export function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const { toast } = useToast();
  const { companies, fetchSectorsByCompany, fetchPositionsByCompany, addSector, addPosition } = useCompanies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      whatsapp: '',
      role: 'user',
      companyId: '',
      sectorId: '',
      positionId: '',
      isActive: true,
    },
  });

  const selectedCompanyId = form.watch('companyId');

  // Load sectors and positions when company changes
  useEffect(() => {
    const loadCompanyData = async () => {
      if (selectedCompanyId) {
        console.log('Company selected:', selectedCompanyId);
        
        // Reset sector and position
        form.setValue('sectorId', '');
        form.setValue('positionId', '');
        
        // Fetch sectors
        setLoadingSectors(true);
        const sectorsData = await fetchSectorsByCompany(selectedCompanyId);
        console.log('Loaded sectors:', sectorsData);
        setSectors(sectorsData);
        setLoadingSectors(false);

        // Fetch positions
        setLoadingPositions(true);
        const positionsData = await fetchPositionsByCompany(selectedCompanyId);
        console.log('Loaded positions:', positionsData);
        setPositions(positionsData);
        setLoadingPositions(false);
      } else {
        setSectors([]);
        setPositions([]);
      }
    };

    loadCompanyData();
  }, [selectedCompanyId, fetchSectorsByCompany, fetchPositionsByCompany, form]);

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          name: values.name,
          username: values.username,
          password: values.password,
          role: values.role,
          companyId: values.companyId,
          sectorId: values.sectorId,
          positionId: values.positionId,
          whatsapp: values.whatsapp || null,
          isActive: values.isActive,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Usuário cadastrado',
        description: `${values.name} foi cadastrado com sucesso.`,
      });

      form.reset();
      setSectors([]);
      setPositions([]);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao cadastrar usuário',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: joao_silva" {...field} />
              </FormControl>
              <FormDescription>
                Usado para login. Apenas letras, números e underscore
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input 
                  placeholder="(00) 00000-0000" 
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numbers = value.replace(/\D/g, '').slice(0, 11);
                    let formatted = numbers;
                    if (numbers.length > 2) {
                      if (numbers.length <= 7) {
                        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
                      } else {
                        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
                      }
                    }
                    field.onChange(formatted);
                  }}
                  maxLength={16}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função no Sistema *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sectorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor *</FormLabel>
              <FormControl>
                <ComboboxWithCreate
                  options={sectors.map(s => ({ value: s.id, label: s.name }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    !selectedCompanyId 
                      ? "Selecione uma empresa primeiro" 
                      : "Selecione um setor"
                  }
                  searchPlaceholder="Buscar setor..."
                  emptyMessage="Nenhum setor encontrado."
                  createLabel="Criar novo setor"
                  createDialogTitle="Criar Novo Setor"
                  createDialogDescription="Digite o nome do novo setor para esta empresa."
                  createInputLabel="Nome do Setor"
                  createInputPlaceholder="Ex: Financeiro"
                  disabled={!selectedCompanyId}
                  loading={loadingSectors}
                  onCreate={async (name) => {
                    if (!selectedCompanyId) return null;
                    const created = await addSector(selectedCompanyId, name);
                    if (created) {
                      setSectors(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                      toast({
                        title: 'Setor criado',
                        description: `O setor "${name}" foi criado com sucesso.`,
                      });
                    }
                    return created;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="positionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo *</FormLabel>
              <FormControl>
                <ComboboxWithCreate
                  options={positions.map(p => ({ value: p.id, label: p.name }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    !selectedCompanyId 
                      ? "Selecione uma empresa primeiro" 
                      : "Selecione um cargo"
                  }
                  searchPlaceholder="Buscar cargo..."
                  emptyMessage="Nenhum cargo encontrado."
                  createLabel="Criar novo cargo"
                  createDialogTitle="Criar Novo Cargo"
                  createDialogDescription="Digite o nome do novo cargo para esta empresa."
                  createInputLabel="Nome do Cargo"
                  createInputPlaceholder="Ex: Analista"
                  disabled={!selectedCompanyId}
                  loading={loadingPositions}
                  onCreate={async (name) => {
                    if (!selectedCompanyId) return null;
                    const created = await addPosition(selectedCompanyId, name);
                    if (created) {
                      setPositions(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                      toast({
                        title: 'Cargo criado',
                        description: `O cargo "${name}" foi criado com sucesso.`,
                      });
                    }
                    return created;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Usuário ativo</FormLabel>
                <FormDescription>
                  Usuários inativos não podem fazer login no sistema
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          Cadastrar Usuário
        </Button>
      </form>
    </Form>
  );
}
