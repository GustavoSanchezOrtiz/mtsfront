import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import {
  ShieldCheck,
  KeyRound,
  UserCheck,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Search,
  X,
  AlertCircle,
  RotateCcw,
  Plus,
  Trash2,
  LayoutGrid,
  List,
  Filter,
  Inbox,
  Mail,
  ArrowUpRight,
  Power,
  CheckSquare,
  Square,
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

export const UsersPage = () => {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  const [profile, setProfile] = useState(user || null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'codigos'

  // Estado de Usuarios y Proyectos (Admin)
  const [usersList, setUsersList] = useState([]);
  const [allQuotes, setAllQuotes] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('todos'); // 'todos' | 'admin' | 'empleado'

  // Modal Asignar Proyectos a Usuario
  const [assignModalUser, setAssignModalUser] = useState(null);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [isSavingAssign, setIsSavingAssign] = useState(false);

  // Estado de Códigos de Invitación (Admin)
  const [codes, setCodes] = useState([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('grid');
  const [toastMessage, setToastMessage] = useState(null);

  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal Generar Código de Invitación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const initialForm = {
    rol_asignado: 'empleado',
    dias_vigencia: 7,
    codigo_personalizado: '',
  };
  const [codeForm, setCodeForm] = useState(initialForm);

  useEffect(() => {
    if (isModalOpen || assignModalUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, assignModalUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  /**
   * Consulta GET /usuarios/me y sincroniza sesión activa
   */
  const fetchMyProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const res = await apiClient.get('/usuarios/me');
      if (res.data) {
        setProfile(res.data);
        if (token) {
          login(token, res.data);
        }
      }
      return res.data;
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      return profile;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  /**
   * Consulta GET /usuarios/ y catálogo de proyectos activos (Sólo Administradores)
   */
  const fetchAdminUsersAndQuotes = async () => {
    try {
      setIsLoadingUsers(true);
      setUsersError(null);
      const [usersRes, quotesRes] = await Promise.all([
        apiClient.get('/usuarios/?skip=0&limit=200'),
        apiClient.get('/cotizaciones/?skip=0&limit=200'),
      ]);
      setUsersList(Array.isArray(usersRes.data) ? usersRes.data : []);
      setAllQuotes(Array.isArray(quotesRes.data) ? quotesRes.data : []);
    } catch (err) {
      console.error('Error al cargar directorio de usuarios:', err);
      setUsersError(
        err.response?.data?.detail ||
          'No se pudo obtener el directorio de operadores.'
      );
    } finally {
      setIsLoadingUsers(false);
    }
  };

  /**
   * Consulta GET /usuarios/codigos-invitacion (Sólo Administradores)
   */
  const fetchInvitationCodes = async (soloActivosParam = false) => {
    try {
      setIsLoadingCodes(true);
      setError(null);
      const response = await apiClient.get(
        `/usuarios/codigos-invitacion?skip=0&limit=${PAGE_SIZE}&solo_activos=${soloActivosParam}`
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setCodes(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error al cargar códigos de invitación:', err);
      setError(
        err.response?.data?.detail ||
          'No se pudo conectar con el servidor para obtener los códigos de acceso.'
      );
    } finally {
      setIsLoadingCodes(false);
    }
  };

  const loadMoreCodes = async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextSkip = codes.length;
      const soloActivosParam = selectedStatusFilter === 'vigente';
      const response = await apiClient.get(
        `/usuarios/codigos-invitacion?skip=${nextSkip}&limit=${PAGE_SIZE}&solo_activos=${soloActivosParam}`
      );
      const nextData = Array.isArray(response.data) ? response.data : [];
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setCodes((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const filtered = nextData.filter((c) => !existingIds.has(c.id));
        return [...prev, ...filtered];
      });
    } catch {
      showToast('No fue posible cargar más códigos.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const currentProfile = await fetchMyProfile();
      const rol = (currentProfile?.rol || user?.rol || '').toLowerCase();
      if (rol === 'admin') {
        fetchAdminUsersAndQuotes();
        fetchInvitationCodes(selectedStatusFilter === 'vigente');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = (profile?.rol || user?.rol || '').toLowerCase() === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchInvitationCodes(selectedStatusFilter === 'vigente');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatusFilter]);

  /**
   * Gestión de Operadores: Cambiar Estado o Rol
   */
  const handleToggleUserStatus = async (targetUser) => {
    if (targetUser.correo === profile?.correo) {
      showToast('No puedes desactivar tu propia cuenta activa.');
      return;
    }
    const nextStatus = targetUser.estado === 'activo' ? 'inactivo' : 'activo';
    const actionLabel = nextStatus === 'activo' ? 'reactivar' : 'desactivar';
    if (
      !window.confirm(
        `¿Deseas ${actionLabel} el acceso del usuario "${targetUser.nombre}"?`
      )
    ) {
      return;
    }
    try {
      const res = await apiClient.patch(`/usuarios/${targetUser.id}`, {
        estado: nextStatus,
      });
      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? res.data : u)));
      showToast(`Estado de ${targetUser.nombre} actualizado a ${nextStatus.toUpperCase()}.`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al actualizar el estado del usuario.');
    }
  };

  const handleToggleUserRole = async (targetUser) => {
    if (targetUser.correo === profile?.correo) {
      showToast('No puedes modificar tu propio rol de Administrador.');
      return;
    }
    const nextRole = targetUser.rol === 'admin' ? 'empleado' : 'admin';
    if (
      !window.confirm(
        `¿Cambiar el rol de "${targetUser.nombre}" a ${nextRole.toUpperCase()}?`
      )
    ) {
      return;
    }
    try {
      const res = await apiClient.patch(`/usuarios/${targetUser.id}`, {
        rol: nextRole,
      });
      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? res.data : u)));
      showToast(`Rol de ${targetUser.nombre} cambiado a ${nextRole.toUpperCase()}.`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al cambiar el rol del usuario.');
    }
  };

  /**
   * Gestión de Asignaciones de Proyectos (PUT /usuarios/{id}/proyectos)
   */
  const openAssignModal = (targetUser) => {
    setAssignModalUser(targetUser);
    setSelectedQuoteIds(
      Array.isArray(targetUser.proyectos_asignados_ids)
        ? [...targetUser.proyectos_asignados_ids]
        : []
    );
    setAssignSearch('');
  };

  const toggleQuoteSelection = (quoteId) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]
    );
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    if (!assignModalUser) return;
    try {
      setIsSavingAssign(true);
      const res = await apiClient.put(`/usuarios/${assignModalUser.id}/proyectos`, {
        cotizacion_ids: selectedQuoteIds,
      });
      setUsersList((prev) =>
        prev.map((u) => (u.id === assignModalUser.id ? res.data : u))
      );
      if (assignModalUser.correo === profile?.correo) {
        fetchMyProfile();
      }
      showToast(`Proyectos asignados actualizados para ${assignModalUser.nombre}.`);
      setAssignModalUser(null);
    } catch (err) {
      showToast(
        err.response?.data?.detail || 'No fue posible guardar las asignaciones.'
      );
    } finally {
      setIsSavingAssign(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = userSearchTerm.toLowerCase().trim();
    return usersList.filter((u) => {
      if (userRoleFilter !== 'todos' && u.rol !== userRoleFilter) return false;
      if (!term) return true;
      return (
        u.nombre?.toLowerCase().includes(term) ||
        u.correo?.toLowerCase().includes(term) ||
        (u.proyectos_asignados || []).some(
          (p) =>
            p.numero_presupuesto?.toLowerCase().includes(term) ||
            p.nombre_proyecto?.toLowerCase().includes(term)
        )
      );
    });
  }, [usersList, userRoleFilter, userSearchTerm]);

  const filteredModalQuotes = useMemo(() => {
    const term = assignSearch.toLowerCase().trim();
    if (!term) return allQuotes;
    return allQuotes.filter(
      (q) =>
        q.numero_presupuesto?.toLowerCase().includes(term) ||
        q.nombre_proyecto?.toLowerCase().includes(term) ||
        q.cliente_nombre?.toLowerCase().includes(term)
    );
  }, [allQuotes, assignSearch]);

  /**
   * Helpers de Códigos de Invitación
   */
  const getCodeStatus = (codeObj) => {
    if (codeObj.usado) {
      return {
        key: 'usado',
        label: 'CANJEADO',
        badgeClass: 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30',
        icon: UserCheck,
      };
    }
    const expDate = codeObj.fecha_expiracion ? new Date(codeObj.fecha_expiracion) : null;
    if (expDate && expDate.getTime() < Date.now()) {
      return {
        key: 'expirado',
        label: 'EXPIRADO',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        icon: XCircle,
      };
    }
    return {
      key: 'vigente',
      label: 'VIGENTE',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle2,
    };
  };

  const counts = useMemo(() => {
    const res = { todos: codes.length, vigente: 0, usado: 0, expirado: 0 };
    codes.forEach((c) => {
      const st = getCodeStatus(c).key;
      if (res[st] !== undefined) res[st]++;
    });
    return res;
  }, [codes]);

  const filterOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos los Códigos', tag: String(counts.todos) },
      { value: 'vigente', label: 'Vigentes / Activos', tag: String(counts.vigente) },
      { value: 'usado', label: 'Canjeados', tag: String(counts.usado) },
      { value: 'expirado', label: 'Expirados', tag: String(counts.expirado) },
    ],
    [counts]
  );

  const userRoleOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos los Roles', tag: String(usersList.length) },
      {
        value: 'empleado',
        label: 'Empleados',
        tag: String(usersList.filter((u) => u.rol === 'empleado').length),
      },
      {
        value: 'admin',
        label: 'Administradores',
        tag: String(usersList.filter((u) => u.rol === 'admin').length),
      },
    ],
    [usersList]
  );

  const filteredCodes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return codes.filter((c) => {
      const st = getCodeStatus(c).key;
      if (selectedStatusFilter !== 'todos' && st !== selectedStatusFilter) return false;
      if (!term) return true;
      return (
        c.codigo?.toLowerCase().includes(term) ||
        c.rol_asignado?.toLowerCase().includes(term) ||
        c.usado_por_nombre?.toLowerCase().includes(term)
      );
    });
  }, [codes, selectedStatusFilter, searchTerm]);

  const handleOpenCreate = () => {
    setCodeForm(initialForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    const dias = parseInt(codeForm.dias_vigencia, 10);
    if (isNaN(dias) || dias < 1 || dias > 365) {
      setFormError('Los días de vigencia deben estar entre 1 y 365.');
      return;
    }
    const custom = codeForm.codigo_personalizado.trim();
    if (custom && (custom.length < 4 || custom.length > 50)) {
      setFormError('El código personalizado debe tener entre 4 y 50 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const payload = {
        rol_asignado: codeForm.rol_asignado,
        dias_vigencia: dias,
      };
      if (custom) {
        payload.codigo_personalizado = custom.toUpperCase();
      }

      const res = await apiClient.post('/usuarios/codigos-invitacion', payload);
      showToast(`Código de uso único ${res.data.codigo} generado.`);
      setIsModalOpen(false);
      fetchInvitationCodes(selectedStatusFilter === 'vigente');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setFormError(
        typeof detail === 'string'
          ? detail
          : 'No se pudo generar el código. Verifica el formato o que no esté duplicado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeCode = async (codeObj) => {
    if (codeObj.usado) {
      showToast('No se puede revocar un código que ya fue canjeado.');
      return;
    }
    if (
      !window.confirm(
        `¿Deseas revocar de forma permanente el código de invitación "${codeObj.codigo}"?`
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/usuarios/codigos-invitacion/${codeObj.id}`);
      showToast(`Código ${codeObj.codigo} revocado.`);
      fetchInvitationCodes(selectedStatusFilter === 'vigente');
    } catch (err) {
      showToast(err.response?.data?.detail || 'No fue posible revocar el código.');
    }
  };

  const assignedProjectsForMe = profile?.proyectos_asignados || [];

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-amber-400 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tarjeta Maestra de Operador en Sesión (Sin ningún ID de base de datos) */}
      <div className="bg-[#101012] border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            {isLoadingProfile && !profile ? (
              <>
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-3.5 w-56 rounded" />
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-heading truncate">
                    {profile?.nombre || 'Operador Autenticado'}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isAdmin
                        ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                        : 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30'
                    }`}
                  >
                    {isAdmin ? 'Administrador' : 'Empleado'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {profile?.estado || 'activo'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    {profile?.correo || '—'}
                  </span>
                  <span className="text-zinc-500">• Sesión única protegida</span>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchMyProfile();
            if (isAdmin) {
              fetchAdminUsersAndQuotes();
              fetchInvitationCodes(selectedStatusFilter === 'vigente');
            }
          }}
          disabled={isLoadingProfile}
          className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoadingProfile ? 'animate-spin' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* VISTA PARA EMPLEADO: SUS PROYECTOS ASIGNADOS                          */}
      {/* ===================================================================== */}
      {!isAdmin ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>Mis Proyectos Asignados</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Proyectos autorizados en los que puedes registrar gastos operativos.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-mono text-indigo-300">
              {assignedProjectsForMe.length} asignados
            </span>
          </div>

          {assignedProjectsForMe.length === 0 ? (
            <div className="border border-zinc-800/80 rounded-2xl bg-[#0c0c0e] p-8 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white font-heading">
                Sin proyectos asignados por el momento
              </h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Un Administrador debe vincular tu cuenta a uno o más proyectos activos para habilitar el registro de gastos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedProjectsForMe.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() =>
                    navigate(`/gastos?presupuesto=${encodeURIComponent(proj.numero_presupuesto)}`)
                  }
                  className="bg-[#101012] hover:bg-[#151518] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700 text-xs font-mono font-bold">
                        {proj.numero_presupuesto}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {proj.estado}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-2.5 line-clamp-2">
                      {proj.nombre_proyecto}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-xs font-mono text-zinc-300">
                    <span>Registrar gastos en este proyecto</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ===================================================================== */
        /* VISTA PARA ADMINISTRADOR: PESTAÑAS USUARIOS / INVITACIONES            */
        /* ===================================================================== */
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/50">
            <div className="inline-flex p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('usuarios')}
                className={`h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'usuarios'
                    ? 'btn-mts-primary text-white font-semibold'
                    : 'border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Usuarios y Asignaciones ({usersList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('codigos')}
                className={`h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'codigos'
                    ? 'btn-mts-primary text-white font-semibold'
                    : 'border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Códigos de Invitación ({codes.length})</span>
              </button>
            </div>
          </div>

          {activeTab === 'usuarios' ? (
            /* ================= TAB 1: DIRECTORIO DE USUARIOS Y PROYECTOS ================= */
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
                    Operadores del Sistema
                  </h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
                    Administra todos los usuarios registrados, sus roles y los proyectos donde pueden registrar gastos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, correo o folio..."
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-indigo-500/50 text-xs text-zinc-200 placeholder-zinc-500 rounded-xl pl-9 pr-8 py-2 outline-none"
                    />
                    {userSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setUserSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <GlideSelect
                    options={userRoleOptions}
                    value={userRoleFilter}
                    onChange={(val) => setUserRoleFilter(val)}
                    ariaLabel="Filtrar usuarios por rol"
                    showTags
                    accentColor="#6366F1"
                    surfaceColor="#18181b"
                    highlightColor="#27272a"
                    textColor="#f4f4f5"
                    size="md"
                    radius={10}
                    menuWidth={200}
                    placement="bottom"
                    align="right"
                    popDuration={0}
                    glideDuration={180}
                  />
                </div>
              </div>

              {isLoadingUsers ? (
                <CardsGridSkeleton count={6} />
              ) : usersError ? (
                <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{usersError}</span>
                  <button
                    type="button"
                    onClick={fetchAdminUsersAndQuotes}
                    className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg font-mono"
                  >
                    Reintentar
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-12 text-center">
                  <p className="text-sm font-semibold text-zinc-200">
                    No se encontraron usuarios con ese criterio
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-content-fade">
                  {filteredUsers.map((u) => {
                    const isSelf = u.correo === profile?.correo;
                    const assignedList = u.proyectos_asignados || [];
                    const isUserAdmin = u.rol === 'admin';
                    const isUserActive = u.estado === 'activo';

                    return (
                      <div
                        key={u.id}
                        className="bg-[#101012] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-bold text-white font-heading truncate">
                                  {u.nombre}
                                </h3>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-zinc-400 truncate mt-0.5">
                                {u.correo}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  isUserAdmin
                                    ? 'bg-amber-400/10 text-amber-300 border-amber-400/25'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                {isUserAdmin ? 'Admin' : 'Empleado'}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                  isUserActive
                                    ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                                    : 'bg-rose-950/20 text-rose-300 border-rose-900/40'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isUserActive ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                {u.estado}
                              </span>
                            </div>
                          </div>

                          {/* Proyectos asignados */}
                          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-zinc-400 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Proyectos Asignados</span>
                              </span>
                              <span className="text-zinc-200 font-bold">
                                {isUserAdmin ? 'Acceso Global' : `${assignedList.length} proy.`}
                              </span>
                            </div>

                            {isUserAdmin ? (
                              <p className="text-[11px] text-zinc-500">
                                Los administradores tienen acceso completo a todos los proyectos.
                              </p>
                            ) : assignedList.length === 0 ? (
                              <p className="text-[11px] text-amber-300/80">
                                Sin proyectos asignados (no podrá registrar gastos hasta asignarle uno).
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                {assignedList.map((p) => (
                                  <span
                                    key={p.id}
                                    title={p.nombre_proyecto}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-200 border border-zinc-800 text-[11px] font-mono max-w-full truncate"
                                  >
                                    <span className="font-semibold text-amber-400">{p.numero_presupuesto}</span>
                                    <span className="text-zinc-400 truncate max-w-[120px]">
                                      · {p.nombre_proyecto}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botones de Acción Administrativa */}
                        <div className="pt-3 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openAssignModal(u)}
                            className="h-8 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Asignar Proyectos</span>
                          </button>

                          {!isSelf && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleUserRole(u)}
                                className="h-8 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-mono transition-colors cursor-pointer"
                                title="Cambiar rol entre Administrador y Empleado"
                              >
                                {isUserAdmin ? 'Hacer Empleado' : 'Hacer Admin'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`h-8 px-2.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                                  isUserActive
                                    ? 'bg-rose-950/25 hover:bg-rose-950/50 border-rose-900/40 text-rose-300'
                                    : 'bg-emerald-950/25 hover:bg-emerald-950/50 border-emerald-900/40 text-emerald-300'
                                }`}
                                title={isUserActive ? 'Suspender acceso' : 'Reactivar acceso'}
                              >
                                <Power className="w-3 h-3" />
                                <span>{isUserActive ? 'Suspender' : 'Activar'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ================= TAB 2: CÓDIGOS DE INVITACIÓN DE USO ÚNICO ================= */
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
                    Códigos de Invitación de Uso Único
                  </h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
                    Cada código cuenta con bloqueo atómico para impedir que dos usuarios lo utilicen simultáneamente.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar código, rol o usuario..."
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 text-sm sm:text-xs text-zinc-200 placeholder-zinc-500 rounded-xl pl-9 pr-8 py-2 outline-none"
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
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="btn-mts-primary h-11 sm:h-9 px-3.5 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                    <span>Generar Código</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-[11px] font-semibold">
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estado:</span>
                  </div>

                  <GlideSelect
                    options={filterOptions}
                    value={selectedStatusFilter}
                    onChange={(val) => setSelectedStatusFilter(val)}
                    ariaLabel="Filtrar códigos de invitación"
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
                  />
                </div>

                <div className="text-xs sm:text-[11px] text-zinc-400">
                  <strong className="text-zinc-200">{filteredCodes.length}</strong> de {codes.length} códigos
                </div>
              </div>

              {isLoadingCodes ? (
                viewMode === 'table' ? (
                  <GenericTableSkeleton
                    columns={['Código', 'Rol', 'Estado', 'Canjeado Por', 'Expira', 'Acciones']}
                    rows={6}
                  />
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <CardsGridSkeleton count={6} />
                    </div>
                    <MobileCardsSkeleton variant="codes" count={4} />
                  </>
                )
              ) : error ? (
                <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-zinc-800/60 rounded-2xl bg-[#0c0c0e] p-8">
                  <Inbox className="w-6 h-6 text-zinc-500 mb-2" />
                  <h3 className="text-sm font-semibold text-zinc-200">No hay códigos registrados</h3>
                </div>
              ) : viewMode === 'table' ? (
                <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e] animate-content-fade">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px]">
                          <th className="py-3 px-4">Código</th>
                          <th className="py-3 px-4">Rol Asignado</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4">Canjeado Por</th>
                          <th className="py-3 px-4">Expiración</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {filteredCodes.map((c) => {
                          const st = getCodeStatus(c);
                          const StatusIcon = st.icon;
                          return (
                            <tr key={c.id} className="hover:bg-zinc-900/60 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-amber-400 select-all whitespace-nowrap">
                                {c.codigo}
                              </td>
                              <td className="py-3.5 px-4 text-zinc-200 whitespace-nowrap">
                                {c.rol_asignado}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${st.badgeClass}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {st.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                                {c.usado_por_nombre || 'Disponible'}
                              </td>
                              <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                                {c.fecha_expiracion
                                  ? new Date(c.fecha_expiracion).toLocaleDateString('es-MX')
                                  : '—'}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                {!c.usado ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeCode(c)}
                                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                    title="Revocar código"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">Uso único agotado</span>
                                )}
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
                  {filteredCodes.map((c) => {
                    const st = getCodeStatus(c);
                    const StatusIcon = st.icon;
                    return (
                      <div
                        key={c.id}
                        className="bg-[#101012] hover:bg-[#131316] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Rol: {c.rol_asignado}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${st.badgeClass}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {st.label}
                            </span>
                          </div>

                          <div className="p-3 bg-zinc-950 border border-zinc-800/90 rounded-xl text-center">
                            <p className="font-mono text-sm sm:text-base font-bold text-amber-400 tracking-wider select-all break-all">
                              {c.codigo}
                            </p>
                          </div>

                          <div className="mt-3 space-y-1 text-xs font-mono text-zinc-400">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Expira:</span>
                              <span>
                                {c.fecha_expiracion
                                  ? new Date(c.fecha_expiracion).toLocaleDateString('es-MX')
                                  : '—'}
                              </span>
                            </div>
                            {c.usado && (
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Titular:</span>
                                <span className="text-indigo-300 truncate max-w-[140px]">
                                  {c.usado_por_nombre || 'Registrado'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-zinc-500">Uso único</span>
                          {!c.usado ? (
                            <button
                              type="button"
                              onClick={() => handleRevokeCode(c)}
                              className="h-8 px-3 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revocar</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-[#818CF8]">Canjeado</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoadingCodes && !error && hasMore && !searchTerm && (
                <div className="flex justify-center pt-2 pb-4">
                  <button
                    type="button"
                    onClick={loadMoreCodes}
                    disabled={isLoadingMore}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-mono flex items-center gap-2 cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <>
                        <Spinner size="sm" color="warning" className="scale-75" />
                        <span>Cargando...</span>
                      </>
                    ) : (
                      <span>Cargar más códigos</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL ASIGNAR PROYECTOS A UN OPERADOR                                     */}
      {/* ========================================================================= */}
      {assignModalUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto"
            onClick={() => setAssignModalUser(null)}
          >
            <form
              onSubmit={handleSaveAssignments}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-heading flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span>Asignar Proyectos a {assignModalUser.nombre}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    El operador solo podrá consultar y registrar gastos en los proyectos seleccionados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignModalUser(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Filtrar por folio, proyecto o cliente..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteIds([])}
                  className="px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                >
                  Limpiar ({selectedQuoteIds.length})
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {filteredModalQuotes.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8 font-mono">
                    No hay proyectos activos disponibles.
                  </p>
                ) : (
                  filteredModalQuotes.map((q) => {
                    const checked = selectedQuoteIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => toggleQuoteSelection(q.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          checked
                            ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                            : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-indigo-300">
                              {q.numero_presupuesto}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {q.estado}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-zinc-100 truncate mt-0.5">
                            {q.nombre_proyecto}
                          </p>
                          {q.cliente_nombre && (
                            <p className="text-[11px] text-zinc-400 truncate">
                              {q.cliente_nombre}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setAssignModalUser(null)}
                  className="flex-1 h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssign}
                  className="btn-mts-primary flex-1 h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingAssign ? 'Guardando...' : `Guardar Asignación (${selectedQuoteIds.length})`}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL GENERAR CÓDIGO DE INVITACIÓN                                        */}
      {/* ========================================================================= */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <form
              onSubmit={handleCreateCode}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-heading">
                    <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    <span>Generar Invitación Segura</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Código de un solo uso protegido contra canje simultáneo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Rol asignado *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'empleado', label: 'Empleado', desc: 'Gastos en proyectos asignados' },
                      { value: 'admin', label: 'Administrador', desc: 'Control total del sistema' },
                    ].map((opt) => {
                      const active = codeForm.rol_asignado === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCodeForm({ ...codeForm, rol_asignado: opt.value })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-400/15 border-amber-400/50 text-white'
                              : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <p className="text-xs font-mono font-bold text-amber-400">{opt.label}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Vigencia en días (1 - 365) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      value={codeForm.dias_vigencia}
                      onChange={(e) => setCodeForm({ ...codeForm, dias_vigencia: e.target.value })}
                      className="w-24 h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-mono focus:border-amber-400 outline-none"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[7, 15, 30, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCodeForm({ ...codeForm, dias_vigencia: d })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                            Number(codeForm.dias_vigencia) === d
                              ? 'bg-zinc-800 text-amber-400 border-zinc-600 font-bold'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Código personalizado (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={codeForm.codigo_personalizado}
                    onChange={(e) =>
                      setCodeForm({
                        ...codeForm,
                        codigo_personalizado: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Dejar vacío para generar aleatorio seguro"
                    className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 sm:h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-mts-primary flex-1 h-11 sm:h-9 px-4 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? 'Generando...' : 'Emitir Código'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};

export default UsersPage;
