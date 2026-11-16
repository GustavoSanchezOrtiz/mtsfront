import React, { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';
import {
  Building,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileText,
  Save,
  Clock,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import logoMts from '../../assets/logo.svg';
import logoNegro from '../../assets/logoNegro.svg';
import decoratorSvg from '../../assets/DecoradorSuperIzquierdo.svg';
import { Skeleton, FormPanelSkeleton } from '../../components/Skeleton';

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const formatFechaEs = (fecha = new Date()) => {
  return `${fecha.getDate()} de ${MESES_ES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

export const CompanyPage = () => {
  const [companyMeta, setCompanyMeta] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    calle: '',
    colonia: '',
    ciudad: 'Durango',
    estado_provincia: 'Durango',
    correo: '',
    telefonos: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Obtiene el registro Singleton GET /empresa-mts/
   */
  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/empresa-mts/');
      const data = res.data || {};
      setCompanyMeta(data);
      setCompanyForm({
        calle: data.calle || '',
        colonia: data.colonia || '',
        ciudad: data.ciudad || 'Durango',
        estado_provincia: data.estado_provincia || 'Durango',
        correo: data.correo || '',
        telefonos: data.telefonos || '',
      });
    } catch (err) {
      console.error('Error al cargar datos de Empresa MTS:', err);
      setError('No se pudo conectar con el servidor para obtener los datos maestros.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  /**
   * Actualiza el registro Singleton PUT /empresa-mts/
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyForm.calle.trim() || !companyForm.colonia.trim()) {
      setFormError('La calle y la colonia fiscal son obligatorias.');
      return;
    }
    if (!companyForm.correo.trim()) {
      setFormError('Ingresa un correo electrónico corporativo válido.');
      return;
    }
    if (!companyForm.telefonos.trim()) {
      setFormError('Ingresa al menos un teléfono de contacto.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        calle: companyForm.calle.trim(),
        colonia: companyForm.colonia.trim(),
        ciudad: companyForm.ciudad.trim(),
        estado_provincia: companyForm.estado_provincia.trim(),
        correo: companyForm.correo.trim(),
        telefonos: companyForm.telefonos.trim(),
      };

      const res = await apiClient.put('/empresa-mts/', payload);
      setCompanyMeta(res.data);
      showToast('Datos maestros de MTS actualizados para PDFs.');
    } catch (err) {
      console.error('Error al actualizar Empresa MTS:', err);
      const detail = err.response?.data?.detail;
      setFormError(
        typeof detail === 'string'
          ? detail
          : 'No se pudo actualizar la información. Verifica el formato del correo.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-amber-400 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-zinc-800/40">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            Empresa MTS
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400">
            Datos maestros corporativos impresos en el encabezado oficial de todos los PDFs de cotización.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCompany}
          disabled={isLoading}
          className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-inter flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Recargar</span>
        </button>
      </div>

      {/* Contenido Principal */}
      {isLoading ? (
        <FormPanelSkeleton />
      ) : error ? (
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error de conexión</p>
            <p className="text-red-400/80">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchCompany}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-white rounded-lg transition-colors font-inter"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-content-fade">
          {/* Formulario Maestro (PUT /empresa-mts/) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-5 shadow-md"
          >
            <div className="border-b border-zinc-800/80 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-white font-heading flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Información Fiscal y de Contacto</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cualquier ajuste impacta inmediatamente los nuevos PDFs descargados.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                  Calle y número *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Ej. Calle Principal #123"
                  value={companyForm.calle}
                  onChange={(e) => setCompanyForm({ ...companyForm, calle: e.target.value })}
                  className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                  Colonia / Parque industrial *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="Ej. Zona Industrial"
                  value={companyForm.colonia}
                  onChange={(e) => setCompanyForm({ ...companyForm, colonia: e.target.value })}
                  className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Durango"
                  value={companyForm.ciudad}
                  onChange={(e) => setCompanyForm({ ...companyForm, ciudad: e.target.value })}
                  className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                  Estado / Provincia *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Durango"
                  value={companyForm.estado_provincia}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, estado_provincia: e.target.value })
                  }
                  className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                  Correo corporativo *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contacto@mtssystems.mx"
                  value={companyForm.correo}
                  onChange={(e) => setCompanyForm({ ...companyForm, correo: e.target.value })}
                  className="w-full h-10 sm:h-9 px-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 focus:border-amber-400 outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-inter text-zinc-400 block font-semibold">
                  Teléfonos de atención *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ej. 618-123-4567, 618-765-4321"
                    value={companyForm.telefonos}
                    onChange={(e) => setCompanyForm({ ...companyForm, telefonos: e.target.value })}
                    className="w-full h-10 sm:h-9 pl-9 pr-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm sm:text-xs text-zinc-200 font-inter focus:border-amber-400 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-mts-primary h-11 sm:h-9 px-5 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" color="current" className="scale-75 text-white" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Vista Previa del Membrete PDF */}
          <div className="lg:col-span-5 bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-md">
            <div className="border-b border-zinc-800/80 pb-3">
              <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Previsualización del Membrete PDF</span>
              </h2>
            </div>

            {/* Simulación fiel del documento oficial (WeasyPrint / quotation.html) */}
            <div className="letterhead-sheet border border-zinc-700/60 shadow-2xl">
                {/* 1. Marca de agua: Logo negro de fondo con opacidad del 8.5% */}
                <div
                  className="absolute pointer-events-none select-none text-center"
                  style={{
                    top: '28%',
                    left: '12%',
                    width: '76%',
                    opacity: 0.085,
                    zIndex: 0,
                  }}
                >
                  <img src={logoNegro} alt="Marca de agua MTS" className="w-full h-auto block" />
                </div>

                {/* 2. Barra superior carbón (#262626) que sostiene datos de contacto */}
                <div
                  className="absolute left-0 right-0 flex items-center select-none"
                  style={{
                    top: '3.7cqw',
                    height: '12.74cqw',
                    backgroundColor: '#262626',
                    zIndex: 1,
                    paddingLeft: '33.8cqw',
                    paddingRight: '2.5cqw',
                  }}
                >
                  <div className="text-[clamp(7.5px,1.4cqw,11.5px)] leading-[1.38] text-[#f7fafc] w-full min-w-0 font-sans">
                    <div className="truncate">
                      <span className="font-bold text-white">Calle:</span>{' '}
                      <span className={!companyForm.calle ? 'text-zinc-400 italic' : ''}>
                        {companyForm.calle || 'Calle Principal #100'}
                      </span>
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-white">Col.</span>{' '}
                      <span className={!companyForm.colonia ? 'text-zinc-400 italic' : ''}>
                        {companyForm.colonia || 'Zona Industrial'}
                      </span>
                    </div>
                    <div className="truncate text-zinc-100">
                      {companyForm.ciudad || 'Durango'}, {companyForm.estado_provincia || 'Durango'}. México
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-white">Correo:</span>{' '}
                      <span className={!companyForm.correo ? 'text-zinc-400 italic' : ''}>
                        {companyForm.correo || 'contacto@mtsingenieria.com'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Decorador superior izquierdo idéntico al SVG del backend */}
                <div
                  className="absolute top-0 left-0 pointer-events-none select-none"
                  style={{
                    width: '31.5cqw',
                    zIndex: 2,
                  }}
                >
                  <img
                    src={decoratorSvg}
                    alt="Decorador MTS"
                    className="w-full block h-auto"
                  />
                </div>

                {/* 4. Logo posicionado DENTRO del recuadro negro superior del decorador */}
                <div
                  className="absolute top-0 left-0 flex items-center justify-center pointer-events-none select-none"
                  style={{
                    width: '31.5cqw',
                    height: '20.15cqw',
                    zIndex: 3,
                  }}
                >
                  <img
                    src={logoMts}
                    alt="Logo MTS"
                    style={{
                      width: '27.8cqw',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </div>

                {/* 5. Contenedor principal del documento */}
                <div
                  className="relative font-sans"
                  style={{
                    zIndex: 1,
                    paddingTop: '22cqw',
                    paddingLeft: '10.2cqw',
                    paddingRight: '6.95cqw',
                    paddingBottom: '3.5cqw',
                  }}
                >
                  {/* Fila de Identificación */}
                  <div className="flex justify-between items-start gap-2 mb-[1.6cqw]">
                    {/* Recuadro CLIENTE */}
                    <div className="letterhead-client-box flex-[0_0_54%] p-[1cqw_1.5cqw] text-[clamp(6.8px,1.2cqw,10px)] leading-[1.28] text-[#1a202c]">
                      <div className="font-bold text-[clamp(7.5px,1.4cqw,11px)] tracking-[0.5px] text-[#1a202c] mb-[0.2cqw]">
                        Cliente:
                      </div>
                      <div className="font-semibold text-[clamp(7.2px,1.3cqw,10.5px)] text-[#1a202c] mb-[0.2cqw] truncate">
                        Industrias Peñoles S.A. de C.V.
                      </div>
                      <div className="text-[#4a5568] text-[clamp(6.5px,1.15cqw,9.5px)] truncate">
                        Calzada de la Unión #1200, Parque Industrial
                      </div>
                      <div className="text-[#4a5568] text-[clamp(6.5px,1.15cqw,9.5px)] truncate">
                        Planta Fundición - Mantenimiento Mayor
                      </div>
                      <div className="text-[#4a5568] text-[clamp(6.5px,1.15cqw,9.5px)] truncate">
                        <strong className="text-[#1a202c] font-semibold">Atención:</strong> Ing. Fernando Rivas
                      </div>
                    </div>

                    {/* Presupuesto y Fecha */}
                    <div className="flex-[0_0_43%] text-right pt-[0.2cqw]">
                      <div className="font-extrabold text-[clamp(9px,1.9cqw,15px)] text-[#1a202c] leading-tight">
                        Presupuesto N: <span>MTS-2026-084</span>
                      </div>
                      <div className="font-medium text-[clamp(7.2px,1.3cqw,11px)] text-[#4a5568] mt-[0.3cqw]">
                        ({formatFechaEs(new Date())})
                      </div>
                    </div>
                  </div>

                  {/* Título del Proyecto */}
                  <div className="text-[clamp(7.5px,1.35cqw,11px)] text-[#1a202c] leading-[1.35] mb-[1.4cqw]">
                    <strong className="font-extrabold text-[#1a202c]">Proyecto:</strong>{' '}
                    <span className="font-semibold text-[#2d3748]">Maquinado y mantenimiento a flecha de transmisión</span>
                  </div>

                  {/* Tabla de Conceptos */}
                  <table className="w-full border-collapse mb-[1.2cqw] text-[clamp(6.8px,1.18cqw,9.8px)]">
                    <thead>
                      <tr className="bg-[#262626] text-white font-bold text-[clamp(6.2px,1.1cqw,9px)] tracking-[0.5px]">
                        <th className="w-[12%] text-center py-[0.7cqw] px-[0.5cqw]">Cant.</th>
                        <th className="w-[56%] text-center py-[0.7cqw] px-[0.5cqw]">Descripción</th>
                        <th className="w-[16%] text-center py-[0.7cqw] px-[0.5cqw]">P.U.</th>
                        <th className="w-[16%] text-center py-[0.7cqw] px-[0.5cqw]">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#cbd5e0] text-[#1a202c]">
                        <td className="text-center py-[0.7cqw] px-[0.5cqw] border-l border-r border-[#cbd5e0] font-medium">
                          1
                        </td>
                        <td className="py-[0.7cqw] px-[0.7cqw] border-l border-r border-[#cbd5e0]">
                          <div className="font-semibold text-[#1a202c] text-[clamp(6.8px,1.2cqw,10px)] leading-tight">
                            Maquinado CNC y rectificado en flecha de transmisión
                          </div>
                          <div className="text-[clamp(6.2px,1.05cqw,8.8px)] italic text-[#4a5568] mt-[0.1cqw]">
                            Acero aleado 4140 templado por inducción
                          </div>
                        </td>
                        <td className="text-center py-[0.7cqw] px-[0.5cqw] border-l border-r border-[#cbd5e0] font-medium text-[clamp(6.8px,1.22cqw,10.2px)]">
                          $ 18,500.00
                        </td>
                        <td className="text-center py-[0.7cqw] px-[0.5cqw] border-l border-r border-[#cbd5e0] font-medium text-[clamp(6.8px,1.22cqw,10.2px)]">
                          $ 18,500.00
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totalizador */}
                  <div className="flex justify-end mb-[1.2cqw]">
                    <div className="flex items-center bg-[#edf2f7] border border-[#cbd5e0] rounded-[2px] overflow-hidden min-w-[clamp(110px,26cqw,200px)]">
                      <div className="px-[1cqw] py-[0.5cqw] font-bold text-[clamp(7.2px,1.3cqw,10.5px)] text-[#1a202c] tracking-[0.5px]">
                        Total:
                      </div>
                      <div className="px-[1cqw] py-[0.5cqw] font-extrabold text-[clamp(8px,1.55cqw,13px)] text-[#1a202c] border-l-2 border-[#a0aec0] text-right flex-grow">
                        $ 18,500.00
                      </div>
                    </div>
                  </div>

                  {/* Notas y Teléfonos */}
                  <div className="text-[clamp(6.2px,1.05cqw,8.8px)] text-[#4a5568] border-t border-zinc-200 pt-[0.8cqw] leading-[1.3]">
                    <p className="italic mb-[0.2cqw]">
                      <strong className="text-[#1a202c] not-italic font-bold">Notas:</strong> Incluye todo lo necesario para su correcto funcionamiento.
                    </p>
                    <p className="text-zinc-500">
                      <strong className="text-[#1a202c] font-semibold">El IVA:</strong> Se adicionará al momento de facturar.{' '}
                      <span className="font-semibold text-zinc-700">Teléfonos:</span>{' '}
                      <span className={!companyForm.telefonos ? 'italic text-zinc-400' : 'text-zinc-800'}>
                        {companyForm.telefonos || '(sin registrar)'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;
