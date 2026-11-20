// CampusKit — Apple Store Smooth Motion System powered by GSAP 3 + ScrollTrigger + Flip
(function () {
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP) {
    if (typeof window.ScrollTrigger !== 'undefined') {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
    if (typeof window.Flip !== 'undefined') {
      window.gsap.registerPlugin(window.Flip);
    }
    window.gsap.defaults({
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }

  // ===========================================================================
  // 1. REUSABLE UI MOTION HELPERS EXPOSED TO app.js
  // ===========================================================================
  const Motion = {
    enabled: hasGSAP && !prefersReduced,

    openDrawer(backdropEl, panelEl, side = 'right') {
      if (!backdropEl) return;
      const panel = panelEl || backdropEl.querySelector('aside');
      backdropEl.classList.remove('hidden');
      if (!this.enabled || !panel) return;

      const fromX = side === 'left' ? -100 : 100;
      gsap.killTweensOf([backdropEl, panel]);
      gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: 'power2.out' });
      gsap.fromTo(
        panel,
        { xPercent: fromX },
        { xPercent: 0, duration: 0.48, ease: 'expo.out', clearProps: 'transform' }
      );
    },

    closeDrawer(backdropEl, panelEl, side = 'right') {
      if (!backdropEl || backdropEl.classList.contains('hidden')) return;
      const panel = panelEl || backdropEl.querySelector('aside');
      if (!this.enabled || !panel) {
        backdropEl.classList.add('hidden');
        return;
      }

      const toX = side === 'left' ? -100 : 100;
      gsap.killTweensOf([backdropEl, panel]);
      gsap.to(panel, { xPercent: toX, duration: 0.32, ease: 'power3.in' });
      gsap.to(backdropEl, {
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          backdropEl.classList.add('hidden');
          gsap.set([backdropEl, panel], { clearProps: 'opacity,transform' });
        }
      });
    },

    openModal(backdropEl, dialogSelector) {
      if (!backdropEl) return;
      const dialog = dialogSelector
        ? backdropEl.querySelector(dialogSelector)
        : backdropEl.firstElementChild;
      backdropEl.classList.remove('hidden');
      if (!this.enabled || !dialog) return;

      gsap.killTweensOf([backdropEl, dialog]);
      gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power2.out' });
      gsap.fromTo(
        dialog,
        { opacity: 0, y: 22, scale: 0.975 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.44,
          ease: 'expo.out',
          clearProps: 'transform,opacity'
        }
      );
    },

    closeModal(backdropEl, dialogSelector) {
      if (!backdropEl || backdropEl.classList.contains('hidden')) return;
      const dialog = dialogSelector
        ? backdropEl.querySelector(dialogSelector)
        : backdropEl.firstElementChild;
      if (!this.enabled || !dialog) {
        backdropEl.classList.add('hidden');
        return;
      }

      gsap.killTweensOf([backdropEl, dialog]);
      gsap.to(dialog, { opacity: 0, y: 12, scale: 0.98, duration: 0.2, ease: 'power2.in' });
      gsap.to(backdropEl, {
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => {
          backdropEl.classList.add('hidden');
          gsap.set([backdropEl, dialog], { clearProps: 'opacity,transform' });
        }
      });
    },

    popCartBadge(buttonEl) {
      if (!this.enabled) return;
      const badge = document.getElementById('cartBadgeCount');
      if (badge) {
        gsap.killTweensOf(badge);
        gsap.fromTo(
          badge,
          { scale: 1.45 },
          { scale: 1, duration: 0.45, ease: 'back.out(2.2)', clearProps: 'transform' }
        );
      }
      if (buttonEl) {
        gsap.fromTo(
          buttonEl,
          { scale: 0.96 },
          { scale: 1, duration: 0.26, ease: 'power3.out', clearProps: 'transform' }
        );
      }
    },

    captureFlip(elements) {
      if (!this.enabled || typeof window.Flip === 'undefined' || !elements || !elements.length) {
        return null;
      }
      return window.Flip.getState(elements);
    },

    playFlip(flipState, visibleEls, newlyShownEls) {
      if (!this.enabled) return;
      if (flipState && typeof window.Flip !== 'undefined' && visibleEls && visibleEls.length) {
        window.Flip.from(flipState, {
          targets: visibleEls,
          duration: 0.46,
          ease: 'expo.out',
          stagger: 0.02,
          scale: false,
          clearProps: 'transform'
        });
      }
      if (newlyShownEls && newlyShownEls.length) {
        gsap.fromTo(
          newlyShownEls,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.035,
            ease: 'power3.out',
            clearProps: 'transform,opacity'
          }
        );
      }
      if (typeof window.ScrollTrigger !== 'undefined') {
        window.ScrollTrigger.refresh();
      }
    },

    staggerReveal(elements, opts = {}) {
      if (!this.enabled || !elements || !elements.length) return;
      gsap.killTweensOf(elements);
      gsap.fromTo(
        elements,
        { opacity: 0, y: opts.y ?? 16 },
        {
          opacity: 1,
          y: 0,
          duration: opts.duration ?? 0.44,
          stagger: opts.stagger ?? 0.045,
          ease: opts.ease || 'expo.out',
          clearProps: 'transform,opacity'
        }
      );
    },

    toggleFlashcard(cardEl) {
      if (!cardEl) return;
      const inner = cardEl.querySelector('.ck-flashcard-inner');
      if (!inner) return;
      const willFlip = !inner.classList.contains('is-flipped');
      inner.classList.toggle('is-flipped', willFlip);
      if (!this.enabled) {
        inner.style.transform = willFlip ? 'rotateY(180deg)' : 'rotateY(0deg)';
        return;
      }
      gsap.killTweensOf(inner);
      gsap.to(inner, {
        rotateY: willFlip ? 180 : 0,
        duration: 0.58,
        ease: 'power3.inOut'
      });
    }
  };

  window.CampusKitMotion = Motion;

  // ===========================================================================
  // 2. APPLE STORE ENTRANCE & SCROLLTRIGGER CHOREOGRAPHY
  // ===========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    if (!Motion.enabled) return;

    const scheduled = new WeakSet();

    // A. Frosted Sticky Global Nav Subtle Elevation on Scroll
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader && typeof window.ScrollTrigger !== 'undefined') {
      window.ScrollTrigger.create({
        start: 'top -12',
        onUpdate: (self) => {
          mainHeader.classList.toggle('shadow-[0_1px_12px_rgba(0,0,0,0.06)]', self.scroll() > 12);
        }
      });
    }

    // B. Apple Split Header Entrance (h1 + Breadcrumb + Filter Pills)
    const topSection = document.querySelector('main > section:first-of-type');
    if (topSection) {
      const heroTargets = Array.from(
        topSection.querySelectorAll(
          'nav[aria-label="Breadcrumb"], h1, h1 + p, #lookbookFilterBar > button, #trackingTabBar > button, #voucherFilterBar > button'
        )
      );
      if (heroTargets.length) {
        heroTargets.forEach((el) => scheduled.add(el));
        gsap.fromTo(
          heroTargets,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.68,
            stagger: 0.045,
            ease: 'expo.out',
            clearProps: 'transform,opacity'
          }
        );
      }
    }

    // C. ScrollTrigger Smooth Deceleration Batch Reveals
    if (typeof window.ScrollTrigger !== 'undefined') {
      const batchReveal = (selector, staggerVal = 0.055, yVal = 22, easeName = 'expo.out') => {
        const viewportFold = (window.innerHeight || 900) * 0.92;
        const targets = Array.from(document.querySelectorAll(selector)).filter((el) => {
          if (el.classList.contains('hidden') || scheduled.has(el)) return false;
          // L08: Never hide elements already visible in the initial viewport (above-the-fold)
          const rect = el.getBoundingClientRect();
          if (rect.top < viewportFold) return false;
          return true;
        });
        if (!targets.length) return;
        targets.forEach((el) => scheduled.add(el));
        gsap.set(targets, { opacity: 0, y: yVal });
        window.ScrollTrigger.batch(targets, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: staggerVal,
              ease: easeName,
              clearProps: 'transform,opacity'
            });
          }
        });
      };

      // Apple Shelf Titles & Residual Headlines
      batchReveal('h1, .as-shelf-title', 0.05, 16, 'expo.out');

      // Apple Hero Showcase Cards & Category Tiles
      batchReveal('.as-card-hero', 0.065, 24, 'expo.out');
      batchReveal('#categoryGrid > *:not(.hidden)', 0.04, 18, 'power3.out');

      // Product Cards (Horizontal Shelves + /san-pham/ Grid)
      batchReveal('.product-card:not(.hidden)', 0.055, 24, 'expo.out');

      // /ma-giam-gia/ Education Verification & Voucher Cards
      batchReveal('#eduVerifyForm', 0.05, 20, 'power3.out');
      batchReveal('.voucher-card:not(.hidden)', 0.065, 22, 'expo.out');

      // /cong-cu/ Study Hub Workspaces
      batchReveal('#tool-exam, #tool-deadline', 0.09, 24, 'expo.out');

      // /goc-hoc-tap/ Lookbook Showcases & Frosted Hotspot Pins
      batchReveal('.lookbook-card:not(.hidden)', 0.09, 26, 'expo.out');
      const pins = document.querySelectorAll('[data-hotspot-pin]');
      if (pins.length) {
        gsap.fromTo(
          pins,
          { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 },
          {
            xPercent: -50,
            yPercent: -50,
            scale: 1,
            opacity: 1,
            duration: 0.52,
            stagger: 0.055,
            delay: 0.2,
            ease: 'expo.out',
            clearProps: 'transform,opacity'
          }
        );
      }

      // Apple Value Cards, Principles, Service Pickup Stations
      batchReveal('.ck-elevated-card', 0.06, 20, 'power3.out');
    }
  });
})();
