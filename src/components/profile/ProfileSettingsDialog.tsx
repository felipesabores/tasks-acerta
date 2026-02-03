import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, User } from 'lucide-react';

export function ProfileSettingsDialog({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<{
        name: string;
        username: string;
        avatar_url: string | null;
    }>({
        name: '',
        username: '',
        avatar_url: null,
    });

    // Fetch profile on open
    useEffect(() => {
        if (open && user) {
            getProfile();
        }
    }, [open, user]);

    async function getProfile() {
        try {
            setLoading(true);
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('name, username, avatar_url')
                .eq('user_id', user.id)
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                setProfile({
                    name: data.name || '',
                    username: data.username || '',
                    avatar_url: data.avatar_url,
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast({
                title: 'Erro ao carregar perfil',
                description: 'Não foi possível carregar seus dados.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setLoading(true);
            if (!user) throw new Error('No user');

            const updates = {
                user_id: user.id,
                name: profile.name,
                username: profile.username,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates, {
                onConflict: 'user_id', // Assuming user_id is unique/PK related
            });

            if (error) throw error;

            toast({
                title: 'Perfil atualizado',
                description: 'Seus dados foram salvos com sucesso.',
            });
            setOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: 'Erro ao atualizar',
                description: 'Não foi possível salvar as alterações.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // Save url to profile immediately? Or just local state?
            // Let's save to profile to persist it.
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: data.publicUrl })
                .eq('user_id', user?.id);

            if (updateError) {
                throw updateError;
            }

            setProfile({ ...profile, avatar_url: data.publicUrl });

            // Sync with Supabase Auth Metadata (to update UI immediately)
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: data.publicUrl }
            });

            if (authError) console.error('Error syncing auth metadata:', authError);

            toast({
                title: 'Avatar atualizado',
                description: 'Sua nova foto de perfil foi salva.',
            });

        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast({
                title: 'Erro no upload',
                description: 'Falha ao enviar a imagem. Verifique se o bucket "avatars" existe e é público.',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback className="text-2xl">
                                {profile.name?.slice(0, 2).toUpperCase() || <User />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                id="avatar"
                                className="hidden"
                                accept="image/*"
                                onChange={uploadAvatar}
                                disabled={uploading}
                            />
                            <Label
                                htmlFor="avatar"
                                className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80"
                            >
                                {uploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                Alterar Foto
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <Input
                            id="username"
                            value={profile.username}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={updateProfile} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
