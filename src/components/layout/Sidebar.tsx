import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, CalendarDays, Users } from "lucide-react";

/**
 * Componente de barra lateral (Sidebar) para navegación del Dashboard.
 */
export default function Sidebar() {
    const links = [
        { to: "/dashboard", label: "Inicio", icon: <LayoutDashboard size={20} /> },
        { to: "/dashboard/tasks", label: "Tareas", icon: <CheckSquare size={20} /> },
        { to: "/dashboard/exams", label: "Exámenes", icon: <CalendarDays size={20} /> },
        { to: "/dashboard/collab", label: "Colaboración", icon: <Users size={20} /> },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
            <div className="p-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-primary-600 font-sans tracking-tight">StudentDash</h1>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium
              ${isActive
                                ? "bg-primary-50 text-primary-600"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`
                        }
                        end={link.to === "/dashboard"}
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 text-sm text-slate-500 text-center">
                © 2026 StudentDash
            </div>
        </aside>
    );
}
