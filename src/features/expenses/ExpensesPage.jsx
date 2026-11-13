import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import {
  Wallet,
  Receipt,
  Layers,
  TrendingUp,
  Search,
  X,
  AlertCircle,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Filter,
  CheckCircle2,
  MoreVertical,
  Inbox,
  Calendar,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuth } from '../../store/useAuth';
import GlideSelect from '../../components/GlideSelect';
import {
  Skeleton,
  CardsGridSkeleton,
  GenericTableSkeleton,
  MobileCardsSkeleton,
} from '../../components/Skeleton';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const toDateInputValue = (isoString) => {
  if (!isoString) return new Date().toISOString().slice(0, 10);
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

export const ExpensesPage = () => {
  const { user } = useAuth();
  const isAdmin = (user?.rol || '').toLowerCase() === 'admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialFolioParam = searchParams.get('presupuesto') || 'todos';

  const [expenses, setExpenses] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [allItemsMap, setAllItemsMap] = useState({});
  const [formPartidas, setFormPartidas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuoteFolio, setSelectedQuoteFolio] = useState(initialFolioParam);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('todos'); // 'todos' | 'directo' | 'general'
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const lastFetchedFolioRef = useRef(null);

  // Modal Crear / Editar Gasto Real
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const initialForm = {
    cotizacion_id: '',
    partida_id: '',
    monto: '',
    descripcion: '',
    fecha_gasto: new Date().toISOString().slice(0, 10),
  };
  const [expenseForm, setExpenseForm] = useState(initialForm);

  // Modal Detalle
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (isFormModalOpen || selectedExpenseDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, selectedExpenseDetail]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCatalogs = async () => {
    try {
      const quotesEndpoint = isAdmin
        ? '/cotizaciones/?include_cancelled=false&skip=0&limit=200'
        : '/cotizaciones/?skip=0&limit=200';
      const [quotesRes, itemsRes] = await Promise.all([
        apiClient.get(quotesEndpoint),
        apiClient.get('/partidas-cotizacion/?skip=0&limit=200'),
      ]);
      const loadedQuotes = Array.isArray(quotesRes.data) ? quotesRes.data : [];
      setQuotes(loadedQuotes);
      const map = {};
      (Array.isArray(itemsRes.data) ? itemsRes.data : []).forEach((it) => {
        map[it.id] = it;
      });
      setAllItemsMap(map);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    } finally {
      setCatalogLoaded(true);
    }
  };

  const quoteMap = useMemo(() => {
    const map = {};
    quotes.forEach((q) => {
      map[q.id] = q;
    });
    return map;
  }, [quotes]);

  const quoteByFolio = useMemo(() => {
    const map = {};
    quotes.forEach((q) => {
      if (q.numero_presupuesto) {
        map[q.numero_presupuesto] = q;
      }
    });
    return map;
  }, [quotes]);

  const resolveFilterQuoteId = (folio) => {
    if (!folio || folio === 'todos') return null;
    return quoteByFolio[folio]?.id || null;
  };

  /**
   * Carga de gastos reales con offset corto (10 registros)
   */
  const fetchExpenses = async (folioFilter = selectedQuoteFolio) => {
    try {
      setIsLoading(true);
      setError(null);
      const targetQuoteId = resolveFilterQuoteId(folioFilter);
      if (folioFilter !== 'todos' && catalogLoaded && !targetQuoteId) {
        setExpenses([]);
        setHasMore(false);
        return;
      }
      const quoteQuery = targetQuoteId ? `&cotizacion_id=${targetQuoteId}` : '';
      const response = await apiClient.get(
        `/gastos-reales/?skip=0&limit=${PAGE_SIZE}${quoteQuery}`
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setExpenses(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error al cargar gastos reales:', err);
      setError(
        err.response?.data?.detail ||
          'No se pudo conectar con el servidor para obtener el control de gastos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreExpenses = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextSkip = expenses.length;
      const targetQuoteId = resolveFilterQuoteId(selectedQuoteFolio);
      const quoteQuery = targetQuoteId ? `&cotizacion_id=${targetQuoteId}` : '';
      const response = await apiClient.get(
        `/gastos-reales/?skip=${nextSkip}&limit=${PAGE_SIZE}${quoteQuery}`
      );
      const nextData = Array.isArray(response.data) ? response.data : [];
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setExpenses((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const filtered = nextData.filter((e) => !existingIds.has(e.id));
        return [...prev, ...filtered];
      });
    } catch {
      showToast('No fue posible cargar más gastos.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, expenses.length, selectedQuoteFolio, quoteByFolio]);

  /**
   * Infinite scroll observer para deslizar sin requerir clic
   */
  useEffect(() => {
    if (isLoading || !hasMore || searchTerm || selectedTypeFilter !== 'todos') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreExpenses();
        }
      },
      { rootMargin: '300px 0px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [isLoading, hasMore, isLoadingMore, searchTerm, selectedTypeFilter, loadMoreExpenses]);

  useEffect(() => {
    fetchCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    // Si se requiere filtrar por un folio específico pero los catálogos aún no cargan, esperamos a tener los datos
    if (selectedQuoteFolio !== 'todos' && !catalogLoaded) {
      return;
    }

    // Evita doble carga: si ya se cargó exactamente este filtro de folio, no volver a disparar fetchExpenses
    if (lastFetchedFolioRef.current === selectedQuoteFolio) {
      return;
    }

    lastFetchedFolioRef.current = selectedQuoteFolio;
    fetchExpenses(selectedQuoteFolio);

    if (selectedQuoteFolio !== 'todos') {
      setSearchParams({ presupuesto: selectedQuoteFolio }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuoteFolio, catalogLoaded]);

  // Cargar partidas de la cotización seleccionada en el formulario
  useEffect(() => {
    const loadPartidasForQuote = async () => {
      if (!expenseForm.cotizacion_id) {
        setFormPartidas([]);
        return;
      }
      try {
        const res = await apiClient.get(
          `/partidas-cotizacion/?cotizacion_id=${expenseForm.cotizacion_id}`
        );
        const list = Array.isArray(res.data) ? res.data : [];
        setFormPartidas(list);
        setAllItemsMap((prev) => {
          const next = { ...prev };
          list.forEach((it) => {
            next[it.id] = it;
          });
          return next;
        });
      } catch (err) {
        console.error('Error al consultar partidas del presupuesto:', err);
        setFormPartidas([]);
      }
    };
    loadPartidasForQuote();
  }, [expenseForm.cotizacion_id]);

  const metrics = useMemo(() => {
    let totalSpent = 0;
    let directSpent = 0;
    let generalSpent = 0;
    let directCount = 0;
    let generalCount = 0;

    expenses.forEach((ex) => {
      const m = Number(ex.monto) || 0;
      totalSpent += m;
      if (ex.partida_id) {
        directSpent += m;
        directCount++;
      } else {
        generalSpent += m;
        generalCount++;
      }
    });

    const activeQuote =
      selectedQuoteFolio !== 'todos' ? quoteByFolio[selectedQuoteFolio] || null : null;
    const quotedBudget = activeQuote ? Number(activeQuote.total) || 0 : 0;
    const margin = quotedBudget - totalSpent;

    return {
      totalSpent,
      directSpent,
      generalSpent,
      directCount,
      generalCount,
      activeQuote,
      quotedBudget,
      margin,
    };
  }, [expenses, selectedQuoteFolio, quoteByFolio]);

  const quoteFilterOptions = useMemo(() => {
    const opts = [
      {
        value: 'todos',
        label: isAdmin ? 'Todos los proyectos' : 'Mis proyectos asignados',
        tag: String(quotes.length),
      },
    ];
    quotes.forEach((q) => {
      opts.push({
        value: q.numero_presupuesto,
        label: `${q.numero_presupuesto} · ${q.nombre_proyecto}`,
        tag: isAdmin ? formatCurrency(q.total || 0) : q.estado,
      });
    });
    return opts;
  }, [quotes, isAdmin]);

  const typeFilterOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos los gastos', tag: String(expenses.length) },
      { value: 'directo', label: 'Gastos directos', tag: String(metrics.directCount) },
      { value: 'general', label: 'Gastos generales', tag: String(metrics.generalCount) },
    ],
    [expenses.length, metrics.directCount, metrics.generalCount]
  );

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return expenses.filter((ex) => {
      if (selectedTypeFilter === 'directo' && !ex.partida_id) return false;
      if (selectedTypeFilter === 'general' && ex.partida_id) return false;

      if (!term) return true;
      const quoteObj = quoteMap[ex.cotizacion_id];
      const itemObj = ex.partida_id ? allItemsMap[ex.partida_id] : null;
      return (
        ex.descripcion?.toLowerCase().includes(term) ||
        ex.cotizacion_folio?.toLowerCase().includes(term) ||
        ex.cotizacion_proyecto?.toLowerCase().includes(term) ||
        ex.partida_concepto?.toLowerCase().includes(term) ||
        ex.registrado_por_nombre?.toLowerCase().includes(term) ||
        quoteObj?.numero_presupuesto?.toLowerCase().includes(term) ||
        quoteObj?.nombre_proyecto?.toLowerCase().includes(term) ||
        itemObj?.descripcion?.toLowerCase().includes(term)
      );
    });
  }, [expenses, selectedTypeFilter, searchTerm, quoteMap, allItemsMap]);

  const handleOpenCreate = () => {
    if (!isAdmin && quotes.length === 0) {
      showToast('No tienes proyectos asignados para registrar gastos.');
      return;
    }
    const defaultQuote =
      selectedQuoteFolio !== 'todos'
        ? quoteByFolio[selectedQuoteFolio]?.id || ''
        : quotes.length === 1
          ? String(quotes[0].id)
          : '';
    setEditingExpenseId(null);
    setExpenseForm({
      cotizacion_id: defaultQuote ? String(defaultQuote) : '',
      partida_id: '',
      monto: '',
      descripcion: '',
      fecha_gasto: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    if (!isAdmin) return;
    setSelectedExpenseDetail(null);
    setEditingExpenseId(expense.id);
    setExpenseForm({
      cotizacion_id: String(expense.cotizacion_id),
      partida_id: expense.partida_id ? String(expense.partida_id) : '',
      monto: String(expense.monto ?? ''),
      descripcion: expense.descripcion || '',
      fecha_gasto: toDateInputValue(expense.fecha_gasto),
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!editingExpenseId && !expenseForm.cotizacion_id) {
      setFormError('Selecciona el proyecto asignado al gasto.');
      return;
    }
    if (!expenseForm.descripcion.trim()) {
      setFormError('Ingresa el concepto o descripción del gasto real.');
      return;
    }
    const montoNum = parseFloat(expenseForm.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setFormError('El monto del gasto debe ser mayor a cero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const isoFecha = expenseForm.fecha_gasto
        ? new Date(`${expenseForm.fecha_gasto}T12:00:00`).toISOString()
        : new Date().toISOString();

      const partidaVal = expenseForm.partida_id ? Number(expenseForm.partida_id) : null;

      if (editingExpenseId && isAdmin) {
        await apiClient.put(`/gastos-reales/${editingExpenseId}`, {
          monto: Number(montoNum.toFixed(2)),
          descripcion: expenseForm.descripcion.trim(),
          fecha_gasto: isoFecha,
          partida_id: partidaVal,
        });
        showToast('Gasto real actualizado correctamente.');
      } else {
        await apiClient.post('/gastos-reales/', {
          cotizacion_id: Number(expenseForm.cotizacion_id),
          partida_id: partidaVal,
          monto: Number(montoNum.toFixed(2)),
          descripcion: expenseForm.descripcion.trim(),
          fecha_gasto: isoFecha,
        });
        showToast('Gasto real registrado exitosamente.');
      }

      setIsFormModalOpen(false);
      fetchExpenses(selectedQuoteFolio);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setFormError(
        typeof detail === 'string'
          ? detail
          : 'No se pudo guardar el gasto. Verifica el proyecto y el monto.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!isAdmin) return;
    const confirmed = window.confirm(
      `¿Deseas eliminar el gasto real "${expense.descripcion}" por ${formatCurrency(expense.monto)}?`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/gastos-reales/${expense.id}`);
      showToast('Gasto real eliminado.');
      if (selectedExpenseDetail?.id === expense.id) {
        setSelectedExpenseDetail(null);
      }
      fetchExpenses(selectedQuoteFolio);
    } catch (err) {
      showToast(err.response?.data?.detail || 'No fue posible eliminar el gasto.');
    }
  };

  const handleOpenDetail = async (expense) => {
    setSelectedExpenseDetail(expense);
    setIsLoadingDetail(true);
    try {
      const res = await apiClient.get(`/gastos-reales/${expense.id}`);
      if (res.data) {
        setSelectedExpenseDetail(res.data);
      }
    } catch (err) {
      console.error('Error al consultar gasto:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getFolioLabel = (expense) =>
    expense.cotizacion_folio ||
    quoteMap[expense.cotizacion_id]?.numero_presupuesto ||
    'Proyecto asignado';

  const getProjectName = (expense) =>
    expense.cotizacion_proyecto ||
    quoteMap[expense.cotizacion_id]?.nombre_proyecto ||
    '';

  const getPartidaLabel = (expense) =>
    expense.partida_concepto ||
    (expense.partida_id ? allItemsMap[expense.partida_id]?.descripcion : null) ||
    'Partida vinculada';

  const renderFloatingMenu = (expense) => (
    <div
      className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-sans text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenDetail(expense);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors"
      >
        <Eye className="w-3.5 h-3.5 text-zinc-400" />
        <span>Ver comprobante</span>
      </button>
      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              handleOpenEdit(expense);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors font-medium"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar gasto</span>
          </button>
          <div className="my-1 border-t border-zinc-800/80" />
          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              handleDeleteExpense(expense);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-amber-400 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Aviso informativo para Empleados sin proyectos asignados */}
      {!isAdmin && catalogLoaded && quotes.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">
              Aún no cuentas con proyectos asignados
            </p>
            <p className="text-amber-200/80 mt-0.5">
              Por seguridad, el rol Empleado solo puede registrar gastos en los proyectos que le asigne un Administrador.
            </p>
          </div>
        </div>
      )}

      {/* KPI Metrics (Escritorio) */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-zinc-500">
              Gasto ejecutado
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(metrics.totalSpent)}
                </p>
                <span className="text-[11px] font-mono text-zinc-400 block">
                  {expenses.length} erogaciones en vista
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#101012] border border-[#6366F1]/25 hover:border-[#6366F1]/40 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-[#818CF8] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              Costos directos
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(metrics.directSpent)}
                </p>
                <span className="text-[11px] font-mono text-[#818CF8]/90 block">
                  {metrics.directCount} vinculados a partidas
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818CF8]">
            <Layers className="w-5 h-5 text-[#6366F1]" />
          </div>
        </div>

        <div className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Gastos generales
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(metrics.generalSpent)}
                </p>
                <span className="text-[11px] font-mono text-zinc-400 block">
                  {metrics.generalCount} indirectos de proyecto
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#101012] border border-emerald-950/50 hover:border-emerald-900/60 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {isAdmin && metrics.activeQuote ? 'Margen proyecto' : 'Proyectos habilitados'}
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : isAdmin && metrics.activeQuote ? (
              <>
                <p
                  className={`text-2xl font-bold tracking-tight ${
                    metrics.margin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(metrics.margin)}
                </p>
                <span className="text-[11px] font-mono text-zinc-400 block">
                  Cotizado: {formatCurrency(metrics.quotedBudget)}
                </span>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {quotes.length}
                </p>
                <span className="text-[11px] font-mono text-emerald-400/90 block">
                  {isAdmin ? 'Selecciona proyecto para margen' : 'Asignados a tu cuenta'}
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Encabezado y Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-zinc-800/40">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5 font-heading">
            Gastos Reales
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
            {isAdmin
              ? 'Control presupuestal de erogaciones directas por partida y gastos generales de obra.'
              : 'Registro de gastos operativos exclusivamente en los proyectos asignados a tu cuenta.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 lg:w-96">
            <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto, folio o proyecto..."
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 text-sm sm:text-xs text-zinc-200 placeholder-zinc-500 rounded-xl pl-9 pr-8 py-2.5 sm:py-2 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white shadow-sm font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden xl:inline">Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-white shadow-sm font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden xl:inline">Tabla</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={!isAdmin && quotes.length === 0}
            className="btn-mts-primary h-11 sm:h-9 px-3.5 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Filtros con GlideSelect */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-1 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Proyecto:</span>
          </div>

          <GlideSelect
            options={quoteFilterOptions}
            value={selectedQuoteFolio}
            onChange={(val) => setSelectedQuoteFolio(val)}
            ariaLabel="Filtrar gastos por proyecto"
            showTags
            accentColor="#fbbf24"
            surfaceColor="#18181b"
            highlightColor="#27272a"
            textColor="#f4f4f5"
            size="md"
            radius={10}
            menuWidth={380}
            placement="bottom"
            align="left"
            popDuration={0}
            glideDuration={180}
            rememberPosition
          />

          <GlideSelect
            options={typeFilterOptions}
            value={selectedTypeFilter}
            onChange={(val) => setSelectedTypeFilter(val)}
            ariaLabel="Filtrar por tipo de gasto"
            showTags
            accentColor="#fbbf24"
            surfaceColor="#18181b"
            highlightColor="#27272a"
            textColor="#f4f4f5"
            size="md"
            radius={10}
            menuWidth={220}
            placement="bottom"
            align="left"
            popDuration={0}
            glideDuration={180}
            rememberPosition
          />
        </div>

        <div className="text-xs sm:text-[11px] text-zinc-400 flex items-center gap-2">
          <span className="hidden sm:inline">
            Mostrando <strong className="text-zinc-200">{filteredExpenses.length}</strong> de{' '}
            <strong className="text-zinc-200">{expenses.length}</strong> gastos
          </span>
          <span className="sm:hidden text-zinc-400 text-xs">
            <strong className="text-zinc-200">{filteredExpenses.length}</strong>/{expenses.length}
          </span>
          {(searchTerm || selectedQuoteFolio !== 'todos' || selectedTypeFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedQuoteFolio('todos');
                setSelectedTypeFilter('todos');
              }}
              className="text-amber-400 hover:text-amber-300 underline text-xs ml-1 cursor-pointer transition-colors"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Carga Esquelética en Web / Indicador ligero en Móvil */}
      {isLoading ? (
        <>
          <div className="hidden sm:block">
            {viewMode === 'table' ? (
              <GenericTableSkeleton
                columns={['Fecha', 'Presupuesto', 'Concepto', 'Clasificación', 'Monto', 'Acciones']}
                rows={7}
              />
            ) : (
              <CardsGridSkeleton count={8} />
            )}
          </div>
          <MobileCardsSkeleton variant="expenses" count={5} />
        </>
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar gastos reales</p>
            <p className="text-red-400/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchExpenses(selectedQuoteFolio)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg transition-colors font-mono"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-8">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
            <Inbox className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No se encontraron gastos reales</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchTerm || selectedQuoteFolio !== 'todos' || selectedTypeFilter !== 'todos'
              ? 'No hay registros que coincidan con los filtros seleccionados.'
              : 'Registra compras de materiales, insumos o gastos operativos asociados a tus proyectos.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e] animate-content-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] select-none">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Presupuesto</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Clasificación</th>
                  <th className="py-3 px-4">Registró</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => handleOpenDetail(expense)}
                    className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                      {expense.fecha_gasto
                        ? new Date(expense.fecha_gasto).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-400 whitespace-nowrap">
                      {getFolioLabel(expense)}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-zinc-100 max-w-md truncate">
                      {expense.descripcion}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                      {expense.partida_id ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30"
                          title={getPartidaLabel(expense)}
                        >
                          <Layers className="w-3 h-3" />
                          Directo · Partida
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                          General
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                      {expense.registrado_por_nombre || 'Operador'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap text-sm">
                      {formatCurrency(expense.monto)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(expense)}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(expense)}
                              className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense)}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 animate-content-fade">
          {filteredExpenses.map((expense) => {
            const projectName = getProjectName(expense);
            return (
              <div
                key={expense.id}
                onClick={() => handleOpenDetail(expense)}
                className="bg-[#101012] hover:bg-[#131316] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md group relative cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold text-amber-400 tracking-wide bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md truncate">
                      {getFolioLabel(expense)}
                    </span>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {expense.partida_id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-mono font-medium bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30">
                          Directo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                          General
                        </span>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === expense.id ? null : expense.id);
                          }}
                          className="p-1.5 sm:p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/60 transition-colors"
                          aria-label="Opciones de gasto"
                        >
                          <MoreVertical className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        {activeMenuId === expense.id && renderFloatingMenu(expense)}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-sm text-zinc-100 tracking-tight leading-snug line-clamp-2 mt-1 font-heading">
                    {expense.descripcion}
                  </h3>

                  <div className="mt-2.5 space-y-1 text-xs">
                    {projectName && <p className="text-zinc-400 truncate">{projectName}</p>}
                    {expense.partida_id && (
                      <p className="text-[#818CF8] text-[11px] truncate font-mono">
                        Partida: {getPartidaLabel(expense)}
                      </p>
                    )}
                    {expense.registrado_por_nombre && (
                      <p className="text-zinc-500 text-[11px] font-mono flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span className="truncate">{expense.registrado_por_nombre}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-end justify-between">
                  <div>
                    <p className="text-2xl sm:text-xl font-bold text-white tracking-tight leading-none font-mono">
                      {formatCurrency(expense.monto)}
                    </p>
                    <p className="text-xs sm:text-[10px] font-mono text-zinc-500 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>
                        {expense.fecha_gasto
                          ? new Date(expense.fecha_gasto).toLocaleDateString('es-MX')
                          : '—'}
                      </span>
                    </p>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(expense)}
                        className="h-9 sm:h-8 px-3 sm:px-2.5 rounded-xl sm:rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs sm:text-[11px]">Editar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(expense)}
                        className="h-9 sm:h-8 px-3 sm:px-2.5 rounded-xl sm:rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs sm:text-[11px]">Detalle</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel & paginación */}
      {!isLoading && !error && hasMore && !searchTerm && selectedTypeFilter === 'todos' && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-zinc-400 text-xs font-mono">
            <Spinner size="sm" color="warning" className="scale-75" />
            <span>Cargando más gastos...</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR GASTO REAL                                           */}
      {/* ========================================================================= */}
      {isFormModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <form
              onSubmit={handleSubmitExpense}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-heading">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>{editingExpenseId ? 'Editar Gasto Real' : 'Registrar Gasto Real'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isAdmin
                      ? 'Asocia el gasto a un proyecto y opcionalmente a una partida.'
                      : 'Selecciona uno de tus proyectos asignados para registrar la erogación.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Presupuesto / proyecto *
                  </label>
                  <select
                    required
                    disabled={!!editingExpenseId}
                    value={expenseForm.cotizacion_id}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        cotizacion_id: e.target.value,
                        partida_id: '',
                      })
                    }
                    className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="">Selecciona un proyecto...</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.numero_presupuesto} — {q.nombre_proyecto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Partida específica (opcional)
                  </label>
                  <select
                    disabled={!expenseForm.cotizacion_id}
                    value={expenseForm.partida_id}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, partida_id: e.target.value })
                    }
                    className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors disabled:opacity-40"
                  >
                    <option value="">(Gasto general / indirecto del proyecto)</option>
                    {formPartidas.map((p, idx) => (
                      <option key={p.id} value={p.id}>
                        {idx + 1}. {p.descripcion}
                        {isAdmin ? ` (${formatCurrency(p.precio_unitario)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                      Monto erogado *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={expenseForm.monto}
                      onChange={(e) => setExpenseForm({ ...expenseForm, monto: e.target.value })}
                      className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-mono focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                      Fecha del gasto *
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.fecha_gasto}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, fecha_gasto: e.target.value })
                      }
                      className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-mono focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Concepto / descripción *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={2000}
                    placeholder="Ej. Compra de placa de acero inoxidable, viáticos de instalación..."
                    value={expenseForm.descripcion}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, descripcion: e.target.value })
                    }
                    className="w-full p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-mts-primary flex-1 h-11 sm:h-9 px-5 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : editingExpenseId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE GASTO REAL (Sin ningún ID de base de datos)              */}
      {/* ========================================================================= */}
      {selectedExpenseDetail &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <span className="text-amber-400 font-mono text-xs font-bold">
                    Comprobante de gasto • {getFolioLabel(selectedExpenseDetail)}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1 font-heading">
                    {selectedExpenseDetail.descripcion}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExpenseDetail(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isLoadingDetail ? (
                <div className="py-4 text-center text-xs font-mono text-zinc-500">
                  Consultando registro...
                </div>
              ) : (
                <div className="space-y-3 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70">
                    <span className="font-mono text-zinc-400 text-[11px]">
                      Monto erogado:
                    </span>
                    <span className="font-mono text-xl font-bold text-white">
                      {formatCurrency(selectedExpenseDetail.monto)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        Clasificación
                      </span>
                      <span className="text-zinc-200 font-medium mt-0.5 block">
                        {selectedExpenseDetail.partida_id
                          ? 'Costo directo de partida'
                          : 'Gasto general de proyecto'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        Fecha de gasto
                      </span>
                      <span className="text-zinc-200 font-mono mt-0.5 block">
                        {selectedExpenseDetail.fecha_gasto
                          ? new Date(selectedExpenseDetail.fecha_gasto).toLocaleDateString('es-MX')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {selectedExpenseDetail.registrado_por_nombre && (
                    <div className="pt-2 border-t border-zinc-800/70">
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        Registrado por
                      </span>
                      <p className="text-zinc-200 mt-0.5">
                        {selectedExpenseDetail.registrado_por_nombre}
                      </p>
                    </div>
                  )}

                  {selectedExpenseDetail.partida_id && (
                    <div className="pt-2 border-t border-zinc-800/70">
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        Partida vinculada
                      </span>
                      <p className="text-[#818CF8] mt-0.5">
                        {getPartidaLabel(selectedExpenseDetail)}
                      </p>
                    </div>
                  )}

                  {getProjectName(selectedExpenseDetail) && (
                    <div className="pt-2 border-t border-zinc-800/70">
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        Proyecto
                      </span>
                      <p className="text-zinc-300 mt-0.5">
                        {getProjectName(selectedExpenseDetail)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(selectedExpenseDetail)}
                      className="h-11 sm:h-9 px-3.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedExpenseDetail)}
                      className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Gasto</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedExpenseDetail(null)}
                    className="ml-auto h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ExpensesPage;
