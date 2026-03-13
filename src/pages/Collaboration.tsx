import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Send, Search, Users, Video } from "lucide-react";

/**
 * Página de Colaboración (Grupos, Mensajes, Peers)
 */
export default function CollaborationPage() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Colaboración</h1>
                    <p className="text-slate-500 mt-1">Chat y grupos de estudio con otros alumnos.</p>
                </div>
                <Button className="gap-2">
                    <Users size={18} /> Nuevo Grupo
                </Button>
            </header>

            <Card className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr]">

                {/* Sidebar Chats */}
                <div className="border-r border-slate-200 bg-slate-50/50 flex flex-col">
                    <div className="p-4 border-b border-slate-200 max-w-full">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full">
                        <ChatItem active name="Grupo: Proyecto Historia" message="Juan: Ya terminé mi parte" time="10:42 AM" />
                        <ChatItem name="Dudas Matemáticas" message="¿Alguien entendió el ejer..." time="Ayer" />
                        <ChatItem name="Ana García" message="Te paso los apuntes luego" time="Mar 12" />
                    </div>
                </div>

                {/* Zona Chat */}
                <div className="flex flex-col bg-white">
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white w-full">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">Grupo: Proyecto Historia</span>
                            <span className="text-xs text-slate-500 font-medium">4 miembros en línea</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-full"><Video size={18} /></Button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-4 w-full">
                        <div className="text-center w-full">
                            <span className="text-xs font-semibold text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">Hoy</span>
                        </div>

                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">L</div>
                            <div>
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-sm text-slate-700">
                                    Hola a todos, ¿a qué hora nos conectamos hoy para revisar la presentación?
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 ml-1 block">10:30 AM</span>
                            </div>
                        </div>

                        <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">Y</div>
                            <div>
                                <div className="bg-primary-600 p-3 rounded-2xl rounded-tr-none shadow-sm text-sm text-white">
                                    Yo puedo después de las 5PM, cuando termine el taller.
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 mr-1 block text-right">10:35 AM</span>
                            </div>
                        </div>

                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">J</div>
                            <div>
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-sm text-slate-700">
                                    Excelente, yo ya terminé mi parte. La subo a Google Docs.
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 ml-1 block">10:42 AM</span>
                            </div>
                        </div>

                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <form className="flex gap-2 max-w-full">
                            <Input className="flex-1 bg-slate-50 border-slate-200" placeholder="Escribe un mensaje..." />
                            <Button type="button" className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center p-0">
                                <Send size={18} className="translate-x-px translate-y-px" />
                            </Button>
                        </form>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function ChatItem({ name, message, time, active = false }: { name: string, message: string, time: string, active?: boolean }) {
    return (
        <div className={`p-4 border-b border-slate-100 cursor-pointer transition-colors max-w-full ${active ? 'bg-white border-l-4 border-l-primary-500' : 'hover:bg-slate-100/50 border-l-4 border-l-transparent'}`}>
            <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{name}</h4>
                <span className="text-xs text-slate-400 shrink-0 font-medium">{time}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">{message}</p>
        </div>
    );
}
