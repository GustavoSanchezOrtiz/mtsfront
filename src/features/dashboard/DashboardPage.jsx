import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  FileText,
  Users,
  Factory,
  Layers,
  Wallet,
  Building2,
  KeyRound,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Clock,
  Briefcase,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Calendar,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuth } from '../../store/useAuth';
import MagicBento from '../../components/MagicBento';
import GlideSelect from '../../components/GlideSelect';
import { Skeleton, DashboardMobileSkeleton } from '../../components/Skeleton';

const PAGE_LIMIT = 10;

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(num);
};

const formatShortDate = (iso) => {
  if (!iso) return 'Reciente';
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return 'Reciente';
  }
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const isAdmin = (user?.rol || '').toLowerCase() === 'admin';

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState('todos');
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [profile, setProfile] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [recentPlants, setRecentPlants] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [usersCount, setUsersCount] = useState(0);

  const monthFilterOptions = useMemo(() => {
    const opts = [
      {
        value: 'todos',
        label: 'Todos los meses',
        tag: String(selectedYear),
      },
    ];
    MONTH_NAMES.forEach((mName, idx) => {
      opts.push({
        value: String(idx + 1),
        label: mName.charAt(0).toUpperCase() + mName.slice(1),
        tag: String(selectedYear),
      });
    });
    return opts;
  }, [selectedYear]);

  const activeMonthName = useMemo(() => {
    if (selectedMonth === 'todos') return null;
    const idx = parseInt(selectedMonth, 10) - 1;
    return MONTH_NAMES[idx] || null;
  }, [selectedMonth]);

  const fetchDashboardTelemetry = async (monthOverride, yearOverride) => {
    setIsLoading(true);
    const activeMonth =
      typeof monthOverride === 'string'
        ? monthOverride
        : typeof monthOverride === 'number'
          ? String(monthOverride)
          : selectedMonth;
    const activeYear =
      typeof yearOverride === 'number'
        ? yearOverride
        : typeof yearOverride === 'string'
          ? parseInt(yearOverride, 10)
          : selectedYear;

    const filterParams = {};
    if (activeYear && !isNaN(activeYear)) filterParams.year = activeYear;
    if (activeMonth && activeMonth !== 'todos') {
      const parsedMonth = parseInt(activeMonth, 10);
      if (!isNaN(parsedMonth)) {
        filterParams.month = parsedMonth;
      }
    }

    const rootBaseUrl = (
      apiClient.defaults.baseURL || 'http://localhost:8000/api/v1'
    ).replace(/\/api\/v1\/?$/, '');

    if (isAdmin) {
      const [
        healthRes,
        meRes,
        summaryRes,
        quotesRes,
        clientsRes,
        plantsRes,
        expensesRes,
        companyRes,
        usersRes,
      ] = await Promise.allSettled([
        axios.get(`${rootBaseUrl}/health`, { timeout: 6000 }),
        apiClient.get('/usuarios/me'),
        apiClient.get('/cotizaciones/resumen-financiero', { params: filterParams }),
        apiClient.get(`/cotizaciones/?include_cancelled=true&skip=0&limit=${PAGE_LIMIT}`, {
          params: filterParams,
        }),
        apiClient.get(`/clientes/?skip=0&limit=${PAGE_LIMIT}`),
        apiClient.get(`/plantas/?skip=0&limit=${PAGE_LIMIT}`),
        apiClient.get(`/gastos-reales/?skip=0&limit=${PAGE_LIMIT}`, {
          params: filterParams,
        }),
        apiClient.get('/empresa-mts/'),
        apiClient.get('/usuarios/?skip=0&limit=100'),
      ]);

      setHealth(
        healthRes.status === 'fulfilled'
          ? healthRes.value.data
          : { status: 'degraded', app: 'MTS API' }
      );

      if (meRes.status === 'fulfilled' && meRes.value.data) {
        setProfile(meRes.value.data);
        updateUser(meRes.value.data);
      }

      setFinancialSummary(
        summaryRes.status === 'fulfilled' && summaryRes.value.data ? summaryRes.value.data : null
      );

      if (quotesRes.status === 'fulfilled' && Array.isArray(quotesRes.value.data)) {
        setRecentQuotes(quotesRes.value.data);
      }
      if (clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value.data)) {
        setRecentClients(clientsRes.value.data);
      }
      if (plantsRes.status === 'fulfilled' && Array.isArray(plantsRes.value.data)) {
        setRecentPlants(plantsRes.value.data);
      }
      if (expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value.data)) {
        setRecentExpenses(expensesRes.value.data);
      }
      if (companyRes.status === 'fulfilled') {
        setCompanyInfo(companyRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
        setUsersCount(usersRes.value.data.length);
      }
    } else {
      // Rol empleado: consulta únicamente sus proyectos asignados y sus gastos autorizados
      const [healthRes, meRes, quotesRes, expensesRes] = await Promise.allSettled([
        axios.get(`${rootBaseUrl}/health`, { timeout: 6000 }),
        apiClient.get('/usuarios/me'),
        apiClient.get('/cotizaciones/?skip=0&limit=50', { params: filterParams }),
        apiClient.get('/gastos-reales/?skip=0&limit=25', { params: filterParams }),
      ]);

      setHealth(
        healthRes.status === 'fulfilled'
          ? healthRes.value.data
          : { status: 'degraded', app: 'MTS API' }
      );

      if (meRes.status === 'fulfilled' && meRes.value.data) {
        setProfile(meRes.value.data);
        updateUser(meRes.value.data);
      }
      if (quotesRes.status === 'fulfilled' && Array.isArray(quotesRes.value.data)) {
        setRecentQuotes(quotesRes.value.data);
      }
      if (expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value.data)) {
        setRecentExpenses(expensesRes.value.data);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardTelemetry(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedMonth, selectedYear]);

  /**
   * Regla financiera (Administrador):
   * - Ingreso: suma ÚNICAMENTE cotizaciones en estado 'pagada'.
   * - Gasto Pendiente: suma ÚNICAMENTE cotizaciones en estado 'aceptada'.
   */
  const finanzas = useMemo(() => {
    if (financialSummary && financialSummary.conteo_pagadas !== undefined) {
      const ingreso = Number(financialSummary.ingreso) || 0;
      const gastoPendiente = Number(
        financialSummary.gasto_pendiente ?? financialSummary.saldo_pendiente ?? 0
      );
      const baseComprometida = ingreso + gastoPendiente;
      const gastosReales = Number(financialSummary.gastos_reales_totales) || 0;
      const porcentajeLiquidado =
        baseComprometida > 0 ? Math.min(100, Math.round((ingreso / baseComprometida) * 100)) : 0;

      return {
        ingreso,
        gastoPendiente,
        baseComprometida,
        gastosReales,
        balanceNeto: ingreso - gastosReales,
        porcentajeLiquidado,
        conteoPagadas: Number(financialSummary.conteo_pagadas) || 0,
        conteoAceptadas: Number(financialSummary.conteo_aceptadas) || 0,
        conteoEnviadas: Number(financialSummary.conteo_enviadas) || 0,
        conteoBorrador: Number(financialSummary.conteo_borrador) || 0,
      };
    }

    let ingreso = 0;
    let gastoPendiente = 0;
    let conteoPagadas = 0;
    let conteoAceptadas = 0;
    let conteoEnviadas = 0;
    let conteoBorrador = 0;

    recentQuotes.forEach((q) => {
      const monto = Number(q.total) || 0;
      const estado = (q.estado || 'borrador').toLowerCase();
      if (estado === 'pagada') {
        ingreso += monto;
        conteoPagadas += 1;
      } else if (estado === 'aceptada') {
        gastoPendiente += monto;
        conteoAceptadas += 1;
      } else if (estado === 'enviada') {
        conteoEnviadas += 1;
      } else if (estado === 'borrador') {
        conteoBorrador += 1;
      }
    });

    const baseComprometida = ingreso + gastoPendiente;
    const gastosReales = recentExpenses.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    const porcentajeLiquidado =
      baseComprometida > 0 ? Math.min(100, Math.round((ingreso / baseComprometida) * 100)) : 0;

    return {
      ingreso,
      gastoPendiente,
      baseComprometida,
      gastosReales,
      balanceNeto: ingreso - gastosReales,
      porcentajeLiquidado,
      conteoPagadas,
      conteoAceptadas,
      conteoEnviadas,
      conteoBorrador,
    };
  }, [financialSummary, recentQuotes, recentExpenses]);

  const operatorName = profile?.nombre || user?.nombre || user?.correo || 'Operador';
  const operatorRole = (profile?.rol || user?.rol || 'empleado').toLowerCase();
  const isHealthy = health?.status === 'healthy';

  const getVibrantQuoteBadge = (estado) => {
    const s = (estado || 'borrador').toLowerCase();
    if (s === 'pagada') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Pagada</span>
        </span>
      );
    }
    if (s === 'aceptada') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-amber-950/40 text-amber-400 border border-amber-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Aceptada</span>
        </span>
      );
    }
    if (s === 'enviada') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-zinc-800/70 text-zinc-300 border border-zinc-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span>Enviada</span>
        </span>
      );
    }
    if (s === 'cancelada') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-rose-950/30 text-rose-400 border border-rose-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Cancelada</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        <span>Borrador</span>
      </span>
    );
  };

  /**
   * Celdas MagicBento para ADMINISTRADOR (Paleta sobria corporativa, fondo carbón mate y acentos medidos)
   */
  const adminBentoItems = useMemo(
    () => [
      // 1. INGRESO (Pagadas) — Dorado sobrio centrado
      {
        id: 'ingreso-pagadas',
        title: 'Ingreso Cobrado',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 1,
        onClick: () => navigate('/cotizaciones'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-inter bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">
                  Ingreso · Cotizaciones pagadas {activeMonthName ? `(${activeMonthName})` : ''}
                </span>
                <span className="sm:hidden">
                  Ingreso {activeMonthName ? `(${activeMonthName})` : '(pagadas)'}
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-inter text-zinc-300 flex items-center gap-1">
                <span>{finanzas.conteoPagadas} pagadas</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-1">
              <p className="text-3xl sm:text-4xl font-inter font-bold text-white tracking-tight">
                {formatCurrency(finanzas.ingreso)}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Flujo efectivo confirmado por proyectos liquidados.
              </p>
            </div>
          </div>
        ),
      },

      // 2. GASTO PENDIENTE (Aceptadas) — Dorado sobrio centrado
      {
        id: 'gasto-pendiente-aceptadas',
        title: 'Gasto Pendiente',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 1,
        onClick: () => navigate('/cotizaciones'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-inter bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">
                  Gasto pendiente · Aceptadas {activeMonthName ? `(${activeMonthName})` : ''}
                </span>
                <span className="sm:hidden">
                  Gasto pendiente {activeMonthName ? `(${activeMonthName})` : ''}
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-inter text-zinc-300 flex items-center gap-1">
                <span>{finanzas.conteoAceptadas} aceptadas</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-1">
              <p className="text-3xl sm:text-4xl font-inter font-bold text-white tracking-tight">
                {formatCurrency(finanzas.gastoPendiente)}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Compromisos autorizados en ejecución pendientes de pago final.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[11px] font-inter text-zinc-400 truncate">Enviadas</span>
                <span className="text-[11px] font-inter font-semibold text-zinc-200 shrink-0">
                  {finanzas.conteoEnviadas} cot.
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[11px] font-inter text-zinc-400 truncate">Borradores</span>
                <span className="text-[11px] font-inter font-semibold text-zinc-200 shrink-0">
                  {finanzas.conteoBorrador} cot.
                </span>
              </div>
            </div>
          </div>
        ),
      },

      // 3. COTIZACIONES RECIENTES — Minimalista sobrio
      {
        id: 'cotizaciones-recientes',
        title: 'Cotizaciones Recientes',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 2,
        onClick: () => navigate('/cotizaciones'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-heading font-semibold text-white truncate">
                    Pulso Comercial · Cotizaciones
                  </h3>
                  <p className="text-[11px] font-inter text-zinc-400 truncate">
                    {activeMonthName
                      ? `Presupuestos registrados en ${activeMonthName} ${selectedYear}`
                      : 'Seguimiento de presupuestos y proyectos'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-xs font-inter text-zinc-300 flex items-center gap-1 shrink-0 hover:text-white transition-colors">
                <span>Explorar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {recentQuotes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <p className="text-xs font-inter text-zinc-500">Sin cotizaciones registradas aún.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between divide-y divide-zinc-800/60 overflow-hidden">
                {recentQuotes.slice(0, 5).map((q) => {
                  const estado = (q.estado || '').toLowerCase();
                  const isCancelled = estado === 'cancelada';
                  return (
                    <div
                      key={q.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/70 text-[11px] font-inter font-semibold">
                            {q.numero_presupuesto}
                          </span>
                          {getVibrantQuoteBadge(q.estado)}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-1">
                          {q.nombre_proyecto || 'Proyecto industrial'}
                        </p>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-inter font-semibold shrink-0 ${
                          isCancelled ? 'text-zinc-600 line-through' : 'text-zinc-200'
                        }`}
                      >
                        {formatCurrency(q.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-inter">
              <span className="text-zinc-500">Volumen comprometido (Pagadas + Aceptadas)</span>
              <span className="text-zinc-200 font-bold">
                {formatCurrency(finanzas.baseComprometida)}
              </span>
            </div>
          </div>
        ),
      },

      // 4. GASTOS REALES Y BALANCE — Sobrio industrial
      {
        id: 'gastos-reales',
        title: 'Gastos Reales y Balance',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 1,
        onClick: () => navigate('/gastos'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-white">
                    Erogaciones Reales y Margen
                  </h3>
                  <p className="text-[11px] font-inter text-zinc-400">
                    {activeMonthName
                      ? `Compras y gastos de ${activeMonthName} ${selectedYear}`
                      : 'Control de compras y gastos frente a ingresos'}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-[10px] font-inter text-zinc-500 block">
                  Gasto ejecutado
                </span>
                <span className="text-base sm:text-lg font-inter font-bold text-zinc-200 mt-0.5 block truncate">
                  {formatCurrency(finanzas.gastosReales)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-[10px] font-inter text-zinc-500 block">
                  Margen neto actual
                </span>
                <span
                  className={`text-base sm:text-lg font-inter font-bold mt-0.5 block truncate ${
                    finanzas.balanceNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(finanzas.balanceNeto)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-inter text-zinc-500">
              <span>Auditoría de compras por proyecto y partida</span>
              <span className="text-zinc-300 font-semibold hover:text-white transition-colors">Abrir Gastos →</span>
            </div>
          </div>
        ),
      },

      // 5. PARTIDAS — Carbón con acento ámbar MTS sutil
      {
        id: 'modulo-partidas',
        title: 'Partidas',
        tone: 'neutral',
        colSpan: 1,
        rowSpan: 1,
        onClick: () => navigate('/partidas'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <Layers className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-inter text-zinc-400">
                Catálogo
              </span>
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-white">Partidas</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Desglose técnico de alcances, volúmenes y precios unitarios.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-amber-400 transition-colors">
              <span>Ver conceptos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ),
      },

      // 6. CLIENTES — Carbón sobrio
      {
        id: 'modulo-clientes',
        title: 'Clientes',
        tone: 'neutral',
        colSpan: 1,
        rowSpan: 1,
        onClick: () => navigate('/clientes'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <Users className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-inter text-zinc-400">
                {recentClients.length}
                {recentClients.length === PAGE_LIMIT ? '+' : ''} empresas
              </span>
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-white">Clientes</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Cartera industrial, contactos ejecutivos y domicilios fiscales.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-white transition-colors">
              <span>Directorio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ),
      },

      // 7. PLANTAS — Carbón sobrio
      {
        id: 'modulo-plantas',
        title: 'Plantas',
        tone: 'neutral',
        colSpan: 1,
        rowSpan: 1,
        onClick: () => navigate('/plantas'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <Factory className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-inter text-zinc-400">
                {recentPlants.length}
                {recentPlants.length === PAGE_LIMIT ? '+' : ''} sedes
              </span>
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-white">Plantas</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Naves industriales, complejos y ubicaciones operativas.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-white transition-colors">
              <span>Ver plantas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ),
      },

      // 8. EMPRESA MTS — Carbón sobrio
      {
        id: 'modulo-empresa',
        title: 'Empresa MTS',
        tone: 'neutral',
        colSpan: 1,
        rowSpan: 1,
        onClick: () => navigate('/empresa'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-inter text-zinc-400 truncate max-w-[110px]">
                {companyInfo?.ciudad || 'Membrete'}
              </span>
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-white">Empresa MTS</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Identidad corporativa, teléfonos y datos para PDFs.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-amber-400 transition-colors">
              <span>Configurar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ),
      },

      // 9. USUARIOS Y ASIGNACIONES — Carbón sobrio
      {
        id: 'modulo-usuarios',
        title: 'Usuarios y Equipo',
        tone: 'neutral',
        colSpan: 1,
        rowSpan: 1,
        onClick: () => navigate('/usuarios'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-inter text-zinc-400">
                {usersCount || 1} usuarios
              </span>
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-white">Equipo y Roles</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Asignación de proyectos a operadores e invitaciones seguras.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-white transition-colors">
              <span>Gestionar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ),
      },

      // 10. ESTADO DE PLATAFORMA — Carbón sobrio con indicador de salud
      {
        id: 'estado-salud-api',
        title: 'Seguridad y API',
        tone: 'neutral',
        colSpan: 1,
        rowSpan: 1,
        onClick: () => fetchDashboardTelemetry(),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                {isHealthy ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-inter text-zinc-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span>{isHealthy ? 'PROTEGIDO' : 'REVISAR'}</span>
              </span>
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-white">
                {health?.app || 'MTS API'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-inter">
                {isHealthy ? 'Sesión única y CORS activos' : 'Verificando enlace...'}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-white transition-colors">
              <span>Sincronizar</span>
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      finanzas,
      recentQuotes,
      recentClients.length,
      recentPlants.length,
      companyInfo,
      usersCount,
      isHealthy,
      health,
      isLoading,
      navigate,
      activeMonthName,
      selectedYear,
    ]
  );

  /**
   * Celdas MagicBento para EMPLEADO (Proyectos asignados y registro rápido de gastos)
   */
  const employeeStats = useMemo(() => {
    const totalSpent = recentExpenses.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
    return {
      assignedCount: recentQuotes.length,
      expensesCount: recentExpenses.length,
      totalSpent,
    };
  }, [recentQuotes, recentExpenses]);

  const employeeBentoItems = useMemo(
    () => [
      {
        id: 'emp-proyectos-kpi',
        title: 'Proyectos Asignados',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 1,
        onClick: () => navigate('/gastos'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-inter bg-zinc-800 text-zinc-300 border border-zinc-700/70">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                <span>Mis proyectos asignados</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-inter text-zinc-400">
                Operador Activo
              </span>
            </div>
            <div>
              <p className="text-3xl font-inter font-bold text-white">
                {employeeStats.assignedCount}{' '}
                <span className="text-base font-normal text-zinc-400">
                  {employeeStats.assignedCount === 1 ? 'proyecto habilitado' : 'proyectos habilitados'}
                </span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Consulta y registro de gastos exclusivo para tus proyectos autorizados.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-white transition-colors">
              <span>Ir al módulo de gastos</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        ),
      },
      {
        id: 'emp-gastos-kpi',
        title: 'Gastos en Mis Proyectos',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 1,
        onClick: () => navigate('/gastos'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-inter bg-zinc-800 text-zinc-300 border border-zinc-700/70">
                <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                <span>Gastos registrados</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-inter text-zinc-400">
                {employeeStats.expensesCount} mov.
              </span>
            </div>
            <div>
              <p className="text-3xl font-inter font-bold text-white">
                {formatCurrency(employeeStats.totalSpent)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Acumulado reciente en tus proyectos asignados.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-inter text-zinc-400 hover:text-amber-400 transition-colors">
              <span>Registrar nuevo gasto</span>
              <PlusCircle className="w-4 h-4" />
            </div>
          </div>
        ),
      },
      {
        id: 'emp-lista-proyectos',
        title: 'Listado de Proyectos Asignados',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 2,
        onClick: () => navigate('/gastos'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-white">
                    Proyectos bajo tu Operación
                  </h3>
                  <p className="text-[11px] font-inter text-zinc-400">
                    Selecciona cualquiera para capturar erogaciones
                  </p>
                </div>
              </div>
            </div>

            {recentQuotes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4">
                <p className="text-sm font-semibold text-zinc-200">
                  Aún no tienes proyectos asignados
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Solicita a un Administrador que vincule tus proyectos desde el panel de Usuarios o Cotizaciones.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-start divide-y divide-zinc-800/60 overflow-hidden">
                {recentQuotes.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/gastos?presupuesto=${encodeURIComponent(q.numero_presupuesto)}`);
                    }}
                    className="py-2.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-zinc-800/40 rounded-lg px-2 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/70 text-[11px] font-inter font-semibold">
                          {q.numero_presupuesto}
                        </span>
                        {getVibrantQuoteBadge(q.estado)}
                      </div>
                      <p className="text-xs text-zinc-300 truncate mt-1">
                        {q.nombre_proyecto}
                      </p>
                    </div>
                    <span className="text-[11px] font-inter text-zinc-400 hover:text-white shrink-0 flex items-center gap-1">
                      <span>+ Gasto</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-inter text-zinc-500">
              <span>Acceso protegido por asignación</span>
              <span className="text-zinc-300 font-semibold hover:text-white transition-colors">Ir a Gastos →</span>
            </div>
          </div>
        ),
      },
      {
        id: 'emp-ultimos-gastos',
        title: 'Últimos Gastos Registrados',
        tone: 'neutral',
        colSpan: 2,
        rowSpan: 2,
        onClick: () => navigate('/gastos'),
        content: (
          <div className="flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-white">
                    Bitácora Reciente de Gastos
                  </h3>
                  <p className="text-[11px] font-inter text-zinc-400">
                    Movimientos capturados en tus proyectos
                  </p>
                </div>
              </div>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <p className="text-xs font-inter text-zinc-500">
                  No hay gastos registrados todavía en tus proyectos.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-start divide-y divide-zinc-800/60 overflow-hidden">
                {recentExpenses.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="py-2.5 first:pt-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{g.descripcion}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-inter text-zinc-500">
                        <span>{g.cotizacion_folio || 'Proyecto asignado'}</span>
                        <span>·</span>
                        <span>{formatShortDate(g.fecha_gasto)}</span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-inter font-bold text-zinc-200 shrink-0">
                      {formatCurrency(g.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-inter text-zinc-500">
              <span>Ver bitácora completa</span>
              <span className="text-zinc-300 font-semibold hover:text-white transition-colors">Abrir Gastos →</span>
            </div>
          </div>
        ),
      },
    ],
    [employeeStats, recentQuotes, recentExpenses, navigate, activeMonthName, selectedYear]
  );

  const activeBentoItems = isAdmin ? adminBentoItems : employeeBentoItems;

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Ejecutivo sobrio en tonos carbón y grafito mate */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#101012] p-5 sm:p-6 shadow-sm">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">
              Hola, {operatorName}
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-zinc-400 max-w-2xl">
              {isAdmin
                ? 'Monitoreo financiero en tiempo real, seguimiento de presupuestos industriales y asignación operativa.'
                : 'Consulta tus proyectos asignados y registra gastos operativos de forma rápida y segura.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => fetchDashboardTelemetry(selectedMonth, selectedYear)}
              disabled={isLoading}
              className="h-11 sm:h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-inter flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => navigate('/cotizaciones')}
                className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Ir a Cotizaciones</span>
                <span className="sm:hidden">Cotizar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/gastos')}
                className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Registrar Gasto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selector de Período / Mes con GlideSelect */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-1 text-xs font-inter">
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Mes:</span>
          </div>

          <GlideSelect
            options={monthFilterOptions}
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
            ariaLabel="Filtrar métricas por mes"
            showTags
            accentColor="#fbbf24"
            surfaceColor="#18181b"
            highlightColor="#27272a"
            textColor="#f4f4f5"
            size="md"
            radius={10}
            menuWidth={240}
            placement="bottom"
            align="left"
            popDuration={0}
            glideDuration={180}
            rememberPosition
          />
        </div>

        <div className="text-xs sm:text-[11px] text-zinc-400 flex items-center gap-2 font-inter">
          {selectedMonth !== 'todos' ? (
            <>
              <span>
                Filtrando:{' '}
                <strong className="text-amber-400 capitalize">
                  {activeMonthName} {selectedYear}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth('todos')}
                className="text-amber-400 hover:text-amber-300 underline text-xs ml-1 cursor-pointer transition-colors"
              >
                Ver todo el año
              </button>
            </>
          ) : (
            <span className="text-zinc-500">
              Métricas acumuladas del ejercicio fiscal {selectedYear}
            </span>
          )}
        </div>
      </div>

      {/* Carga esquelética exclusiva Web vs MagicBento sobrio sin glow de borde */}
      {isLoading ? (
        <>
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Skeleton className="col-span-2 h-[208px] rounded-[16px] bg-zinc-900/60" />
            <Skeleton className="col-span-2 h-[208px] rounded-[16px] bg-zinc-900/60" />
            <Skeleton className="col-span-2 row-span-2 h-[430px] rounded-[16px] bg-zinc-900/60" />
            <Skeleton className="col-span-2 h-[208px] rounded-[16px] bg-zinc-900/60" />
            <Skeleton className="col-span-1 h-[208px] rounded-[16px] bg-zinc-900/60" />
            <Skeleton className="col-span-1 h-[208px] rounded-[16px] bg-zinc-900/60" />
          </div>
          {/* Móvil: Esqueleto dedicado de alta fidelidad, idéntico al layout real sin shifts */}
          <DashboardMobileSkeleton isAdmin={isAdmin} />
        </>
      ) : (
        <div className="animate-dashboard-fade">
          <MagicBento
            items={activeBentoItems}
            columns={4}
            rowHeight={208}
            gap={14}
            radius={16}
            glowColor="#71717a"
            enableBorderGlow={false}
            enableSpotlight={false}
            enableStars={false}
            clickEffect={false}
            intro={false}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
