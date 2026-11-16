import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import {
  Factory,
  Building2,
  MapPin,
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
} from 'lucide-react';
import apiClient from '../../lib/axios';
import GlideSelect from '../../components/GlideSelect';
import SearchableCombobox from '../../components/SearchableCombobox';
import {
  Skeleton,
  CardsGridSkeleton,
  GenericTableSkeleton,
  MobileCardsSkeleton,
} from '../../components/Skeleton';

export const PlantsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClientParam = searchParams.get('cliente') || 'todos';

  const [plants, setPlants] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState(initialClientParam);
  const [viewMode, setViewMode] = useState('grid');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Paginación de offset corto (entre 5 y 10 registros)
  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal Crear / Editar Planta
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const initialForm = {
    cliente_id: '',
    numero_planta: '',
    ubicacion: '',
  };
  const [plantForm, setPlantForm] = useState(initialForm);

  // Modal Detalle de Planta (GET /plantas/{id})
  const [selectedPlantDetail, setSelectedPlantDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (isFormModalOpen || selectedPlantDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormModalOpen, selectedPlantDetail]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchClientsCatalog = async () => {
    try {
      const res = await apiClient.get('/clientes/?skip=0&limit=100');
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar catálogo de clientes:', err);
    } finally {
      setClientsLoaded(true);
    }
  };

  /**
   * Carga de plantas con offset corto (10 registros) y filtro opcional por cliente en servidor
   */
  const fetchPlants = async (clientFilter = selectedClientFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const matchedClient =
        clientFilter && clientFilter !== 'todos'
          ? clients.find((c) => c.nombre === clientFilter)
          : null;
      const clientQuery = matchedClient ? `&cliente_id=${matchedClient.id}` : '';
      const response = await apiClient.get(
        `/plantas/?skip=0&limit=${PAGE_SIZE}${clientQuery}`
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setPlants(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error al cargar plantas:', err);
      setError('No se pudo conectar con el servidor para obtener las plantas operativas.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePlants = async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextSkip = plants.length;
      const matchedClient =
        selectedClientFilter && selectedClientFilter !== 'todos'
          ? clients.find((c) => c.nombre === selectedClientFilter)
          : null;
      const clientQuery = matchedClient ? `&cliente_id=${matchedClient.id}` : '';
      const response = await apiClient.get(
        `/plantas/?skip=${nextSkip}&limit=${PAGE_SIZE}${clientQuery}`
      );
      const nextData = Array.isArray(response.data) ? response.data : [];
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setPlants((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filtered = nextData.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });
    } catch (err) {
      console.error('Error al cargar más plantas:', err);
      showToast('No fue posible cargar más plantas.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchClientsCatalog();
  }, []);

  useEffect(() => {
    if (!clientsLoaded) return;
    fetchPlants(selectedClientFilter);
    if (selectedClientFilter !== 'todos') {
      setSearchParams({ cliente: selectedClientFilter }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientFilter, clientsLoaded]);

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clients]);

  const clientComboboxOptions = useMemo(() => {
    return clients.map((c) => ({
      value: String(c.id),
      label: c.nombre,
      sublabel: c.direccion || c.correo || '',
      icon: Building2,
    }));
  }, [clients]);

  const metrics = useMemo(() => {
    const uniqueClientIds = new Set(plants.map((p) => p.cliente_id));
    const uniqueLocations = new Set(
      plants.map((p) => (p.ubicacion || '').trim().toLowerCase()).filter(Boolean)
    );
    return {
      totalPlants: plants.length,
      clientsWithPlants: uniqueClientIds.size,
      locationsCount: uniqueLocations.size,
      totalClients: clients.length,
    };
  }, [plants, clients]);

  const filterOptions = useMemo(() => {
    const opts = [{ value: 'todos', label: 'Todos los Clientes', tag: 'Todas' }];
    clients.forEach((c) => {
      opts.push({
        value: c.nombre,
        label: c.nombre.length > 26 ? `${c.nombre.slice(0, 26)}…` : c.nombre,
        tag: 'Empresa',
      });
    });
    return opts;
  }, [clients]);

  const filteredPlants = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return plants.filter((plant) => {
      const resolvedClientName = plant.cliente_nombre || clientMap[plant.cliente_id]?.nombre || '';
      if (selectedClientFilter !== 'todos' && resolvedClientName !== selectedClientFilter) {
        return false;
      }
      if (!term) return true;
      return (
        plant.numero_planta?.toLowerCase().includes(term) ||
        plant.ubicacion?.toLowerCase().includes(term) ||
        resolvedClientName.toLowerCase().includes(term)
      );
    });
  }, [plants, searchTerm, clientMap, selectedClientFilter]);

  /**
   * Abrir Modal Crear Planta
   */
  const handleOpenCreate = () => {
    setEditingPlantId(null);
    const matchedClient =
      selectedClientFilter !== 'todos'
        ? clients.find((c) => c.nombre === selectedClientFilter)
        : null;
    setPlantForm({
      cliente_id: matchedClient ? String(matchedClient.id) : '',
      numero_planta: '',
      ubicacion: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  /**
   * Abrir Modal Editar Planta
   */
  const handleOpenEdit = (plant) => {
    setSelectedPlantDetail(null);
    setEditingPlantId(plant.id);
    setPlantForm({
      cliente_id: String(plant.cliente_id),
      numero_planta: plant.numero_planta || '',
      ubicacion: plant.ubicacion || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  /**
   * Guardar Planta (POST /plantas/ o PUT /plantas/{id})
   */
  const handleSubmitPlant = async (e) => {
    e.preventDefault();
    if (!editingPlantId && !plantForm.cliente_id) {
      setFormError('Selecciona el cliente corporativo propietario de la planta.');
      return;
    }
    if (!plantForm.numero_planta.trim()) {
      setFormError('Ingresa el número o identificador de planta.');
      return;
    }
    if (!plantForm.ubicacion.trim()) {
      setFormError('Ingresa la ubicación física de la planta.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingPlantId) {
        await apiClient.put(`/plantas/${editingPlantId}`, {
          numero_planta: plantForm.numero_planta.trim(),
          ubicacion: plantForm.ubicacion.trim(),
        });
        showToast('Planta actualizada correctamente.');
      } else {
        await apiClient.post('/plantas/', {
          cliente_id: Number(plantForm.cliente_id),
          numero_planta: plantForm.numero_planta.trim(),
          ubicacion: plantForm.ubicacion.trim(),
        });
        showToast('Planta registrada exitosamente.');
      }

      setIsFormModalOpen(false);
      fetchPlants(selectedClientFilter);
    } catch (err) {
      console.error('Error al guardar planta:', err);
      const detail = err.response?.data?.detail;
      setFormError(
        typeof detail === 'string'
          ? detail
          : 'No se pudo guardar la planta. Verifica los campos requeridos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Borrado lógico (DELETE /plantas/{id})
   */
  const handleDeletePlant = async (plant) => {
    const confirmed = window.confirm(
      `¿Deseas dar de baja la Planta "${plant.numero_planta}"?`
    );
    if (!confirmed) return;

    try {
      await apiClient.delete(`/plantas/${plant.id}`);
      showToast(`Planta ${plant.numero_planta} dada de baja.`);
      if (selectedPlantDetail?.id === plant.id) {
        setSelectedPlantDetail(null);
      }
      fetchPlants(selectedClientFilter);
    } catch (err) {
      console.error('Error al eliminar planta:', err);
      showToast(err.response?.data?.detail || 'No fue posible eliminar la planta.');
    }
  };

  /**
   * Detalle de planta por ID (GET /plantas/{id})
   */
  const handleOpenDetail = async (plant) => {
    setSelectedPlantDetail(plant);
    setIsLoadingDetail(true);
    try {
      const res = await apiClient.get(`/plantas/${plant.id}`);
      if (res.data) {
        setSelectedPlantDetail(res.data);
      }
    } catch (err) {
      console.error('Error al consultar planta:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const renderFloatingMenu = (plant) => (
    <div
      className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 font-sans text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenDetail(plant);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors"
      >
        <Eye className="w-3.5 h-3.5 text-zinc-400" />
        <span>Ver detalle</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleOpenEdit(plant);
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/80 flex items-center gap-2 transition-colors font-medium"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Editar planta</span>
      </button>
      <div className="my-1 border-t border-zinc-800/80" />
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null);
          handleDeletePlant(plant);
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
            Plantas
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
            Sucursales, naves industriales y ubicaciones operativas vinculadas a cada cliente.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 lg:w-96">
            <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar número de planta, cliente o zona..."
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
            <span>Nueva Planta</span>
          </button>
        </div>
      </div>

      {/* Filtro por Cliente con GlideSelect */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-1 text-xs font-inter">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Cliente:</span>
          </div>

          <GlideSelect
            options={filterOptions}
            value={selectedClientFilter}
            onChange={(val) => setSelectedClientFilter(val)}
            ariaLabel="Filtrar plantas por cliente"
            showTags
            accentColor="#fbbf24"
            surfaceColor="#18181b"
            highlightColor="#27272a"
            textColor="#f4f4f5"
            size="md"
            radius={10}
            menuWidth={320}
            placement="bottom"
            align="left"
            popDuration={0}
            glideDuration={180}
            rememberPosition
          />
        </div>

        <div className="text-xs sm:text-[11px] text-zinc-400 flex items-center gap-2">
          <span className="hidden sm:inline">
            Mostrando <strong className="text-zinc-200">{filteredPlants.length}</strong> de{' '}
            <strong className="text-zinc-200">{plants.length}</strong> plantas
          </span>
          <span className="sm:hidden text-zinc-400 text-xs">
            <strong className="text-zinc-200">{filteredPlants.length}</strong>/{plants.length}
          </span>
          {(searchTerm || selectedClientFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedClientFilter('todos');
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
                columns={['Planta', 'Cliente', 'Ubicación', 'Alta', 'Acciones']}
                rows={7}
              />
            ) : (
              <CardsGridSkeleton count={8} />
            )}
          </div>
          <MobileCardsSkeleton variant="plants" count={5} />
        </>
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar plantas</p>
            <p className="text-red-400/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchPlants(selectedClientFilter)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg transition-colors font-inter"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-8">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
            <Inbox className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No se encontraron plantas</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            {searchTerm || selectedClientFilter !== 'todos'
              ? 'No hay sucursales que coincidan con los filtros aplicados.'
              : 'Registra una nueva planta vinculada a un cliente activo.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e] animate-content-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-inter text-[11px] select-none">
                  <th className="py-3 px-4">Planta</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-inter">
                {filteredPlants.map((plant) => {
                  const clientObj = clientMap[plant.cliente_id];
                  return (
                    <tr
                      key={plant.id}
                      onClick={() => handleOpenDetail(plant)}
                      className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-amber-400 whitespace-nowrap">
                        Planta {plant.numero_planta}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-zinc-100 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#818CF8] shrink-0" />
                          <span>{plant.cliente_nombre || clientObj?.nombre || 'Cliente corporativo'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-300 max-w-md truncate">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{plant.ubicacion}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                        {plant.created_at
                          ? new Date(plant.created_at).toLocaleDateString('es-MX')
                          : '—'}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(plant)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(plant)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlant(plant)}
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
          {filteredPlants.map((plant) => {
            const clientObj = clientMap[plant.cliente_id];
            return (
              <div
                key={plant.id}
                onClick={() => handleOpenDetail(plant)}
                className="bg-[#101012] hover:bg-[#131316] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md group relative cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-inter text-xs font-bold text-amber-400 tracking-wide bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
                      PLANTA {plant.numero_planta}
                    </span>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[10px] font-inter font-medium bg-green-500/10 text-green-400 border border-green-500/25">
                        Activa
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === plant.id ? null : plant.id);
                          }}
                          className="p-1.5 sm:p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/60 transition-colors"
                          aria-label="Opciones de planta"
                        >
                          <MoreVertical className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        {activeMenuId === plant.id && renderFloatingMenu(plant)}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-sm text-zinc-100 tracking-tight leading-snug line-clamp-2 mt-1 font-heading">
                    {plant.ubicacion}
                  </h3>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[#818CF8] font-medium truncate">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {plant.cliente_nombre || clientObj?.nombre || 'Cliente corporativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="font-inter text-xs sm:text-[10px] text-zinc-500">
                    {plant.created_at
                      ? new Date(plant.created_at).toLocaleDateString('es-MX')
                      : 'Activa'}
                  </span>

                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(plant)}
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
      {!isLoading && !error && hasMore && !searchTerm && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={loadMorePlants}
            disabled={isLoadingMore}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-inter transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Spinner size="sm" color="warning" className="scale-75" />
                <span>Cargando más plantas...</span>
              </>
            ) : (
              <span>Cargar más plantas (+{PAGE_SIZE})</span>
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR PLANTA                                               */}
      {/* ========================================================================= */}
      {isFormModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <form
              onSubmit={handleSubmitPlant}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-heading">
                    <Factory className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>{editingPlantId ? 'Editar Planta' : 'Nueva Planta'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Asocia una planta o nave industrial a un cliente corporativo.
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
                <SearchableCombobox
                  id="plant-cliente-id"
                  label="Cliente propietario *"
                  placeholder="Selecciona un cliente..."
                  searchPlaceholder="Buscar cliente por nombre o dirección..."
                  value={plantForm.cliente_id}
                  onChange={(val) => setPlantForm({ ...plantForm, cliente_id: val })}
                  disabled={!!editingPlantId}
                  options={clientComboboxOptions}
                  icon={Building2}
                  emptyMessage="No se encontraron clientes registrados"
                  required
                />

                <div className="space-y-1">
                  <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                    Número / clave de planta *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Ej. Planta 01 / Nave Norte"
                    value={plantForm.numero_planta}
                    onChange={(e) => setPlantForm({ ...plantForm, numero_planta: e.target.value })}
                    className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-inter placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                    Ubicación física *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={250}
                    placeholder="Parque Industrial, Km, Municipio, Estado..."
                    value={plantForm.ubicacion}
                    onChange={(e) => setPlantForm({ ...plantForm, ubicacion: e.target.value })}
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
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" color="current" className="scale-75 text-white" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingPlantId ? 'Guardar Cambios' : 'Registrar Planta'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE PLANTA (GET /plantas/{id})                               */}
      {/* ========================================================================= */}
      {selectedPlantDetail &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <span className="text-amber-400 font-inter text-xs font-bold">
                    Planta {selectedPlantDetail.numero_planta}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 font-heading">
                    {selectedPlantDetail.cliente_nombre ||
                      clientMap[selectedPlantDetail.cliente_id]?.nombre ||
                      'Cliente corporativo'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlantDetail(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isLoadingDetail ? (
                <div className="py-4 text-center text-xs font-inter text-zinc-500">
                  Actualizando información...
                </div>
              ) : (
                <div className="space-y-3 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-[10px] font-inter text-zinc-500 block">
                      Ubicación operativa
                    </span>
                    <p className="text-zinc-100 mt-1 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{selectedPlantDetail.ubicacion}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between font-inter text-[11px] text-zinc-400">
                    <span className="text-emerald-400">Sucursal activa</span>
                    <span>
                      Alta:{' '}
                      {selectedPlantDetail.created_at
                        ? new Date(selectedPlantDetail.created_at).toLocaleDateString('es-MX')
                        : '—'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDeletePlant(selectedPlantDetail)}
                  className="h-11 sm:h-9 px-3.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dar de Baja</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedPlantDetail)}
                  className="btn-mts-primary h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Planta</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PlantsPage;
