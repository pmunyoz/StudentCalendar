import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { subjectService } from "../../services/subjectService";
import { type Subject } from "../../services/taskService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ConfirmationModal } from "../ui/Modal";
import { BookOpen, Plus, Edit3, Trash2, Loader2, Palette, Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

/** Mapa de clases Tailwind por color para mantener consistencia con Tasks.tsx */
const subjectColorMap: Record<string, { bg100: string; text700: string; border200: string; bg500: string; bg50: string }> = {
    blue:   { bg100: 'bg-blue-100',   text700: 'text-blue-700',   border200: 'border-blue-200/50',   bg500: 'bg-blue-500',   bg50: 'bg-blue-50' },
    red:    { bg100: 'bg-red-100',    text700: 'text-red-700',    border200: 'border-red-200/50',    bg500: 'bg-red-500',    bg50: 'bg-red-50' },
    green:  { bg100: 'bg-green-100',  text700: 'text-green-700',  border200: 'border-green-200/50',  bg500: 'bg-green-500',  bg50: 'bg-green-50' },
    purple: { bg100: 'bg-purple-100', text700: 'text-purple-700', border200: 'border-purple-200/50', bg500: 'bg-purple-500', bg50: 'bg-purple-50' },
    orange: { bg100: 'bg-orange-100', text700: 'text-orange-700', border200: 'border-orange-200/50', bg500: 'bg-orange-500', bg50: 'bg-orange-50' },
    pink:   { bg100: 'bg-pink-100',   text700: 'text-pink-700',   border200: 'border-pink-200/50',   bg500: 'bg-pink-500',   bg50: 'bg-pink-50' },
    cyan:   { bg100: 'bg-cyan-100',   text700: 'text-cyan-700',   border200: 'border-cyan-200/50',   bg500: 'bg-cyan-500',   bg50: 'bg-cyan-50' },
    amber:  { bg100: 'bg-amber-100',  text700: 'text-amber-700',  border200: 'border-amber-200/50',  bg500: 'bg-amber-500',  bg50: 'bg-amber-50' },
    teal:   { bg100: 'bg-teal-100',   text700: 'text-teal-700',   border200: 'border-teal-200/50',   bg500: 'bg-teal-500',   bg50: 'bg-teal-50' },
    rose:   { bg100: 'bg-rose-100',   text700: 'text-rose-700',   border200: 'border-rose-200/50',   bg500: 'bg-rose-500',   bg50: 'bg-rose-50' },
    indigo: { bg100: 'bg-indigo-100', text700: 'text-indigo-700', border200: 'border-indigo-200/50', bg500: 'bg-indigo-500', bg50: 'bg-indigo-50' },
    slate:  { bg100: 'bg-slate-100',  text700: 'text-slate-700',  border200: 'border-slate-200/50',  bg500: 'bg-slate-500',  bg50: 'bg-slate-50' },
};

const availableColors = Object.keys(subjectColorMap);

/**
 * Componente para gestionar materias: listado, creación, edición y eliminación.
 */
export default function SubjectsManager() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [subjectName, setSubjectName] = useState("");
    const [subjectColor, setSubjectColor] = useState("blue");
    
    // Delete states
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

    /**
     * Obtiene las materias del usuario desde Supabase.
     */
    const fetchSubjects = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await subjectService.getSubjects();
            setSubjects(data);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    /**
     * Abre el formulario para crear una nueva materia.
     */
    const openAddForm = () => {
        setEditingId(null);
        setSubjectName("");
        setSubjectColor("blue");
        setIsFormOpen(true);
    };

    /**
     * Abre el formulario para editar una materia existente.
     * @param subject Materia a editar
     */
    const openEditForm = (subject: Subject) => {
        setEditingId(subject.id);
        setSubjectName(subject.name);
        setSubjectColor(subject.color);
        setIsFormOpen(true);
    };

    /**
     * Cierra el formulario y resetea los estados.
     */
    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setSubjectName("");
        setSubjectColor("blue");
    };

    /**
     * Guarda la materia (nueva o editada) validando los datos de entrada según OWASP.
     * @param e Evento de formulario
     */
    const handleSaveSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !subjectName.trim()) return;

        // OWASP: Validación básica de longitud para evitar abusos
        if (subjectName.length > 50) {
            alert("El nombre de la materia es demasiado largo (máx. 50 caracteres).");
            return;
        }

        try {
            setActionLoading(true);
            const subjectData = {
                name: subjectName.trim(),
                color: subjectColor,
                user_id: user.id
            };

            if (editingId) {
                await subjectService.updateSubject(editingId, subjectData);
                setSubjects(subjects.map(s => s.id === editingId ? { ...s, ...subjectData } : s));
            } else {
                const data = await subjectService.createSubject(subjectData);
                if (data) setSubjects([...subjects, data].sort((a, b) => a.name.localeCompare(b.name)));
            }
            closeForm();
        } catch (error) {
            console.error("Error saving subject:", error);
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * Inicia el proceso de eliminación de una materia.
     * @param subject Materia a eliminar
     */
    const handleDeleteRequest = (subject: Subject) => {
        setSubjectToDelete(subject);
    };

    /**
     * Confirma la eliminación de la materia en Supabase.
     */
    const handleConfirmDelete = async () => {
        if (!subjectToDelete) return;

        try {
            setActionLoading(true);
            await subjectService.deleteSubject(subjectToDelete.id);
            setSubjects(subjects.filter(s => s.id !== subjectToDelete.id));
            setSubjectToDelete(null);
        } catch (error) {
            console.error("Error deleting subject:", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
        );
    }

    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-visible">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen size={20} className="text-primary-600" />
                    Gestión de Materias
                </CardTitle>
                {!isFormOpen && (
                    <Button onClick={openAddForm} size="sm" className="gap-2">
                        <Plus size={16} /> Nueva Materia
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-6">
                {isFormOpen && (
                    <div className="mb-8 p-4 bg-primary-50/30 border border-primary-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleSaveSubject} className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre de la materia</label>
                                    <Input
                                        value={subjectName}
                                        onChange={(e) => setSubjectName(e.target.value)}
                                        placeholder="Ej: Matemáticas Avanzadas"
                                        autoFocus
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                        <Palette size={12} /> Color
                                    </label>
                                    <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl border border-slate-200">
                                        {availableColors.map((color) => {
                                            const sc = subjectColorMap[color];
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setSubjectColor(color)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full transition-all ring-offset-2",
                                                        sc.bg500,
                                                        subjectColor === color ? "ring-2 ring-slate-400 scale-110 shadow-sm" : "hover:scale-110"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={closeForm} disabled={actionLoading}>
                                    <X size={16} className="mr-1" /> Cancelar
                                </Button>
                                <Button type="submit" disabled={!subjectName.trim() || actionLoading} className="min-w-[120px]">
                                    {actionLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Check size={16} className="mr-1" />
                                            {editingId ? "Actualizar" : "Crear Materia"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjects.length === 0 && !isFormOpen ? (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-medium">No has añadido ninguna materia todavía.</p>
                            <p className="text-sm">Las materias te ayudan a organizar tus tareas y exámenes.</p>
                        </div>
                    ) : (
                        subjects.map((subject) => {
                            const sc = subjectColorMap[subject.color] || subjectColorMap.blue;
                            return (
                                <div
                                    key={subject.id}
                                    className={cn(
                                        "group flex items-center justify-between p-4 rounded-2xl border transition-all",
                                        "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-4 h-4 rounded-full shadow-inner", sc.bg500)} />
                                        <span className="font-bold text-slate-700">{subject.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditForm(subject)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRequest(subject)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>

            <ConfirmationModal
                isOpen={!!subjectToDelete}
                onClose={() => setSubjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar materia?"
                message={`Estás a punto de eliminar "${subjectToDelete?.name}". Esto no borrará tus tareas, pero se quedarán sin materia asociada.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </Card>
    );
}
