import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CheckCircle2, Circle, MoreVertical, Plus } from "lucide-react";

interface Task {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    completed: boolean;
}

const initialTasks: Task[] = [
    { id: "1", title: "Ensayo sobre Revolución Industrial", course: "Historia", dueDate: "Mañana, 23:59", completed: false },
    { id: "2", title: "Problemas 1-15 Capítulo 4", course: "Matemáticas", dueDate: "Viernes, 10:00", completed: false },
    { id: "3", title: "Lectura: El Quijote (Cap. 1-5)", course: "Literatura", dueDate: "Lunes, 08:00", completed: true },
];

/**
 * Componente principal de la página de Tareas.
 * Muestra y gestiona la lista de tareas pendientes y completadas.
 */
export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    /**
     * Alterna el estado de completado de una tarea.
     * @param id - Identificador de la tarea
     */
    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    /**
     * Maneja el envío del formulario para añadir una nueva tarea.
     */
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            course: "General",
            dueDate: "Sin fecha",
            completed: false
        };

        setTasks([newTask, ...tasks]);
        setNewTaskTitle("");
        setIsAdding(false);
    };

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tareas</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus entregas y proyectos.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="gap-2">
                    <Plus size={18} /> Nueva Tarea
                </Button>
            </header>

            {/* Formulario Nueva Tarea */}
            {isAdding && (
                <Card className="border-primary-200 shadow-md ring-1 ring-primary-100">
                    <CardContent className="p-4">
                        <form onSubmit={handleAddTask} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <Input
                                    autoFocus
                                    label="Título de la tarea"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    placeholder="Ej: Estudiar para el parcial..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                                <Button type="submit">Guardar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista Principal */}
                <div className="lg:col-span-2 space-y-6">

                    <section>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            Pendientes <span className="bg-primary-100 text-primary-700 py-0.5 px-2.5 rounded-full text-xs">{pendingTasks.length}</span>
                        </h2>
                        <div className="space-y-3">
                            {pendingTasks.length === 0 ? (
                                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500">
                                    ¡Todo al día! No tienes tareas pendientes.
                                </div>
                            ) : (
                                pendingTasks.map(task => (
                                    <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
                                ))
                            )}
                        </div>
                    </section>

                    {completedTasks.length > 0 && (
                        <section className="opacity-75">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                Completadas <span className="bg-slate-200 text-slate-600 py-0.5 px-2.5 rounded-full text-xs">{completedTasks.length}</span>
                            </h2>
                            <div className="space-y-3">
                                {completedTasks.map(task => (
                                    <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Panel Lateral Tasks */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="secondary" className="w-full justify-start text-left">Todas las materias</Button>
                            <Button variant="ghost" className="w-full justify-start text-left">Matemáticas</Button>
                            <Button variant="ghost" className="w-full justify-start text-left">Historia</Button>
                            <Button variant="ghost" className="w-full justify-start text-left">Literatura</Button>
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
function TaskItem({ task, onToggle }: { task: Task, onToggle: () => void }) {
    return (
        <div className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm hover:border-primary-300'}`}>
            <button
                onClick={onToggle}
                className={`shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-slate-300 hover:text-primary-500'}`}
            >
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>

            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold truncate transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {task.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className={`font-medium px-2 py-0.5 rounded-md ${task.completed ? 'bg-slate-200 text-slate-600' : 'bg-primary-50 text-primary-700'}`}>
                        {task.course}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                        {task.dueDate}
                    </span>
                </div>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                <MoreVertical size={18} />
            </button>
        </div>
    );
}
