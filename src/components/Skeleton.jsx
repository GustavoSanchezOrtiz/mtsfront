import React from 'react';

/**
 * Componente base de Esqueleto con animación de pulso sutil
 * Diseñado acorde a la paleta industrial oscura del sistema MTS
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-800/50 ${className}`}
      {...props}
    />
  );
}

/**
 * Esqueleto para el Grid de Tarjetas de Cotizaciones
 */
export function QuotesGridSkeleton({ count = 8 }) {
  return (
    <div className="space-y-6">
      {/* Grupo simulado de fecha */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-full" />
          <div className="flex-1 h-px bg-zinc-800/80" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md"
            >
              <div>
                {/* Cabecera de tarjeta: Número de presupuesto + Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Skeleton className="h-6 w-28 rounded-md bg-zinc-800/70" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                </div>

                {/* Título de proyecto */}
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <Skeleton className="h-4 w-3/5 rounded-md" />
                </div>

                {/* Cliente / Planta */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3.5 w-40 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                </div>

                {/* Metadatos (partidas y fecha) */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>

              {/* Pie de tarjeta: Importe y Botón PDF */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-end justify-between">
                <div>
                  <Skeleton className="h-2.5 w-12 rounded mb-1" />
                  <Skeleton className="h-7 w-28 rounded-lg bg-zinc-800/80" />
                </div>
                <Skeleton className="h-9 w-24 rounded-xl bg-zinc-800/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Esqueleto para la Tabla Widescreen de Cotizaciones
 */
export function QuotesTableSkeleton({ rows = 8 }) {
  return (
    <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e] font-poppins">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-poppins">
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
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="hover:bg-zinc-900/30">
                <td className="py-3.5 px-4">
                  <Skeleton className="h-4 w-24 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-4 w-48 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-4 w-36 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-4 w-28 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-3.5 w-20 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-5 w-24 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Esqueleto para las Partidas dentro del Modal de Detalle
 */
export function QuoteDetailItemsSkeleton({ count = 3 }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-zinc-900/90 text-[10px] text-zinc-400 border-b border-zinc-800">
          <tr>
            <th className="px-3 py-2 text-center w-8">#</th>
            <th className="px-3 py-2">Descripción</th>
            <th className="px-3 py-2 text-center w-16">Cant.</th>
            <th className="px-3 py-2 text-right w-24">Precio</th>
            <th className="px-3 py-2 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {Array.from({ length: count }).map((_, i) => (
            <tr key={i} className="hover:bg-zinc-900/40">
              <td className="px-3 py-3 text-center">
                <Skeleton className="h-3.5 w-4 mx-auto rounded" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-3.5 w-3/4 rounded" />
              </td>
              <td className="px-3 py-3 text-center">
                <Skeleton className="h-3.5 w-8 mx-auto rounded" />
              </td>
              <td className="px-3 py-3 text-right">
                <Skeleton className="h-3.5 w-16 ml-auto rounded" />
              </td>
              <td className="px-3 py-3 text-right">
                <Skeleton className="h-3.5 w-16 ml-auto rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Esqueleto para la Tabla de Clientes
 */
export function ClientsTableSkeleton({ rows = 6 }) {
  return (
    <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-[11px] font-medium text-zinc-400 border-b border-zinc-800/80">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-normal">Empresa / Razón Social</th>
              <th scope="col" className="px-5 py-3.5 font-normal">Dirección Operativa</th>
              <th scope="col" className="px-5 py-3.5 font-normal text-right">Fecha de Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="hover:bg-zinc-800/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 w-40 rounded" />
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Skeleton className="h-4 w-52 rounded" />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Skeleton className="h-4 w-20 ml-auto rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Esqueleto genérico en cuadrícula para módulos operativos (Clientes, Plantas, Partidas, Gastos, Códigos)
 */
export function CardsGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-24 rounded-md bg-zinc-800/70" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-3.5 w-3/5 rounded-md" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Esqueleto genérico de tabla widescreen con columnas configurables
 */
export function GenericTableSkeleton({ columns = ['Concepto', 'Relación', 'Detalle', 'Fecha', 'Acciones'], rows = 7 }) {
  return (
    <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-[#0c0c0e]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] select-none">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${idx === columns.length - 1 ? 'text-right' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/30">
                {columns.map((_, cIdx) => (
                  <td
                    key={cIdx}
                    className={`py-3.5 px-4 ${cIdx === columns.length - 1 ? 'text-right' : ''}`}
                  >
                    {cIdx === columns.length - 1 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                      </div>
                    ) : (
                      <Skeleton
                        className={`h-4 rounded ${
                          cIdx === 0 ? 'w-16' : cIdx === 1 ? 'w-44' : 'w-28'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Esqueleto para paneles maestros de configuración (Empresa MTS / Perfil)
 */
export function FormPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-[#101012] border border-zinc-800/80 rounded-2xl p-6 space-y-5">
        <Skeleton className="h-5 w-48 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>
      <div className="lg:col-span-5 bg-[#101012] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Esqueletos móviles con las MISMAS medidas (padding, interlineado, alturas fijas) que las
 * tarjetas reales, para que al llegar los datos no haya salto de diseño (resize).
 * Alturas base: fila de cabecera 28px · título text-base leading-snug 22px/línea ·
 * texto text-xs 16px · botón h-9 36px.
 */
const MOBILE_CARD_SHELL =
  'bg-[#101012] border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-md';

function TitleLines({ lines = 2, className = 'mt-1' }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-[22px] flex items-center">
          <Skeleton className={`h-4 rounded-md ${i === lines - 1 ? 'w-3/5' : 'w-11/12'}`} />
        </div>
      ))}
    </div>
  );
}

function HeaderRow({ pillWidth = 'w-16', badgeWidth = 'w-28', marginClass = 'mb-2.5' }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${marginClass}`}>
      <Skeleton className={`h-[22px] ${badgeWidth} rounded-md bg-zinc-800/70`} />
      <div className="flex items-center gap-1.5 shrink-0">
        <Skeleton className={`h-[22px] ${pillWidth} rounded-full`} />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}

function FooterRow({ leftHeight, alignClass = 'items-end', rightWidth = 'w-20', children }) {
  return (
    <div className={`mt-4 pt-3 border-t border-zinc-800/60 flex ${alignClass} justify-between`}>
      <div style={{ height: leftHeight }} className="flex flex-col justify-start">
        {children}
      </div>
      <Skeleton className={`h-9 ${rightWidth} rounded-xl bg-zinc-800/70`} />
    </div>
  );
}

const MOBILE_VARIANTS = {
  quotes: (
    <div className={MOBILE_CARD_SHELL}>
      <div>
        <HeaderRow marginClass="mb-2" pillWidth="w-20" />
        <TitleLines className="mt-1.5" />
        <div className="mt-2.5 space-y-1">
          <div className="h-4 flex items-center">
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
        </div>
      </div>
      <FooterRow leftHeight={46} rightWidth="w-[72px]">
        <Skeleton className="h-6 w-32 rounded-lg bg-zinc-800/80" />
        <Skeleton className="h-4 w-28 rounded mt-1.5" />
      </FooterRow>
    </div>
  ),
  items: (
    <div className={MOBILE_CARD_SHELL}>
      <div>
        <HeaderRow pillWidth="w-10" />
        <TitleLines />
        <div className="mt-2 h-4 flex items-center">
          <Skeleton className="h-3.5 w-40 rounded" />
        </div>
      </div>
      <FooterRow leftHeight={41} rightWidth="w-[78px]">
        <Skeleton className="h-5 w-28 rounded-lg bg-zinc-800/80" />
        <Skeleton className="h-[17px] w-24 rounded mt-1" />
      </FooterRow>
    </div>
  ),
  expenses: (
    <div className={MOBILE_CARD_SHELL}>
      <div>
        <HeaderRow pillWidth="w-16" />
        <TitleLines />
        <div className="mt-2.5 space-y-1">
          <div className="h-4 flex items-center">
            <Skeleton className="h-3.5 w-40 rounded" />
          </div>
          <div className="h-[17px] flex items-center">
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <div className="h-[17px] flex items-center">
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
      </div>
      <FooterRow leftHeight={46} rightWidth="w-[78px]">
        <Skeleton className="h-6 w-32 rounded-lg bg-zinc-800/80" />
        <Skeleton className="h-4 w-24 rounded mt-1.5" />
      </FooterRow>
    </div>
  ),
  clients: (
    <div className={MOBILE_CARD_SHELL}>
      <div>
        <HeaderRow pillWidth="w-20" />
        <TitleLines />
        <div className="mt-3 space-y-1.5">
          <div className="h-[39px] flex flex-col justify-center gap-1.5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      </div>
      <FooterRow leftHeight={36} alignClass="items-center" rightWidth="w-[78px]">
        <div className="h-9 flex items-center">
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </FooterRow>
    </div>
  ),
  plants: (
    <div className={MOBILE_CARD_SHELL}>
      <div>
        <HeaderRow pillWidth="w-14" badgeWidth="w-24" />
        <TitleLines />
        <div className="mt-3 space-y-1">
          <div className="h-4 flex items-center">
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
        </div>
      </div>
      <FooterRow leftHeight={36} alignClass="items-center" rightWidth="w-[78px]">
        <div className="h-9 flex items-center">
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </FooterRow>
    </div>
  ),
  codes: (
    <div className={MOBILE_CARD_SHELL}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-3 h-[21px]">
          <Skeleton className="h-[21px] w-24 rounded-md" />
          <Skeleton className="h-[21px] w-20 rounded-full" />
        </div>
        <div className="p-3 border border-transparent rounded-xl flex items-center justify-center">
          <Skeleton className="h-5 w-40 rounded bg-zinc-800/80" />
        </div>
        <div className="mt-3 space-y-1">
          <div className="h-4 flex items-center justify-between">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between h-[45px]">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg bg-zinc-800/70" />
      </div>
    </div>
  ),
};

/**
 * Esqueleto móvil (visible solo < sm): una columna con tarjetas de la variante indicada.
 * variant: 'quotes' | 'items' | 'expenses' | 'clients' | 'plants' | 'codes'
 */
export function MobileCardsSkeleton({ variant = 'quotes', count = 5, className = '' }) {
  const card = MOBILE_VARIANTS[variant] || MOBILE_VARIANTS.quotes;
  return (
    <div className={`sm:hidden ${variant === 'quotes' ? 'space-y-3' : ''} ${className}`} aria-busy="true" aria-label="Cargando">
      {variant === 'quotes' && (
        <div className="flex items-center gap-3 pt-2 h-[29px]">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-[21px] w-24 rounded-full" />
          <div className="flex-1 h-px bg-zinc-800/80" />
        </div>
      )}
      <div className="grid grid-cols-1 gap-3.5">
        {Array.from({ length: count }).map((_, i) => (
          <React.Fragment key={i}>{card}</React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Esqueleto móvil exclusivo para el Dashboard MTS (diseño bento en 1 columna)
 * Reproduce exactamente la forma de las tarjetas métricas y listas para eliminar cualquier salto o parpadeo.
 */
export function DashboardMobileSkeleton({ isAdmin = true }) {
  if (!isAdmin) {
    return (
      <div className="sm:hidden flex flex-col gap-3.5" aria-busy="true" aria-label="Cargando panel">
        {/* Card 1: Mis Proyectos Asignados KPI */}
        <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <Skeleton className="h-[26px] w-48 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="py-2">
            <Skeleton className="h-8 w-44 rounded-lg bg-zinc-800/80" />
            <Skeleton className="h-3.5 w-64 rounded mt-2" />
          </div>
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>

        {/* Card 2: Mis Gastos Registrados KPI */}
        <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <Skeleton className="h-[26px] w-40 rounded-lg" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="py-2">
            <Skeleton className="h-8 w-48 rounded-lg bg-zinc-800/80" />
            <Skeleton className="h-3.5 w-60 rounded mt-2" />
          </div>
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>

        {/* Card 3: Lista de Proyectos Asignados */}
        <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-zinc-800/60 space-y-2.5 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-48 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard Mobile Skeleton
  return (
    <div className="sm:hidden flex flex-col gap-3.5" aria-busy="true" aria-label="Cargando panel">
      {/* 1. Ingreso Cobrado (Pagadas) */}
      <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-[26px] w-36 rounded-lg" />
          <Skeleton className="h-[22px] w-24 rounded-full" />
        </div>
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <Skeleton className="h-9 w-52 rounded-lg bg-zinc-800/80" />
          <Skeleton className="h-3.5 w-64 rounded mt-2" />
        </div>
      </div>

      {/* 2. Gasto Pendiente (Aceptadas) */}
      <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-[26px] w-36 rounded-lg" />
          <Skeleton className="h-[22px] w-24 rounded-full" />
        </div>
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <Skeleton className="h-9 w-44 rounded-lg bg-zinc-800/80" />
          <Skeleton className="h-3.5 w-60 rounded mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Skeleton className="h-7 rounded-lg" />
          <Skeleton className="h-7 rounded-lg" />
        </div>
      </div>

      {/* 3. Cotizaciones Recientes */}
      <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>

        <div className="divide-y divide-zinc-800/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-36 rounded" />
              </div>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>

        <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
      </div>

      {/* 4. Gastos Reales y Balance */}
      <div className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-4 flex flex-col justify-between gap-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="w-4 h-4 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
            <Skeleton className="h-2.5 w-20 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <Skeleton className="h-3 w-44 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>

      {/* 5. Módulos de Acceso Rápido (4 tarjetas en grid de 2 cols) */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#101012] border border-zinc-800/80 rounded-[16px] p-3.5 flex flex-col justify-between gap-3 shadow-md h-[100px]">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-2.5 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
