import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import {
  Users,
  MapPin,
  Building2,
  Factory,
  RotateCcw,
  Search,
  X,
  AlertCircle,
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
  ArrowUpRight,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import GlideSelect from '../../components/GlideSelect';
import {
  Skeleton,
  CardsGridSkeleton,
  GenericTableSkeleton,
  MobileCardsSkeleton,
} from '../../components/Skeleton';

export const ClientsPage = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Paginación de offset corto (entre 5 y 10 registros)
  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal Crear / Editar Cliente
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const initialForm = {
    nombre: '',
    direccion: '',
  };
  const [clientForm, setClientForm] = useState(initialForm);

  // Modal Ver Detalle (GET /clientes/{id} + GET /plantas/?cliente_id={id})
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [detailPlants, setDetailPlants] = useState([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Alta rápida de planta dentro del detalle de cliente
  const [quickPlantForm, setQuickPlantForm] = useState({ numero_planta: '', ubicacion: '' });
  const [isAddingPlant, setIsAddingPlant] = useState(false);

  useEffect(() => {
    if (isFormModalOpen || selectedClientDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, selectedClientDetail]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Carga inicial con offset corto (10 registros) y catálogo de plantas para conteo
   */
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [clientsRes, plantsRes] = await Promise.all([
        apiClient.get(`/clientes/?skip=0&limit=${PAGE_SIZE}`),
        apiClient.get('/plantas/?skip=0&limit=100'),
      ]);
      const data = Array.isArray(clientsRes.data) ? clientsRes.data : [];
      setClients(data);
      setHasMore(data.length === PAGE_SIZE);
      setPlants(Array.isArray(plantsRes.data) ? plantsRes.data : []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError('No se pudo conectar con el servidor para obtener el directorio de clientes.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Paginación incremental con offset corto
   */
  const loadMoreClients = async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextSkip = clients.length;
      const response = await apiClient.get(`/clientes/?skip=${nextSkip}&limit=${PAGE_SIZE}`);
      const nextData = Array.isArray(response.data) ? response.data : [];
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const filtered = nextData.filter((c) => !existingIds.has(c.id));
        return [...prev, ...filtered];
      });
    } catch (err) {
      console.error('Error al cargar más clientes:', err);
      showToast('No fue posible cargar más clientes.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Mapa de plantas por cliente_id
  const plantsByClientMap = useMemo(() => {
    const map = {};
    plants.forEach((p) => {
      if (!map[p.cliente_id]) map[p.cliente_id] = [];
      map[p.cliente_id].push(p);
    });
    return map;
  }, [plants]);

  // Contadores para KPI y GlideSelect
  const counts = useMemo(() => {
    let conPlantas = 0;
    let soloMatriz = 0;
    clients.forEach((c) => {
      if ((plantsByClientMap[c.id]?.length || 0) > 0) conPlantas++;
      else soloMatriz++;
    });
    return {
      todos: clients.length,
      con_plantas: conPlantas,
      solo_matriz: soloMatriz,
      totalPlantas: plants.length,
    };
  }, [clients, plantsByClientMap, plants]);

  const filterOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos los Clientes', tag: String(counts.todos) },
      { value: 'con_plantas', label: 'Con Plantas', tag: String(counts.con_plantas) },
      { value: 'solo_matriz', label: 'Solo Matriz', tag: String(counts.solo_matriz) },
    ],
    [counts]
  );

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clients.filter((client) => {
      const plantCount = plantsByClientMap[client.id]?.length || 0;
      if (selectedFilter === 'con_plantas' && plantCount === 0) return false;
      if (selectedFilter === 'solo_matriz' && plantCount > 0) return false;

      if (!term) return true;
      return (
        client.nombre?.toLowerCase().includes(term) ||
        client.direccion?.toLowerCase().includes(term)
      );
    });
  }, [clients, searchTerm, selectedFilter, plantsByClientMap]);

  /**
   * Abrir Modal Crear Cliente
   */
  const handleOpenCreate = () => {
    setEditingClientId(null);
    setClientForm(initialForm);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  /**
   * Abrir Modal Editar Cliente
   */
  const handleOpenEdit = (client) => {
    setSelectedClientDetail(null);
    setEditingClientId(client.id);
    setClientForm({
      nombre: client.nombre || '',
      direccion: client.direccion || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  /**
   * Guardar Cliente (POST /clientes/ o PUT /clientes/{id})
   */
  const handleSubmitClient = async (e) => {
    e.preventDefault();
    if (!clientForm.nombre.trim()) {
      setFormError('Ingresa el nombre o razón social del cliente.');
      return;
    }
    if (!clientForm.direccion.trim()) {
      setFormError('Ingresa la dirección operativa o fiscal.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const payload = {
        nombre: clientForm.nombre.trim(),
        direccion: clientForm.direccion.trim(),
      };

      if (editingClientId) {
        await apiClient.put(`/clientes/${editingClientId}`, payload);
        showToast('Cliente actualizado correctamente.');
      } else {
        await apiClient.post('/clientes/', payload);
        showToast('Cliente registrado exitosamente.');
      }

      setIsFormModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      const detail = err.response?.data?.detail;
      setFormError(
        typeof detail === 'string'
          ? detail
          : 'Verifica los datos ingresados.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Borrado lógico de cliente (DELETE /clientes/{id})
   */
  const handleDeleteClient = async (client) => {
    const confirmed = window.confirm(
      `¿Deseas dar de baja al cliente "${client.nombre}"?`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/clientes/${client.id}`);
      showToast(`Cliente "${client.nombre}" dado de baja.`);
      if (selectedClientDetail?.id === client.id) {
        setSelectedClientDetail(null);
      }
      fetchClients();
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      showToast(err.response?.data?.detail || 'No fue posible eliminar el cliente.');
    }
  };

  /**
   * Ver detalle completo del cliente (GET /clientes/{id} + GET /plantas/?cliente_id={id})
   */
  const handleOpenDetail = async (client) => {
    setSelectedClientDetail(client);
    setIsLoadingDetail(true);
    setQuickPlantForm({ numero_planta: '', ubicacion: '' });
    try {
      const [clientRes, plantsRes] = await Promise.all([
        apiClient.get(`/clientes/${client.id}`),
        apiClient.get(`/plantas/?cliente_id=${client.id}&skip=0&limit=50`),
      ]);
      if (clientRes.data) {
        setSelectedClientDetail(clientRes.data);
      }
      setDetailPlants(Array.isArray(plantsRes.data) ? plantsRes.data : []);
    } catch (err) {
      console.error('Error al consultar detalle de cliente:', err);
      setDetailPlants(plantsByClientMap[client.id] || []);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  /**
   * Alta rápida de planta vinculada desde el modal del cliente (POST /plantas/)
   */
  const handleQuickAddPlant = async (e) => {
    e.preventDefault();
    if (!selectedClientDetail || !quickPlantForm.numero_planta.trim() || !quickPlantForm.ubicacion.trim()) {
      return;
    }
    try {
      setIsAddingPlant(true);
      const res = await apiClient.post('/plantas/', {
        cliente_id: selectedClientDetail.id,
        numero_planta: quickPlantForm.numero_planta.trim(),
        ubicacion: quickPlantForm.ubicacion.trim(),
      });
      setDetailPlants((prev) => [res.data, ...prev]);
      setPlants((prev) => [res.data, ...prev]);
      setQuickPlantForm({ numero_planta: '', ubicacion: '' });
      showToast(`Planta "${res.data.numero_planta}" vinculada al cliente.`);
    } catch (err) {
      console.error('Error al vincular planta:', err);
      showToast(err.response?.data?.detail || 'Error al registrar la planta.');
    } finally {
      setIsAddingPlant(false);
    }
  };

  const renderFloatingMenu = (client) => (
    <div
      className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-sans text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenDetail(client);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors"
      >
        <Eye className="w-3.5 h-3.5 text-zinc-400" />
        <span>Ver ficha y plantas</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenEdit(client);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors font-medium"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Editar cliente</span>
      </button>
      <div className="my-1 border-t border-zinc-800/80" />
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleDeleteClient(client);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Dar de baja</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-amber-400 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado y Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-zinc-800/40">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5 font-heading">
            Clientes
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
            Directorio corporativo de empresas, direcciones operativas y sucursales asociadas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 lg:w-96">
            <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empresa o dirección..."
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
            <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden font-bold">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Filtro con GlideSelect */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-1 text-xs font-inter">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtro:</span>
          </div>

          <GlideSelect
            options={filterOptions}
            value={selectedFilter}
            onChange={(val) => setSelectedFilter(val)}
            ariaLabel="Filtrar clientes"
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
            Mostrando <strong className="text-zinc-200">{filteredClients.length}</strong> de{' '}
            <strong className="text-zinc-200">{clients.length}</strong> clientes
          </span>
          <span className="sm:hidden text-zinc-400 text-xs">
            <strong className="text-zinc-200">{filteredClients.length}</strong>/{clients.length}
          </span>
          {(searchTerm || selectedFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('todos');
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
                columns={['Empresa', 'Dirección', 'Correo', 'Plantas', 'Alta', 'Acciones']}
                rows={7}
              />
            ) : (
              <CardsGridSkeleton count={8} />
            )}
          </div>
          <MobileCardsSkeleton variant="clients" count={5} />
        </>
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar clientes</p>
            <p className="text-red-400/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchClients}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg transition-colors font-inter"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-8">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
            <Inbox className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No se encontraron clientes</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchTerm || selectedFilter !== 'todos'
              ? 'No hay empresas que coincidan con los filtros seleccionados.'
              : 'Aún no se han dado de alta clientes corporativos en el sistema.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e] animate-content-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-inter text-[11px] select-none">
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Plantas</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-inter">
                {filteredClients.map((client) => {
                  const clientPlants = plantsByClientMap[client.id] || [];
                  return (
                    <tr
                      key={client.id}
                      onClick={() => handleOpenDetail(client)}
                      className="hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-zinc-100 max-w-xs truncate">
                        {client.nombre}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-400 max-w-sm truncate">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{client.direccion}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {clientPlants.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30">
                            <Factory className="w-3 h-3" />
                            {clientPlants.length} {clientPlants.length === 1 ? 'planta' : 'plantas'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                            Matriz
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString('es-MX')
                          : '—'}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(client)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Ver ficha"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Dar de baja"
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
          {filteredClients.map((client) => {
            const clientPlants = plantsByClientMap[client.id] || [];
            return (
              <div
                key={client.id}
                onClick={() => handleOpenDetail(client)}
                className="bg-[#101012] hover:bg-[#131316] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md group relative cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 font-inter text-[11px] font-bold text-amber-400 tracking-wide bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
                      <Building2 className="w-3 h-3" />
                      <span>Corporativo</span>
                    </span>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {clientPlants.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-inter font-medium bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30">
                          <Factory className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                          {clientPlants.length} {clientPlants.length === 1 ? 'planta' : 'plantas'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-inter font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                          Matriz
                        </span>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === client.id ? null : client.id);
                          }}
                          className="p-1.5 sm:p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/60 transition-colors"
                          aria-label="Opciones de cliente"
                        >
                          <MoreVertical className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        {activeMenuId === client.id && renderFloatingMenu(client)}
                      </div>
                    </div>
                  </div>

                  <h3
                    className="font-semibold text-base sm:text-sm text-zinc-100 tracking-tight leading-snug line-clamp-2 mt-1 font-heading"
                    title={client.nombre}
                  >
                    {client.nombre}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{client.direccion}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="font-inter text-xs sm:text-[10px] text-zinc-500">
                    {client.created_at
                      ? new Date(client.created_at).toLocaleDateString('es-MX')
                      : 'Activo'}
                  </span>

                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(client)}
                      className="h-9 sm:h-8 px-3 sm:px-2.5 rounded-xl sm:rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="font-inter text-xs sm:text-[11px]">Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación de offset corto */}
      {!isLoading && !error && hasMore && !searchTerm && selectedFilter === 'todos' && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={loadMoreClients}
            disabled={isLoadingMore}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-inter transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Spinner size="sm" color="warning" className="scale-75" />
                <span>Cargando más clientes...</span>
              </>
            ) : (
              <span>Cargar más clientes (+{PAGE_SIZE})</span>
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR CLIENTE (PORTAL SIN ANIMACIÓN DE ESCALADO)           */}
      {/* ========================================================================= */}
      {isFormModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <form
              onSubmit={handleSubmitClient}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-heading">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>{editingClientId ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Información comercial y fiscal para presupuestos MTS.
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
                  <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                    Razón social / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="Ej. Industrias Metálicas del Norte S.A. de C.V."
                    value={clientForm.nombre}
                    onChange={(e) => setClientForm({ ...clientForm, nombre: e.target.value })}
                    className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                    Dirección operativa *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={300}
                    placeholder="Parque Industrial, Calle, Número, Ciudad y Estado..."
                    value={clientForm.direccion}
                    onChange={(e) => setClientForm({ ...clientForm, direccion: e.target.value })}
                    className="w-full p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 sm:h-9 px-5 btn-mts-primary font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" color="current" className="scale-75 text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingClientId ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE CLIENTE + PLANTAS VINCULADAS                             */}
      {/* ========================================================================= */}
      {selectedClientDetail &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-5 max-h-[94vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <span className="text-amber-400 font-inter text-xs font-bold">
                    Ficha corporativa
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 font-heading">
                    {selectedClientDetail.nombre}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClientDetail(null)}
                  aria-label="Cerrar detalle de cliente"
                  className="p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 text-xs space-y-2.5">
                <div>
                  <span className="text-[11px] font-inter text-zinc-400 block">
                    Dirección operativa / fiscal
                  </span>
                  <p className="text-zinc-200 mt-1 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{selectedClientDetail.direccion}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800/70">
                  <span className="text-[11px] font-inter text-zinc-400 block">
                    Registro en sistema
                  </span>
                  <span className="text-zinc-300 font-inter mt-0.5 block">
                    {selectedClientDetail.created_at
                      ? new Date(selectedClientDetail.created_at).toLocaleString('es-MX')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Plantas asociadas a este cliente */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-inter text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-[#818CF8]" />
                    <span>Plantas vinculadas ({detailPlants.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientDetail(null);
                      navigate(`/plantas?cliente=${encodeURIComponent(selectedClientDetail.nombre)}`);
                    }}
                    className="text-xs font-inter text-[#818CF8] hover:underline flex items-center gap-1"
                  >
                    <span>Ir a Plantas</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isLoadingDetail ? (
                  <div className="py-4 text-center text-xs font-inter text-zinc-500">
                    Consultando sucursales...
                  </div>
                ) : detailPlants.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                    Este cliente aún no tiene plantas o sucursales registradas.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {detailPlants.map((plant) => (
                      <div
                        key={plant.id}
                        className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-inter font-bold text-[#818CF8]">
                            Planta {plant.numero_planta}
                          </span>
                          <p className="text-zinc-400 truncate text-[11px]">{plant.ubicacion}</p>
                        </div>
                        <span className="font-inter text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                          Activa
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario rápido para agregar planta a este cliente */}
                <form
                  onSubmit={handleQuickAddPlant}
                  className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2.5"
                >
                  <span className="text-[10px] font-inter text-zinc-400 font-semibold block">
                    + Vincular nueva planta rápida
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      required
                      maxLength={50}
                      placeholder="Núm. Planta (Ej. P-01)"
                      value={quickPlantForm.numero_planta}
                      onChange={(e) =>
                        setQuickPlantForm({ ...quickPlantForm, numero_planta: e.target.value })
                      }
                      className="sm:col-span-4 h-9 px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none"
                    />
                    <input
                      type="text"
                      required
                      maxLength={250}
                      placeholder="Ubicación física de la planta..."
                      value={quickPlantForm.ubicacion}
                      onChange={(e) =>
                        setQuickPlantForm({ ...quickPlantForm, ubicacion: e.target.value })
                      }
                      className="sm:col-span-5 h-9 px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isAddingPlant}
                      className="sm:col-span-3 h-10 sm:h-9 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-amber-400 font-semibold rounded-lg text-xs font-inter transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isAddingPlant ? 'Agregando...' : 'Agregar Planta'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteClient(selectedClientDetail)}
                  className="h-11 sm:h-9 px-3.5 bg-rose-950/30 hover:bg-rose-950/50 active:scale-[0.98] border border-rose-900/40 text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dar de Baja</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedClientDetail)}
                    className="h-11 sm:h-9 px-4 btn-mts-primary font-semibold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar Cliente</span>
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

export default ClientsPage;
