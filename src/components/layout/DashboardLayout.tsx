import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.tsx";
import Header from "./Header.tsx";

/**
 * Layout principal del Dashboard
 * Contiene la barra lateral, cabecera y el área principal donde se renderizan las páginas.
 */
export default function DashboardLayout() {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800">
            {/* Barra lateral de navegación */}
            <Sidebar />

            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Cabecera superior con Notificaciones y Perfil */}
                <Header />

                {/* Área de contenido desplazable */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
