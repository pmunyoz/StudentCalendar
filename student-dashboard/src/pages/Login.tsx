import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * Página de Login / Registro. Renderiza el formulario de inicio de sesión.
 */
export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    /**
     * Sube el archivo de imagen al bucket 'avatars' de Supabase y devuelve la URL.
     * 
     * @param file - Archivo de imagen a subir
     * @param userId - ID del usuario para nombrar el archivo
     */
    const uploadAvatar = async (file: File, userId: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    /**
     * Maneja el envío del formulario para iniciar sesión o registrarse usando Supabase.
     * 
     * @param e - Evento del formulario React
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (email && password) {
            setLoading(true);
            if (isRegistering) {
                // Registro de usuario
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }

                if (signUpData.user) {
                    try {
                        let avatarUrl = "";
                        if (avatarFile) {
                            avatarUrl = await uploadAvatar(avatarFile, signUpData.user.id);
                        }

                        // Guardar perfil en la tabla 'profiles'
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .insert([
                                {
                                    id: signUpData.user.id,
                                    first_name: firstName,
                                    last_name: lastName,
                                    birth_date: birthDate,
                                    avatar_url: avatarUrl,
                                }
                            ]);

                        if (profileError) throw profileError;

                        setSuccessMsg("Registro exitoso. Revisa tu correo o inicia sesión.");
                        setIsRegistering(false);
                        // Limpiar campos
                        setFirstName("");
                        setLastName("");
                        setBirthDate("");
                        setAvatarFile(null);
                    } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : String(err);
                        setError("Error al crear el perfil: " + message);
                    }
                }
            } else {
                // Inicio de sesión
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    setError(signInError.message === "Invalid login credentials" ? "Credenciales incorrectas" : signInError.message);
                } else if (data.session) {
                    navigate("/dashboard");
                }
            }
            setLoading(false);
        } else {
            setError("Por favor ingresa tu correo y contraseña.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-600 tracking-tight font-sans">
                        StudentDash
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {isRegistering ? "Crea una cuenta en el panel estudiantil" : "Inicia sesión en tu panel estudiantil"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 text-center">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl border border-green-200 text-center">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                        placeholder="Juan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Apellidos
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                        placeholder="Pérez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Foto de Perfil
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-all text-sm"
                                >
                                    {avatarFile ? avatarFile.name : "Seleccionar imagen"}
                                </button>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                            placeholder="alumno@universidad.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4"
                    >
                        {loading ? (isRegistering ? "Registrando..." : "Ingresando...") : (isRegistering ? "Registrarse" : "Ingresar")}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-600">
                            {isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setError(null);
                                    setSuccessMsg(null);
                                }}
                                className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors"
                            >
                                {isRegistering ? "Inicia sesión" : "Regístrate"}
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
