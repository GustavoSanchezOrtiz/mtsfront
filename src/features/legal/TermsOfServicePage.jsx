import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  UserCheck,
  Briefcase,
  Lock,
  Building2,
  Clock,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import logoMts from '../../assets/logo.svg';

const SECTIONS = [
  { id: 'aceptacion', title: '1. Aceptación y acceso restringido', icon: UserCheck },
  { id: 'uso-permitido', title: '2. Uso permitido', icon: Briefcase },
  { id: 'seguridad-sesiones', title: '3. Seguridad de la cuenta y sesiones', icon: Lock },
  { id: 'propiedad-disponibilidad', title: '4. Disponibilidad y propiedad intelectual', icon: Building2 },
];

export const TermsOfServicePage = () => {
  const token = useAuth((state) => state.token);
  const refreshToken = useAuth((state) => state.refreshToken);
  const isLoggedIn = !!(token || refreshToken);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Condiciones del servicio · MTS Plataforma';
    window.scrollTo({ top: 0, behavior: 'auto' });
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#66530F] selection:text-white">
      {/* Enlace de accesibilidad para lectores de pantalla y teclado */}
      <a
        href="#contenido-terminos"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-amber-400 focus:text-zinc-950 focus:font-semibold focus:text-xs focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Encabezado público accesible */}
      <header className="sticky top-0 z-40 h-14 backdrop-blur-2xl backdrop-saturate-150 bg-zinc-900/80 border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-3">
          <Link
            to={isLoggedIn ? '/' : '/login'}
            className="flex items-center gap-2.5 shrink-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title={isLoggedIn ? 'Ir al panel principal' : 'Ir al inicio de sesión'}
          >
            <img
              src={logoMts}
              alt="MTS Ingeniería Industrial"
              className="h-7 sm:h-8 w-auto object-contain select-none"
            />
          </Link>

          <Link
            to={isLoggedIn ? '/' : '/login'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-poppins font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>{isLoggedIn ? 'Volver al panel' : 'Volver al acceso'}</span>
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main
        id="contenido-terminos"
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
      >
        {/* Cabecera del documento */}
        <div className="bg-[#101012] border border-zinc-800/90 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-poppins font-medium mb-3">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>Documento público legal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">
            Condiciones del Servicio — MTS Plataforma
          </h1>

          <p className="text-sm text-zinc-300 mt-2.5 leading-relaxed max-w-3xl">
            Lineamientos operativos, de acceso y de seguridad aplicables al uso de la plataforma
            administrativa de <strong className="text-white font-semibold">MTS Ingeniería Industrial</strong>{' '}
            y su servicio API asociado.
          </p>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400 font-poppins">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Última actualización: noviembre de 2026</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>Aplicación: administracion.ingenieriamts.com</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Índice de navegación rápida */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20">
            <nav
              aria-label="Índice de condiciones del servicio"
              className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 space-y-1.5"
            >
              <p className="text-xs font-poppins font-semibold text-zinc-400 px-2.5 pb-1.5 border-b border-zinc-800/70">
                Contenido del documento
              </p>
              <ul className="space-y-1 pt-1">
                {SECTIONS.map(({ id, title, icon: Icon }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-poppins text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <Icon className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                      <span>{title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Secciones */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Aceptación y acceso restringido */}
            <section
              id="aceptacion"
              aria-labelledby="h-aceptacion"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-aceptacion"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>1. Aceptación y acceso restringido</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                El acceso y uso de{' '}
                <span className="text-zinc-100 font-medium">MTS Plataforma</span> (
                <code className="text-xs text-amber-300 bg-zinc-900 px-1.5 py-0.5 rounded">administracion.ingenieriamts.com</code>
                ) está reservado exclusivamente para personal, operadores y administradores
                autorizados de <strong className="text-white font-semibold">MTS Ingeniería Industrial</strong>.
                El registro requiere un código de invitación válido emitido por un administrador.
              </p>
            </section>

            {/* 2. Uso permitido */}
            <section
              id="uso-permitido"
              aria-labelledby="h-uso-permitido"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-uso-permitido"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                <span>2. Uso permitido</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Los usuarios autorizados se comprometen a utilizar la plataforma únicamente para
                fines operativos internos de la empresa, incluyendo la gestión de clientes, plantas,
                presupuestos comerciales, cotizaciones y comprobación de gastos asignados. Queda
                prohibido compartir credenciales, códigos de invitación o extraer información
                comercial para fines ajenos a MTS Ingeniería Industrial.
              </p>
            </section>

            {/* 3. Seguridad de la cuenta y sesiones */}
            <section
              id="seguridad-sesiones"
              aria-labelledby="h-seguridad-sesiones"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-seguridad-sesiones"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3. Seguridad de la cuenta y sesiones</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                El acceso se realiza mediante Google OAuth 2.0. Por seguridad operativa, el sistema
                mantiene una única sesión activa por usuario; iniciar sesión en un nuevo dispositivo
                cerrará automáticamente la sesión anterior. Cada usuario es responsable de la
                actividad realizada bajo su cuenta.
              </p>
            </section>

            {/* 4. Disponibilidad y propiedad intelectual */}
            <section
              id="propiedad-disponibilidad"
              aria-labelledby="h-propiedad-disponibilidad"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-propiedad-disponibilidad"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>4. Disponibilidad y propiedad intelectual</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                El software, la interfaz, los formatos de membrete y los datos generados dentro de
                la plataforma son propiedad exclusiva de MTS Ingeniería Industrial. La administración
                se reserva el derecho de suspender o revocar el acceso de cualquier cuenta en caso
                de baja laboral, cambio de rol o uso indebido.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Pie de página accesible */}
      <footer className="border-t border-zinc-800/70 py-6 px-4 sm:px-6 text-center text-xs text-zinc-500 font-poppins">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MTS Ingeniería Industrial · Plataforma Administrativa</span>
          <div className="flex items-center gap-4">
            <Link
              to="/privacidad"
              className="text-zinc-400 hover:text-amber-400 underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
            >
              Política de privacidad
            </Link>
            <Link
              to={isLoggedIn ? '/' : '/login'}
              className="text-zinc-400 hover:text-amber-400 underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
            >
              {isLoggedIn ? 'Ir al panel principal' : 'Ir a iniciar sesión'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
