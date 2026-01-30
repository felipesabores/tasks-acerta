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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/hooks/useCompanies';
import { Loader2, UserPlus } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

const userFormSchema = z.object({
  username: z.string()
    .trim()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username muito longo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
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
  const { companies, fetchSectorsByCompany, fetchPositionsByCompany } = useCompanies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
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
      // Generate internal email from username
      const internalEmail = `${values.username.toLowerCase()}@internal.acertamais.app`;

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: internalEmail,
        password: values.password,
        options: {
          data: {
            name: values.username,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Update profile with additional fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          company_id: values.companyId,
          position_id: values.positionId,
          is_active: values.isActive,
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Get profile id for sector assignment
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (profile) {
        // Assign user to sector
        const { error: sectorError } = await supabase
          .from('profile_sectors')
          .insert({
            profile_id: profile.id,
            sector_id: values.sectorId,
          });

        if (sectorError) {
          console.error('Error assigning sector:', sectorError);
        }
      }

      // Update user role if not 'user'
      if (values.role !== 'user') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: values.role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Error updating role:', roleError);
        }
      }

      toast({
        title: 'Usuário cadastrado',
        description: `${values.username} foi cadastrado com sucesso.`,
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: joao_silva" {...field} />
              </FormControl>
              <FormDescription>
                Apenas letras, números e underscore
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
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!selectedCompanyId || loadingSectors}
              >
                <FormControl>
                  <SelectTrigger>
                    {loadingSectors ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={
                        !selectedCompanyId 
                          ? "Selecione uma empresa primeiro" 
                          : "Selecione um setor"
                      } />
                    )}
                  </SelectTrigger>
                </FormControl>
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
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!selectedCompanyId || loadingPositions}
              >
                <FormControl>
                  <SelectTrigger>
                    {loadingPositions ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={
                        !selectedCompanyId 
                          ? "Selecione uma empresa primeiro" 
                          : "Selecione um cargo"
                      } />
                    )}
                  </SelectTrigger>
                </FormControl>
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
