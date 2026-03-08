import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CheckCircle2, Circle, MoreVertical, Plus, BookOpen, Calendar, ClipboardList, Loader2, AtSign, Trash2, Edit3, X } from "lucide-react";

interface Subject {
    id: string;
    name: string;
    color: string;
}

interface Exam {
    id: string;
    title: string;
    type: 'exam';
}

interface Exercise {
    id: string;
    title: string;
    type: 'exercise';
}

type Mentionable = Exam | Exercise;

interface Task {
    id: string;
    title: string;
    subject_id: string | null;
    due_date: string | null;
    completed: boolean;
    linked_id: string | null;
    linked_type: 'exam' | 'exercise' | null;
    linked_title?: string;
    subject?: Subject;
}

/**
 * Componente principal de la página de Tareas.
 * Permite gestionar tareas vinculándolas a materias y exámenes/ejercicios mediante @.
 */
export default function TasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [mentionables, setMentionables] = useState<Mentionable[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>("");

    // Mention System States
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [selectedMention, setSelectedMention] = useState<Mentionable | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    /**
     * Carga las materias, exámenes, ejercicios y tareas de Supabase.
     */
    const fetchInitialData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Subjects
            const { data: subData } = await supabase
                .from('subjects')
                .select('*')
                .order('name');

            if (subData && subData.length > 0) {
                setSubjects(subData);
            } else {
                // Crear algunas materias por defecto si no existen
                const defaultSubjects = [
                    { name: 'Matemáticas', color: 'blue', user_id: user?.id },
                    { name: 'Historia', color: 'red', user_id: user?.id },
                    { name: 'Literatura', color: 'green', user_id: user?.id }
                ];
                const { data: newSubs } = await supabase.from('subjects').insert(defaultSubjects).select();
                if (newSubs) setSubjects(newSubs);
            }

            // 2. Fetch Exams and Exercises for mentions
            const [{ data: exams }, { data: exercises }] = await Promise.all([
                supabase.from('exams').select('id, title').order('created_at', { ascending: false }).limit(5),
                supabase.from('exercises').select('id, title').order('created_at', { ascending: false }).limit(5)
            ]);

            const combined: Mentionable[] = [
                ...(exams?.map(e => ({ ...e, type: 'exam' as const })) || []),
                ...(exercises?.map(e => ({ ...e, type: 'exercise' as const })) || [])
            ];
            setMentionables(combined);

            // 3. Fetch Tasks
            const { data: taskData } = await supabase
                .from('tasks')
                .select('*, subject:subjects(*)')
                .order('created_at', { ascending: false });

            // 4. Fetch linked titles if needed
            if (taskData) {
                const tasksWithTitles = await Promise.all(taskData.map(async (task: any) => {
                    if (task.linked_id && task.linked_type) {
                        const table = task.linked_type === 'exam' ? 'exams' : 'exercises';
                        const { data: linkedItem } = await supabase
                            .from(table)
                            .select('title')
                            .eq('id', task.linked_id)
                            .single();
                        return { ...task, linked_title: linkedItem?.title };
                    }
                    return task;
                }));
                setTasks(tasksWithTitles as Task[]);
            }

        } catch (error) {
            console.error("Error loading tasks data:", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Detecta si se está escribiendo una mención con @.
     */
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewTaskTitle(value);

        const lastAtIndices = value.lastIndexOf('@');
        if (lastAtIndices !== -1 && lastAtIndices === value.length - 1) {
            setShowMentions(true);
            setMentionFilter("");
        } else if (showMentions) {
            const query = value.slice(lastAtIndices + 1);
            if (query.includes(" ")) {
                setShowMentions(false);
            } else {
                setMentionFilter(query);
            }
        }
    };

    /**
     * Aplica la mención seleccionada al título de la tarea.
     */
    const applyMention = (m: Mentionable) => {
        const lastAt = newTaskTitle.lastIndexOf('@');
        const base = newTaskTitle.slice(0, lastAt).trim();
        setNewTaskTitle(base + " "); // Mantenemos el texto base y un espacio

        setSelectedMention(m);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    /**
     * Prepara el formulario para editar una tarea existente.
     */
    const startEditing = (task: Task) => {
        setEditingTask(task);
        setNewTaskTitle(task.title);
        setSelectedSubjectId(task.subject_id || "");
        setDueDate(task.due_date ? task.due_date.split('T')[0] : "");

        // Si tiene mención vinculada, intentamos recuperarla
        if (task.linked_id && task.linked_type) {
            const m = mentionables.find(mn => mn.id === task.linked_id && mn.type === task.linked_type);
            if (m) setSelectedMention(m);
        } else {
            setSelectedMention(null);
        }

        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /**
     * Elimina una tarea de Supabase.
     */
    const deleteTask = async (taskId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    /**
     * Guarda la nueva tarea en Supabase.
     */
    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user) return;

        try {
            const taskDataToSave = {
                title: newTaskTitle,
                user_id: user.id,
                subject_id: selectedSubjectId || null,
                linked_id: selectedMention?.id || null,
                linked_type: selectedMention?.type || null,
                due_date: dueDate || null,
            };

            if (editingTask) {
                // UPDATE
                const { data, error } = await supabase
                    .from('tasks')
                    .update(taskDataToSave)
                    .eq('id', editingTask.id)
                    .select('*, subject:subjects(*)')
                    .single();

                if (error) throw error;
                if (data) {
                    // Recuperamos el título vinculado para el estado local
                    const updatedTask = { ...data, linked_title: selectedMention?.title };
                    setTasks(tasks.map(t => t.id === editingTask.id ? (updatedTask as Task) : t));
                }
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('tasks')
                    .insert({ ...taskDataToSave, completed: false })
                    .select('*, subject:subjects(*)')
                    .single();

                if (error) throw error;
                if (data) {
                    const newTask = { ...data, linked_title: selectedMention?.title };
                    setTasks([newTask as Task, ...tasks]);
                }
            }

            resetForm();
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    /**
     * Resetea el formulario y los estados relacionados.
     */
    const resetForm = () => {
        setNewTaskTitle("");
        setSelectedSubjectId("");
        setDueDate("");
        setSelectedMention(null);
        setEditingTask(null);
        setIsAdding(false);
    };

    /**
     * Alterna el estado de completado de una tarea en Supabase.
     */
    const toggleTask = async (task: Task) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ completed: !task.completed })
                .eq('id', task.id);

            if (error) throw error;

            setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto pb-10">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tareas</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus entregas y proyectos vinculados.</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="gap-2 shadow-lg shadow-primary-100">
                        <Plus size={18} /> Nueva Tarea
                    </Button>
                )}
            </header>

            {/* Formulario Nueva Tarea Mejorado */}
            {isAdding && (
                <Card className="border-primary-200 shadow-xl ring-2 ring-primary-50 relative z-20 overflow-visible animate-in zoom-in-95 duration-200">
                    <CardContent className="p-6">
                        <form onSubmit={handleSaveTask} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">
                                    {editingTask ? "Editando Tarea" : "Nueva Tarea"}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 relative">
                                    <Input
                                        ref={inputRef}
                                        autoFocus
                                        label="¿Qué tienes que hacer?"
                                        value={newTaskTitle}
                                        onChange={handleTitleChange}
                                        placeholder="Ej: Repasar tema 1 @examen..."
                                        className="text-lg"
                                    />

                                    {/* Selected Mention Chip (Bubble) */}
                                    {selectedMention && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-xl text-xs font-bold border border-primary-200 animate-in zoom-in-95 shadow-sm">
                                                {selectedMention.type === 'exam' ? <Calendar size={14} className="text-red-500" /> : <ClipboardList size={14} className="text-blue-500" />}
                                                <span>Vinculado a: {selectedMention.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMention(null)}
                                                    className="ml-1 p-0.5 hover:bg-primary-200 rounded-full transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mention Suggestions Popup */}
                                    {showMentions && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto p-1 animate-in fade-in zoom-in-95">
                                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <AtSign size={12} /> Sugerencias
                                            </div>
                                            {mentionables
                                                .filter(m => m.title.toLowerCase().includes(mentionFilter.toLowerCase()))
                                                .map(m => (
                                                    <button
                                                        key={`${m.type}-${m.id}`}
                                                        type="button"
                                                        onClick={() => applyMention(m)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary-50 text-left rounded-lg transition-colors group"
                                                    >
                                                        {m.type === 'exam' ? <Calendar size={14} className="text-red-500" /> : <ClipboardList size={14} className="text-blue-500" />}
                                                        <span className="text-sm font-medium text-slate-700">{m.title}</span>
                                                        <span className="ml-auto text-[10px] text-slate-400 group-hover:text-primary-400 capitalize">{m.type === 'exam' ? 'Examen' : 'Ejercicio'}</span>
                                                    </button>
                                                ))}
                                            {mentionables.length === 0 && (
                                                <div className="px-3 py-4 text-center text-sm text-slate-500">
                                                    No hay exámenes o ejercicios recientes.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Materia</label>
                                    <select
                                        value={selectedSubjectId}
                                        onChange={e => setSelectedSubjectId(e.target.value)}
                                        className="w-full px-4 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer h-[42px]"
                                    >
                                        <option value="">Selecciona materia...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Input
                                        type="date"
                                        label="Fecha Límite"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="h-[42px]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                                <Button type="submit" disabled={!newTaskTitle.trim()}>
                                    {editingTask ? "Actualizar Tarea" : "Crear Tarea"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista Principal */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            Pendientes <span className="bg-primary-100 text-primary-700 py-0.5 px-2.5 rounded-full text-xs">{pendingTasks.length}</span>
                        </h2>
                        <div className="space-y-3">
                            {pendingTasks.length === 0 ? (
                                <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 bg-slate-50/30">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <CheckCircle2 size={32} className="text-emerald-500" />
                                    </div>
                                    <p className="font-semibold text-slate-900">¡Todo al día!</p>
                                    <p className="text-sm mt-1">No tienes tareas pendientes por ahora.</p>
                                </div>
                            ) : (
                                pendingTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={() => toggleTask(task)}
                                        onDelete={() => deleteTask(task.id)}
                                        onEdit={() => startEditing(task)}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {completedTasks.length > 0 && (
                        <section className="opacity-80">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                Completadas <span className="bg-slate-200 text-slate-600 py-0.5 px-2.5 rounded-full text-xs">{completedTasks.length}</span>
                            </h2>
                            <div className="space-y-3">
                                {completedTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={() => toggleTask(task)}
                                        onDelete={() => deleteTask(task.id)}
                                        onEdit={() => startEditing(task)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Panel Lateral - Materias & Estadísticas */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen size={18} className="text-primary-600" />
                                Materias
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-1">
                            <Button variant="secondary" className="w-full justify-start text-left rounded-lg bg-primary-50 text-primary-700 border-none">Todas las tareas</Button>
                            {subjects.map(subject => (
                                <Button
                                    key={subject.id}
                                    variant="ghost"
                                    className="w-full justify-start text-left rounded-lg hover:bg-slate-50 gap-3"
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full bg-${subject.color}-500 shrink-0`} />
                                    {subject.name}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm ring-1 ring-emerald-100 bg-emerald-50/20">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-emerald-700">
                                    {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                                </div>
                                <div className="text-sm font-medium text-emerald-600 mt-1 uppercase tracking-wider">Progreso Semanal</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/**
 * Componente individual para mostrar una tarea.
 * Permite marcar la tarea como completada o pendiente.
 */
function TaskItem({
    task,
    onToggle,
    onDelete,
    onEdit
}: {
    task: Task,
    onToggle: () => void,
    onDelete: () => void,
    onEdit: () => void
}) {
    const [showActions, setShowActions] = useState(false);

    return (
        <div className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${task.completed ? 'bg-slate-100/50 border-slate-200' : 'bg-white border-slate-200 shadow-sm hover:border-primary-300 hover:shadow-md'}`}>
            <button
                onClick={onToggle}
                className={`shrink-0 transition-transform active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-primary-500'}`}
            >
                {task.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
            </button>

            <div className="flex-1 min-w-0">
                <h4 className={`font-bold transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {task.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 no-wrap">
                    {task.subject && (
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-${task.subject.color}-100 text-${task.subject.color}-700 border border-${task.subject.color}-200/50`}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-${task.subject.color}-500`} />
                            {task.subject.name}
                        </span>
                    )}

                    {task.linked_type && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${task.linked_type === 'exam' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            {task.linked_type === 'exam' ? <Calendar size={10} /> : <ClipboardList size={10} />}
                            {task.linked_title || (task.linked_type === 'exam' ? 'Examen' : 'Ejercicio')}
                        </span>
                    )}

                    {task.due_date && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                            <Calendar size={10} />
                            {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}

                    {!task.subject && !task.linked_type && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">General</span>
                    )}
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <MoreVertical size={18} />
                </button>

                {showActions && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)}></div>
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={() => { onEdit(); setShowActions(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <Edit3 size={14} className="text-slate-400" />
                                Editar
                            </button>
                            <hr className="my-1 border-slate-100" />
                            <button
                                onClick={() => { onDelete(); setShowActions(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={14} />
                                Eliminar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
