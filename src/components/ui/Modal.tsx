import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

/**
 * Componente Modal genérico y elegante.
 * @param props Propiedades para configurar el modal (abierto, cerrar, título, contenido, footer)
 */
export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    // Cerrar con la tecla Esc
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            // Bloquear scroll del body cuando el modal está abierto
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop con desenfoque */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 ring-1 ring-slate-200">
                <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="p-6">
                    {children}
                </div>

                {footer && (
                    <footer className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

/**
 * Modal especializado para confirmaciones rápidas.
 */
export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "primary"
}: ConfirmationModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={() => { onConfirm(); onClose(); }}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p className="text-slate-600 leading-relaxed font-medium">
                {message}
            </p>
        </Modal>
    );
}
