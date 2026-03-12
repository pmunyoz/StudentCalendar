import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { CheckCircle2, CalendarDays, TrendingUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/**
 * Página principal del Dashboard (Resumen)
 */
export default function DashboardPage() {
    const { userName } = useAuth();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hola, {userName} 👋</h1>
                <p className="text-slate-500 mt-1">Aquí tienes un resumen de tu actividad académica.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 font-medium text-sm mb-1">Tareas Pendientes</h3>
                                <span className="text-4xl font-bold text-slate-800">12</span>
                            </div>
                            <div className="p-3 bg-blue-50 text-primary-600 rounded-xl">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-auto">
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">3 finalizadas hoy</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-slate-500 font-medium text-sm mb-1">Próximo Examen</h3>
                                <span className="text-2xl font-bold text-slate-800 tracking-tight block leading-tight">Estructura de Datos</span>
                            </div>
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <CalendarDays size={24} />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-sm text-red-600 font-medium bg-red-50 inline-block px-3 py-1 rounded-lg">Lunes 15 Nov, 09:00 AM</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 font-medium text-sm mb-1">Progreso General</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-primary-600">85%</span>
                                </div>
                            </div>
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div className="mt-auto w-full">
                            <div className="flex justify-between items-center text-xs text-slate-500 mb-1 font-medium">
                                <span>Media de calificaciones</span>
                                <span>Excelente</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Section placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-slate-500 p-8">No hay actividad para mostrar hoy.</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Comunidad y Anuncios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-slate-500 p-8">Mantente al tanto de las novedades.</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
