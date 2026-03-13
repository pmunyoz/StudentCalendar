import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ConfirmationModal } from "../components/ui/Modal";
import { CheckCircle2, Circle, MoreVertical, Plus, BookOpen, Calendar, ClipboardList, Loader2, Trash2, Edit3 } from "lucide-react";
import { taskService, type Task, type Subject } from "../services/taskService";
import { subjectService } from "../services/subjectService";
import { referenceService, type Mentionable } from "../services/referenceService";

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
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [newSubjectColor, setNewSubjectColor] = useState("blue");
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);

    // Linked Item States
    const [selectedMention, setSelectedMention] = useState<Mentionable | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);

            // 1. Fetch Subjects
            let subData = await subjectService.getSubjects();
            if (subData.length === 0) {
                subData = await subjectService.createDefaultSubjects(user.id);
            }
            setSubjects(subData);

            // 2. Fetch Mentions (Exams & Exercises)
            const combined = await referenceService.getMentionables();
            setMentionables(combined);

            // Construir mapa de títulos para resolver linked_title
            const titleMap = new Map<string, string>();
            combined.forEach(m => titleMap.set(m.id, m.title));

            // 3. Fetch Tasks
            const taskData = await taskService.getTasks();

            // 4. Resolver linked_title en memoria
            const tasksWithTitles: Task[] = taskData.map((task) => ({
                ...task,
                linked_title: task.linked_id ? titleMap.get(task.linked_id) : undefined,
            }));
            setTasks(tasksWithTitles);

        } catch (error) {
            console.error("Error loading tasks data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    /**
     * Maneja el cambio del título de la tarea.
     * @param e Evento de cambio del input
     */
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTaskTitle(e.target.value);
    };

    /**
     * Crea una nueva materia en Supabase para el usuario actual.
     * @param e Evento de envío del formulario
     */
    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim() || !user) return;

        try {
            const data = await subjectService.createSubject({
                name: newSubjectName,
                color: newSubjectColor,
                user_id: user.id
            });

            if (data) {
                setSubjects([...subjects, data]);
                setSelectedSubjectId(data.id);
                setIsAddingSubject(false);
                setNewSubjectName("");
            }
        } catch (error) {
            console.error("Error creating subject:", error);
        }
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
     * Prepara una tarea para ser eliminada mostrando el modal de confirmación.
     * @param taskId ID de la tarea a eliminar
     */
    const deleteTask = (taskId: string) => {
        setTaskToDelete(taskId);
    };

    /**
     * Ejecuta la eliminación definitiva de la tarea en la base de datos.
     */
    const confirmDelete = async () => {
        if (!taskToDelete) return;

        try {
            await taskService.deleteTask(taskToDelete);
            setTasks(tasks.filter(t => t.id !== taskToDelete));
        } catch (error) {
            console.error("Error deleting task:", error);
        } finally {
            setTaskToDelete(null);
        }
    };

    /**
     * Guarda la tarea (nueva o editada) en Supabase con sus vínculos.
     * @param e Evento de envío del formulario
     */
    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user) return;

        try {
            const taskDataToSave: Partial<Task> = {
                title: newTaskTitle,
                user_id: user.id,
                subject_id: selectedSubjectId || null,
                linked_id: selectedMention?.id || null,
                linked_type: selectedMention?.type || null,
                due_date: dueDate || null,
            };

            if (editingTask) {
                // UPDATE
                const data = await taskService.updateTask(editingTask.id, taskDataToSave);
                if (data) {
                    const updatedTask = { ...data, linked_title: selectedMention?.title };
                    setTasks(tasks.map(t => t.id === editingTask.id ? (updatedTask as Task) : t));
                }
            } else {
                // INSERT
                const data = await taskService.createTask({ ...taskDataToSave, completed: false });
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
        setIsAddingSubject(false);
        setNewSubjectName("");
    };

    /**
     * Alterna el estado de completado de una tarea en Supabase.
     */
    const toggleTask = async (task: Task) => {
        try {
            await taskService.updateTask(task.id, { completed: !task.completed });
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

    // Filtrar tareas según la materia seleccionada
    const filteredTasks = filterSubjectId
        ? tasks.filter(t => t.subject_id === filterSubjectId)
        : tasks;

    const pendingTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

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
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <Input
                                        ref={inputRef}
                                        autoFocus
                                        label="¿Qué tienes que hacer?"
                                        value={newTaskTitle}
                                        onChange={handleTitleChange}
                                        placeholder="Ej: Repasar tema 1 para el examen..."
                                        className="text-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-sm font-medium text-slate-700">Materia</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingSubject(!isAddingSubject)}
                                                className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
                                            >
                                                {isAddingSubject ? "Cancelar" : "+ Nueva"}
                                            </button>
                                        </div>

                                        {isAddingSubject ? (
                                            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-1">
                                                <Input
                                                    autoFocus
                                                    placeholder="Nombre de la materia"
                                                    value={newSubjectName}
                                                    onChange={e => setNewSubjectName(e.target.value)}
                                                    className="h-9 text-sm"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-wrap gap-1.5 flex-1">
                                                        {['blue', 'red', 'green', 'purple', 'orange', 'pink', 'cyan', 'amber', 'teal', 'rose', 'indigo', 'slate'].map(color => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => setNewSubjectColor(color)}
                                                                className={`w-6 h-6 rounded-full ${getColorClasses(color).bg500} ring-offset-1 shrink-0 ${newSubjectColor === color ? 'ring-2 ring-slate-400' : ''}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={handleCreateSubject}
                                                        disabled={!newSubjectName.trim()}
                                                        className="h-8 px-3 text-xs"
                                                    >
                                                        Guardar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Vincular a...</label>
                                        <select
                                            value={selectedMention ? `${selectedMention.type}:${selectedMention.id}` : ""}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (!val) {
                                                    setSelectedMention(null);
                                                } else {
                                                    const [type, id] = val.split(':');
                                                    const m = mentionables.find(mn => mn.id === id && mn.type === type);
                                                    if (m) setSelectedMention(m);
                                                }
                                            }}
                                            className="w-full px-4 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer h-[42px]"
                                        >
                                            <option value="">Ninguno</option>
                                            <optgroup label="Exámenes">
                                                {mentionables.filter(m => m.type === 'exam').map(m => (
                                                    <option key={m.id} value={`exam:${m.id}`}>{m.title}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Ejercicios">
                                                {mentionables.filter(m => m.type === 'exercise').map(m => (
                                                    <option key={m.id} value={`exercise:${m.id}`}>{m.title}</option>
                                                ))}
                                            </optgroup>
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

                                {/* Preview of Bubbles */}
                                <div className="mt-2 flex flex-wrap items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[50px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Vista previa:</span>

                                    {selectedSubjectId && (
                                        (() => {
                                            const s = subjects.find(sub => sub.id === selectedSubjectId);
                                            if (!s) return null;
                                            const pc = getColorClasses(s.color);
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${pc.bg100} ${pc.text700} border ${pc.border200} animate-in zoom-in-95`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${pc.bg500}`} />
                                                    {s.name}
                                                </span>
                                            );
                                        })()
                                    )}

                                    {selectedMention && (
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full animate-in zoom-in-95 ${selectedMention.type === 'exam' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {selectedMention.type === 'exam' ? <Calendar size={10} /> : <ClipboardList size={10} />}
                                            {selectedMention.title}
                                        </span>
                                    )}

                                    {dueDate && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 animate-in zoom-in-95">
                                            <Calendar size={10} />
                                            {new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}

                                    {!selectedSubjectId && !selectedMention && !dueDate && (
                                        <span className="text-[10px] font-medium text-slate-400 italic">Selecciona opciones para ver las etiquetas...</span>
                                    )}
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
                            <Button
                                variant={filterSubjectId === null ? "secondary" : "ghost"}
                                onClick={() => setFilterSubjectId(null)}
                                className={`w-full justify-start text-left rounded-lg gap-3 ${filterSubjectId === null ? 'bg-primary-50 text-primary-700 border-none' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0`} />
                                Todas las tareas
                            </Button>
                            {subjects.map(subject => {
                                const sc = getColorClasses(subject.color);
                                return (
                                    <Button
                                        key={subject.id}
                                        variant={filterSubjectId === subject.id ? "secondary" : "ghost"}
                                        onClick={() => setFilterSubjectId(subject.id)}
                                        className={`w-full justify-start text-left rounded-lg gap-3 ${filterSubjectId === subject.id ? `${sc.bg50} ${sc.text700} border-none` : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full ${sc.bg500} shrink-0`} />
                                        {subject.name}
                                    </Button>
                                );
                            })}
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

            <ConfirmationModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar Plan"
                message="¿Se va a eliminar esta tarea de tu planificación académica? Confírmalo si has terminado con ella o si ya no es necesaria."
                confirmText="Eliminar"
                cancelText="Volver"
                variant="danger"
            />
        </div>
    );
}

/** Mapa de clases Tailwind por color para evitar interpolación dinámica */
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

const defaultColorClasses = subjectColorMap.blue;

function getColorClasses(color: string) {
    return subjectColorMap[color] ?? defaultColorClasses;
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
    const colors = task.subject ? getColorClasses(task.subject.color) : null;

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
                    {task.subject && colors && (
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg100} ${colors.text700} border ${colors.border200}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.bg500}`} />
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
