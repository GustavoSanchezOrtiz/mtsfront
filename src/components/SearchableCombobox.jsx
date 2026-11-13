import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Loader2, Inbox } from 'lucide-react';

const normalizeStr = (str) =>
  str ? String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

/**
 * SearchableCombobox
 * Selector accesible con autocompletado, búsqueda en tiempo real e identidad Apple Dark Industrial.
 */
export const SearchableCombobox = ({
  id,
  name,
  label,
  sublabel,
  placeholder = 'Selecciona una opción...',
  searchPlaceholder = 'Buscar...',
  value,
  onChange,
  options = [],
  disabled = false,
  isLoading = false,
  required = false,
  emptyMessage = 'No se encontraron resultados',
  allowEmptyDefault = false,
  emptyDefaultLabel = '(Sin selección / general)',
  emptyDefaultValue = '',
  emptyDefaultSublabel = '',
  emptyDefaultIcon = null,
  icon: TriggerIcon = null,
  className = '',
  menuWidth = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState('bottom');

  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalizar opciones
  const fullOptions = useMemo(() => {
    const list = [];
    if (allowEmptyDefault) {
      list.push({
        value: emptyDefaultValue,
        label: emptyDefaultLabel,
        sublabel: emptyDefaultSublabel,
        icon: emptyDefaultIcon,
        isEmptyDefault: true,
      });
    }
    return list.concat(options);
  }, [
    allowEmptyDefault,
    emptyDefaultValue,
    emptyDefaultLabel,
    emptyDefaultSublabel,
    emptyDefaultIcon,
    options,
  ]);

  // Encontrar opción seleccionada
  const selectedOption = useMemo(() => {
    return fullOptions.find((opt) => String(opt.value) === String(value));
  }, [fullOptions, value]);

  // Filtrado reactivo por término de búsqueda (ignora mayúsculas y acentos)
  const filteredOptions = useMemo(() => {
    const q = normalizeStr(searchTerm);
    if (!q) return fullOptions;
    return fullOptions.filter((opt) => {
      const matchLabel = normalizeStr(opt.label).includes(q);
      const matchSub = opt.sublabel ? normalizeStr(opt.sublabel).includes(q) : false;
      return matchLabel || matchSub;
    });
  }, [fullOptions, searchTerm]);

  // Ajustar placement (top/bottom) según espacio en pantalla
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 250 && spaceAbove > spaceBelow) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }
  }, [isOpen]);

  // Autofocus en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      const t = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleSelect = (optValue, opt) => {
    onChange?.(optValue, opt);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(emptyDefaultValue, null);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const item = filteredOptions[highlightedIndex];
        handleSelect(item.value, item);
      }
    }
  };

  const SelectedIcon = selectedOption?.icon || TriggerIcon;

  return (
    <div
      ref={containerRef}
      className={`space-y-1 relative ${isOpen ? 'z-40' : 'z-10'} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Label superior */}
      {label && (
        <div className="flex items-center justify-between gap-1.5">
          <label
            htmlFor={id}
            className="text-[11px] font-poppins text-zinc-400 block font-semibold truncate select-none"
          >
            {label}
          </label>
          {sublabel && (
            <span className="text-[10px] text-zinc-500 font-poppins truncate">
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* Input oculto para formularios HTML nativos */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value ?? ''}
        required={required}
      />

      {/* Botón Disparador (Trigger) estilo Apple Industrial MTS */}
      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full h-10 sm:h-9 px-3 rounded-xl border text-xs text-left flex items-center justify-between gap-2 transition-all outline-none font-poppins ${
          disabled
            ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-60'
            : isOpen
            ? 'bg-zinc-950 border-amber-400 ring-1 ring-amber-400/30 text-white shadow-lg'
            : 'bg-zinc-950/70 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:text-white cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          ) : SelectedIcon ? (
            <SelectedIcon
              className={`w-4 h-4 shrink-0 ${
                selectedOption && String(selectedOption.value) !== String(emptyDefaultValue)
                  ? 'text-amber-400'
                  : 'text-zinc-500'
              }`}
            />
          ) : null}

          <div className="min-w-0 flex-1 truncate">
            {selectedOption ? (
              <span className="truncate block font-medium">
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-zinc-500 truncate block">
                {isLoading ? 'Cargando opciones...' : placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!disabled &&
            !isLoading &&
            selectedOption &&
            String(selectedOption.value) !== String(emptyDefaultValue) && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="p-1 text-zinc-500 hover:text-zinc-200 rounded-md hover:bg-zinc-800 transition-colors"
                title="Limpiar selección"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Menú Flotante con Buscador y Lista de Opciones */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute left-0 w-full bg-[#121214] border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-content-fade ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={menuWidth ? { width: menuWidth } : undefined}
          role="listbox"
        >
          {/* Cabecera con Buscador Integrado */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/90 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none font-poppins py-1"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Lista de Resultados con Scroll Suave */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center">
                <Inbox className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-400 font-medium font-poppins">
                  {emptyMessage}
                </p>
                {searchTerm && (
                  <p className="text-[11px] text-zinc-600 font-poppins mt-0.5">
                    No hay coincidencias con "{searchTerm}"
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                const OptIcon = opt.icon || TriggerIcon;

                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value, opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2.5 transition-all cursor-pointer font-poppins ${
                      isSelected
                        ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300 font-semibold shadow-sm'
                        : isHighlighted
                        ? 'bg-zinc-800/80 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptIcon && (
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-400/40 text-amber-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <OptIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-xs">
                          {opt.label}
                        </p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-sans">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-400 stroke-[2.5] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCombobox;
