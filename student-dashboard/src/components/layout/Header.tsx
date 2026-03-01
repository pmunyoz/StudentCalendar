import { Bell, Search, User } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Cabecera superior del Dashboard
 */
export default function Header() {
    return (
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <label className="relative hidden sm:block w-full max-w-sm">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar tareas, exámenes..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                    />
                </label>
            </div>

            <div className="flex items-center gap-4">
                <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors">
                    <span className="text-lg leading-none">+</span> Añadir Evento
                </button>

                <button className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                <Link to="/login" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                        <User size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                        John Doe
                    </span>
                </Link>
            </div>
        </header>
    );
}
