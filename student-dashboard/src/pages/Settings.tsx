import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { User, Mail, Calendar, Save, AlertCircle, CheckCircle2, Lock, Camera, Loader2 } from "lucide-react";
import SubjectsManager from "../components/subjects/SubjectsManager";

/**
 * Página de Configuración para editar el perfil del usuario
 */
export default function Settings() {
    const { user, refreshProfile, avatarUrl: currentAvatarUrl } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [email, setEmail] = useState("");

    // Password states
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Avatar states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setFirstName(data.first_name || "");
                setLastName(data.last_name || "");
                setBirthDate(data.birth_date || "");

                if (data.avatar_url) {
                    setPreviewUrl(data.avatar_url);
                }
            }
        } catch (err: unknown) {
            console.error("Error fetching profile:", err);
            setError("No se pudo cargar la información del perfil.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            setEmail(user.email || "");
            fetchProfile();
        }
    }, [user, fetchProfile]);

    // Sincronizar previsualización con la URL actual del perfil SOLO si no hay un archivo local pendiente
    useEffect(() => {
        if (currentAvatarUrl && !avatarFile) {
            setPreviewUrl(currentAvatarUrl);
        } else if (!currentAvatarUrl && !avatarFile) {
            setPreviewUrl(null);
        }
    }, [currentAvatarUrl, avatarFile]);

    /**
     * Sube un archivo de imagen al bucket 'avatars' de Supabase Storage.
     * @param file El archivo de imagen a subir.
     * @returns La URL pública del archivo subido.
     */
    const uploadAvatar = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    /**
     * Maneja la selección de un nuevo archivo de imagen y genera una previsualización.
     */
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    /**
     * Valida y guarda los cambios del perfil, incluyendo avatar, información personal y contraseña.
     */
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validaciones básicas
        if (newPassword && newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setSaving(true);

        try {
            let avatar_url = undefined;

            // 1. Subir avatar si hay uno nuevo seleccionado
            if (avatarFile) {
                avatar_url = await uploadAvatar(avatarFile);
            }

            // 2. Actualizar perfil en la tabla 'profiles'
            const updateData: Record<string, string | undefined> = {
                id: user?.id,
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                updated_at: new Date().toISOString(),
            };
            if (avatar_url) updateData.avatar_url = avatar_url;

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(updateData);

            if (profileError) throw profileError;

            // Actualizar previsualización inmediatamente con cache buster
            if (avatar_url) {
                setPreviewUrl(`${avatar_url}?t=${Date.now()}`);
            }

            // 3. Actualizar Auth data (email y/o password) en Supabase Auth
            const authUpdates: Record<string, string> = {};
            if (email !== user?.email) authUpdates.email = email;
            if (newPassword) authUpdates.password = newPassword;

            if (Object.keys(authUpdates).length > 0) {
                const { error: authError } = await supabase.auth.updateUser(authUpdates);
                if (authError) throw authError;

                if (authUpdates.email) {
                    setError("El correo ha sido actualizado. Revisa tu bandeja de entrada para confirmarlo.");
                }
            }

            // 4. Refrescar estado global del perfil
            await refreshProfile();
            setSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
            setAvatarFile(null);

            setTimeout(() => setSuccess(false), 5000);
        } catch (err: unknown) {
            console.error("Error updating profile:", err);
            setError(err instanceof Error ? err.message : "Error al actualizar el perfil.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuración</h1>
                <p className="text-slate-500 mt-1">Gestiona tu perfil y seguridad.</p>
            </header>

            {/* Subjects Management Section */}
            <SubjectsManager />

            <form onSubmit={handleSave} className="space-y-6">
                {/* Profile Photo Section */}
                <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Camera size={20} className="text-primary-600" />
                            Foto de Perfil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
                                    {previewUrl ? (
                                        <img key={previewUrl} src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-slate-300" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera size={24} />
                                </button>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-slate-800">Cambiar avatar</h3>
                                <p className="text-sm text-slate-500 mb-4">Haz clic en la imagen para elegir una nueva foto. Formatos: JPG, PNG o WebP.</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                                >
                                    Subir nueva imagen
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information Section */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User size={20} className="text-primary-600" />
                            Información Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nombre</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all border border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Apellidos</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all border border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all border border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all border border-slate-200"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Section */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock size={20} className="text-red-500" />
                            Seguridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Dejar en blanco para no cambiar"
                                    className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all border border-slate-200 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all border border-slate-200 text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-in zoom-in-95">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 animate-in zoom-in-95">
                        <CheckCircle2 size={20} className="shrink-0" />
                        <p className="text-sm font-medium">¡Perfil actualizado correctamente!</p>
                    </div>
                )}

                <div className="flex justify-end items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-200 active:scale-95 min-w-[180px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Guardar cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
