import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Database,
  Lock,
  HardDrive,
  Globe,
  UserCheck,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import logoMts from '../../assets/logo.svg';

const SECTIONS = [
  { id: 'responsable', title: '1. Responsable y alcance', icon: FileText },
  { id: 'datos', title: '2. Datos que recopilamos', icon: Database },
  { id: 'finalidades', title: '3. Finalidad del tratamiento', icon: UserCheck },
  { id: 'sesiones', title: '4. Sesiones y almacenamiento PWA', icon: HardDrive },
  { id: 'terceros', title: '5. Terceros y Google OAuth', icon: Globe },
  { id: 'seguridad', title: '6. Seguridad técnica', icon: Lock },
  { id: 'derechos', title: '7. Derechos y revocación', icon: ShieldCheck },
];

export const PrivacyPolicyPage = () => {
  const token = useAuth((state) => state.token);
  const refreshToken = useAuth((state) => state.refreshToken);
  const isLoggedIn = !!(token || refreshToken);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Política de privacidad · MTS Plataforma';
    window.scrollTo({ top: 0, behavior: 'auto' });
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#66530F] selection:text-white">
      {/* Enlace de accesibilidad para lectores de pantalla y teclado */}
      <a
        href="#contenido-privacidad"
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
        id="contenido-privacidad"
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
      >
        {/* Cabecera del documento */}
        <div className="bg-[#101012] border border-zinc-800/90 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-poppins font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Documento público de privacidad</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">
            Política de privacidad
          </h1>

          <p className="text-sm text-zinc-300 mt-2.5 leading-relaxed max-w-3xl">
            En <strong className="text-white font-semibold">MTS Ingeniería Industrial</strong>{' '}
            protegemos la confidencialidad de los operadores, clientes y datos operativos procesados
            a través de nuestra plataforma administrativa y su API de servicios.
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
              aria-label="Índice de la política de privacidad"
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

          {/* Secciones legales y técnicas */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Responsable y alcance */}
            <section
              id="responsable"
              aria-labelledby="h-responsable"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-responsable"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span>1. Responsable y alcance</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Esta política describe cómo la plataforma web{' '}
                <span className="text-zinc-100 font-medium">MTS Plataforma</span> (
                <code className="text-xs text-amber-300 bg-zinc-900 px-1.5 py-0.5 rounded">administracion.ingenieriamts.com</code>
                ) y su servicio backend (
                <code className="text-xs text-amber-300 bg-zinc-900 px-1.5 py-0.5 rounded">api.ingenieriamts.com</code>
                ) recopilan, procesan y resguardan la información necesaria para la gestión
                administrativa, elaboración de cotizaciones industriales y control presupuestal de
                gastos.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Este documento es de carácter público y accesible sin necesidad de iniciar sesión.
              </p>
            </section>

            {/* 2. Datos que recopilamos */}
            <section
              id="datos"
              aria-labelledby="h-datos"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3.5"
            >
              <h2
                id="h-datos"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-amber-400 shrink-0" />
                <span>2. Datos que recopilamos</span>
              </h2>

              <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <h3 className="text-xs font-poppins font-semibold text-white">
                    a) Datos de cuenta mediante Google OAuth 2.0
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    El registro requiere un código de invitación único emitido por un administrador.
                    Al autenticarte con Google, nuestro servidor verifica tu credencial y almacena
                    únicamente: identificador único de Google (<code className="text-xs text-zinc-200">google_id</code>),
                    nombre, correo electrónico verificado, rol operativo (administrador o empleado)
                    y estado de activación. <strong className="text-zinc-100">No solicitamos ni almacenamos contraseñas locales.</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <h3 className="text-xs font-poppins font-semibold text-white">
                    b) Información operativa y comercial
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Para cumplir las funciones del sistema, los usuarios autorizados registran:
                    directorio de clientes (razón social, dirección fiscal y correo de contacto),
                    plantas o sucursales (número o clave y ubicación), presupuestos y partidas
                    cotizadas (folios, nombre del proyecto, contacto de atención y montos), datos
                    fiscales de MTS para membretes PDF y comprobaciones de gastos reales vinculadas
                    al usuario que las captura.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <h3 className="text-xs font-poppins font-semibold text-white">
                    c) Datos técnicos transitorios de red
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Para prevenir abusos y ataques automatizados, el servidor procesa la dirección
                    IP de la solicitud exclusivamente en memoria temporal (ventana deslizante de 60
                    segundos para control de tasa o <em>rate limiting</em>). No mantenemos un
                    historial permanente de direcciones IP en la base de datos.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Finalidad del tratamiento */}
            <section
              id="finalidades"
              aria-labelledby="h-finalidades"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-finalidades"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3. Finalidad del tratamiento</span>
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300 leading-relaxed">
                <li>
                  Validar tu identidad con Google OAuth 2.0 y controlar el alta segura de cuentas
                  mediante códigos de invitación con expiración.
                </li>
                <li>
                  Aplicar control de acceso basado en roles: los administradores gestionan toda la
                  operación, mientras los operadores con rol empleado únicamente acceden a los
                  proyectos asignados para registrar gastos.
                </li>
                <li>
                  Generar cotizaciones comerciales y documentos PDF oficiales con el membrete de
                  MTS Ingeniería Industrial.
                </li>
                <li>
                  Mantener la integridad contable entre presupuestos cotizados y gastos reales
                  ejecutados.
                </li>
              </ul>
            </section>

            {/* 4. Sesiones y almacenamiento en el navegador */}
            <section
              id="sesiones"
              aria-labelledby="h-sesiones"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-sesiones"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                <span>4. Sesiones y almacenamiento en el navegador (PWA)</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                La aplicación utiliza tokens JWT firmados (<code className="text-xs text-zinc-200">HS256</code>)
                con vigencia de 60 minutos para acceso a la API y un token de renovación de hasta
                30 días con rotación automática para mantener la continuidad en dispositivos móviles
                y PWA.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Para ello, el navegador guarda únicamente en <code className="text-xs text-zinc-200">localStorage</code>{' '}
                los tokens de sesión y los datos básicos de tu perfil autenticado. Adicionalmente, el
                backend aplica control de <strong className="text-zinc-100">sesión única activa</strong>{' '}
                (<code className="text-xs text-zinc-200">active_session_id</code>), por lo que
                iniciar sesión en un nuevo dispositivo revoca de inmediato la sesión anterior.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                No utilizamos cookies de rastreo publicitario, perfiles de comportamiento ni
                herramientas de analítica comercial de terceros.
              </p>
            </section>

            {/* 5. Terceros y Google OAuth */}
            <section
              id="terceros"
              aria-labelledby="h-terceros"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-terceros"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <span>5. Transferencias y servicios de terceros</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                El único proveedor externo vinculado al tratamiento de datos de identidad es{' '}
                <strong className="text-white font-semibold">Google LLC (Google OAuth 2.0)</strong>,
                empleado exclusivamente para validar tu sesión y comprobar que tu correo electrónico
                esté verificado bajo nuestro identificador de cliente autorizado.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                MTS Ingeniería Industrial no vende, alquila ni comparte los datos de operadores,
                clientes, plantas, cotizaciones o gastos con terceros ajenos a su operación interna.
              </p>
            </section>

            {/* 6. Medidas de seguridad */}
            <section
              id="seguridad"
              aria-labelledby="h-seguridad"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-seguridad"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>6. Medidas de seguridad técnica</span>
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300 leading-relaxed">
                <li>
                  Transporte cifrado mediante TLS/HTTPS con políticas estrictas de seguridad de
                  transporte (HSTS en producción) y validación de hosts confiables.
                </li>
                <li>
                  Cabeceras HTTP de protección (<code className="text-xs text-zinc-200">X-Frame-Options: DENY</code>,{' '}
                  <code className="text-xs text-zinc-200">X-Content-Type-Options: nosniff</code>,{' '}
                  <code className="text-xs text-zinc-200">Content-Security-Policy</code> y{' '}
                  <code className="text-xs text-zinc-200">Cache-Control: no-store</code> en rutas de la API).
                </li>
                <li>
                  Política estricta de CORS restringida al dominio oficial de la plataforma, límite
                  de tamaño en peticiones (1 MB) y bloqueo contra accesos locales no autorizados
                  durante la compilación de documentos PDF.
                </li>
                <li>
                  Borrado lógico en registros comerciales y financieros para preservar auditoría e
                  integridad referencial sin exponer registros archivados.
                </li>
              </ul>
            </section>

            {/* 7. Derechos y revocación */}
            <section
              id="derechos"
              aria-labelledby="h-derechos"
              className="scroll-mt-20 bg-[#101012] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h2
                id="h-derechos"
                className="text-base sm:text-lg font-heading font-semibold text-white flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>7. Derechos del titular, revocación y contacto</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                En todo momento puedes cerrar sesión desde la plataforma, acción que revoca de
                inmediato tu identificador de sesión en el servidor y elimina los tokens guardados
                en tu navegador. También puedes revocar el acceso otorgado a esta aplicación
                directamente desde los permisos de seguridad de tu Cuenta de Google.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Si necesitas consultar, actualizar, rectificar o solicitar la desactivación o
                eliminación de tus datos personales conforme a los derechos ARCO, comunícate con la
                administración de <strong className="text-white font-semibold">MTS Ingeniería Industrial</strong>{' '}
                a través del correo corporativo registrado en los membretes oficiales de la empresa.
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
              to="/terminos"
              className="text-zinc-400 hover:text-amber-400 underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
            >
              Condiciones del servicio
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

export default PrivacyPolicyPage;
