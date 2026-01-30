import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
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
import { Loader2, UserPlus } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRole';

const userFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome completo é obrigatório').max(100, 'Nome muito longo'),
  whatsapp: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, 'WhatsApp deve ter 11 dígitos (DDD + número)'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').or(z.literal('')),
  cargo: z.string().trim().min(1, 'Cargo é obrigatório').max(100, 'Cargo muito longo'),
  role: z.enum(['user', 'task_editor', 'admin']),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserRegistrationFormProps {
  onSuccess?: () => void;
}

export function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone mask function (Brazilian format)
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      whatsapp: '',
      email: '',
      cargo: '',
      role: 'user',
      password: '',
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);

    try {
      // Generate email if not provided
      const email = values.email || `${values.whatsapp.replace(/\D/g, '')}@placeholder.local`;

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: {
            name: values.name,
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
          whatsapp: values.whatsapp,
          cargo: values.cargo,
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
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
        description: `${values.name} foi cadastrado com sucesso.`,
      });

      form.reset();
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
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="(00) 00000-0000" 
                  value={field.value}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  maxLength={16}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ex: joao@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Analista de Vendas" {...field} />
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
              <FormLabel>Papel no Sistema</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="task_editor">Editor de Tarefas</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha Inicial *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
              </FormControl>
              <FormMessage />
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
