import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, ChevronDown, BookmarkPlus, Trash2, Check, User, Building2 } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailRegistryInput = ({
  value = '',
  onChange,
  savedEmails = [],
  clienteId = null,
  contactName = '',
  onSelectSaved,
  onSaveNew,
  onDeleteSaved,
  placeholder = 'Ej. compras@cliente.com',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  ariaLabel = 'Correo de contacto o envío',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const normalizedValue = (value || '').trim().toLowerCase();
  const parsedClientId = clienteId ? parseInt(clienteId, 10) : null;

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 240 && rect.top > 240;
    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 260),
      openUp,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleReposition = () => updatePosition();
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const { clientMatches, otherMatches, exactSaved } = useMemo(() => {
    const exact = savedEmails.find(
      (item) => (item.correo || '').toLowerCase() === normalizedValue
    );

    const filtered = savedEmails.filter((item) => {
      if (!normalizedValue) return true;
      return (
        (item.correo || '').toLowerCase().includes(normalizedValue) ||
        (item.nombre_contacto || '').toLowerCase().includes(normalizedValue) ||
        (item.cliente_nombre || '').toLowerCase().includes(normalizedValue)
      );
    });

    const forClient = [];
    const others = [];
    for (const item of filtered) {
      if (parsedClientId && item.cliente_id === parsedClientId) {
        forClient.push(item);
      } else {
        others.push(item);
      }
    }

    return {
      clientMatches: forClient,
      otherMatches: others,
      exactSaved: exact || null,
    };
  }, [savedEmails, normalizedValue, parsedClientId]);

  const canQuickSave = Boolean(
    onSaveNew && normalizedValue && EMAIL_RE.test(normalizedValue) && !exactSaved
  );

  const handleQuickSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickSave || isSaving) return;
    try {
      setIsSaving(true);
      await onSaveNew({
        correo: normalizedValue,
        nombre_contacto: contactName?.trim() || null,
        cliente_id: parsedClientId || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDeleteSaved || deletingId) return;
    try {
      setDeletingId(id);
      await onDeleteSaved(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectItem = (item) => {
    onChange?.(item.correo);
    onSelectSaved?.(item);
    setIsOpen(false);
  };

  const renderItem = (item) => {
    const isSelected = (item.correo || '').toLowerCase() === normalizedValue;
    const displayContactName =
      item.nombre_contacto &&
      item.nombre_contacto.trim().toLowerCase() !== (item.correo || '').trim().toLowerCase()
        ? item.nombre_contacto
        : null;
    return (
      <div
        key={item.id}
        role="option"
        aria-selected={isSelected}
        onClick={() => handleSelectItem(item)}
        className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
            : 'hover:bg-zinc-800/80 text-zinc-200 border border-transparent'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-inter font-medium truncate">{item.correo}</span>
            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </div>
          {(displayContactName || item.cliente_nombre) && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[10px] text-zinc-400 font-inter">
              {displayContactName && (
                <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                  <User className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{displayContactName}</span>
                </span>
              )}
              {item.cliente_nombre && (
                <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
                  <Building2 className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{item.cliente_nombre}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-inter text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md tabular-nums">
            {item.veces_enviado || 1} {item.veces_enviado === 1 ? 'envío' : 'envíos'}
          </span>
          {onDeleteSaved && (
            <button
              type="button"
              onClick={(e) => handleDelete(e, item.id)}
              disabled={deletingId === item.id}
              title="Eliminar del registro de correos"
              aria-label={`Eliminar ${item.correo} del registro`}
              className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const hasAnyMatches = clientMatches.length > 0 || otherMatches.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
        <input
          type="email"
          required={required}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange?.(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className={`w-full h-9 pl-8 pr-8 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs font-inter text-zinc-200 placeholder-zinc-600 focus:border-amber-400 outline-none transition-colors disabled:opacity-50 ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Mostrar correos enviados anteriormente"
          title="Correos enviados anteriormente"
          className="absolute right-2 p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-40"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
          />
        </button>
      </div>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          >
            {canQuickSave && (
              <div className="p-1.5 border-b border-zinc-800/80 bg-zinc-900/60">
                <button
                  type="button"
                  onClick={handleQuickSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-poppins font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {isSaving ? 'Guardando correo...' : `Guardar "${normalizedValue}"`}
                    </span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 shrink-0">Registro</span>
                </button>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
              {clientMatches.length > 0 && (
                <div className="space-y-0.5">
                  <p className="px-2 pt-1 pb-0.5 text-[10px] font-poppins font-semibold text-amber-400/90">
                    Usados con este cliente
                  </p>
                  {clientMatches.map(renderItem)}
                </div>
              )}

              {otherMatches.length > 0 && (
                <div className="space-y-0.5">
                  <p className="px-2 pt-1 pb-0.5 text-[10px] font-poppins font-semibold text-zinc-500">
                    {clientMatches.length > 0
                      ? 'Otros correos enviados anteriormente'
                      : 'Correos enviados anteriormente'}
                  </p>
                  {otherMatches.map(renderItem)}
                </div>
              )}

              {!hasAnyMatches && !canQuickSave && (
                <div className="px-3 py-4 text-center text-xs font-inter text-zinc-500">
                  {savedEmails.length === 0
                    ? 'Aún no hay correos guardados. Escribe un correo y se guardará automáticamente al enviar o guardar.'
                    : 'No hay coincidencias en los correos guardados.'}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default EmailRegistryInput;
