import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * OWASP A09: Security Logging and Monitoring Failures.
 * Frontera de error de React que captura errores no controlados en el árbol de componentes.
 * Previene la revelación de información sensible (como trazas de la pila) al usuario final en la UI.
 */
export class SecurityErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Aquí se debería enviar el error a un servicio seguro de logging (ej. Sentry)
        // asegurándose de no incluir PII (Personal Identifiable Information).
        console.error("Uncaught error logged securely:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Algo salió mal</h2>
                        <p className="text-slate-500 mb-6">Hemos registrado el error y nuestro equipo está trabajando en ello.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700"
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
