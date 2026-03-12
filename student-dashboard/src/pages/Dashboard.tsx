import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { taskService, type Task } from "../services/taskService";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { 
    CheckCircle2, 
    CalendarDays, 
    TrendingUp, 
    Loader2, 
    Circle, 
    Clock, 
    AlertTriangle,
    ArrowUpRight,
    BookOpen,
    Quote
} from "lucide-react";

/**
 * Página principal del Dashboard (Resumen)
 * Organizada en 3 pilares: Tareas, Exámenes y Progreso.
 */
export default function DashboardPage() {
    const { user, userName } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Listado de frases motivadoras de eruditos
    const quotes = useMemo(() => [
        { text: "La inteligencia consiste no solo en el conocimiento, sino también en la destreza de aplicar los conocimientos en la práctica.", author: "Aristóteles" },
        { text: "Lo que con mucho trabajo se adquiere, más se ama.", author: "Aristóteles" },
        { text: "No hay camino para la paz, la paz es el camino.", author: "Mahatma Gandhi" },
        { text: "Vive como si fueras a morir mañana. Aprende como si fueras a vivir siempre.", author: "Mahatma Gandhi" },
        { text: "Solo sé que no sé nada.", author: "Sócrates" },
        { text: "La educación es el arma más poderosa que puedes usar para cambiar el mundo.", author: "Nelson Mandela" },
        { text: "El genio se hace con un 1% de talento y un 99% de trabajo.", author: "Albert Einstein" },
        { text: "No he fallado. Simplemente he encontrado 10.000 formas que no funcionan.", author: "Thomas Edison" },
        { text: "El aprendizaje nunca agota la mente.", author: "Leonardo da Vinci" },
        { text: "Sapere aude. Ten el valor de usar tu propia razón.", author: "Immanuel Kant" }
    ], []);

    // Seleccionar una frase basada en el día actual para que cambie a diario
    const dailyQuote = useMemo(() => {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        return quotes[dayOfYear % quotes.length];
    }, [quotes]);

    // Lógica de saludo dinámico
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return "Buenos días";
        if (hour >= 12 && hour < 20) return "Buenas tardes";
        return "Buenas noches";
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await taskService.getTasks(user.id);
            setTasks(data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    
    // Tareas con fecha límite próxima (próximos 3 días)
    const urgentTasks = pendingTasks
        .filter(t => {
            if (!t.due_date) return false;
            const dueDate = new Date(t.due_date);
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 3;
        })
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

    const progressPercentage = tasks.length > 0 
        ? Math.round((completedTasks.length / tasks.length) * 100) 
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="font-outfit">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        {greeting}, <span className="text-primary-600">{userName}</span> 👋
                    </h1>
                    <div className="mt-4 max-w-2xl relative">
                        <Quote className="absolute -left-6 -top-2 text-slate-100 w-12 h-12 -z-10 rotate-12" />
                        <p className="text-slate-600 italic font-medium text-lg leading-relaxed">
                            "{dailyQuote.text}"
                        </p>
                        <p className="text-primary-500 font-bold text-sm mt-2 flex items-center gap-2">
                            <span className="w-4 h-[2px] bg-primary-200"></span> {dailyQuote.author}
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* COLUMNA 1: TAREAS (Unificada) */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                <CheckCircle2 size={20} className="text-primary-600" />
                                Tareas
                            </CardTitle>
                            <button 
                                onClick={() => navigate('/dashboard/tasks')}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                            >
                                Gestionar <ArrowUpRight size={14} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Resumén rápido */}
                            <div className="bg-linear-to-br from-primary-500 to-primary-700 p-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="text-center p-3 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pendientes</p>
                                        <p className="text-2xl font-black text-slate-800">{pendingTasks.length}</p>
                                    </div>
                                    <div className="text-center p-3 bg-emerald-50/30 rounded-2xl shadow-sm ring-1 ring-emerald-100/50 flex-1">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Completadas</p>
                                        <p className="text-2xl font-black text-emerald-700">{completedTasks.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Alertas Urgentes */}
                            {urgentTasks.length > 0 && (
                                <div className="p-4 bg-orange-50/50 border-b border-orange-100/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle size={14} className="text-orange-600" />
                                        <span className="text-[10px] font-black text-orange-700 uppercase tracking-tight">¡Atención! Próximas entregas</span>
                                    </div>
                                    <div className="space-y-2">
                                        {urgentTasks.slice(0, 3).map(task => (
                                            <div key={task.id} className="bg-white p-2 rounded-lg ring-1 ring-orange-200/50 shadow-sm flex items-center justify-between text-xs transition-transform hover:translate-x-1 cursor-pointer" onClick={() => navigate('/dashboard/tasks')}>
                                                <span className="truncate font-semibold text-slate-700 max-w-[150px]">{task.title}</span>
                                                <span className="font-bold text-orange-600 shrink-0">
                                                    {(() => {
                                                        const diff = Math.ceil((new Date(task.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        return diff === 0 ? 'Hoy' : `en ${diff}d`;
                                                    })()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Listado Reciente */}
                            <div className="p-2">
                                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actividad Reciente</p>
                                {tasks.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-sm">No hay tareas registradas.</div>
                                ) : (
                                    <div className="space-y-1">
                                        {tasks.slice(0, 5).map(task => (
                                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                {task.completed ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <Circle size={16} className="text-slate-300 shrink-0 group-hover:text-primary-400" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                        {task.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {task.subject && (
                                                            <span className="text-[9px] font-black text-primary-600 uppercase">
                                                                {task.subject.name}
                                                            </span>
                                                        )}
                                                        {task.completed && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Listo</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMNA 2: EXÁMENES */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                <CalendarDays size={20} className="text-red-500" />
                                Exámenes
                            </CardTitle>
                            <button 
                                onClick={() => navigate('/dashboard/exams')}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                            >
                                Calendario <ArrowUpRight size={14} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Proximo Examen Highlight */}
                            <div className="relative overflow-hidden bg-linear-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-200">
                                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-red-100 uppercase tracking-widest mb-1">Próximo Reto</p>
                                        <h3 className="text-xl font-bold leading-tight">Estructura de Datos I</h3>
                                        <p className="text-xs text-red-100 mt-1 font-medium italic opacity-90">"Faltan solo 3 días, ¡revisa tus apuntes!"</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-red-400/30 p-3 rounded-xl backdrop-blur-sm self-start">
                                        <Clock size={16} />
                                        <div className="text-xs">
                                            <p className="font-black">Lunes, 15 de Nov</p>
                                            <p className="opacity-80">09:00 AM • Aula 302</p>
                                        </div>
                                    </div>
                                </div>
                                <CalendarDays className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                            </div>

                            {/* Otros Exámenes Mock */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Agenda de Exámenes</h4>
                                <div className="space-y-4">
                                    {[
                                        { title: "Matemática Discreta", date: "22 Nov", color: "bg-blue-500" },
                                        { title: "Sistemas Operativos", date: "28 Nov", color: "bg-purple-500" },
                                        { title: "Base de Datos", date: "05 Dic", color: "bg-emerald-500" }
                                    ].map((exam, i) => (
                                        <div key={i} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/dashboard/exams')}>
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-100 transition-colors group-hover:bg-primary-50">
                                                <span className="text-[8px] font-black text-slate-400 group-hover:text-primary-600 uppercase">{exam.date.split(' ')[1]}</span>
                                                <span className="text-xs font-black text-slate-700 group-hover:text-primary-700">{exam.date.split(' ')[0]}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate group-hover:text-primary-700 transition-colors">{exam.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${exam.color}`}></div>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase">Teórico • Presencial</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMNA 3: PROGRESO */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                <TrendingUp size={20} className="text-emerald-500" />
                                Progreso General
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center text-center">
                                {/* Circular Progress Mockup with SVG */}
                                <div className="relative w-40 h-40 mb-6 drop-shadow-xl">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            fill="transparent"
                                            className="text-slate-100"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            fill="transparent"
                                            strokeDasharray={440}
                                            strokeDashoffset={440 - (440 * progressPercentage) / 100}
                                            strokeLinecap="round"
                                            className="text-primary-500 transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-slate-800 tracking-tighter">{progressPercentage}%</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Completado</span>
                                    </div>
                                </div>

                                <div className="w-full space-y-4 text-left">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Resumen de carga</p>
                                            <p className="text-lg font-black text-primary-600">{tasks.length}</p>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">Tienes un total de {tasks.length} tareas registradas hasta la fecha.</p>
                                    </div>

                                    {/* Subject distribution mockup */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enfoque por Materia</p>
                                        {[
                                            { name: "Historia", count: 4, color: "bg-red-500", total: 6 },
                                            { name: "Conocimiento", count: 2, color: "bg-blue-500", total: 5 },
                                            { name: "Inglés", count: 1, color: "bg-emerald-500", total: 3 }
                                        ].map((sub, i) => (
                                            <div key={i} className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                                        <BookOpen size={12} className="text-slate-400" />
                                                        {sub.name}
                                                    </span>
                                                    <span className="text-slate-400 font-bold">{Math.round((sub.count / sub.total) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`${sub.color} h-full rounded-full transition-all duration-700`} style={{ width: `${(sub.count / sub.total) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
