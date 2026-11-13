import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import {
  FileText,
  Search,
  Plus,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  RotateCcw,
  Inbox,
  AlertCircle,
  X,
  Building2,
  Building,
  Factory,
  MapPin,
  User,
  Users,
  Mail,
  Trash2,
  Layers,
  ArrowLeft,
  ArrowRight,
  Check,
  DollarSign,
  Pencil,
  Send,
  Filter,
  LayoutGrid,
  List,
  Eye,
  TrendingUp,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import GlideSelect from '../../components/GlideSelect';
import SearchableCombobox from '../../components/SearchableCombobox';
import {
  Skeleton,
  QuotesGridSkeleton,
  QuotesTableSkeleton,
  QuoteDetailItemsSkeleton,
  MobileCardsSkeleton,
} from '../../components/Skeleton';

/**
 * Diccionario de Estados de Cotización con identidad visual corporativa MTS
 * Corresponde a los valores del backend: 'borrador', 'enviada', 'aceptada', 'pagada', 'cancelada'
 */
export const ESTADOS_COTIZACION = {
  borrador: {
    key: 'borrador',
    label: 'BORRADOR',
    fullLabel: 'Borrador (Interno)',
    desc: 'En preparación técnica, pendiente de envío',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700/80',
    dotClass: 'bg-zinc-400',
    buttonActiveClass: 'bg-zinc-800 text-white border-zinc-600 shadow-sm',
    icon: Clock,
  },
  enviada: {
    key: 'enviada',
    label: 'ENVIADA',
    fullLabel: 'Enviada al Cliente',
    desc: 'Emitida en PDF y enviada a compras/mantenimiento',
    badgeClass: 'bg-[#6366F1]/10 text-[#818CF8] border-[#6366F1]/30',
    dotClass: 'bg-[#6366F1]',
    buttonActiveClass: 'bg-[#6366F1]/20 text-[#A5B4FC] border-[#6366F1]/50 shadow-sm',
    icon: Send,
  },
  aceptada: {
    key: 'aceptada',
    label: 'ACEPTADA',
    fullLabel: 'Aceptada / Pendiente',
    desc: 'Aprobada por cliente, pendiente de liquidación',
    badgeClass: 'bg-amber-400/10 text-amber-400 border-amber-400/25',
    dotClass: 'bg-amber-400',
    buttonActiveClass: 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm',
    icon: CheckCircle2,
  },
  pagada: {
    key: 'pagada',
    label: 'PAGADA',
    fullLabel: 'Pagada / Ingreso',
    desc: 'Venta liquidada e ingresada formalmente',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/25',
    dotClass: 'bg-green-500',
    buttonActiveClass: 'bg-green-500/20 text-green-300 border-green-500/50 shadow-sm',
    icon: DollarSign,
  },
  cancelada: {
    key: 'cancelada',
    label: 'CANCELADA',
    fullLabel: 'Cancelada / Declinada',
    desc: 'Cancelada internamente o rechazada por cliente',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    dotClass: 'bg-rose-400',
    buttonActiveClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm',
    icon: XCircle,
  },
};

const getEstadoConfig = (estado) => {
  const norm = (estado || 'borrador').toLowerCase();
  return ESTADOS_COTIZACION[norm] || ESTADOS_COTIZACION.borrador;
};

/**
 * Formatea valores numéricos como moneda estándar ($9,800.84)
 */
const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formato largo para encabezados de fecha: "Martes, 3 de noviembre de 2026"
 */
const formatGroupDate = (dateString) => {
  if (!dateString) return 'Sin fecha programada';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

/**
 * Calcula el número de presupuesto más chico disponible (primer hueco libre)
 * para el año en curso (formato MTS-YYYY-XXX). Para 2026 en adelante comienza en 8000 (MTS-2026-8000).
 */
export const getNextAvailableQuoteNumber = (quotesList = []) => {
  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`^MTS-${currentYear}-(\\d+)$`, 'i');
  const usedNumbers = new Set();

  quotesList.forEach((q) => {
    const folio = (q.numero_presupuesto || '').trim();
    const m = folio.match(pattern);
    if (m) {
      const num = parseInt(m[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
    }
  });

  const startNumber = currentYear >= 2026 ? 8000 : 1;
  let candidate = startNumber;
  while (usedNumbers.has(candidate)) {
    candidate += 1;
  }

  const padLength = candidate >= 1000 || currentYear >= 2026 ? 4 : 3;
  return `MTS-${currentYear}-${String(candidate).padStart(padLength, '0')}`;
};

export const QuotesPage = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [plants, setPlants] = useState([]);
  const [isPlantsLoading, setIsPlantsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal Wizard (Crear o Editar en 3 Partes)
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null); // null = Crear, number = Editar
  const [deletedPartidaIds, setDeletedPartidaIds] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  // Modal Ver Detalle de Cotización
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailExpenses, setDetailExpenses] = useState([]);
  const [isLoadingDetailItems, setIsLoadingDetailItems] = useState(false);
  const [isEditingAssignments, setIsEditingAssignments] = useState(false);
  const [detailAssignedIds, setDetailAssignedIds] = useState([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Formulario del Presupuesto Comercial
  const initialQuoteForm = {
    numero_presupuesto: '',
    nombre_proyecto: '',
    atencion_a: '',
    cliente_id: '',
    planta_id: '',
    moneda: 'MXN',
    porcentaje_anticipo: 50,
    tiempo_entrega: '30 días hábiles a partir de recibida la orden de compra y/o anticipo',
    vigencia_dias: 40,
    condiciones_pago: 'Los pagos a MTS SYSTEMS se deben efectuar por medio de cheque o transferencia bancaria.',
    incluye_instalacion: false,
    notas_legales:
      'Salvo fluctuación importando del Peso-Dólar. Los precios están sujetos a cambio por variación en costos de material sin previo aviso. El IVA no se incluye en la presente cotización, dicho impuesto será adicionado al momento de facturar.',
    estado: 'borrador',
    usuarios_asignados_ids: [],
    partidas: [{ descripcion: '', cantidad: 1, precio_unitario: '' }],
  };
  const [quoteForm, setQuoteForm] = useState(initialQuoteForm);

  // Bloqueo de scroll cuando un modal esté activo
  useEffect(() => {
    if (isWizardModalOpen || selectedQuoteDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isWizardModalOpen, selectedQuoteDetail]);

  // Cerrar menú flotante al hacer clic afuera
  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const PAGE_SIZE = 10; // Offset corto a la base de datos (entre 5 y 10)
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Carga inicial de cotizaciones con offset corto
   */
  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get(
        `/cotizaciones/?include_cancelled=true&skip=0&limit=${PAGE_SIZE}`
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setQuotes(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('No se pudo conectar con el servidor para obtener las cotizaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carga el siguiente lote con offset a la base de datos
   */
  const loadMoreQuotes = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextSkip = quotes.length;
      const response = await apiClient.get(
        `/cotizaciones/?include_cancelled=true&skip=${nextSkip}&limit=${PAGE_SIZE}`
      );
      const nextData = Array.isArray(response.data) ? response.data : [];
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setQuotes((prev) => {
        const existingIds = new Set(prev.map((q) => q.id));
        const filtered = nextData.filter((q) => !existingIds.has(q.id));
        return [...prev, ...filtered];
      });
    } catch (err) {
      console.error('Error al cargar más cotizaciones:', err);
      showToast('No fue posible cargar más registros.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, quotes.length]);

  /**
   * Infinite scroll observer para deslizar sin requerir clic
   */
  useEffect(() => {
    if (isLoading || !hasMore || searchTerm || selectedStatusFilter !== 'todos') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreQuotes();
        }
      },
      { rootMargin: '300px 0px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [isLoading, hasMore, isLoadingMore, searchTerm, selectedStatusFilter, loadMoreQuotes]);

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/clientes/?skip=0&limit=100');
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  };

  const fetchEmployeesCatalog = async () => {
    try {
      const response = await apiClient.get('/usuarios/?skip=0&limit=200');
      const allUsers = Array.isArray(response.data) ? response.data : [];
      setEmployees(
        allUsers.filter(
          (u) =>
            (u.estado || 'activo').toLowerCase() === 'activo' &&
            (u.rol || '').toLowerCase() === 'empleado'
        )
      );
    } catch (err) {
      console.error('Error al cargar operadores:', err);
    }
  };

  const fetchPlantsForClient = async (clientId) => {
    if (!clientId) {
      setPlants([]);
      setIsPlantsLoading(false);
      return;
    }
    try {
      setIsPlantsLoading(true);
      const response = await apiClient.get(`/plantas/?cliente_id=${clientId}`);
      setPlants(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar plantas del cliente:', err);
      setPlants([]);
    } finally {
      setIsPlantsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchClients();
    fetchEmployeesCatalog();
  }, []);

  // Al cambiar cliente_id en el formulario, cargar sus plantas
  useEffect(() => {
    if (quoteForm.cliente_id) {
      fetchPlantsForClient(quoteForm.cliente_id);
    } else {
      setPlants([]);
    }
  }, [quoteForm.cliente_id]);

  /**
   * Conteo de cotizaciones por estado
   */
  const statusCounts = useMemo(() => {
    const counts = {
      todos: quotes.length,
      borrador: 0,
      enviada: 0,
      aceptada: 0,
      pagada: 0,
      cancelada: 0,
    };
    quotes.forEach((q) => {
      const s = (q.estado || 'borrador').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [quotes]);

  /**
   * Mapeo rápido de Clientes por ID para visualización corporativa
   */
  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      map[c.id] = c.nombre;
    });
    return map;
  }, [clients]);

  /**
   * Métricas financieras agregadas por estado
   */
  const financialMetrics = useMemo(() => {
    let totalGeneral = 0;
    let totalPagado = 0;
    let totalAceptado = 0;
    let totalEnviado = 0;
    let totalBorrador = 0;

    quotes.forEach((q) => {
      const amount = Number(q.total) || 0;
      totalGeneral += amount;
      const s = (q.estado || 'borrador').toLowerCase();
      if (s === 'pagada') totalPagado += amount;
      else if (s === 'aceptada') totalAceptado += amount;
      else if (s === 'enviada') totalEnviado += amount;
      else if (s === 'borrador') totalBorrador += amount;
    });

    return {
      totalGeneral,
      totalPagado,
      totalAceptado,
      totalEnviado,
      totalBorrador,
    };
  }, [quotes]);

  /**
   * Opciones para el filtro GlideSelect de estados de cotización
   */
  const filterOptions = useMemo(
    () => [
      {
        value: 'todos',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Todos los estados</span>
          </span>
        ),
        tag: String(statusCounts.todos || 0),
      },
      ...Object.entries(ESTADOS_COTIZACION).map(([key, cfg]) => ({
        value: key,
        label: (
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
            <span>{cfg.label}</span>
          </span>
        ),
        tag: String(statusCounts[key] || 0),
      })),
    ],
    [statusCounts]
  );

  /**
   * Filtrado y agrupación por estado, término de búsqueda y fecha
   */
  const groupedQuotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = quotes.filter((q) => {
      // Filtro por Estado
      if (selectedStatusFilter !== 'todos') {
        const s = (q.estado || 'borrador').toLowerCase();
        if (s !== selectedStatusFilter) return false;
      }

      // Filtro por Búsqueda (Número de Presupuesto, Nombre o Atención a)
      if (!term) return true;
      return (
        (q.numero_presupuesto && q.numero_presupuesto.toLowerCase().includes(term)) ||
        (q.nombre_proyecto && q.nombre_proyecto.toLowerCase().includes(term)) ||
        (q.atencion_a && q.atencion_a.toLowerCase().includes(term))
      );
    });

    filtered.sort((a, b) => new Date(b.fecha || b.created_at || 0) - new Date(a.fecha || a.created_at || 0));

    const groups = {};
    filtered.forEach((q) => {
      const dateKey = q.fecha ? new Date(q.fecha).toISOString().split('T')[0] : 'sin-fecha';
      if (!groups[dateKey]) {
        groups[dateKey] = {
          label: formatGroupDate(q.fecha),
          items: [],
        };
      }
      groups[dateKey].items.push(q);
    });

    return Object.entries(groups).map(([key, data]) => ({
      key,
      label: data.label,
      items: data.items,
    }));
  }, [quotes, searchTerm, selectedStatusFilter]);

  /**
   * Clientes y plantas seleccionadas para la vista previa del resumen
   */
  const selectedClientObj = useMemo(() => {
    return clients.find((c) => String(c.id) === String(quoteForm.cliente_id));
  }, [clients, quoteForm.cliente_id]);

  const selectedPlantObj = useMemo(() => {
    return plants.find((p) => String(p.id) === String(quoteForm.planta_id));
  }, [plants, quoteForm.planta_id]);

  /**
   * Opciones formateadas con buscador para SearchableCombobox
   */
  const clientComboboxOptions = useMemo(() => {
    return clients.map((c) => ({
      value: String(c.id),
      label: c.nombre,
      sublabel: c.direccion || c.correo || '',
      icon: Building2,
    }));
  }, [clients]);

  const plantComboboxOptions = useMemo(() => {
    return plants.map((p) => {
      const pNum = (p.numero_planta || '').trim();
      const pLabel = pNum
        ? pNum.toLowerCase().startsWith('planta')
          ? pNum
          : `Planta ${pNum}`
        : 'Planta';
      return {
        value: String(p.id),
        label: pLabel,
        sublabel: p.ubicacion || '',
        icon: Factory,
      };
    });
  }, [plants]);

  /**
   * Cálculos financieros en vivo del formulario (sin sumar IVA en cotización)
   */
  const formCalculations = useMemo(() => {
    let subtotal = 0;
    quoteForm.partidas.forEach((p) => {
      const cant = parseFloat(p.cantidad) || 0;
      const pu = parseFloat(p.precio_unitario) || 0;
      subtotal += cant * pu;
    });
    return { subtotal, total: subtotal };
  }, [quoteForm.partidas]);

  /**
   * Apertura del modal en modo CREACIÓN
   * Asigna automáticamente el número de presupuesto más chico disponible (primer hueco)
   */
  const handleOpenCreate = async () => {
    setEditingQuoteId(null);
    setDeletedPartidaIds([]);
    setCurrentStep(1);
    setWizardError(null);

    // Asignar inmediatamente el número más chico disponible calculado de forma local
    const localNext = getNextAvailableQuoteNumber(quotes);
    setQuoteForm({
      ...initialQuoteForm,
      numero_presupuesto: localNext,
    });
    setIsWizardModalOpen(true);

    // Consultar al servidor para verificar contra toda la base de datos completa
    try {
      const res = await apiClient.get('/cotizaciones/siguiente-numero');
      if (res.data?.numero_presupuesto) {
        setQuoteForm((prev) => ({
          ...prev,
          numero_presupuesto: res.data.numero_presupuesto,
        }));
      }
    } catch {
      // Si falla la red, el número local previamente asignado se mantiene
    }
  };

  /**
   * Apertura del modal en modo EDICIÓN desde los 3 puntitos o detalle
   */
  const handleOpenEdit = async (quote) => {
    try {
      setActiveMenuId(null);
      setSelectedQuoteDetail(null);
      setIsLoading(true);

      // Cargar cotización detallada y partidas activas
      const [quoteRes, itemsRes] = await Promise.all([
        apiClient.get(`/cotizaciones/${quote.id}`),
        apiClient.get(`/partidas-cotizacion/?cotizacion_id=${quote.id}`),
      ]);
      const fullQuote = quoteRes.data || quote;
      const items = Array.isArray(itemsRes.data) ? itemsRes.data : [];

      setEditingQuoteId(quote.id);
      setDeletedPartidaIds([]);
      setCurrentStep(1);
      setWizardError(null);

      // Si tiene cliente, precargar sus plantas
      if (fullQuote.cliente_id) {
        await fetchPlantsForClient(fullQuote.cliente_id);
      }

      setQuoteForm({
        numero_presupuesto: fullQuote.numero_presupuesto || '',
        nombre_proyecto: fullQuote.nombre_proyecto || '',
        atencion_a: fullQuote.atencion_a || '',
        cliente_id: fullQuote.cliente_id ? String(fullQuote.cliente_id) : '',
        planta_id: fullQuote.planta_id ? String(fullQuote.planta_id) : '',
        moneda: fullQuote.moneda || 'MXN',
        porcentaje_anticipo:
          fullQuote.porcentaje_anticipo !== undefined ? fullQuote.porcentaje_anticipo : 50,
        tiempo_entrega:
          fullQuote.tiempo_entrega ||
          '30 días hábiles a partir de recibida la orden de compra y/o anticipo',
        vigencia_dias: fullQuote.vigencia_dias || 40,
        condiciones_pago:
          fullQuote.condiciones_pago ||
          'Los pagos a MTS SYSTEMS se deben efectuar por medio de cheque o transferencia bancaria.',
        incluye_instalacion: Boolean(fullQuote.incluye_instalacion),
        notas_legales:
          fullQuote.notas_legales ||
          'Salvo fluctuación importando del Peso-Dólar. Los precios están sujetos a cambio por variación en costos de material sin previo aviso. El IVA no se incluye en la presente cotización, dicho impuesto será adicionado al momento de facturar.',
        estado: (fullQuote.estado || 'borrador').toLowerCase(),
        usuarios_asignados_ids: Array.isArray(fullQuote.usuarios_asignados_ids)
          ? fullQuote.usuarios_asignados_ids
          : [],
        partidas:
          items.length > 0
            ? items.map((it) => ({
                id: it.id,
                descripcion: it.descripcion,
                cantidad: it.cantidad,
                precio_unitario: it.precio_unitario,
              }))
            : [{ descripcion: '', cantidad: 1, precio_unitario: '' }],
      });

      setIsWizardModalOpen(true);
    } catch (err) {
      console.error('Error al abrir editor de cotización:', err);
      showToast('Error al cargar datos para edición.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apertura del modal de Detalle (GET /cotizaciones/{id}, /partidas-cotizacion y /gastos-reales)
   */
  const handleOpenDetail = async (quote) => {
    setSelectedQuoteDetail(quote);
    setIsEditingAssignments(false);
    setDetailAssignedIds(
      Array.isArray(quote.usuarios_asignados_ids) ? quote.usuarios_asignados_ids : []
    );
    setIsLoadingDetailItems(true);
    try {
      const [quoteRes, itemsRes, expensesRes] = await Promise.all([
        apiClient.get(`/cotizaciones/${quote.id}`),
        apiClient.get(`/partidas-cotizacion/?cotizacion_id=${quote.id}`),
        apiClient.get(`/gastos-reales/?cotizacion_id=${quote.id}`),
      ]);
      if (quoteRes.data) {
        setSelectedQuoteDetail(quoteRes.data);
        setDetailAssignedIds(
          Array.isArray(quoteRes.data.usuarios_asignados_ids)
            ? quoteRes.data.usuarios_asignados_ids
            : []
        );
      }
      setDetailItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setDetailExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
    } catch (err) {
      console.error('Error al cargar detalle de cotización:', err);
      setDetailItems([]);
      setDetailExpenses([]);
    } finally {
      setIsLoadingDetailItems(false);
    }
  };

  /**
   * Guardar asignación rápida de empleados al proyecto desde el modal de detalle
   */
  const handleSaveDetailAssignments = async () => {
    if (!selectedQuoteDetail) return;
    try {
      setIsSavingAssignments(true);
      const res = await apiClient.put(`/cotizaciones/${selectedQuoteDetail.id}/asignaciones`, {
        usuario_ids: detailAssignedIds,
      });
      if (res.data) {
        setSelectedQuoteDetail(res.data);
        setQuotes((prev) => prev.map((q) => (q.id === res.data.id ? res.data : q)));
      }
      setIsEditingAssignments(false);
      showToast('Personal operativo actualizado en el proyecto.');
    } catch (err) {
      console.error('Error al asignar operadores:', err);
      showToast(err.response?.data?.detail || 'No se pudo actualizar la asignación.');
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const toggleFormEmployee = (userId) => {
    setQuoteForm((prev) => {
      const exists = prev.usuarios_asignados_ids.includes(userId);
      return {
        ...prev,
        usuarios_asignados_ids: exists
          ? prev.usuarios_asignados_ids.filter((id) => id !== userId)
          : [...prev.usuarios_asignados_ids, userId],
      };
    });
  };

  const toggleDetailEmployee = (userId) => {
    setDetailAssignedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  /**
   * Cambio rápido de estado de la cotización
   */
  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      await apiClient.put(`/cotizaciones/${quoteId}`, { estado: newStatus });
      const cfg = getEstadoConfig(newStatus);
      showToast(`Estado actualizado a: ${cfg.label}`);
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, estado: newStatus } : q))
      );
      if (selectedQuoteDetail && selectedQuoteDetail.id === quoteId) {
        setSelectedQuoteDetail((prev) => ({ ...prev, estado: newStatus }));
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      showToast('No se pudo actualizar el estado.');
    }
  };

  /**
   * Cancelación formal de presupuesto (PATCH /cotizaciones/{id}/cancelar)
   */
  const handleCancelQuote = async (quoteId, numPresupuesto) => {
    const confirmCancel = window.confirm(
      `¿Deseas marcar como CANCELADO el presupuesto comercial "${numPresupuesto}"?`
    );
    if (!confirmCancel) return;

    try {
      await apiClient.patch(`/cotizaciones/${quoteId}/cancelar`);
      showToast(`Presupuesto ${numPresupuesto} cancelado.`);
      fetchQuotes();
      if (selectedQuoteDetail?.id === quoteId) {
        setSelectedQuoteDetail((prev) => ({ ...prev, estado: 'cancelada' }));
      }
    } catch (err) {
      console.error('Error al cancelar cotización:', err);
      showToast(err.response?.data?.detail || 'No fue posible cancelar el presupuesto.');
    }
  };

  /**
   * Baja idempotente de presupuesto vía DELETE /cotizaciones/{id}
   */
  const handleDeleteQuote = async (quoteId, numPresupuesto) => {
    const confirmDelete = window.confirm(
      `¿Confirmas dar de baja el presupuesto "${numPresupuesto}"?`
    );
    if (!confirmDelete) return;

    try {
      await apiClient.delete(`/cotizaciones/${quoteId}`);
      showToast(`Presupuesto ${numPresupuesto} dado de baja.`);
      fetchQuotes();
      if (selectedQuoteDetail?.id === quoteId) {
        setSelectedQuoteDetail((prev) => ({ ...prev, estado: 'cancelada' }));
      }
    } catch (err) {
      console.error('Error al dar de baja cotización:', err);
      showToast(err.response?.data?.detail || 'No fue posible dar de baja el presupuesto.');
    }
  };

  /**
   * Descarga del PDF oficial
   */
  const handleDownloadPdf = async (quoteId, numPresupuesto) => {
    try {
      setDownloadingId(quoteId);
      const response = await apiClient.get(`/cotizaciones/${quoteId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeFolio = String(numPresupuesto || 'Presupuesto').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.setAttribute('download', `Cotizacion_${safeFolio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      showToast('Error al generar el PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Manejo dinámico de partidas en el Wizard
   */
  const handleAddPartida = () => {
    setQuoteForm({
      ...quoteForm,
      partidas: [...quoteForm.partidas, { descripcion: '', cantidad: 1, precio_unitario: '' }],
    });
  };

  const handleUpdatePartida = (index, field, value) => {
    const updated = [...quoteForm.partidas];
    updated[index] = { ...updated[index], [field]: value };
    setQuoteForm({ ...quoteForm, partidas: updated });
  };

  const handleRemovePartida = (index) => {
    if (quoteForm.partidas.length <= 1) return;
    const itemToRemove = quoteForm.partidas[index];
    if (itemToRemove.id) {
      setDeletedPartidaIds((prev) => [...prev, itemToRemove.id]);
    }
    const updated = quoteForm.partidas.filter((_, i) => i !== index);
    setQuoteForm({ ...quoteForm, partidas: updated });
  };

  /**
   * Navegación entre pasos del Wizard
   */
  const handleNextStep1 = () => {
    let folio = quoteForm.numero_presupuesto.trim();
    if (!folio) {
      folio = getNextAvailableQuoteNumber(quotes);
      setQuoteForm((prev) => ({ ...prev, numero_presupuesto: folio }));
    }
    if (!quoteForm.cliente_id) {
      setWizardError('Por favor selecciona un cliente corporativo.');
      return;
    }
    if (!quoteForm.nombre_proyecto.trim()) {
      setWizardError('Por favor describe el concepto o nombre del proyecto.');
      return;
    }
    if (!quoteForm.atencion_a.trim()) {
      setWizardError('Por favor indica a quién va dirigida la cotización (Atención a).');
      return;
    }
    setWizardError(null);
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    const validPartidas = quoteForm.partidas.filter(
      (p) => p.descripcion.trim() && parseFloat(p.precio_unitario) >= 0
    );
    if (validPartidas.length === 0) {
      setWizardError('Agrega al menos una partida técnica con descripción y precio unitario.');
      return;
    }
    setWizardError(null);
    setCurrentStep(3);
  };

  /**
   * Guardar (Crear o Actualizar) en el Backend
   */
  const handleSaveQuoteSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setWizardError(null);

      const quotePayload = {
        numero_presupuesto: quoteForm.numero_presupuesto.trim(),
        nombre_proyecto: quoteForm.nombre_proyecto.trim(),
        atencion_a: quoteForm.atencion_a.trim(),
        cliente_id: parseInt(quoteForm.cliente_id, 10),
        planta_id: quoteForm.planta_id ? parseInt(quoteForm.planta_id, 10) : undefined,
        moneda: quoteForm.moneda || 'MXN',
        porcentaje_anticipo: parseFloat(quoteForm.porcentaje_anticipo) || 50,
        tiempo_entrega: quoteForm.tiempo_entrega,
        vigencia_dias: parseInt(quoteForm.vigencia_dias, 10) || 40,
        condiciones_pago: quoteForm.condiciones_pago,
        incluye_instalacion: Boolean(quoteForm.incluye_instalacion),
        notas_legales: quoteForm.notas_legales,
        estado: quoteForm.estado || 'borrador',
        usuarios_asignados_ids: Array.isArray(quoteForm.usuarios_asignados_ids)
          ? quoteForm.usuarios_asignados_ids
          : [],
      };

      const validPartidas = quoteForm.partidas.filter(
        (p) => p.descripcion.trim() && parseFloat(p.precio_unitario) >= 0
      );

      if (editingQuoteId) {
        // === ACTUALIZACIÓN (PUT) ===
        await apiClient.put(`/cotizaciones/${editingQuoteId}`, quotePayload);

        // Eliminar partidas descartadas
        for (const delId of deletedPartidaIds) {
          try {
            await apiClient.delete(`/partidas-cotizacion/${delId}`);
          } catch (err) {
            console.warn(`Error al eliminar partida ${delId}:`, err);
          }
        }

        // Actualizar existentes o crear nuevas partidas
        for (const partida of validPartidas) {
          if (partida.id) {
            await apiClient.put(`/partidas-cotizacion/${partida.id}`, {
              descripcion: partida.descripcion.trim(),
              cantidad: parseFloat(partida.cantidad) || 1,
              precio_unitario: parseFloat(partida.precio_unitario) || 0,
            });
          } else {
            await apiClient.post('/partidas-cotizacion/', {
              cotizacion_id: editingQuoteId,
              descripcion: partida.descripcion.trim(),
              cantidad: parseFloat(partida.cantidad) || 1,
              precio_unitario: parseFloat(partida.precio_unitario) || 0,
            });
          }
        }

        showToast(`¡Presupuesto ${quotePayload.numero_presupuesto} actualizado con éxito!`);
      } else {
        // === CREACIÓN NUEVA (POST) ===
        const quoteRes = await apiClient.post('/cotizaciones/', quotePayload);
        const createdQuote = quoteRes.data;

        for (const partida of validPartidas) {
          await apiClient.post('/partidas-cotizacion/', {
            cotizacion_id: createdQuote.id,
            descripcion: partida.descripcion.trim(),
            cantidad: parseFloat(partida.cantidad) || 1,
            precio_unitario: parseFloat(partida.precio_unitario) || 0,
          });
        }

        showToast(`¡Presupuesto ${createdQuote.numero_presupuesto} registrado con éxito!`);
      }

      setIsWizardModalOpen(false);
      setEditingQuoteId(null);
      setDeletedPartidaIds([]);
      setCurrentStep(1);
      setQuoteForm(initialQuoteForm);
      fetchQuotes();
    } catch (err) {
      console.error('Error al guardar cotización:', err);
      setWizardError(
        err.response?.data?.detail ||
          'No se pudo guardar la cotización. Verifica los datos y que el número de presupuesto no esté duplicado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Menú flotante de acciones para cotización (reutilizable en vistas tarjeta y tabla)
   */
  const renderFloatingMenu = (quote) => (
    <div
      className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-sans text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenEdit(quote);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors font-medium"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Editar Cotización</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenDetail(quote);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 flex items-center gap-2 transition-colors"
      >
        <Layers className="w-3.5 h-3.5 text-zinc-400" />
        <span>Ver Detalle y Partidas</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleDownloadPdf(quote.id, quote.numero_presupuesto);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 flex items-center gap-2 transition-colors"
      >
        <ArrowDownToLine className="w-3.5 h-3.5 text-zinc-400" />
        <span>Descargar PDF</span>
      </button>

      <div className="h-px bg-zinc-800 my-1" />

      <div className="px-3 py-1 text-[10px] font-poppins text-zinc-500">
        Cambiar estado
      </div>
      {quote.estado !== 'pagada' && (
        <button
          type="button"
          onClick={() => {
            setActiveMenuId(null);
            handleUpdateStatus(quote.id, 'pagada');
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-green-400 hover:bg-green-950/20 flex items-center gap-2 transition-colors"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Marcar Pagada</span>
        </button>
      )}
      {quote.estado !== 'aceptada' && (
        <button
          type="button"
          onClick={() => {
            setActiveMenuId(null);
            handleUpdateStatus(quote.id, 'aceptada');
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:bg-amber-950/20 flex items-center gap-2 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Marcar Aceptada</span>
        </button>
      )}
      {quote.estado !== 'enviada' && (
        <button
          type="button"
          onClick={() => {
            setActiveMenuId(null);
            handleUpdateStatus(quote.id, 'enviada');
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-[#818CF8] hover:bg-[#6366F1]/20 flex items-center gap-2 transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>Marcar Enviada</span>
        </button>
      )}
      {quote.estado !== 'borrador' && (
        <button
          type="button"
          onClick={() => {
            setActiveMenuId(null);
            handleUpdateStatus(quote.id, 'borrador');
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Marcar Borrador</span>
        </button>
      )}

      <div className="h-px bg-zinc-800 my-1" />

      {quote.estado !== 'cancelada' && (
        <button
          type="button"
          onClick={() => {
            setActiveMenuId(null);
            handleCancelQuote(quote.id, quote.numero_presupuesto);
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelar Presupuesto</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleDeleteQuote(quote.id, quote.numero_presupuesto);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Dar de Baja</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 font-poppins">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-amber-400 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado: Título y Barra de Controles Web / Móvil */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-zinc-800/40">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5 font-heading">
            Cotizaciones
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
            Gestiona los presupuestos comerciales, ciclo de estados y documentos oficiales PDF.
          </p>
        </div>

        {/* Buscador, Switch de Vista y Botón de Creación */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 lg:w-96">
            <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, proyecto o cliente..."
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 text-sm sm:text-xs text-zinc-200 placeholder-zinc-500 rounded-xl pl-9 pr-8 py-2.5 sm:py-2 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Modo de Vista (Cuadrícula / Tabla) */}
          <div className="hidden sm:flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white shadow-sm font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Vista en Tarjetas"
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
              title="Vista en Tabla"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden xl:inline">Tabla</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-11 sm:h-9 px-3.5 btn-mts-primary font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Nueva Cotización</span>
            <span className="sm:hidden font-bold">Nueva</span>
          </button>
        </div>
      </div>

      {/* Filtro por Estado con GlideSelect */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-1 text-xs font-poppins">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Estado:</span>
          </div>

          <GlideSelect
            options={filterOptions}
            value={selectedStatusFilter}
            onChange={(val) => setSelectedStatusFilter(val)}
            ariaLabel="Filtrar cotizaciones por estado"
            showTags
            accentColor="#fbbf24"
            surfaceColor="#18181b"
            highlightColor="#27272a"
            textColor="#f4f4f5"
            size="md"
            radius={10}
            menuWidth={210}
            placement="bottom"
            align="left"
            popDuration={0}
            glideDuration={180}
            rememberPosition
          />
        </div>

        <div className="text-xs sm:text-[11px] text-zinc-400 flex items-center gap-2">
          <span className="hidden sm:inline">
            Mostrando{' '}
            <strong className="text-zinc-200">
              {groupedQuotes.reduce((acc, g) => acc + g.items.length, 0)}
            </strong>{' '}
            de <strong className="text-zinc-200">{quotes.length}</strong> cotizaciones
          </span>
          <span className="sm:hidden text-zinc-400 text-xs">
            <strong className="text-zinc-200">{groupedQuotes.reduce((acc, g) => acc + g.items.length, 0)}</strong>/{quotes.length}
          </span>
          {(searchTerm || selectedStatusFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatusFilter('todos');
              }}
              className="text-amber-400 hover:text-amber-300 underline text-xs ml-1 cursor-pointer transition-colors"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Estado de Carga: Esqueleto en Web, sin esqueletos pesados en móvil */}
      {isLoading ? (
        <>
          {/* Carga Esquelética exclusiva para pantallas Web/Escritorio */}
          <div className="hidden sm:block">
            {viewMode === 'table' ? (
              <QuotesTableSkeleton rows={7} />
            ) : (
              <QuotesGridSkeleton count={8} />
            )}
          </div>
          <MobileCardsSkeleton variant="quotes" count={5} />
        </>
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar cotizaciones</p>
            <p className="text-red-400/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchQuotes}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg transition-colors font-poppins"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : groupedQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-8">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
            <Inbox className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No se encontraron presupuestos</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchTerm || selectedStatusFilter !== 'todos'
              ? 'No hay cotizaciones que coincidan con los filtros aplicados.'
              : 'Aún no se han generado cotizaciones en el sistema.'}
          </p>
          {(searchTerm || selectedStatusFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatusFilter('todos');
              }}
              className="mt-3 text-xs text-amber-400 hover:underline font-poppins"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Vista en Tabla Completa (Aprovechamiento máximo de espacio en pantalla ancha) */
        <div className="bg-[#101012] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl animate-content-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-poppins text-[11px] select-none">
                  <th className="py-3 px-4">Presupuesto</th>
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Atención a</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-poppins">
                {groupedQuotes.flatMap((g) => g.items).map((quote) => {
                  const estadoCfg = getEstadoConfig(quote.estado);
                  const isDownloading = downloadingId === quote.id;

                  return (
                    <tr
                      key={quote.id}
                      onClick={() => handleOpenDetail(quote)}
                      className="hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-bold text-amber-400 whitespace-nowrap">
                        <span>{quote.numero_presupuesto}</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-zinc-100 max-w-xs xl:max-w-md truncate" title={quote.nombre_proyecto}>
                        {quote.nombre_proyecto}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-300 whitespace-nowrap">
                        {clientMap[quote.cliente_id] ? (
                          <span className="flex items-center gap-1.5" title={clientMap[quote.cliente_id]}>
                            <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[160px] xl:max-w-[220px]">{clientMap[quote.cliente_id]}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-400 whitespace-nowrap">
                        {quote.atencion_a ? (
                          <span className="flex items-center gap-1.5" title={quote.atencion_a}>
                            <User className="w-3 h-3 text-zinc-600 shrink-0" />
                            <span className="truncate max-w-[140px] xl:max-w-[180px]">{quote.atencion_a}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                        {quote.fecha
                          ? new Date(quote.fecha).toLocaleDateString('es-MX')
                          : 'Sin fecha'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-white text-sm">
                          {formatCurrency(quote.total || 0)}
                        </span>
                        <span className="text-[10px] text-zinc-500 ml-1">
                          {quote.moneda || 'MXN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${estadoCfg.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                          {estadoCfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(quote)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(quote)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(quote.id, quote.numero_presupuesto)}
                            disabled={isDownloading}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Descargar PDF"
                          >
                            {isDownloading ? (
                              <Spinner size="sm" color="warning" className="scale-75" />
                            ) : (
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === quote.id ? null : quote.id)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {activeMenuId === quote.id && renderFloatingMenu(quote)}
                          </div>
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
        /* Vista en Cuadrícula de Tarjetas Enriquecidas (Multi-columna para monitores anchos) */
        <div className="space-y-6 animate-content-fade">
          {groupedQuotes.map(({ key, label, items }) => (
            <div key={key} className="space-y-3">
              {/* Encabezado de Fecha con Línea Horizontal */}
              <div className="flex items-center gap-3 pt-2">
                <h2 className="text-xs font-semibold text-zinc-400 tracking-wide select-none">
                  {label}
                </h2>
                <div className="flex-1 h-px bg-zinc-800/80" />
              </div>

              {/* Cuadrícula de Tarjetas expandida en escritorio y limpia y espaciosa en móvil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                {items.map((quote) => {
                  const isDownloading = downloadingId === quote.id;
                  const estadoCfg = getEstadoConfig(quote.estado);
                  const StatusIcon = estadoCfg.icon;

                  return (
                    <div
                      key={quote.id}
                      onClick={() => handleOpenDetail(quote)}
                      className="bg-[#101012] hover:bg-[#131316] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md group relative cursor-pointer"
                    >
                      {/* Parte Superior: Presupuesto + Badge de Estado + Menú */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
                          <span
                            className="font-poppins text-xs font-bold text-amber-400 tracking-wide bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md"
                            title="Número de Presupuesto"
                          >
                            {quote.numero_presupuesto}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Badge Dinámico de Estado */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-poppins font-medium border ${estadoCfg.badgeClass}`}
                            >
                              <StatusIcon className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                              {estadoCfg.label}
                            </span>

                            {/* Botón de 3 Puntos */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === quote.id ? null : quote.id);
                                }}
                                className="p-1.5 sm:p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/60 transition-colors"
                                title="Opciones"
                                aria-label="Menú de opciones"
                              >
                                <MoreVertical className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                              {activeMenuId === quote.id && renderFloatingMenu(quote)}
                            </div>
                          </div>
                        </div>

                        {/* Título del Proyecto con letra más grande y legible en móvil */}
                        <h3
                          className="font-semibold text-base sm:text-sm text-zinc-100 tracking-tight leading-snug line-clamp-2 mt-1.5 sm:mt-1 font-heading"
                          title={quote.nombre_proyecto}
                        >
                          {quote.nombre_proyecto}
                        </h3>

                        {/* Cliente destacado; atención a reservado a pantallas grandes para dar aire al móvil */}
                        <div className="mt-2.5 sm:mt-3 space-y-1">
                          {(quote.cliente_nombre || clientMap[quote.cliente_id]) ? (
                            <div
                              className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium truncate"
                              title={quote.cliente_nombre || clientMap[quote.cliente_id]}
                            >
                              <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="truncate">
                                {quote.cliente_nombre || clientMap[quote.cliente_id]}
                              </span>
                            </div>
                          ) : null}
                          {quote.atencion_a ? (
                            <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] truncate" title={quote.atencion_a}>
                              <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                              <span className="truncate">{quote.atencion_a}</span>
                            </div>
                          ) : null}
                          {Array.isArray(quote.usuarios_asignados) &&
                            quote.usuarios_asignados.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#818CF8] font-poppins pt-0.5">
                                <Users className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {quote.usuarios_asignados.length}{' '}
                                  {quote.usuarios_asignados.length === 1
                                    ? 'empleado asignado'
                                    : 'empleados asignados'}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Parte Inferior: Total Presupuesto + Acción PDF Directa */}
                      <div className="mt-4 sm:mt-5 pt-3 border-t border-zinc-800/60 flex items-end justify-between">
                        <div>
                          <p className="text-2xl sm:text-xl font-bold text-white tracking-tight leading-none">
                            {formatCurrency(quote.total || 0)}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 font-poppins text-xs sm:text-[10px] text-zinc-500">
                            <span>{quote.fecha ? new Date(quote.fecha).toLocaleDateString('es-MX') : 'Sin fecha'}</span>
                            <span>•</span>
                            <span className="text-zinc-400 font-semibold">{quote.moneda || 'MXN'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Botón ver detalle en desktop (en móvil el toque en la tarjeta abre el detalle) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(quote)}
                            className="hidden sm:flex h-8 w-8 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white items-center justify-center transition-all"
                            title="Ver detalle completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Descargar PDF accesible y cómodo */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(quote.id, quote.numero_presupuesto)}
                            disabled={isDownloading}
                            className="h-9 sm:h-8 px-3 sm:px-2.5 rounded-xl sm:rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all focus:outline-none"
                            title="Descargar PDF membretado"
                          >
                            {isDownloading ? (
                              <Spinner size="sm" color="warning" className="scale-75" />
                            ) : (
                              <>
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                <span className="font-poppins text-xs sm:text-[11px]">PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sentinel para carga infinita al deslizar (offset corto a la base de datos) */}
      {!isLoading && !error && hasMore && !searchTerm && selectedStatusFilter === 'todos' && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-poppins text-zinc-400">
              <Spinner size="sm" color="warning" className="scale-75" />
              <span>Cargando más presupuestos...</span>
            </div>
          ) : (
            <div className="h-4 w-full" aria-hidden="true" />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL WIZARD EN 3 PASOS: CREAR / EDITAR (PORTAL DIRECTO A BODY z-[9999])  */}
      {/* ========================================================================= */}
      {isWizardModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-poppins antialiased">
            <div
              className="fixed inset-0 bg-black/85 backdrop-blur-sm -z-10 transition-opacity"
              onClick={() => setIsWizardModalOpen(false)}
            />
            <div
              className="relative w-full max-w-5xl 2xl:max-w-6xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[94vh] overflow-y-auto flex flex-col justify-between my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado y Stepper (3 Pasos Separados) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-2.5 sm:pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-heading">
                      {editingQuoteId ? (
                        <>
                          <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                          <span>
                            <span className="hidden sm:inline">Editar Presupuesto: </span>
                            <span className="sm:hidden">Editar: </span>
                            {quoteForm.numero_presupuesto}
                          </span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                          <span>Nuevo Presupuesto</span>
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {currentStep === 1 && 'Paso 1: Datos generales y cliente.'}
                      {currentStep === 2 && 'Paso 2: Partidas y precios cotizados.'}
                      {currentStep === 3 && 'Paso 3: Condiciones y resumen final.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWizardModalOpen(false)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Indicador Visual de Pasos (1 -> 2 -> 3) sin saltos de línea */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-0.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={`flex items-center gap-1.5 sm:gap-2 text-xs font-poppins transition-all whitespace-nowrap ${
                      currentStep === 1
                        ? 'text-white font-bold'
                        : currentStep > 1
                        ? 'text-zinc-300 hover:text-white cursor-pointer'
                        : 'text-zinc-400'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                        currentStep === 1
                          ? 'btn-mts-primary font-bold'
                          : currentStep > 1
                          ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      1
                    </span>
                    <span className="hidden sm:inline">1. Datos y Planta</span>
                    <span className="sm:hidden">1. Datos</span>
                  </button>

                  <div className="flex-1 h-px bg-zinc-800 min-w-[8px] max-w-[30px] sm:max-w-[80px]" />

                  <button
                    type="button"
                    onClick={() => currentStep > 2 && setCurrentStep(2)}
                    className={`flex items-center gap-1.5 sm:gap-2 text-xs font-poppins transition-all whitespace-nowrap ${
                      currentStep === 2
                        ? 'text-white font-bold'
                        : currentStep > 2
                        ? 'text-zinc-300 hover:text-white cursor-pointer'
                        : 'text-zinc-400'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                        currentStep === 2
                          ? 'btn-mts-primary font-bold'
                          : currentStep > 2
                          ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      2
                    </span>
                    <span>2. Partidas</span>
                  </button>

                  <div className="flex-1 h-px bg-zinc-800 min-w-[8px] max-w-[30px] sm:max-w-[80px]" />

                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 text-xs font-poppins whitespace-nowrap ${
                      currentStep === 3 ? 'text-white font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                        currentStep === 3 ? 'btn-mts-primary font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      3
                    </span>
                    <span className="hidden sm:inline">3. Términos y Resumen</span>
                    <span className="sm:hidden">3. Resumen</span>
                  </div>
                </div>

                {/* Banner de Error en el Wizard */}
                {wizardError && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{wizardError}</span>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PASO 1: DATOS GENERALES, CLIENTE, PLANTA Y CONTACTO              */}
                {/* ================================================================= */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {/* Número de Presupuesto */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-poppins text-zinc-400 block font-semibold truncate">
                            Presupuesto *
                          </label>
                          {!editingQuoteId && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await apiClient.get('/cotizaciones/siguiente-numero');
                                  if (res.data?.numero_presupuesto) {
                                    setQuoteForm((prev) => ({
                                      ...prev,
                                      numero_presupuesto: res.data.numero_presupuesto,
                                    }));
                                  }
                                } catch {
                                  const localNext = getNextAvailableQuoteNumber(quotes);
                                  setQuoteForm((prev) => ({
                                    ...prev,
                                    numero_presupuesto: localNext,
                                  }));
                                }
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer transition-colors"
                              title="Asignar el número más chico disponible"
                            >
                              Siguiente libre
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Ej. MTS-2026-8000"
                          value={quoteForm.numero_presupuesto}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, numero_presupuesto: e.target.value })
                          }
                          className="w-full h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-poppins placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors"
                        />
                      </div>

                      {/* Cliente Corporativo con Buscador SearchableCombobox */}
                      <SearchableCombobox
                        id="quote-cliente-id"
                        label="Cliente *"
                        placeholder="Selecciona un cliente..."
                        searchPlaceholder="Buscar cliente por nombre o dirección..."
                        value={quoteForm.cliente_id}
                        onChange={(val) => {
                          setQuoteForm({
                            ...quoteForm,
                            cliente_id: val,
                            planta_id: '',
                          });
                        }}
                        options={clientComboboxOptions}
                        icon={Building2}
                        emptyMessage="No se encontraron clientes registrados"
                        required
                      />

                      {/* Planta / Sucursal Vinculada con Buscador SearchableCombobox */}
                      <SearchableCombobox
                        id="quote-planta-id"
                        label="Planta / sucursal"
                        placeholder={
                          !quoteForm.cliente_id
                            ? 'Primero selecciona un cliente'
                            : isPlantsLoading
                            ? 'Cargando sucursales...'
                            : plants.length === 0
                            ? '(Sin sucursales - Matriz general)'
                            : 'Selecciona una planta (opcional)...'
                        }
                        searchPlaceholder="Buscar planta por número o ubicación..."
                        value={quoteForm.planta_id}
                        onChange={(val) => setQuoteForm({ ...quoteForm, planta_id: val })}
                        disabled={!quoteForm.cliente_id || isPlantsLoading}
                        isLoading={isPlantsLoading}
                        allowEmptyDefault={true}
                        emptyDefaultLabel="(Sin planta / matriz general)"
                        emptyDefaultValue=""
                        emptyDefaultSublabel={selectedClientObj?.direccion || 'Usar dirección fiscal del cliente'}
                        emptyDefaultIcon={Building}
                        options={plantComboboxOptions}
                        icon={Factory}
                        emptyMessage={
                          quoteForm.cliente_id
                            ? 'Este cliente no tiene sucursales registradas'
                            : 'Selecciona primero un cliente'
                        }
                      />

                      {/* Concepto / Nombre del Proyecto */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold truncate">
                          Proyecto / concepto *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. RETAPIZADO DE ASIENTO"
                          value={quoteForm.nombre_proyecto}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, nombre_proyecto: e.target.value })
                          }
                          className="w-full h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors"
                        />
                      </div>

                      {/* Atención a (Persona de contacto) */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold truncate">
                          Atención a *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Ing. Roberto Silva"
                          value={quoteForm.atencion_a}
                          onChange={(e) => setQuoteForm({ ...quoteForm, atencion_a: e.target.value })}
                          className="w-full h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Asignación de Empleados Autorizados para Capturar Gastos */}
                    <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-poppins text-zinc-300 font-semibold flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#818CF8]" />
                          <span>Empleados asignados al proyecto (registro de gastos)</span>
                        </label>
                        <span className="text-[10px] font-poppins text-[#818CF8] bg-[#6366F1]/10 border border-[#6366F1]/25 px-2 py-0.5 rounded-full">
                          {quoteForm.usuarios_asignados_ids.length} seleccionados
                        </span>
                      </div>

                      {employees.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          No hay usuarios con rol empleado activos actualmente. Puedes invitarlos desde el módulo Usuarios.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                          {employees.map((emp) => {
                            const selected = quoteForm.usuarios_asignados_ids.includes(emp.id);
                            return (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => toggleFormEmployee(emp.id)}
                                className={`px-3 py-2 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  selected
                                    ? 'bg-[#6366F1]/15 border-[#6366F1]/50 text-white shadow-sm'
                                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{emp.nombre}</p>
                                  <p className="text-[10px] text-zinc-500 truncate font-poppins">
                                    {emp.correo}
                                  </p>
                                </div>
                                <span
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                    selected
                                      ? 'bg-[#6366F1] border-[#6366F1] text-white'
                                      : 'border-zinc-700'
                                  }`}
                                >
                                  {selected && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PASO 2: PARTIDAS TÉCNICAS (CONCEPTO, CANTIDAD, PRECIO UNITARIO)   */}
                {/* ================================================================= */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 gap-2">
                      <span className="text-xs font-poppins text-zinc-400 font-semibold truncate">
                        Partidas ({quoteForm.partidas.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPartida}
                        className="h-9 sm:h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-poppins flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Partida</span>
                      </button>
                    </div>

                    {/* Lista modular de partidas adaptada para Surface Duo, móviles y pantallas táctiles */}
                    <div className="space-y-3 max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                      {quoteForm.partidas.map((partida, idx) => {
                        const sub =
                          (parseFloat(partida.cantidad) || 0) *
                          (parseFloat(partida.precio_unitario) || 0);

                        return (
                          <div
                            key={idx}
                            className="p-3 sm:p-4 bg-zinc-950/70 border border-zinc-800/90 rounded-2xl space-y-3 transition-all hover:border-zinc-700/80 shadow-md"
                          >
                            {/* Cabecera de la Partida: Número e Importe Total */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-semibold text-zinc-200">
                                  Partida #{idx + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-zinc-500 font-medium">Total:</span>
                                <span className="text-xs sm:text-sm font-bold text-amber-400 font-poppins">
                                  {formatCurrency(sub)}
                                </span>
                              </div>
                            </div>

                            {/* Cuadro de texto modular de la descripción técnica */}
                            <div className="rounded-xl border border-zinc-800 focus-within:border-amber-400 bg-zinc-900/60 transition-colors overflow-hidden">
                              <textarea
                                rows={2}
                                required
                                placeholder="Descripción técnica de la partida..."
                                value={partida.descripcion}
                                onChange={(e) =>
                                  handleUpdatePartida(idx, 'descripcion', e.target.value)
                                }
                                className="w-full bg-transparent p-2.5 sm:p-3 text-xs text-zinc-200 outline-none resize-y min-h-[56px] leading-relaxed custom-scrollbar block placeholder-zinc-600 font-poppins"
                              />
                            </div>

                            {/* Botones, controles y campos numéricos DEBAJO del cuadro de texto */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                {/* Cantidad */}
                                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/90 rounded-xl px-2.5 py-1.5 focus-within:border-amber-400 transition-colors">
                                  <label className="text-[11px] text-zinc-400 font-medium select-none">
                                    Cant:
                                  </label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    required
                                    value={partida.cantidad}
                                    onChange={(e) =>
                                      handleUpdatePartida(idx, 'cantidad', e.target.value)
                                    }
                                    className="w-16 sm:w-20 bg-transparent text-xs text-zinc-200 outline-none text-center font-semibold"
                                  />
                                </div>

                                {/* Precio Unitario */}
                                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/90 rounded-xl px-2.5 py-1.5 focus-within:border-amber-400 transition-colors">
                                  <label className="text-[11px] text-zinc-400 font-medium select-none">
                                    Precio ($):
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    required
                                    placeholder="0.00"
                                    value={partida.precio_unitario}
                                    onChange={(e) =>
                                      handleUpdatePartida(idx, 'precio_unitario', e.target.value)
                                    }
                                    className="w-24 sm:w-28 bg-transparent text-xs text-zinc-200 outline-none text-right font-semibold"
                                  />
                                </div>
                              </div>

                              {/* Botón Eliminar debajo del cuadro de texto */}
                              <div className="flex items-center gap-2 ml-auto">
                                {quoteForm.partidas.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePartida(idx)}
                                    className="h-9 px-3 bg-red-950/25 hover:bg-red-950/50 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-poppins flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                    title="Eliminar esta partida"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-semibold">Eliminar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Botón secundario para agregar otra partida al final de la lista */}
                      <button
                        type="button"
                        onClick={handleAddPartida}
                        className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-amber-400/60 rounded-xl text-xs font-poppins text-zinc-400 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-zinc-950/30 hover:bg-zinc-900/40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar otra partida</span>
                      </button>
                    </div>

                    {/* Previsualización en Vivo de Importes */}
                    <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-poppins">
                      <span className="text-zinc-400">Subtotal:</span>
                      <span className="text-white text-sm font-bold">
                        {formatCurrency(formCalculations.subtotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PASO 3: TÉRMINOS COMERCIALES, ESTADO Y RESUMEN FINANCIERO        */}
                {/* ================================================================= */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* Selector de Estado de la Cotización */}
                    <div className="space-y-1.5 p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                      <label className="text-[11px] font-poppins text-zinc-400 block font-semibold truncate">
                        Estado *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {Object.entries(ESTADOS_COTIZACION).map(([key, cfg]) => {
                          const isSelected = quoteForm.estado === key;
                          const StateIcon = cfg.icon;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setQuoteForm({ ...quoteForm, estado: key })}
                              className={`p-2 rounded-lg text-xs font-poppins border flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? cfg.buttonActiveClass
                                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <StateIcon className="w-3.5 h-3.5 shrink-0" />
                              <div className="text-left">
                                <p className="font-bold text-[11px] leading-none">{cfg.label}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Moneda */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                          Moneda
                        </label>
                        <select
                          value={quoteForm.moneda}
                          onChange={(e) => setQuoteForm({ ...quoteForm, moneda: e.target.value })}
                          className="w-full h-8 px-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none"
                        >
                          <option value="MXN">MXN (Pesos Mexicanos)</option>
                          <option value="USD">USD (Dólares Americanos)</option>
                        </select>
                      </div>

                      {/* % Anticipo */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                          % Anticipo
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quoteForm.porcentaje_anticipo}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, porcentaje_anticipo: e.target.value })
                          }
                          className="w-full h-8 px-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      {/* Vigencia en Días */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                          Vigencia (días)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quoteForm.vigencia_dias}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, vigencia_dias: e.target.value })
                          }
                          className="w-full h-8 px-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      {/* Tiempo de Entrega */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                          Tiempo de entrega
                        </label>
                        <input
                          type="text"
                          value={quoteForm.tiempo_entrega}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, tiempo_entrega: e.target.value })
                          }
                          className="w-full h-8 px-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      {/* Condiciones de Pago */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-poppins text-zinc-400 block font-semibold">
                          Condiciones de pago
                        </label>
                        <input
                          type="text"
                          value={quoteForm.condiciones_pago}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, condiciones_pago: e.target.value })
                          }
                          className="w-full h-8 px-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* Resumen Ejecutivo y Fiscal */}
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 font-poppins">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-bold text-amber-400 truncate">
                          Resumen financiero
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {quoteForm.partidas.length} partida(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                        <div>
                          <span className="text-zinc-400 block">Cliente:</span>
                          <span className="text-zinc-200 font-semibold">
                            {selectedClientObj?.nombre || 'No seleccionado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Planta:</span>
                          <span className="text-zinc-200">
                            {selectedPlantObj
                              ? `Planta ${selectedPlantObj.numero_planta || ''} (${selectedPlantObj.ubicacion})`
                              : 'Matriz / General'}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Presupuesto:</span>
                          <span className="text-amber-400 font-bold">{quoteForm.numero_presupuesto}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Estado:</span>
                          <span className="text-zinc-200 font-bold">
                            {getEstadoConfig(quoteForm.estado).label}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 text-xs border-t border-zinc-800/80">
                        <div className="flex justify-between text-zinc-400">
                          <span>Personal operativo asignado:</span>
                          <span className="text-[#818CF8] font-semibold font-poppins">
                            {quoteForm.usuarios_asignados_ids.length}{' '}
                            {quoteForm.usuarios_asignados_ids.length === 1 ? 'empleado' : 'empleados'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-sm">
                          <span className="text-amber-400 font-bold">Importe total neto:</span>
                          <span className="text-white text-lg font-bold font-poppins">
                            {formatCurrency(formCalculations.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer de Navegación de Pasos */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setIsWizardModalOpen(false)}
                    className="h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Atrás</span>
                  </button>
                )}

                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Siguiente: Partidas</span>
                    <span className="sm:hidden">Siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Siguiente: Resumen</span>
                    <span className="sm:hidden">Siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={handleSaveQuoteSubmit}
                    disabled={isSubmitting}
                    className="btn-mts-primary h-11 sm:h-9 px-5 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" color="current" className="scale-75 text-white" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span className="hidden sm:inline">
                          {editingQuoteId ? 'Guardar Cambios' : 'Registrar Cotización'}
                        </span>
                        <span className="sm:hidden">
                          {editingQuoteId ? 'Guardar' : 'Registrar'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL VER DETALLE DE COTIZACIÓN (PORTAL DIRECTO A BODY z-[9999])           */}
      {/* ========================================================================= */}
      {selectedQuoteDetail &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-poppins antialiased">
            <div
              className="fixed inset-0 bg-black/85 backdrop-blur-sm -z-10 transition-opacity"
              onClick={() => setSelectedQuoteDetail(null)}
            />
            <div
              className="relative w-full max-w-4xl lg:max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-6 max-h-[94vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Detalle */}
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-2.5 sm:pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-poppins text-sm font-bold">
                      {selectedQuoteDetail.numero_presupuesto}
                    </span>
                    {(() => {
                      const cfg = getEstadoConfig(selectedQuoteDetail.estado);
                      const StateIcon = cfg.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-poppins font-medium border ${cfg.badgeClass}`}
                        >
                          <StateIcon className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1 font-heading">
                    {selectedQuoteDetail.nombre_proyecto}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteDetail(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector / Barra de Cambio Rápido de Estado */}
              <div className="p-2.5 sm:p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1.5 font-poppins">
                <span className="text-[10px] text-zinc-500 block font-semibold truncate">
                  Estado:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(ESTADOS_COTIZACION).map(([key, cfg]) => {
                    const isCurrent =
                      (selectedQuoteDetail.estado || 'borrador').toLowerCase() === key;
                    const StateIcon = cfg.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleUpdateStatus(selectedQuoteDetail.id, key)}
                        className={`p-2 rounded-lg text-xs font-poppins border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCurrent
                            ? cfg.buttonActiveClass
                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                        title={cfg.desc}
                      >
                        <StateIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-bold text-[11px] truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datos de Cabecera del Detalle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs font-poppins">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Atención a</span>
                  <span className="text-zinc-200 truncate block">{selectedQuoteDetail.atencion_a || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Fecha</span>
                  <span className="text-zinc-200 block">
                    {selectedQuoteDetail.fecha
                      ? new Date(selectedQuoteDetail.fecha).toLocaleDateString('es-MX')
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Moneda</span>
                  <span className="text-zinc-200 block">
                    {selectedQuoteDetail.moneda} ({selectedQuoteDetail.porcentaje_anticipo}%)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Total</span>
                  <span className="text-amber-400 font-bold block">
                    {formatCurrency(selectedQuoteDetail.total || 0)}
                  </span>
                </div>
              </div>

              {/* Listado de Partidas Técnicas Registradas (Sólo Lectura en Detalle) */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-poppins text-zinc-300 font-bold flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Partidas ({detailItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedQuoteDetail)}
                    className="text-xs font-poppins text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>

                {isLoadingDetailItems ? (
                  <>
                    <div className="hidden sm:block">
                      <QuoteDetailItemsSkeleton count={3} />
                    </div>
                    <div className="sm:hidden py-4 text-center text-xs font-poppins text-zinc-500">
                      Cargando partidas...
                    </div>
                  </>
                ) : detailItems.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl space-y-1">
                    <p className="text-xs text-zinc-400">Sin partidas agregadas.</p>
                    <p className="text-[11px] text-zinc-600">
                      Usa "Editar" para capturar partidas técnicas.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Vista de partidas para Surface Duo y móviles (< sm) */}
                    <div className="sm:hidden space-y-2.5">
                      {detailItems.map((item, i) => {
                        const rowImporte =
                          (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0);
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-300">Partida #{i + 1}</span>
                              <span className="font-bold text-amber-400 font-poppins">
                                {formatCurrency(rowImporte)}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                              {item.descripcion}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-900">
                              <span>
                                Cant: <strong className="text-zinc-200">{item.cantidad}</strong>
                              </span>
                              <span>
                                P.U:{' '}
                                <strong className="text-zinc-200">
                                  {formatCurrency(item.precio_unitario)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Vista de tabla para pantallas grandes (>= sm) */}
                    <div className="hidden sm:block border border-zinc-800/80 rounded-xl overflow-x-auto bg-zinc-950/40 custom-scrollbar">
                      <table className="w-full text-left text-xs font-poppins">
                        <thead className="bg-zinc-900/90 text-[10px] text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="px-2 sm:px-3 py-2 w-16 text-center">Cant.</th>
                            <th className="px-2 sm:px-3 py-2">Descripción</th>
                            <th className="px-2 sm:px-3 py-2 text-right w-24">Precio</th>
                            <th className="px-2 sm:px-3 py-2 text-right w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {detailItems.map((item) => {
                            const rowImporte =
                              parseFloat(item.cantidad) * parseFloat(item.precio_unitario);
                            return (
                              <tr key={item.id} className="hover:bg-zinc-800/20">
                                <td className="px-2 sm:px-3 py-2 text-center text-zinc-400 font-poppins">
                                  {item.cantidad}
                                </td>
                                <td className="px-2 sm:px-3 py-2 min-w-[220px]">
                                  <div className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap break-words max-h-32 overflow-y-auto custom-scrollbar font-sans">
                                    {item.descripcion}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-right text-zinc-400">
                                  {formatCurrency(item.precio_unitario)}
                                </td>
                                <td className="px-2 sm:px-3 py-2 text-right text-amber-400 font-semibold">
                                  {formatCurrency(rowImporte)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Personal Operativo Asignado al Proyecto */}
              <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-poppins text-zinc-300 font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#818CF8]" />
                    <span>
                      Empleados autorizados ({selectedQuoteDetail.usuarios_asignados?.length || 0})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingAssignments((prev) => !prev)}
                    className="text-xs font-poppins text-[#818CF8] hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    {isEditingAssignments ? 'Cerrar selector' : 'Asignar empleados'}
                  </button>
                </div>

                {isEditingAssignments ? (
                  <div className="space-y-3 pt-1">
                    {employees.length === 0 ? (
                      <p className="text-xs text-zinc-500">
                        No hay empleados activos registrados en la plataforma.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {employees.map((emp) => {
                          const selected = detailAssignedIds.includes(emp.id);
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => toggleDetailEmployee(emp.id)}
                              className={`px-3 py-2 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                selected
                                  ? 'bg-[#6366F1]/15 border-[#6366F1]/50 text-white'
                                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{emp.nombre}</p>
                                <p className="text-[10px] text-zinc-500 truncate font-poppins">
                                  {emp.correo}
                                </p>
                              </div>
                              <span
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                  selected
                                    ? 'bg-[#6366F1] border-[#6366F1] text-white'
                                    : 'border-zinc-700'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailAssignedIds(
                            Array.isArray(selectedQuoteDetail.usuarios_asignados_ids)
                              ? selectedQuoteDetail.usuarios_asignados_ids
                              : []
                          );
                          setIsEditingAssignments(false);
                        }}
                        className="h-10 sm:h-8 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isSavingAssignments}
                        onClick={handleSaveDetailAssignments}
                        className="btn-mts-primary h-10 sm:h-8 px-3.5 text-white font-semibold rounded-lg text-xs font-poppins cursor-pointer"
                      >
                        {isSavingAssignments ? 'Guardando...' : 'Guardar Asignación'}
                      </button>
                    </div>
                  </div>
                ) : !selectedQuoteDetail.usuarios_asignados ||
                  selectedQuoteDetail.usuarios_asignados.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Ningún empleado operativo tiene asignado este proyecto aún. Sólo los administradores pueden capturar gastos hasta que asignes personal.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedQuoteDetail.usuarios_asignados.map((op) => (
                      <span
                        key={op.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs text-zinc-200"
                      >
                        <User className="w-3 h-3 text-[#818CF8]" />
                        <span className="font-medium">{op.nombre}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen de Gastos Reales vs Presupuesto */}
              {(() => {
                const spentSum = detailExpenses.reduce(
                  (acc, ex) => acc + (Number(ex.monto) || 0),
                  0
                );
                const quoteTotal = Number(selectedQuoteDetail.total) || 0;
                const diff = quoteTotal - spentSum;
                return (
                  <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-poppins">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-[#818CF8]" />
                        <span>Gastos reales ({detailExpenses.length})</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-3 pt-0.5">
                        <span className="text-zinc-300">
                          Ejecutado: <strong className="text-white">{formatCurrency(spentSum)}</strong>
                        </span>
                        <span className={diff >= 0 ? 'text-green-400' : 'text-rose-400'}>
                          Margen: <strong>{formatCurrency(diff)}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const folio = selectedQuoteDetail.numero_presupuesto;
                        setSelectedQuoteDetail(null);
                        navigate(`/gastos?presupuesto=${encodeURIComponent(folio)}`);
                      }}
                      className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 text-[#818CF8] rounded-lg text-xs font-poppins flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Gestionar Gastos</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Footer de Acciones del Detalle */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div>
                  {selectedQuoteDetail.estado !== 'cancelada' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCancelQuote(
                          selectedQuoteDetail.id,
                          selectedQuoteDetail.numero_presupuesto
                        )
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <span className="hidden sm:inline">Cancelar Presupuesto</span>
                      <span className="sm:hidden">Cancelar</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedQuoteDetail)}
                    className="h-11 sm:h-9 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar Cotización</span>
                    <span className="sm:hidden">Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadPdf(
                        selectedQuoteDetail.id,
                        selectedQuoteDetail.numero_presupuesto
                      )
                    }
                    disabled={downloadingId === selectedQuoteDetail.id}
                    className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {downloadingId === selectedQuoteDetail.id ? (
                      <>
                        <Spinner size="sm" color="current" className="scale-75 text-white" />
                        <span>PDF...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Descargar PDF</span>
                        <span className="sm:hidden">PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default QuotesPage;
