import { Helmet } from "react-helmet-async";

export function SecurityHeaders() {
    return (
        <Helmet>
            {/* OWASP A05: Security Misconfiguration - Previene ataques Clickjacking */}
            <meta http-equiv="X-Frame-Options" content="DENY" />

            {/* Evita el escaneo de tipos MIME */}
            <meta http-equiv="X-Content-Type-Options" content="nosniff" />

            {/* Controla la información enviada en el encabezado Referer */}
            <meta name="referrer" content="strict-origin-when-cross-origin" />

            {/* OWASP A03: Injection - Content Security Policy (modo lectura/UI por ahora) 
          Permite recursos del mismo origen y conexiones al backend de Supabase. */}
            <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' https://ysyciivfxtdixktnkujl.supabase.co;" />

            {/* Sugiere la actualización de solicitudes inseguras (A02: Cryptographic Failures) */}
            <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />

            {/* Restringe qué características del navegador se pueden usar */}
            <meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />
        </Helmet>
    );
}
