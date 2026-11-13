import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Factory,
  FileText,
  Layers,
  Wallet,
  Building2,
  KeyRound,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../store/useAuth';
import LoginPage from '../features/auth/LoginPage';
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const ClientsPage = lazy(() => import('../features/clients/ClientsPage'));
const PlantsPage = lazy(() => import('../features/plants/PlantsPage'));
const QuotesPage = lazy(() => import('../features/quotes/QuotesPage'));
const QuoteItemsPage = lazy(() => import('../features/quote_items/QuoteItemsPage'));
const ExpensesPage = lazy(() => import('../features/expenses/ExpensesPage'));
const CompanyPage = lazy(() => import('../features/company/CompanyPage'));
const UsersPage = lazy(() => import('../features/users/UsersPage'));
import StaggeredMenu from '../components/StaggeredMenu';
import logoMts from '../assets/logo.svg';

/**
 * Guardián de Rutas Protegidas (Requiere sesión activa)
 */
export const ProtectedRoute = () => {
  const token = useAuth((state) => state.token);
  const refreshToken = useAuth((state) => state.refreshToken);

  if (!token && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * Guardián de Rutas Administrativas (Exclusivo rol 'admin')
 */
export const AdminRoute = () => {
  const user = useAuth((state) => state.user);

  if (user?.rol !== 'admin') {
    return <Navigate to="/gastos" replace />;
  }

  return <Outlet />;
};

/**
 * Layout Principal Industrial MTS con navegación filtrada por rol
 */
export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.rol === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAdmin
    ? [
        { to: '/', label: 'Inicio', icon: LayoutDashboard },
        { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
        { to: '/partidas', label: 'Partidas', icon: Layers },
        { to: '/gastos', label: 'Gastos', icon: Wallet },
        { to: '/clientes', label: 'Clientes', icon: Users },
        { to: '/plantas', label: 'Plantas', icon: Factory },
        { to: '/empresa', label: 'Empresa', icon: Building2 },
        { to: '/usuarios', label: 'Usuarios', icon: KeyRound },
      ]
    : [
        { to: '/', label: 'Inicio', icon: LayoutDashboard },
        { to: '/gastos', label: 'Gastos', icon: Wallet },
        { to: '/usuarios', label: 'Perfil', icon: UserCheck },
      ];

  const mobileNavItems = isAdmin
    ? [
        { label: 'Inicio', link: '/', ariaLabel: 'Ir al panel de inicio' },
        { label: 'Cotizaciones', link: '/cotizaciones', ariaLabel: 'Ir al módulo de cotizaciones' },
        { label: 'Partidas', link: '/partidas', ariaLabel: 'Ir al catálogo de partidas' },
        { label: 'Gastos', link: '/gastos', ariaLabel: 'Ir al módulo de gastos reales' },
        { label: 'Clientes', link: '/clientes', ariaLabel: 'Ir al directorio de clientes' },
        { label: 'Plantas', link: '/plantas', ariaLabel: 'Ir al directorio de plantas' },
        { label: 'Empresa', link: '/empresa', ariaLabel: 'Ir a configuración de Empresa MTS' },
        { label: 'Usuarios', link: '/usuarios', ariaLabel: 'Ir a usuarios e invitaciones' },
      ]
    : [
        { label: 'Inicio', link: '/', ariaLabel: 'Ir a mi resumen operativo' },
        { label: 'Gastos', link: '/gastos', ariaLabel: 'Registrar gastos de proyectos asignados' },
        { label: 'Perfil', link: '/usuarios', ariaLabel: 'Ver mi cuenta y proyectos asignados' },
      ];

  const mobileSocialItems = [
    {
      label:
        user?.nombre || user?.correo
          ? `Operador: ${user?.nombre || user?.correo}`
          : 'Sesión Operativa MTS',
      link: '/usuarios',
    },
    {
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#66530F] selection:text-white">
      <StaggeredMenu
        position="right"
        items={mobileNavItems}
        socialItems={mobileSocialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        changeMenuColorOnOpen={true}
        colors={['#18181b', '#27272a']}
        accentColor="#66530F"
        logoUrl={logoMts}
        onLogoClick={() => {
          if (location.pathname === '/') return;
          React.startTransition(() => {
            navigate('/');
          });
        }}
        isFixed={true}
        className="md:hidden"
        onItemClick={(e, item) => {
          if (item.link && item.link !== '#') {
            e.preventDefault();
            if (location.pathname === item.link) {
              return;
            }
            React.startTransition(() => {
              navigate(item.link);
            });
          }
        }}
      />

      {/* Header superior unificado (Functional Layer - Liquid Glass HIG) */}
      <header className="sticky top-0 z-50 h-14 backdrop-blur-2xl backdrop-saturate-150 bg-zinc-900/75 border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <Link to="/" className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a38418] rounded-lg" title="Inicio MTS">
            <img src={logoMts} alt="MTS" className="h-8 w-auto object-contain select-none" />
          </Link>

          <nav aria-label="Navegación principal" className="hidden md:flex items-center p-1 bg-zinc-950/70 border border-zinc-800/70 rounded-xl space-x-0.5 overflow-x-auto max-w-[calc(100vw-240px)]">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a38418] ${
                    isActive
                      ? 'btn-mts-primary font-semibold'
                      : 'border border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] font-medium'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            to="/usuarios"
            className="text-right hidden lg:block hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a38418] rounded-lg px-1"
            title="Ver perfil operativo"
          >
            <p className="text-xs font-medium text-zinc-200 leading-tight truncate max-w-[160px]">
              {user?.nombre || user?.correo || 'Operador'}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">
              {user?.rol === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-300 bg-zinc-900/80 hover:bg-rose-950/50 active:bg-rose-950/80 active:scale-[0.98] border border-zinc-800/80 hover:border-rose-800/60 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
            title="Cerrar Sesión Segura"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

/**
 * Enrutador Global MTS con protección RBAC
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/gastos" element={<ExpensesPage />} />
            <Route path="/usuarios" element={<UsersPage />} />

            {/* Módulos exclusivos de Administración */}
            <Route element={<AdminRoute />}>
              <Route path="/cotizaciones" element={<QuotesPage />} />
              <Route path="/partidas" element={<QuoteItemsPage />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/plantas" element={<PlantsPage />} />
              <Route path="/empresa" element={<CompanyPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
