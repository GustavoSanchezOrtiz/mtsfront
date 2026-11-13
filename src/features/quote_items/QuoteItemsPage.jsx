import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import {
  Layers,
  FileText,
  DollarSign,
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
  TrendingUp,
} from 'lucide-react';
import apiClient from '../../lib/axios';
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

export const QuoteItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuoteParam = searchParams.get('presupuesto') || 'todos';

  const [items, setItems] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quotesLoaded, setQuotesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuoteFilter, setSelectedQuoteFilter] = useState(initialQuoteParam);
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Paginación de offset corto (entre 5 y 10 registros)
  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Modal Crear / Editar Partida
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const initialForm = {
    cotizacion_id: '',
    descripcion: '',
    cantidad: '1',
    precio_unitario: '',
  };
  const [itemForm, setItemForm] = useState(initialForm);

  // Modal Detalle (GET /partidas-cotizacion/{id})
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (isFormModalOpen || selectedItemDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, selectedItemDetail]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchQuotesCatalog = async () => {
    try {
      const res = await apiClient.get('/cotizaciones/?include_cancelled=true&skip=0&limit=100');
      setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar catálogo de cotizaciones:', err);
    } finally {
      setQuotesLoaded(true);
    }
  };

  /**
   * Carga inicial con offset corto (10 registros)
   */
  const fetchItems = async (quoteFilter = selectedQuoteFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const matchedQuote =
        quoteFilter && quoteFilter !== 'todos'
          ? quotes.find((q) => q.numero_presupuesto === quoteFilter)
          : null;
      const quoteQuery = matchedQuote ? `&cotizacion_id=${matchedQuote.id}` : '';
      const response = await apiClient.get(
        `/partidas-cotizacion/?skip=0&limit=${PAGE_SIZE}${quoteQuery}`
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setItems(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error al cargar partidas:', err);
      setError('No se pudo conectar con el servidor para obtener las partidas cotizadas.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextSkip = items.length;
      const matchedQuote =
        selectedQuoteFilter && selectedQuoteFilter !== 'todos'
          ? quotes.find((q) => q.numero_presupuesto === selectedQuoteFilter)
          : null;
      const quoteQuery = matchedQuote ? `&cotizacion_id=${matchedQuote.id}` : '';
      const response = await apiClient.get(
        `/partidas-cotizacion/?skip=${nextSkip}&limit=${PAGE_SIZE}${quoteQuery}`
      );
      const nextData = Array.isArray(response.data) ? response.data : [];
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const filtered = nextData.filter((i) => !existingIds.has(i.id));
        return [...prev, ...filtered];
      });
    } catch (err) {
      console.error('Error al cargar más partidas:', err);
      showToast('No fue posible cargar más partidas.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, items.length, selectedQuoteFilter, quotes]);

  /**
   * Observer para cargar el siguiente lote de partidas al deslizar
   */
  useEffect(() => {
    if (isLoading || !hasMore || searchTerm) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreItems();
        }
      },
      { rootMargin: '300px 0px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [isLoading, hasMore, isLoadingMore, searchTerm, loadMoreItems]);

  useEffect(() => {
    fetchQuotesCatalog();
  }, []);

  useEffect(() => {
    if (!quotesLoaded) return;
    fetchItems(selectedQuoteFilter);
    if (selectedQuoteFilter !== 'todos') {
      setSearchParams({ presupuesto: selectedQuoteFilter }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuoteFilter, quotesLoaded]);

  const quoteMap = useMemo(() => {
    const map = {};
    quotes.forEach((q) => {
      map[q.id] = q;
    });
    return map;
  }, [quotes]);

  const metrics = useMemo(() => {
    let subtotalSum = 0;
    const uniqueQuotes = new Set();
    items.forEach((it) => {
      const sub = (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0);
      subtotalSum += sub;
      uniqueQuotes.add(it.cotizacion_id);
    });
    const avg = items.length > 0 ? subtotalSum / items.length : 0;
    return {
      count: items.length,
      subtotalSum,
      avg,
      uniqueQuotes: uniqueQuotes.size,
    };
  }, [items]);

  const filterOptions = useMemo(() => {
    const opts = [{ value: 'todos', label: 'Todas las Cotizaciones', tag: 'Todas' }];
    quotes.forEach((q) => {
      opts.push({
        value: q.numero_presupuesto,
        label: q.numero_presupuesto,
        tag: (q.estado || 'borrador').toUpperCase(),
      });
    });
    return opts;
  }, [quotes]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return items.filter((it) => {
      const quoteObj = quoteMap[it.cotizacion_id];
      const folio = it.cotizacion_folio || quoteObj?.numero_presupuesto || '';
      if (selectedQuoteFilter !== 'todos' && folio !== selectedQuoteFilter) {
        return false;
      }
      if (!term) return true;
      const proyecto = (it.cotizacion_proyecto || quoteObj?.nombre_proyecto || '').toLowerCase();
      return (
        it.descripcion?.toLowerCase().includes(term) ||
        folio.toLowerCase().includes(term) ||
        proyecto.includes(term)
      );
    });
  }, [items, searchTerm, quoteMap, selectedQuoteFilter]);

  const handleOpenCreate = () => {
    setEditingItemId(null);
    const matchedQuote =
      selectedQuoteFilter !== 'todos'
        ? quotes.find((q) => q.numero_presupuesto === selectedQuoteFilter)
        : null;
    setItemForm({
      cotizacion_id: matchedQuote ? String(matchedQuote.id) : '',
      descripcion: '',
      cantidad: '1',
      precio_unitario: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItemDetail(null);
    setEditingItemId(item.id);
    setItemForm({
      cotizacion_id: String(item.cotizacion_id),
      descripcion: item.descripcion || '',
      cantidad: String(item.cantidad ?? 1),
      precio_unitario: String(item.precio_unitario ?? ''),
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  /**
   * Guardar Partida (POST /partidas-cotizacion/ o PUT /partidas-cotizacion/{id})
   */
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!editingItemId && !itemForm.cotizacion_id) {
      setFormError('Selecciona el presupuesto al que pertenece la partida.');
      return;
    }
    if (!itemForm.descripcion.trim()) {
      setFormError('Ingresa la descripción técnica de la partida.');
      return;
    }
    const cant = parseFloat(itemForm.cantidad);
    const precio = parseFloat(itemForm.precio_unitario);
    if (isNaN(cant) || cant <= 0) {
      setFormError('La cantidad debe ser mayor a cero.');
      return;
    }
    if (isNaN(precio) || precio < 0) {
      setFormError('El precio unitario debe ser válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingItemId) {
        await apiClient.put(`/partidas-cotizacion/${editingItemId}`, {
          descripcion: itemForm.descripcion.trim(),
          cantidad: Number(cant.toFixed(2)),
          precio_unitario: Number(precio.toFixed(2)),
        });
        showToast('Partida actualizada correctamente.');
      } else {
        await apiClient.post('/partidas-cotizacion/', {
          cotizacion_id: Number(itemForm.cotizacion_id),
          descripcion: itemForm.descripcion.trim(),
          cantidad: Number(cant.toFixed(2)),
          precio_unitario: Number(precio.toFixed(2)),
        });
        showToast('Partida agregada exitosamente.');
      }

      setIsFormModalOpen(false);
      fetchItems(selectedQuoteFilter);
    } catch (err) {
      console.error('Error al guardar partida:', err);
      const detail = err.response?.data?.detail;
      setFormError(
        typeof detail === 'string'
          ? detail
          : 'No se pudo guardar la partida. Revisa los valores numéricos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Borrado lógico de partida (DELETE /partidas-cotizacion/{id})
   */
  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar la partida "${item.descripcion.slice(0, 45)}"?`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/partidas-cotizacion/${item.id}`);
      showToast('Partida eliminada correctamente.');
      if (selectedItemDetail?.id === item.id) {
        setSelectedItemDetail(null);
      }
      fetchItems(selectedQuoteFilter);
    } catch (err) {
      console.error('Error al eliminar partida:', err);
      showToast(err.response?.data?.detail || 'No fue posible eliminar la partida.');
    }
  };

  /**
   * Consulta puntual por ID (GET /partidas-cotizacion/{id})
   */
  const handleOpenDetail = async (item) => {
    setSelectedItemDetail(item);
    setIsLoadingDetail(true);
    try {
      const res = await apiClient.get(`/partidas-cotizacion/${item.id}`);
      if (res.data) {
        setSelectedItemDetail(res.data);
      }
    } catch (err) {
      console.error('Error al obtener partida:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const renderFloatingMenu = (item) => (
    <div
      className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-sans text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenDetail(item);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors"
      >
        <Eye className="w-3.5 h-3.5 text-zinc-400" />
        <span>Ver desglose</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenEdit(item);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors font-medium"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Editar partida</span>
      </button>
      <div className="my-1 border-t border-zinc-800/80" />
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleDeleteItem(item);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Eliminar</span>
      </button>
    </div>
  );

  const previewSubtotal =
    (parseFloat(itemForm.cantidad) || 0) * (parseFloat(itemForm.precio_unitario) || 0);

  return (
    <div className="space-y-6 pb-12 font-poppins">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-amber-400 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Metrics (Escritorio) */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-poppins text-zinc-500">
              Partidas en vista
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-12 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">{metrics.count}</p>
                <span className="text-[11px] font-poppins text-zinc-400 block">
                  Líneas técnicas activas
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#101012] border border-green-950/40 hover:border-green-900/50 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors">
          <div className="space-y-1">
            <span className="text-[11px] font-poppins text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Subtotal acumulado
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(metrics.subtotalSum)}
                </p>
                <span className="text-[11px] font-poppins text-zinc-400 block">
                  Total neto presupuestado
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#101012] border border-[#6366F1]/25 hover:border-[#6366F1]/40 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors">
          <div className="space-y-1">
            <span className="text-[11px] font-poppins text-[#818CF8] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              Ticket promedio
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(metrics.avg)}
                </p>
                <span className="text-[11px] font-poppins text-[#818CF8]/90 block">
                  Importe medio por línea
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818CF8]">
            <TrendingUp className="w-5 h-5 text-[#6366F1]" />
          </div>
        </div>

        <div className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-poppins text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Presupuestos
            </span>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-12 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {metrics.uniqueQuotes}
                </p>
                <span className="text-[11px] font-poppins text-zinc-500 block">
                  Cotizaciones vinculadas
                </span>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Encabezado y Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-zinc-800/40">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5 font-heading">
            Partidas
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
            Conceptos técnicos, cantidades y precios unitarios vinculados a cotizaciones MTS.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 lg:w-96">
            <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar concepto, servicio o presupuesto..."
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
            className="btn-mts-primary h-11 sm:h-9 px-3.5 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            <span>Nueva Partida</span>
          </button>
        </div>
      </div>

      {/* Filtro por Cotización con GlideSelect */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-1 text-xs font-poppins">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Presupuesto:</span>
          </div>

          <GlideSelect
            options={filterOptions}
            value={selectedQuoteFilter}
            onChange={(val) => setSelectedQuoteFilter(val)}
            ariaLabel="Filtrar partidas por cotización"
            showTags
            accentColor="#fbbf24"
            surfaceColor="#18181b"
            highlightColor="#27272a"
            textColor="#f4f4f5"
            size="md"
            radius={10}
            menuWidth={360}
            placement="bottom"
            align="left"
            popDuration={0}
            glideDuration={180}
            rememberPosition
          />
        </div>

        <div className="text-xs sm:text-[11px] text-zinc-400 flex items-center gap-2">
          <span className="hidden sm:inline">
            Mostrando <strong className="text-zinc-200">{filteredItems.length}</strong> de{' '}
            <strong className="text-zinc-200">{items.length}</strong> partidas
          </span>
          <span className="sm:hidden text-zinc-400 text-xs">
            <strong className="text-zinc-200">{filteredItems.length}</strong>/{items.length}
          </span>
          {(searchTerm || selectedQuoteFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedQuoteFilter('todos');
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
                columns={['Presupuesto', 'Descripción', 'Cant.', 'Precio', 'Subtotal', 'Acciones']}
                rows={7}
              />
            ) : (
              <CardsGridSkeleton count={8} />
            )}
          </div>
          <MobileCardsSkeleton variant="items" count={5} />
        </>
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar partidas</p>
            <p className="text-red-400/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchItems(selectedQuoteFilter)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg transition-colors font-poppins"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-8">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
            <Inbox className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No se encontraron partidas</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchTerm || selectedQuoteFilter !== 'todos'
              ? 'No hay conceptos que coincidan con el filtro actual.'
              : 'Agrega partidas técnicas vinculadas a una cotización activa.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e] animate-content-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-poppins text-[11px] select-none">
                  <th className="py-3 px-4">Presupuesto</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4 text-center">Cant.</th>
                  <th className="py-3 px-4 text-right">Precio</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-poppins">
                {filteredItems.map((item) => {
                  const quoteObj = quoteMap[item.cotizacion_id];
                  const sub = (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-amber-400 whitespace-nowrap">
                        {item.cotizacion_folio || quoteObj?.numero_presupuesto || 'Presupuesto'}
                      </td>
                      <td className="py-3 px-4 min-w-[280px] max-w-xl font-sans">
                        <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors text-xs text-zinc-100 leading-relaxed whitespace-pre-wrap break-words max-h-36 overflow-y-auto custom-scrollbar shadow-inner">
                          {item.descripcion}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-300 whitespace-nowrap">
                        {Number(item.cantidad)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-300 whitespace-nowrap">
                        {formatCurrency(item.precio_unitario)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap">
                        {formatCurrency(sub)}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 animate-content-fade">
          {filteredItems.map((item) => {
            const quoteObj = quoteMap[item.cotizacion_id];
            const sub = (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0);
            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="bg-[#101012] hover:bg-[#131316] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md group relative cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-poppins text-xs font-bold text-amber-400 tracking-wide bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md truncate">
                        {item.cotizacion_folio || quoteObj?.numero_presupuesto || 'PRESUPUESTO'}
                      </span>
                      {quoteObj?.nombre_proyecto && (
                        <span
                          className="text-xs text-zinc-400 truncate font-sans max-w-[150px] hidden sm:inline"
                          title={quoteObj.nombre_proyecto}
                        >
                          {quoteObj.nombre_proyecto}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-[10px] font-poppins font-medium bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30">
                        x{Number(item.cantidad)}
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                          className="p-1.5 sm:p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
                          aria-label="Opciones de partida"
                        >
                          <MoreVertical className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        {activeMenuId === item.id && renderFloatingMenu(item)}
                      </div>
                    </div>
                  </div>

                  {quoteObj?.nombre_proyecto && (
                    <p className="text-xs text-zinc-400 truncate mb-2 sm:hidden font-sans">
                      {quoteObj.nombre_proyecto}
                    </p>
                  )}

                  {/* Cuadrado Modular de Descripción Completa */}
                  <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 group-hover:border-zinc-700/80 transition-colors shadow-inner min-h-[96px] max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="font-sans text-xs sm:text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap break-words select-text">
                      {item.descripcion}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-end justify-between">
                  <div>
                    <p className="text-xl sm:text-lg font-bold text-white tracking-tight leading-none font-poppins">
                      {formatCurrency(sub)}
                    </p>
                    <p className="text-[11px] font-poppins text-zinc-500 mt-1">
                      Unit: {formatCurrency(item.precio_unitario)}
                    </p>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="h-9 sm:h-8 px-3 sm:px-2.5 rounded-xl sm:rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="font-poppins text-xs sm:text-[11px]">Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sentinel para carga infinita al deslizar (offset corto a la base de datos) */}
      {!isLoading && !error && hasMore && !searchTerm && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-poppins text-zinc-400">
              <Spinner size="sm" color="warning" className="scale-75" />
              <span>Cargando más partidas...</span>
            </div>
          ) : (
            <div className="h-4 w-full" aria-hidden="true" />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR PARTIDA                                              */}
      {/* ========================================================================= */}
      {isFormModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-poppins antialiased">
            <div
              className="fixed inset-0 bg-black/85 backdrop-blur-sm -z-10 transition-opacity"
              onClick={() => setIsFormModalOpen(false)}
            />
            <form
              onSubmit={handleSubmitItem}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-heading">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>{editingItemId ? 'Editar Partida' : 'Nueva Partida'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Concepto técnico y cotización unitaria.
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
                  <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                    Presupuesto asociado *
                  </label>
                  <select
                    required
                    disabled={!!editingItemId}
                    value={itemForm.cotizacion_id}
                    onChange={(e) => setItemForm({ ...itemForm, cotizacion_id: e.target.value })}
                    className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="">Selecciona una cotización...</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.numero_presupuesto} — {q.nombre_proyecto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                    Descripción técnica *
                  </label>
                  <div className="rounded-xl overflow-hidden border border-zinc-800 focus-within:border-amber-400 bg-zinc-950/70 transition-colors shadow-inner">
                    <textarea
                      rows={4}
                      required
                      placeholder="Detalle completo del servicio, suministro, maquinado o fabricación..."
                      value={itemForm.descripcion}
                      onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })}
                      className="w-full p-3 bg-transparent text-sm sm:text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-colors resize-y min-h-[96px] leading-relaxed custom-scrollbar block"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={itemForm.cantidad}
                      onChange={(e) => setItemForm({ ...itemForm, cantidad: e.target.value })}
                      className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-poppins focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                      Precio unitario *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={itemForm.precio_unitario}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, precio_unitario: e.target.value })
                      }
                      className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-poppins focus:border-amber-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between font-poppins text-xs">
                  <span className="text-zinc-400">Subtotal:</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {formatCurrency(previewSubtotal)}
                  </span>
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
                  {isSubmitting ? 'Guardando...' : editingItemId ? 'Guardar Cambios' : 'Registrar Partida'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE PARTIDA (GET /partidas-cotizacion/{id})                  */}
      {/* ========================================================================= */}
      {selectedItemDetail &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-poppins antialiased">
            <div
              className="fixed inset-0 bg-black/85 backdrop-blur-sm -z-10 transition-opacity"
              onClick={() => setSelectedItemDetail(null)}
            />
            <div
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <span className="text-amber-400 font-poppins text-xs font-bold">
                    Folio{' '}
                    {selectedItemDetail.cotizacion_folio ||
                      quoteMap[selectedItemDetail.cotizacion_id]?.numero_presupuesto ||
                      'Presupuesto'}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1 font-heading">
                    Desglose técnico de partida
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemDetail(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isLoadingDetail ? (
                <div className="py-4 text-center text-xs font-poppins text-zinc-500">
                  Consultando partida...
                </div>
              ) : (
                <div className="space-y-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-inner">
                    <span className="text-[10px] font-poppins text-amber-400 block font-semibold mb-1.5">
                      Descripción modular de la partida
                    </span>
                    <div className="text-zinc-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-sans max-h-60 overflow-y-auto custom-scrollbar select-text">
                      {selectedItemDetail.descripcion}
                    </div>
                  </div>

                  {quoteMap[selectedItemDetail.cotizacion_id] && (
                    <div className="pt-2 border-t border-zinc-800/70">
                      <span className="text-[10px] font-poppins text-zinc-500 block">
                        Proyecto asociado
                      </span>
                      <p className="text-zinc-300 font-medium mt-0.5">
                        {quoteMap[selectedItemDetail.cotizacion_id].nombre_proyecto}
                      </p>
                    </div>
                  )}

                  {(() => {
                    const sub =
                      (Number(selectedItemDetail.cantidad) || 0) *
                      (Number(selectedItemDetail.precio_unitario) || 0);
                    return (
                      <div className="pt-3 border-t border-zinc-800/80 space-y-1.5 font-poppins">
                        <div className="flex justify-between text-zinc-400">
                          <span>Cantidad:</span>
                          <span className="text-zinc-200">{Number(selectedItemDetail.cantidad)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Precio unitario:</span>
                          <span className="text-zinc-200">
                            {formatCurrency(selectedItemDetail.precio_unitario)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-sm">
                          <span className="text-amber-400 font-bold">Total:</span>
                          <span className="text-white text-base font-bold">
                            {formatCurrency(sub)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(selectedItemDetail)}
                  className="h-11 sm:h-9 px-3.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedItemDetail)}
                  className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Partida</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default QuoteItemsPage;
