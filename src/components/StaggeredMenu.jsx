'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export const StaggeredMenu = ({
  position = 'right',
  colors = ['#18181b', '#27272a'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl,
  menuButtonColor = '#f4f4f5',
  openMenuButtonColor = '#ffffff',
  accentColor = '#eab308',
  changeMenuColorOnOpen = true,
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
  onItemClick,
  onLogoClick,
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);

  // Refs de las 3 barras del icono de Hamburguesa
  const lineTopRef = useRef(null);
  const lineMidRef = useRef(null);
  const lineBotRef = useRef(null);

  const textInnerRef = useRef(null);
  const textWrapRef = useRef(null);
  const [textLines, setTextLines] = useState(['Menú', 'Cerrar']);

  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const iconTweenRef = useRef(null);
  const textCycleAnimRef = useRef(null);
  const colorTweenRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const lineTop = lineTopRef.current;
      const lineMid = lineMidRef.current;
      const lineBot = lineBotRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !lineTop || !lineMid || !lineBot || !textInner) return;

      let preLayers = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }

      // Configuración inicial de barras de hamburguesa
      gsap.set(lineTop, { y: -4.5, rotate: 0, transformOrigin: 'center center' });
      gsap.set(lineMid, { opacity: 1, scaleX: 1, transformOrigin: 'center center' });
      gsap.set(lineBot, { y: 4.5, rotate: 0, transformOrigin: 'center center' });

      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 8 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 20, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.45, ease: 'power4.out' }, i * 0.06);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.06 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.06 : 0);
    const panelDuration = 0.55;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.8,
          ease: 'power4.out',
          stagger: { each: 0.08, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.5,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.06, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.35;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            ease: 'power3.out',
            stagger: { each: 0.06, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    busyRef.current = true;
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) {
      busyRef.current = false;
      setOpen(false);
      return;
    }

    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 8 });
        }
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        if (numberEls.length) {
          gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        const socialTitle = panel.querySelector('.sm-socials-title');
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 20, opacity: 0 });
        busyRef.current = false;
        setOpen(false);
      }
    });
  }, [position]);

  // Animación del Icono de Hamburguesa: 3 barras a "X" y viceversa
  const animateIcon = useCallback(opening => {
    const lineTop = lineTopRef.current;
    const lineMid = lineMidRef.current;
    const lineBot = lineBotRef.current;
    if (!lineTop || !lineMid || !lineBot) return;

    if (opening) {
      gsap.to(lineTop, { y: 0, rotate: 45, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(lineMid, { opacity: 0, scaleX: 0, duration: 0.2, overwrite: 'auto' });
      gsap.to(lineBot, { y: 0, rotate: -45, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    } else {
      gsap.to(lineTop, { y: -4.5, rotate: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(lineMid, { opacity: 1, scaleX: 1, duration: 0.3, delay: 0.08, overwrite: 'auto' });
      gsap.to(lineBot, { y: 4.5, rotate: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    }
  }, []);

  const animateColor = useCallback(
    opening => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: opening ? 0.12 : 0,
          duration: 0.35,
          ease: 'power2.out'
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  const animateText = useCallback(opening => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    if (opening) {
      const cycles = 2;
      const seq = ['Menú'];
      let last = 'Menú';
      for (let i = 0; i < cycles; i++) {
        last = last === 'Menú' ? 'Cerrar' : 'Menú';
        seq.push(last);
      }
      if (last !== 'Cerrar') seq.push('Cerrar');
      seq.push('Cerrar');
      setTextLines(seq);

      gsap.set(inner, { yPercent: 0 });
      const lineCount = seq.length;
      const finalShift = ((lineCount - 1) / lineCount) * 100;
      textCycleAnimRef.current = gsap.to(inner, {
        yPercent: -finalShift,
        duration: 0.38,
        ease: 'power4.out'
      });
    } else {
      setTextLines(['Cerrar', 'Menú']);
      gsap.set(inner, { yPercent: 0 });
      textCycleAnimRef.current = gsap.to(inner, {
        yPercent: -50,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          setTextLines(['Menú', 'Cerrar']);
          gsap.set(inner, { yPercent: 0 });
        }
      });
    }
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    if (target) {
      setOpen(true);
      onMenuOpen?.();
      playOpen();
      animateIcon(true);
      animateColor(true);
      animateText(true);
    } else {
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = event => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  const handleItemClick = (e, item) => {
    closeMenu();
    if (onItemClick) {
      onItemClick(e, item);
    }
  };

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper' + (isFixed ? ' fixed-wrapper' : '')}
      style={accentColor ? { ['--sm-accent']: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors && colors.length ? colors.slice(0, 4) : ['#18181b', '#27272a'];
          return raw.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
        })()}
      </div>

      <header className="staggered-menu-header" aria-label="Navegación móvil">
        {/* Identidad de Marca MTS en el Header Móvil */}
        <div className="sm-header-brand">
          {logoUrl ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                if (onLogoClick) onLogoClick();
              }}
              className="sm-header-logo-btn"
              aria-label="Ir al inicio"
            >
              <img
                src={logoUrl}
                alt="Logo MTS"
                className="sm-header-logo-img"
                draggable={false}
              />
            </button>
          ) : null}
        </div>

        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((l, i) => (
                <span className="sm-toggle-line" key={i}>
                  {l}
                </span>
              ))}
            </span>
          </span>

          {/* Icono de Hamburguesa (3 barras que se transforman en X) */}
          <span className="sm-icon-burger" aria-hidden="true">
            <span ref={lineTopRef} className="sm-burger-bar" />
            <span ref={lineMidRef} className="sm-burger-bar" />
            <span ref={lineBotRef} className="sm-burger-bar" />
          </span>
        </button>
      </header>

      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
            {items && items.length ? (
              items.map((it, idx) => (
                <li className="sm-panel-itemWrap" key={it.label + idx}>
                  <a
                    className="sm-panel-item"
                    href={it.link}
                    aria-label={it.ariaLabel || it.label}
                    data-index={idx + 1}
                    onClick={(e) => handleItemClick(e, it)}
                  >
                    <span className="sm-panel-itemLabel">{it.label}</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">Sin opciones</span>
                </span>
              </li>
            )}
          </ul>

          {displaySocials && socialItems && socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Enlaces rápidos">
              <h3 className="sm-socials-title">Acciones</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((s, i) => (
                  <li key={s.label + i} className="sm-socials-item">
                    {s.onClick ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          closeMenu();
                          s.onClick(e);
                        }}
                        className="sm-socials-link text-left bg-transparent border-none p-0 cursor-pointer font-medium"
                      >
                        {s.label}
                      </button>
                    ) : (
                      <a
                        href={s.link}
                        target={s.isExternal ? '_blank' : undefined}
                        rel={s.isExternal ? 'noopener noreferrer' : undefined}
                        className="sm-socials-link"
                        onClick={(e) => handleItemClick(e, s)}
                      >
                        {s.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
