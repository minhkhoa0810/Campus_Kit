// CampusKit — Apple Store Vietnam Design System Unified Controller (static/js/app.js)
document.addEventListener('DOMContentLoaded', () => {
  // ===========================================================================
  // 1. GLOBAL DATA & PERSISTENT STATE
  // ===========================================================================
  const rawGlobal = document.getElementById('campuskit-global-data');
  let GLOBAL = { baseURL: '/', products: [], vouchers: [], ordersData: { orders: [], warranties: [] } };
  if (rawGlobal) {
    try {
      GLOBAL = JSON.parse(rawGlobal.textContent);
    } catch (_) {}
  }

  function resolveAsset(path) {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    const base = (GLOBAL.baseURL || '/').replace(/\/+$/, '');
    const clean = String(path).replace(/^\/+/, '');
    return `${base}/${clean}`;
  }

  const CATALOG = (GLOBAL.products || []).map((p, idx) => ({
    ...p,
    index: idx,
    price: Number(p.price) || 0,
    originalPrice: Number(p.originalPrice) || 0,
    discountPercent: Number(p.discountPercent) || 0,
    resolvedImage: resolveAsset(p.image)
  }));

  const VOUCHERS = GLOBAL.vouchers || [];
  const DEMO_ORDERS = (GLOBAL.ordersData && GLOBAL.ordersData.orders) || [];
  const DEMO_WARRANTIES = (GLOBAL.ordersData && GLOBAL.ordersData.warranties) || [];

  const STORAGE_KEY = 'campuskit_state_v1';
  const defaultPersisted = {
    cart: [
      { productId: 'prod-1', qty: 1 },
      { productId: 'prod-3', qty: 1 }
    ],
    appliedVoucher: null,
    eduUser: null,
    placedOrders: [],
    pomoSessions: 2,
    pomoTasks: [
      { id: 't1', text: 'Ôn tập chương 3 & làm 15 câu trắc nghiệm', done: true },
      { id: 't2', text: 'Tóm tắt công thức trọng tâm ra Flashcard', done: false }
    ]
  };

  let persisted = { ...defaultPersisted };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      persisted = {
        ...defaultPersisted,
        ...saved,
        cart: Array.isArray(saved.cart) ? saved.cart : defaultPersisted.cart,
        placedOrders: Array.isArray(saved.placedOrders) ? saved.placedOrders : [],
        pomoTasks: Array.isArray(saved.pomoTasks) ? saved.pomoTasks : defaultPersisted.pomoTasks
      };
    }
  } catch (_) {}

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (_) {}
  }

  const Motion = window.CampusKitMotion || {
    enabled: false,
    openDrawer: (el) => el?.classList.remove('hidden'),
    closeDrawer: (el) => el?.classList.add('hidden'),
    openModal: (el) => el?.classList.remove('hidden'),
    closeModal: (el) => el?.classList.add('hidden'),
    popCartBadge: () => {},
    captureFlip: () => null,
    playFlip: () => {},
    staggerReveal: () => {},
    toggleFlashcard: (cardEl) => {
      const inner = cardEl?.querySelector('.ck-flashcard-inner');
      if (!inner) return;
      const flipped = inner.classList.toggle('is-flipped');
      inner.style.transform = flipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
    }
  };

  let uiState = {
    activeCategory: 'all',
    activeSubCategory: 'all',
    priceRange: 'all',
    priceMin: 0,
    priceMax: 3000000,
    priceMaxLimit: 3000000,
    openAccordionCat: null,
    searchQuery: '',
    sortBy: 'featured',
    showAllCategories: false
  };

  function formatVND(amount) {
    return Math.max(0, Math.round(Number(amount) || 0)).toLocaleString('vi-VN') + '₫';
  }

  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Toast Notification
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
  }

  // Sync Logged-in / Verified Student Label in Header
  function syncHeaderUser() {
    const label = document.getElementById('loginBtnLabel');
    if (label && persisted.eduUser && persisted.eduUser.email) {
      const shortId = persisted.eduUser.email.split('@')[0].slice(0, 9).toUpperCase();
      label.textContent = `SV: ${shortId}`;
    }
  }
  syncHeaderUser();

  // ===========================================================================
  // 1B. APPLE SEARCH CURTAIN & HORIZONTAL SHELF PADDLES
  // ===========================================================================
  const searchCurtain = document.getElementById('appleSearchCurtain');
  const openSearchCurtainBtn = document.getElementById('openSearchCurtainBtn');
  const closeSearchCurtainBtn = document.getElementById('closeSearchCurtainBtn');
  const desktopInput = document.getElementById('desktopSearchInput');
  const clearDesktopBtn = document.getElementById('clearDesktopSearchBtn');

  function openSearchCurtain() {
    if (!searchCurtain) {
      desktopInput?.focus();
      return;
    }
    searchCurtain.classList.remove('hidden');
    openSearchCurtainBtn?.setAttribute('aria-expanded', 'true');
    if (window.gsap && Motion.enabled) {
      window.gsap.killTweensOf(searchCurtain);
      window.gsap.fromTo(
        searchCurtain,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
    }
    desktopInput?.focus();
  }

  function closeSearchCurtain(instant = false) {
    if (!searchCurtain || searchCurtain.classList.contains('hidden')) return;
    openSearchCurtainBtn?.setAttribute('aria-expanded', 'false');
    if (!instant && window.gsap && Motion.enabled) {
      window.gsap.killTweensOf(searchCurtain);
      window.gsap.to(searchCurtain, {
        y: -8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          searchCurtain.classList.add('hidden');
          window.gsap.set(searchCurtain, { clearProps: 'transform,opacity' });
        }
      });
    } else {
      if (window.gsap) window.gsap.killTweensOf(searchCurtain);
      searchCurtain.classList.add('hidden');
    }
  }

  openSearchCurtainBtn?.addEventListener('click', () => {
    if (!searchCurtain || searchCurtain.classList.contains('hidden')) {
      openSearchCurtain();
    } else {
      closeSearchCurtain();
    }
  });

  closeSearchCurtainBtn?.addEventListener('click', () => closeSearchCurtain());

  searchCurtain?.addEventListener('click', (e) => {
    if (e.target === searchCurtain && searchCurtain.firstElementChild) {
      closeSearchCurtain();
    }
  });

  // Apple Store Horizontal Shelf Paddles ([data-shelf-prev], [data-shelf-next], [data-shelf-track])
  function initAppleShelves() {
    const tracks = document.querySelectorAll('[data-shelf-track]');
    if (!tracks.length) return;

    const syncShelfButtons = (track) => {
      const id = track.dataset.shelfTrack;
      if (!id) return;
      const atStart = track.scrollLeft <= 4;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      document.querySelectorAll(`[data-shelf-prev="${id}"]`).forEach((btn) => {
        btn.disabled = atStart;
      });
      document.querySelectorAll(`[data-shelf-next="${id}"]`).forEach((btn) => {
        btn.disabled = atEnd;
      });
    };

    const syncAllShelves = () => {
      tracks.forEach(syncShelfButtons);
    };

    tracks.forEach((track) => {
      const id = track.dataset.shelfTrack;
      if (!id) return;

      document.querySelectorAll(`[data-shelf-prev="${id}"]`).forEach((prevBtn) => {
        prevBtn.addEventListener('click', () => {
          track.scrollBy({ left: -420, behavior: 'smooth' });
        });
      });

      document.querySelectorAll(`[data-shelf-next="${id}"]`).forEach((nextBtn) => {
        nextBtn.addEventListener('click', () => {
          track.scrollBy({ left: 420, behavior: 'smooth' });
        });
      });

      track.addEventListener('scroll', () => syncShelfButtons(track), { passive: true });
    });

    window.addEventListener('resize', syncAllShelves, { passive: true });
    syncAllShelves();
    requestAnimationFrame(syncAllShelves);
  }
  initAppleShelves();

  // ===========================================================================
  // 2. VOUCHER & CART ENGINE (CROSS-PAGE)
  // ===========================================================================
  function calculateVoucherDiscount(subtotal, code) {
    if (!code || subtotal <= 0) return { valid: false, discount: 0, voucher: null, reason: '' };
    const cleanCode = code.trim().toUpperCase();
    const v = VOUCHERS.find((item) => item.code.toUpperCase() === cleanCode);
    if (!v) return { valid: false, discount: 0, voucher: null, reason: 'Mã giảm giá không tồn tại.' };
    if (v.eduOnly && !(persisted.eduUser && persisted.eduUser.verified)) {
      return {
        valid: false,
        discount: 0,
        voucher: v,
        reason: 'Mã EDU15VIP yêu cầu xác thực email sinh viên (.edu.vn).'
      };
    }
    if (subtotal < (v.minOrder || 0)) {
      return {
        valid: false,
        discount: 0,
        voucher: v,
        reason: `Mã ${v.code} áp dụng cho đơn từ ${formatVND(v.minOrder)}.`
      };
    }
    let discount = v.type === 'percent' ? Math.round((subtotal * v.value) / 100) : Number(v.value);
    if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
    if (discount > subtotal) discount = subtotal;
    return { valid: true, discount, voucher: v, reason: '' };
  }

  function renderCart() {
    const badge = document.getElementById('cartBadgeCount');
    const container = document.getElementById('cartItemsContainer');
    const subtotalEl = document.getElementById('cartSubtotal');
    const finalTotalEl = document.getElementById('cartFinalTotal');
    const discountRow = document.getElementById('cartDiscountRow');
    const discountAmountEl = document.getElementById('cartDiscountAmount');
    const appliedBar = document.getElementById('cartAppliedVoucherBar');
    const appliedText = document.getElementById('cartAppliedVoucherText');
    const freeShipHint = document.getElementById('cartFreeShipHint');

    const totalQty = persisted.cart.reduce((sum, item) => sum + item.qty, 0);
    if (badge) badge.textContent = totalQty;
    if (!container || !subtotalEl) return;

    if (persisted.cart.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center space-y-3">
          <p class="text-base font-semibold tracking-tight text-[#1d1d1f]">Giỏ hàng của bạn đang trống.</p>
          <p class="text-xs text-[#6e6e73]">Khám phá dụng cụ học tập tối giản cho mùa thi ngay hôm nay.</p>
          <a href="${resolveAsset('san-pham/')}" class="as-pill-blue inline-flex items-center justify-center rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium px-5 py-2.5 shadow-sm transition-all">
            Khám phá sản phẩm
          </a>
        </div>
      `;
      subtotalEl.textContent = '0₫';
      if (finalTotalEl) finalTotalEl.textContent = '0₫';
      discountRow?.classList.add('hidden');
      appliedBar?.classList.add('hidden');
      if (freeShipHint) freeShipHint.textContent = 'Miễn phí giao KTX 2H cho đơn từ 199.000₫';
      return;
    }

    let subtotal = 0;
    container.innerHTML = persisted.cart
      .map((item) => {
        const product = CATALOG.find((p) => p.id === item.productId);
        if (!product) return '';
        subtotal += product.price * item.qty;
        return `
          <div class="py-4 flex gap-3.5 items-start">
            <img src="${escapeHTML(product.resolvedImage)}" alt="${escapeHTML(product.name)}" class="w-16 h-16 rounded-2xl bg-[#f5f5f7] object-cover border border-[#d2d2d7]/50 shrink-0" />
            <div class="flex-1 min-w-0">
              <h4 class="text-[13px] font-semibold text-[#1d1d1f] leading-snug">${escapeHTML(product.name)}</h4>
              <p class="text-xs font-semibold text-[#6e6e73] mt-0.5">${formatVND(product.price)}</p>
              <div class="flex items-center justify-between mt-2.5">
                <div class="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] p-0.5">
                  <button type="button" data-cart-dec="${escapeHTML(product.id)}" class="w-6 h-6 rounded-full hover:bg-white text-xs font-medium text-[#1d1d1f] flex items-center justify-center transition-colors">−</button>
                  <span class="px-2.5 text-xs font-semibold text-[#1d1d1f] tabular-nums">${item.qty}</span>
                  <button type="button" data-cart-inc="${escapeHTML(product.id)}" class="w-6 h-6 rounded-full hover:bg-white text-xs font-medium text-[#1d1d1f] flex items-center justify-center transition-colors">+</button>
                </div>
                <button type="button" data-cart-remove="${escapeHTML(product.id)}" class="text-xs text-[#0066cc] hover:underline">Xóa</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    subtotalEl.textContent = formatVND(subtotal);

    if (freeShipHint) {
      if (subtotal >= 199000) {
        freeShipHint.innerHTML = '<strong class="text-[#0071e3] font-medium">Đủ điều kiện miễn phí giao nhanh KTX 2H.</strong>';
      } else {
        freeShipHint.textContent = `Mua thêm ${formatVND(199000 - subtotal)} để được miễn phí giao nhanh KTX 2H`;
      }
    }

    let discount = 0;
    if (persisted.appliedVoucher) {
      const check = calculateVoucherDiscount(subtotal, persisted.appliedVoucher);
      if (check.valid) {
        discount = check.discount;
        discountRow?.classList.remove('hidden');
        if (discountAmountEl) discountAmountEl.textContent = `-${formatVND(discount)}`;
        appliedBar?.classList.remove('hidden');
        if (appliedText) appliedText.textContent = `Đã áp mã ${check.voucher.code} (-${formatVND(discount)})`;
      } else {
        discountRow?.classList.add('hidden');
        appliedBar?.classList.remove('hidden');
        if (appliedText) appliedText.textContent = `${persisted.appliedVoucher}: ${check.reason}`;
      }
    } else {
      discountRow?.classList.add('hidden');
      appliedBar?.classList.add('hidden');
    }

    if (finalTotalEl) finalTotalEl.textContent = formatVND(subtotal - discount);
  }

  function addToCart(productId, qty = 1, silent = false, triggerEl = null) {
    const prod = CATALOG.find((p) => p.id === productId);
    if (!prod) return;
    const existing = persisted.cart.find((i) => i.productId === productId);
    if (existing) existing.qty += qty;
    else persisted.cart.push({ productId, qty });
    saveState();
    renderCart();
    Motion.popCartBadge(triggerEl);
    if (!silent) showToast(`Đã thêm "${prod.name}" vào giỏ hàng!`);
  }

  function applyVoucherCode(code, openDrawer = false) {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return;
    const v = VOUCHERS.find((x) => x.code.toUpperCase() === clean);
    if (!v) {
      showToast(`Mã "${clean}" không hợp lệ hoặc đã hết hạn.`);
      return;
    }
    if (v.eduOnly && !(persisted.eduUser && persisted.eduUser.verified)) {
      showToast('Vui lòng xác thực email .edu.vn để sử dụng mã EDU15VIP!');
      document.getElementById('eduEmailInput')?.focus();
      return;
    }
    persisted.appliedVoucher = v.code;
    saveState();
    renderCart();
    const voucherInput = document.getElementById('cartVoucherInput');
    if (voucherInput) voucherInput.value = v.code;
    showToast(`Đã áp dụng mã giảm giá ${v.code} vào giỏ hàng!`);
    if (openDrawer) {
      Motion.openDrawer(document.getElementById('cartDrawerBackdrop'), null, 'right');
    }
  }

  // ===========================================================================
  // 3. PRODUCT QUICK VIEW & INFO MODAL (APPLE STORE STYLING)
  // ===========================================================================
  const quickViewBackdrop = document.getElementById('quickViewBackdrop');
  const quickViewContent = document.getElementById('quickViewContent');

  function openQuickView(productId) {
    const p = CATALOG.find((item) => item.id === productId);
    if (!p || !quickViewBackdrop || !quickViewContent) return;
    const eduPrice = Math.round(p.price * 0.85);
    const highlightsHtml = (p.highlights || [])
      .map(
        (h) =>
          `<li class="flex items-start gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-[#0071e3] mt-1.5 shrink-0"></span><span>${escapeHTML(h)}</span></li>`
      )
      .join('');

    quickViewContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12">
        <div class="md:col-span-6 bg-[#f5f5f7] aspect-square overflow-hidden relative flex items-center justify-center p-6 sm:p-8">
          <img src="${escapeHTML(p.resolvedImage)}" alt="${escapeHTML(p.name)}" class="w-full h-full object-cover object-center rounded-2xl" />
          <div class="absolute top-4 left-4 flex flex-wrap gap-1.5">
            <span class="rounded-full bg-white/90 backdrop-blur-md text-[#1d1d1f] text-[11px] font-semibold px-3 py-1 shadow-sm">${escapeHTML(p.badge)}</span>
            <span class="rounded-full bg-[#fff3eb] text-[#b64400] text-[11px] font-semibold px-2.5 py-1">-${p.discountPercent}%</span>
          </div>
        </div>
        <div class="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <p class="text-xs font-semibold tracking-tight text-[#b64400] mb-1.5">
              ${escapeHTML(p.category)} • ${escapeHTML(p.subCategory)}
            </p>
            <h3 class="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1d1d1f] leading-snug mb-3">${escapeHTML(p.name)}</h3>
            <div class="flex flex-wrap items-baseline gap-2.5 pb-4 mb-4 border-b border-[#d2d2d7]/60">
              <span class="text-2xl font-semibold tracking-tight text-[#1d1d1f]">${formatVND(p.price)}</span>
              <span class="text-sm text-[#86868b] line-through">${formatVND(p.originalPrice)}</span>
              <span class="rounded-full bg-[#e8f2ff] text-[#0071e3] text-[11px] font-medium px-3 py-0.5">
                Giá SV .edu.vn: ~${formatVND(eduPrice)}
              </span>
            </div>

            <p class="text-xs sm:text-[13px] font-medium text-[#1d1d1f] mb-3">${escapeHTML(p.specs)}</p>
            ${
              highlightsHtml
                ? `<ul class="space-y-2 text-xs sm:text-[13px] text-[#6e6e73] leading-relaxed mb-5">${highlightsHtml}</ul>`
                : ''
            }

            <div class="rounded-2xl bg-[#f5f5f7] p-3.5 text-xs text-[#6e6e73] space-y-1.5 mb-6">
              <p><strong class="font-medium text-[#1d1d1f]">Tình trạng:</strong> <span class="text-[#0071e3] font-medium">${escapeHTML(p.stock || 'Còn hàng')}</span></p>
              <p><strong class="font-medium text-[#1d1d1f]">Bảo hành:</strong> ${escapeHTML(p.warranty || '1 đổi 1 trong 30 ngày')}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] p-1">
              <button type="button" id="qvDecBtn" class="w-8 h-8 rounded-full hover:bg-white text-sm font-medium text-[#1d1d1f] flex items-center justify-center transition-colors">−</button>
              <span id="qvQtyVal" class="px-3 text-xs font-semibold text-[#1d1d1f] tabular-nums">1</span>
              <button type="button" id="qvIncBtn" class="w-8 h-8 rounded-full hover:bg-white text-sm font-medium text-[#1d1d1f] flex items-center justify-center transition-colors">+</button>
            </div>
            <button
              type="button"
              id="qvAddCartBtn"
              class="as-pill-blue flex-1 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white text-sm font-medium py-3 px-6 shadow-sm transition-all"
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    `;

    let qty = 1;
    const qtyEl = document.getElementById('qvQtyVal');
    document.getElementById('qvDecBtn')?.addEventListener('click', () => {
      if (qty > 1) {
        qty -= 1;
        qtyEl.textContent = String(qty);
      }
    });
    document.getElementById('qvIncBtn')?.addEventListener('click', () => {
      qty += 1;
      qtyEl.textContent = String(qty);
    });
    document.getElementById('qvAddCartBtn')?.addEventListener('click', (ev) => {
      addToCart(p.id, qty, false, ev.currentTarget);
      Motion.closeModal(quickViewBackdrop);
    });

    Motion.openModal(quickViewBackdrop);
  }

  document.getElementById('closeQuickViewBtn')?.addEventListener('click', () => Motion.closeModal(quickViewBackdrop));
  quickViewBackdrop?.addEventListener('click', (e) => {
    if (e.target === quickViewBackdrop) Motion.closeModal(quickViewBackdrop);
  });

  // Info Modal (Policies & Order Success)
  const infoBackdrop = document.getElementById('infoModalBackdrop');
  const infoContent = document.getElementById('infoModalContent');
  const POLICY_CONTENT = {
    'student-policy': {
      tag: 'Đặc quyền Sinh viên',
      title: 'Chính sách ưu đãi giáo dục (.edu.vn)',
      html: `
        <div class="space-y-3 text-sm text-[#6e6e73] leading-relaxed">
          <p>• Mọi sinh viên sở hữu email trường đại học / cao đẳng (<strong class="text-[#1d1d1f] font-medium">@*.edu.vn</strong>) được kích hoạt mã <strong class="text-[#0071e3] font-semibold">EDU15VIP</strong> giảm 15% tối đa 150.000₫ không yêu cầu giá trị đơn tối thiểu.</p>
          <p>• Tân sinh viên chưa được cấp email trường có thể dùng mã <strong class="text-[#1d1d1f] font-semibold">SINHVIEN11</strong> giảm 15% cho đơn từ 199.000₫ hoặc xuất trình thẻ sinh viên khi nhận hàng tại sảnh KTX.</p>
          <div class="pt-2">
            <a href="${resolveAsset('ma-giam-gia/')}" class="as-pill-blue inline-flex items-center justify-center rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium px-5 py-2.5 text-xs shadow-sm transition-all">
              Đến trang xác thực .edu.vn
            </a>
          </div>
        </div>
      `
    },
    'shipping-policy': {
      tag: 'Giao nhanh KTX 2H',
      title: 'Chính sách giao nhận & Đổi mới 30 ngày',
      html: `
        <div class="space-y-3 text-sm text-[#6e6e73] leading-relaxed">
          <p>• <strong class="text-[#1d1d1f] font-semibold">Giao nhanh 2 giờ:</strong> Áp dụng cho KTX Khu A, KTX Khu B ĐHQG TP.HCM, khu trọ Tân Lập và các quận nội thành từ 08:00 – 21:00 mỗi ngày. Miễn phí vận chuyển cho đơn từ 199.000₫.</p>
          <p>• <strong class="text-[#1d1d1f] font-semibold">Bảo hành 1 đổi 1 tận sảnh:</strong> Trong 30 ngày đầu, nếu bàn phím cơ, chuột không dây, đèn LED hay đồng hồ Pomodoro có lỗi nhà sản xuất, điều phối viên mang máy mới tới đổi trực tiếp miễn phí.</p>
        </div>
      `
    },
    'contact-support': {
      tag: 'Hợp tác CLB Sinh viên',
      title: 'Đồng hành cùng CLB & Đại sứ CampusKit',
      html: `
        <div class="space-y-3 text-sm text-[#6e6e73] leading-relaxed">
          <p>• CampusKit tài trợ học phẩm, giải thưởng cuộc thi học thuật, Hackathon và chào đón Tân sinh viên cho các CLB / Đội / Nhóm thuộc ĐHQG và các trường đại học trên toàn quốc.</p>
          <p>• Liên hệ trực tiếp phòng Đối ngoại Sinh viên qua email <strong class="text-[#0071e3] font-medium">hello@campuskit.vn</strong> hoặc Hotline <strong class="text-[#1d1d1f] font-semibold">1900 6868</strong>.</p>
        </div>
      `
    }
  };

  function openInfoModal(tag, title, bodyHtml) {
    if (!infoBackdrop || !infoContent) return;
    infoContent.innerHTML = `
      <span class="inline-block text-xs font-semibold tracking-tight text-[#b64400]">${escapeHTML(tag)}</span>
      <h3 class="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#1d1d1f] mt-1.5 mb-4 pb-3 border-b border-[#d2d2d7]/60">${escapeHTML(title)}</h3>
      ${bodyHtml}
    `;
    Motion.openModal(infoBackdrop);
  }

  document.getElementById('closeInfoModalBtn')?.addEventListener('click', () => Motion.closeModal(infoBackdrop));
  infoBackdrop?.addEventListener('click', (e) => {
    if (e.target === infoBackdrop) Motion.closeModal(infoBackdrop);
  });

  // ===========================================================================
  // 4. PRODUCT CATALOG FILTERING (HOMEPAGE + /SAN-PHAM/)
  // ===========================================================================
  const productGrid = document.getElementById('productGrid');
  const catalogSection = document.getElementById('featured-products');
  const isHomeCatalog = catalogSection?.dataset.homeCatalog === 'true';
  const productCards = Array.from(document.querySelectorAll('#productGrid .product-card')).map((card) => ({
    id: card.dataset.id,
    name: card.dataset.name || '',
    category: card.dataset.category || '',
    extraCat: card.dataset.extraCat || '',
    subCategory: card.dataset.subCategory || '',
    specs: card.dataset.specs || '',
    price: Number(card.dataset.price) || 0,
    discount: Number(card.dataset.discount) || 0,
    featured: card.dataset.featured === 'true',
    index: Number(card.dataset.index) || 0,
    el: card
  }));

  function updateProductsView(animate = true) {
    if (!productGrid) return;
    const emptyState = document.getElementById('emptyProductState');
    const activeBadge = document.getElementById('activeFilterBadge');
    const resetBtn = document.getElementById('resetFilterBtn');
    const countEl = document.getElementById('catalogResultCount');

    const prevVisibleSet = new Set(
      productCards.filter((p) => !p.el.classList.contains('hidden')).map((p) => p.el)
    );
    const flipState = animate ? Motion.captureFlip(Array.from(prevVisibleSet)) : null;

    const q = uiState.searchQuery.trim().toLowerCase();
    const hasCustomPrice = uiState.priceMin > 0 || uiState.priceMax < uiState.priceMaxLimit;
    const hasAnyFilter =
      uiState.activeCategory !== 'all' ||
      uiState.activeSubCategory !== 'all' ||
      uiState.priceRange !== 'all' ||
      hasCustomPrice ||
      q !== '';

    let visible = productCards.filter((p) => {
      if (isHomeCatalog && !hasAnyFilter && !p.featured) return false;

      const matchCat =
        uiState.activeCategory === 'all' ||
        p.category === uiState.activeCategory ||
        p.extraCat === uiState.activeCategory;

      const matchSub =
        uiState.activeSubCategory === 'all' ||
        p.subCategory.toLowerCase() === uiState.activeSubCategory.toLowerCase();

      let matchPrice = true;
      if (hasCustomPrice) {
        matchPrice = p.price >= uiState.priceMin && p.price <= uiState.priceMax;
      } else if (uiState.priceRange === 'under-150') {
        matchPrice = p.price < 150000;
      } else if (uiState.priceRange === '150-350') {
        matchPrice = p.price >= 150000 && p.price <= 350000;
      } else if (uiState.priceRange === '350-600') {
        matchPrice = p.price >= 350000 && p.price <= 600000;
      } else if (uiState.priceRange === 'over-600') {
        matchPrice = p.price > 600000;
      } else if (uiState.priceRange === 'over-350') {
        matchPrice = p.price > 350000;
      }

      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q);

      return matchCat && matchSub && matchPrice && matchQuery;
    });

    if (uiState.sortBy === 'price-asc') visible.sort((a, b) => a.price - b.price);
    else if (uiState.sortBy === 'price-desc') visible.sort((a, b) => b.price - a.price);
    else if (uiState.sortBy === 'discount-desc') visible.sort((a, b) => b.discount - a.discount);
    else visible.sort((a, b) => a.index - b.index);

    productCards.forEach((p) => p.el.classList.add('hidden'));
    const visibleEls = [];
    const newlyShownEls = [];
    visible.forEach((p) => {
      p.el.classList.remove('hidden');
      productGrid.appendChild(p.el);
      if (prevVisibleSet.has(p.el)) visibleEls.push(p.el);
      else newlyShownEls.push(p.el);
    });

    if (animate) {
      Motion.playFlip(flipState, visibleEls, newlyShownEls);
    }

    emptyState?.classList.toggle('hidden', visible.length > 0);
    if (countEl) countEl.textContent = `Hiển thị ${visible.length} / ${productCards.length} sản phẩm`;

    activeBadge?.classList.toggle('hidden', !hasAnyFilter);
    resetBtn?.classList.toggle('hidden', !hasAnyFilter);
    if (hasAnyFilter && activeBadge) {
      const parts = [];
      if (uiState.activeCategory !== 'all') {
        const activeCatBtn = document.querySelector(`#catalogCategoryList [data-catalog-cat="${CSS.escape(uiState.activeCategory)}"]`);
        parts.push(activeCatBtn?.dataset.catLabel || uiState.activeCategory);
      }
      if (uiState.activeSubCategory !== 'all') parts.push(uiState.activeSubCategory);
      if (hasCustomPrice) {
        if (uiState.priceMin === 0 && uiState.priceMax === 150000) parts.push('Dưới 150K');
        else if (uiState.priceMin === 150000 && uiState.priceMax === 350000) parts.push('150K–350K');
        else if (uiState.priceMin === 350000 && uiState.priceMax === 600000) parts.push('350K–600K');
        else if (uiState.priceMin === 600000 && uiState.priceMax === uiState.priceMaxLimit) parts.push('Trên 600K');
        else parts.push(`${Math.round(uiState.priceMin / 1000)}K–${Math.round(uiState.priceMax / 1000)}K`);
      } else {
        if (uiState.priceRange === 'under-150') parts.push('Dưới 150K');
        if (uiState.priceRange === '150-350') parts.push('150K–350K');
        if (uiState.priceRange === '350-600') parts.push('350K–600K');
        if (uiState.priceRange === 'over-600') parts.push('Trên 600K');
        if (uiState.priceRange === 'over-350') parts.push('Trên 350K');
      }
      if (q) parts.push(`"${uiState.searchQuery.trim()}"`);
      activeBadge.textContent = 'Đang lọc: ' + parts.join(' • ');
    }

    // Sync Header / Search Curtain Category Pills
    document.querySelectorAll('[data-nav-cat]').forEach((btn) => {
      const isActive = btn.dataset.navCat === uiState.activeCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Sync Sidebar Category Accordion Rows on /san-pham/
    document.querySelectorAll('#catalogCategoryList [data-catalog-cat]').forEach((btn) => {
      const catId = btn.dataset.catalogCat;
      const isSelected = catId === uiState.activeCategory;
      const isExpanded = catId !== 'all' && uiState.openAccordionCat === catId;
      const countEl = btn.querySelector('[data-cat-count]');
      const chevronEl = btn.querySelector('[data-accordion-chevron]');

      if (isSelected && uiState.activeSubCategory === 'all') {
        btn.className = 'w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-xl bg-[#1d1d1f] text-white font-semibold transition-all group';
        if (countEl) countEl.className = 'text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-white/90 tabular-nums shrink-0';
        if (chevronEl) chevronEl.className = `w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`;
      } else if (isSelected && uiState.activeSubCategory !== 'all') {
        btn.className = 'w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-xl bg-[#f5f5f7] text-[#1d1d1f] font-semibold transition-all group';
        if (countEl) countEl.className = 'text-[11px] text-[#1d1d1f] font-medium tabular-nums shrink-0';
        if (chevronEl) chevronEl.className = `w-3.5 h-3.5 text-[#1d1d1f] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`;
      } else {
        btn.className = 'w-full flex items-center justify-between px-3 py-2 text-[13px] text-left rounded-xl text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium transition-all group';
        if (countEl) countEl.className = 'text-[11px] text-[#86868b] group-hover:text-[#1d1d1f] tabular-nums shrink-0';
        if (chevronEl) chevronEl.className = `w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`;
      }
      if (catId !== 'all') {
        btn.setAttribute('aria-expanded', String(isExpanded));
      }
    });

    // Sync Accordion Panels Visibility
    document.querySelectorAll('#catalogCategoryList [data-accordion-panel]').forEach((panel) => {
      const isExpanded = panel.dataset.accordionPanel === uiState.openAccordionCat;
      panel.classList.toggle('hidden', !isExpanded);
    });

    // Sync Inline Sub-category Buttons inside Accordions
    document.querySelectorAll('#catalogCategoryList [data-catalog-sub]').forEach((btn) => {
      const isActive =
        btn.dataset.catalogSub === uiState.activeSubCategory &&
        (uiState.activeCategory === 'all' || btn.dataset.parentCat === uiState.activeCategory);
      const dot = btn.querySelector('[data-sub-dot]');
      btn.className = isActive
        ? 'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12.5px] text-left rounded-lg bg-[#f5f5f7] text-[#1d1d1f] font-semibold transition-colors'
        : 'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12.5px] text-left rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors';
      if (dot) {
        dot.className = isActive
          ? 'w-1.5 h-1.5 rounded-full bg-[#0071e3] shrink-0 transition-colors'
          : 'w-1.5 h-1.5 rounded-full bg-transparent shrink-0 transition-colors';
      }
    });
  }

  // Read URL Params on Load (e.g. /san-pham/?cat=Workspace&q=mica)
  const params = new URLSearchParams(window.location.search);

  if (params.get('cat')) {
    uiState.activeCategory = params.get('cat');
    if (uiState.activeCategory !== 'all') uiState.openAccordionCat = uiState.activeCategory;
  }
  if (params.get('sub')) uiState.activeSubCategory = params.get('sub');
  if (params.get('price')) uiState.priceRange = params.get('price');
  if (params.get('q')) {
    uiState.searchQuery = params.get('q');
    if (desktopInput) desktopInput.value = uiState.searchQuery;
    clearDesktopBtn?.classList.remove('hidden');
  }
  const hasInitialUrlFilter = Boolean(
    params.get('cat') || params.get('sub') || params.get('price') || params.get('q')
  );
  if (productGrid) updateProductsView(hasInitialUrlFilter);

  function resetAllProductFilters() {
    uiState.activeCategory = 'all';
    uiState.activeSubCategory = 'all';
    uiState.priceRange = 'all';
    uiState.priceMin = 0;
    uiState.priceMax = uiState.priceMaxLimit;
    uiState.openAccordionCat = null;
    uiState.searchQuery = '';
    if (desktopInput) desktopInput.value = '';
    clearDesktopBtn?.classList.add('hidden');
    document.dispatchEvent(new CustomEvent('ck:price-range-reset'));
    updateProductsView();
  }

  document.getElementById('resetFilterBtn')?.addEventListener('click', resetAllProductFilters);
  document.getElementById('emptyResetBtn')?.addEventListener('click', resetAllProductFilters);

  // Header / Curtain Search Input
  desktopInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    clearDesktopBtn?.classList.toggle('hidden', !val);
    if (productGrid) {
      uiState.searchQuery = val;
      updateProductsView();
    }
  });

  clearDesktopBtn?.addEventListener('click', () => {
    if (desktopInput) desktopInput.value = '';
    clearDesktopBtn.classList.add('hidden');
    if (productGrid) {
      uiState.searchQuery = '';
      updateProductsView();
    }
    desktopInput?.focus();
  });

  document.getElementById('desktopSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = (desktopInput?.value || '').trim();
    closeSearchCurtain();
    if (productGrid) {
      uiState.searchQuery = val;
      updateProductsView();
      catalogSection?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const targetUrl = val
        ? `${resolveAsset('san-pham/')}?q=${encodeURIComponent(val)}`
        : resolveAsset('san-pham/');
      window.location.href = targetUrl;
    }
  });

  // Homepage Category Icon Grid / Shelf
  document.getElementById('categoryGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-cat-group]');
    if (!card) return;
    if (productGrid) {
      uiState.activeCategory = card.dataset.catGroup || 'all';
      uiState.activeSubCategory = card.dataset.catSub || 'all';
      updateProductsView();
      catalogSection?.scrollIntoView({ behavior: 'smooth' });
      showToast(`Đang lọc: ${card.dataset.catName}`);
    } else {
      const group = card.dataset.catGroup || 'all';
      const sub = card.dataset.catSub || '';
      const url = new URL(resolveAsset('san-pham/'), window.location.origin);
      if (group && group !== 'all') url.searchParams.set('cat', group);
      if (sub && sub !== 'all') url.searchParams.set('sub', sub);
      window.location.href = url.pathname + url.search;
    }
  });

  document.getElementById('toggleAllCategoriesBtn')?.addEventListener('click', (e) => {
    uiState.showAllCategories = !uiState.showAllCategories;
    const total = e.currentTarget.dataset.totalCount || '12';
    const extraEls = Array.from(document.querySelectorAll('#categoryGrid [data-cat-extra="true"]'));
    extraEls.forEach((el) => {
      el.classList.toggle('hidden', !uiState.showAllCategories);
    });
    if (uiState.showAllCategories) {
      Motion.staggerReveal(extraEls, { y: 14, duration: 0.35, stagger: 0.04 });
    }
    const lbl = document.getElementById('toggleAllCategoriesLabel');
    if (lbl) lbl.textContent = uiState.showAllCategories ? 'Thu gọn danh mục' : `Xem tất cả danh mục (${total})`;
    document.getElementById('toggleAllCategoriesIcon')?.classList.toggle('rotate-180', uiState.showAllCategories);
  });

  // /san-pham/ Sidebar Controls & Column Switcher
  document.getElementById('toggleCatalogSidebarBtn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('catalogSidebar');
    const icon = document.getElementById('toggleCatalogSidebarIcon');
    if (!sidebar) return;
    const hidden = sidebar.classList.toggle('hidden');
    if (icon) icon.textContent = hidden ? '+' : '−';
  });

  document.getElementById('catalogCategoryList')?.addEventListener('click', (e) => {
    const subBtn = e.target.closest('[data-catalog-sub]');
    if (subBtn) {
      const parentCat = subBtn.dataset.parentCat || 'all';
      const subName = subBtn.dataset.catalogSub;
      if (uiState.activeSubCategory === subName && uiState.activeCategory === parentCat) {
        uiState.activeSubCategory = 'all';
      } else {
        uiState.activeCategory = parentCat;
        uiState.activeSubCategory = subName;
        uiState.openAccordionCat = parentCat;
      }
      updateProductsView();
      return;
    }

    const catBtn = e.target.closest('[data-catalog-cat]');
    if (!catBtn) return;
    const catId = catBtn.dataset.catalogCat;
    if (catId === 'all') {
      uiState.activeCategory = 'all';
      uiState.activeSubCategory = 'all';
      uiState.openAccordionCat = null;
    } else if (uiState.activeCategory === catId && uiState.activeSubCategory === 'all') {
      // Toggle accordion open/close when clicking the already-selected category
      uiState.openAccordionCat = uiState.openAccordionCat === catId ? null : catId;
    } else {
      uiState.activeCategory = catId;
      uiState.activeSubCategory = 'all';
      uiState.openAccordionCat = catId;
    }
    updateProductsView();
  });

  document.addEventListener('ck:price-range-change', (e) => {
    const { min, max, maxLimit, preset } = e.detail || {};
    uiState.priceMin = Number(min) || 0;
    uiState.priceMax = Number(max) || 3000000;
    uiState.priceMaxLimit = Number(maxLimit) || 3000000;
    uiState.priceRange = preset || 'all';
    updateProductsView();
  });

  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    uiState.sortBy = e.target.value;
    updateProductsView();
  });

  const cols2Btn = document.getElementById('gridCols2Btn');
  const cols3Btn = document.getElementById('gridCols3Btn');
  cols2Btn?.addEventListener('click', () => {
    const visibleEls = productCards.filter((p) => !p.el.classList.contains('hidden')).map((p) => p.el);
    const state = Motion.captureFlip(visibleEls);
    productGrid?.classList.remove('xl:grid-cols-3');
    productGrid?.classList.add('xl:grid-cols-2');
    cols2Btn.className = 'rounded-full px-3.5 py-1.5 text-[11px] font-medium bg-[#1d1d1f] text-white shadow-sm transition-all';
    if (cols3Btn) cols3Btn.className = 'rounded-full px-3.5 py-1.5 text-[11px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-all';
    Motion.playFlip(state, visibleEls, []);
  });
  cols3Btn?.addEventListener('click', () => {
    const visibleEls = productCards.filter((p) => !p.el.classList.contains('hidden')).map((p) => p.el);
    const state = Motion.captureFlip(visibleEls);
    productGrid?.classList.remove('xl:grid-cols-2');
    productGrid?.classList.add('xl:grid-cols-3');
    cols3Btn.className = 'rounded-full px-3.5 py-1.5 text-[11px] font-medium bg-[#1d1d1f] text-white shadow-sm transition-all';
    if (cols2Btn) cols2Btn.className = 'rounded-full px-3.5 py-1.5 text-[11px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-all';
    Motion.playFlip(state, visibleEls, []);
  });

  // ===========================================================================
  // 5. DELEGATED GLOBAL ACTIONS (NAV PILLS, CART, BUNDLES, VOUCHERS, ESCAPE)
  // ===========================================================================
  document.addEventListener('click', (e) => {
    const navCatBtn = e.target.closest('[data-nav-cat]');
    if (navCatBtn) {
      const cat = navCatBtn.dataset.navCat;
      closeSearchCurtain();
      if (productGrid) {
        uiState.activeCategory = cat;
        uiState.activeSubCategory = 'all';
        updateProductsView();
        catalogSection?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href =
          cat === 'all'
            ? resolveAsset('san-pham/')
            : `${resolveAsset('san-pham/')}?cat=${encodeURIComponent(cat)}`;
      }
      return;
    }

    const flipBtn = e.target.closest('[data-flip-card]');
    if (flipBtn) {
      const card = flipBtn.closest('.ck-flashcard');
      if (card) Motion.toggleFlashcard(card);
      return;
    }

    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn) {
      addToCart(addBtn.dataset.addCart, 1, false, addBtn);
      return;
    }

    const qvBtn = e.target.closest('[data-quick-view]');
    if (qvBtn) {
      openQuickView(qvBtn.dataset.quickView);
      return;
    }

    const bundleBtn = e.target.closest('[data-add-bundle]');
    if (bundleBtn) {
      const ids = (bundleBtn.dataset.addBundle || '').split(',').map((s) => s.trim()).filter(Boolean);
      ids.forEach((id) => addToCart(id, 1, true, bundleBtn));
      Motion.openDrawer(document.getElementById('cartDrawerBackdrop'), null, 'right');
      showToast(`Đã thêm trọn bộ "${bundleBtn.dataset.bundleName || 'Setup'}" (${ids.length} món) vào giỏ!`);
      return;
    }

    const copyVoucherBtn = e.target.closest('[data-copy-voucher]');
    if (copyVoucherBtn) {
      const code = copyVoucherBtn.dataset.copyVoucher;
      try { navigator.clipboard?.writeText(code); } catch (_) {}
      showToast(`Đã sao chép mã giảm giá: ${code}`);
      return;
    }

    const applyVoucherBtn = e.target.closest('[data-apply-voucher]');
    if (applyVoucherBtn) {
      applyVoucherCode(applyVoucherBtn.dataset.applyVoucher, true);
      return;
    }

    const footerCatBtn = e.target.closest('[data-footer-cat]');
    if (footerCatBtn) {
      const cat = footerCatBtn.dataset.footerCat;
      if (productGrid) {
        uiState.activeCategory = cat;
        uiState.activeSubCategory = 'all';
        updateProductsView();
        catalogSection?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = `${resolveAsset('san-pham/')}?cat=${encodeURIComponent(cat)}`;
      }
      return;
    }

    const infoModalBtn = e.target.closest('[data-info-modal]');
    if (infoModalBtn) {
      const key = infoModalBtn.dataset.infoModal;
      const data = POLICY_CONTENT[key];
      if (data) openInfoModal(data.tag, data.title, data.html);
    }
  });

  // Top Promo Copy
  document.getElementById('copyPromoBtn')?.addEventListener('click', (e) => {
    const code = e.currentTarget.dataset.promo || 'SINHVIEN11';
    try { navigator.clipboard?.writeText(code); } catch (_) {}
    showToast(`Đã sao chép mã giảm giá: ${code} (-15%)`);
  });

  // Cart Drawer Events
  const cartBackdrop = document.getElementById('cartDrawerBackdrop');
  document.getElementById('openCartBtn')?.addEventListener('click', () => Motion.openDrawer(cartBackdrop, null, 'right'));
  document.getElementById('closeCartBtn')?.addEventListener('click', () => Motion.closeDrawer(cartBackdrop, null, 'right'));
  cartBackdrop?.addEventListener('click', (e) => {
    if (e.target === cartBackdrop) Motion.closeDrawer(cartBackdrop, null, 'right');
  });

  document.getElementById('cartItemsContainer')?.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-cart-inc]')?.dataset.cartInc;
    const dec = e.target.closest('[data-cart-dec]')?.dataset.cartDec;
    const rem = e.target.closest('[data-cart-remove]')?.dataset.cartRemove;
    if (inc) {
      const item = persisted.cart.find((i) => i.productId === inc);
      if (item) item.qty += 1;
    } else if (dec) {
      const item = persisted.cart.find((i) => i.productId === dec);
      if (item && --item.qty <= 0) persisted.cart = persisted.cart.filter((i) => i.productId !== dec);
    } else if (rem) {
      persisted.cart = persisted.cart.filter((i) => i.productId !== rem);
    }
    saveState();
    renderCart();
  });

  document.getElementById('cartVoucherForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('cartVoucherInput');
    if (input) applyVoucherCode(input.value, false);
  });

  document.getElementById('removeCartVoucherBtn')?.addEventListener('click', () => {
    persisted.appliedVoucher = null;
    saveState();
    renderCart();
    showToast('Đã gỡ mã giảm giá khỏi giỏ hàng.');
  });

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (!persisted.cart.length) return showToast('Giỏ hàng đang trống!');
    let subtotal = 0;
    const orderItems = [];
    persisted.cart.forEach((item) => {
      const p = CATALOG.find((x) => x.id === item.productId);
      if (p) {
        subtotal += p.price * item.qty;
        orderItems.push({ name: p.name, qty: item.qty, price: p.price });
      }
    });
    const vCheck = calculateVoucherDiscount(subtotal, persisted.appliedVoucher);
    const discount = vCheck.valid ? vCheck.discount : 0;
    const finalTotal = Math.max(0, subtotal - discount);
    const PICKUP_POINTS = {
      khtn: {
        shortName: 'Điểm giao hàng Phường Chợ Quán',
        address: 'CS1 – ĐH Khoa học Tự nhiên (227 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh)',
        courier: 'Đang điều phối shipper tại Điểm giao hàng Phường Chợ Quán',
        packTitle: 'Đóng gói chống sốc tại Điểm giao hàng Phường Chợ Quán',
        shipTitle: 'Đang tiến hành giao',
        shipDetail: 'Gọi điện trước 5 phút khi tới nơi',
        step3Label: 'Đang tiến hành giao'
      },
      'ktx-a': {
        shortName: 'Điểm giao hàng Phường Linh Xuân',
        address: 'Ký túc xá Khu A – ĐHQG-HCM (Đường Tạ Quang Bửu, Khu phố 33, Phường Linh Xuân, TP. Hồ Chí Minh)',
        courier: 'Đang điều phối shipper tại Điểm giao hàng Phường Linh Xuân',
        packTitle: 'Đóng gói chống sốc tại Điểm giao hàng Phường Linh Xuân',
        shipTitle: 'Đang tiến hành giao',
        shipDetail: 'Gọi điện trước 5 phút khi tới nơi',
        step3Label: 'Đang tiến hành giao'
      },
      'ktx-b': {
        shortName: 'Điểm giao hàng Phường Đông Hòa',
        address: 'Ký túc xá Khu B – ĐHQG-HCM (Đường Mạc Đĩnh Chi, Khu phố Tân Hòa, Phường Đông Hòa, TP. Hồ Chí Minh)',
        courier: 'Đang điều phối shipper tại Điểm giao hàng Phường Đông Hòa',
        packTitle: 'Đóng gói chống sốc tại Điểm giao hàng Phường Đông Hòa',
        shipTitle: 'Đang tiến hành giao',
        shipDetail: 'Gọi điện trước 5 phút khi tới nơi',
        step3Label: 'Đang tiến hành giao'
      }
    };
    const addressInput = document.getElementById('cartDeliveryInput');
    const selectedKey = (addressInput?.value || 'khtn').trim();
    const point = PICKUP_POINTS[selectedKey] || PICKUP_POINTS.khtn;
    const dest = point.address;
    const orderId = 'CK-2611-' + Math.floor(1000 + Math.random() * 8999);
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' • Hôm nay';

    const newOrder = {
      id: orderId,
      customer: persisted.eduUser?.email ? persisted.eduUser.email.split('@')[0] : 'Khách hàng Sinh viên',
      phone: '0900000000',
      email: persisted.eduUser?.email || 'student@campuskit.vn',
      createdAt: nowStr,
      eta: 'Dự kiến giao trong vòng 2 giờ tới',
      address: dest,
      courier: point.courier,
      step3Label: point.step3Label,
      step: 1,
      statusLabel: 'Đã xác nhận đơn hàng mới',
      payment: discount > 0 ? `COD / VietQR (Đã áp mã ${persisted.appliedVoucher})` : 'Thanh toán khi nhận hàng (COD)',
      discount,
      total: finalTotal,
      items: orderItems,
      timeline: [
        { time: nowStr, title: 'Đặt hàng thành công trên CampusKit', detail: `Điểm nhận hàng: ${dest}`, done: true },
        { time: 'Đang xử lý', title: point.packTitle, detail: 'Kiểm tra ngoại quan & kích hoạt tem bảo hành 30 ngày', done: false },
        { time: 'Dự kiến +45p', title: point.shipTitle, detail: point.shipDetail, done: false },
        { time: 'Dự kiến +90p', title: 'Giao thành công', detail: 'Đồng kiểm 100% khi nhận hàng', done: false }
      ]
    };

    persisted.placedOrders.unshift(newOrder);
    persisted.cart = [];
    persisted.appliedVoucher = null;
    saveState();
    renderCart();
    Motion.closeDrawer(cartBackdrop, null, 'right');

    openInfoModal(
      'Xác nhận đơn hàng',
      `Đặt hàng thành công • ${orderId}`,
      `
        <div class="space-y-3 text-sm text-[#6e6e73] leading-relaxed">
          <p>Cảm ơn bạn! Đơn hàng <strong class="text-[#0071e3] font-semibold">${escapeHTML(orderId)}</strong> trị giá <strong class="text-[#1d1d1f] font-semibold">${formatVND(finalTotal)}</strong> đã được chuyển đến <strong class="text-[#1d1d1f] font-medium">${escapeHTML(point.shortName)}</strong>.</p>
          <p><strong class="text-[#1d1d1f] font-medium">Điểm nhận hàng:</strong> ${escapeHTML(dest)}</p>
          <div class="pt-3">
            <a href="${resolveAsset('tra-cuu/')}?order=${encodeURIComponent(orderId)}" class="as-pill-blue inline-flex items-center justify-center w-full text-center rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium py-3.5 px-6 shadow-sm transition-all">
              Theo dõi tiến độ đơn ${escapeHTML(orderId)}
            </a>
          </div>
        </div>
      `
    );
  });

  // Login Modal & Mobile Drawer & Newsletter
  const loginBackdrop = document.getElementById('loginModalBackdrop');
  document.getElementById('openLoginBtn')?.addEventListener('click', () => Motion.openModal(loginBackdrop));
  document.getElementById('closeLoginModalBtn')?.addEventListener('click', () => Motion.closeModal(loginBackdrop));
  loginBackdrop?.addEventListener('click', (e) => {
    if (e.target === loginBackdrop) Motion.closeModal(loginBackdrop);
  });

  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmailInput').value.trim();
    const isEdu = email.toLowerCase().includes('.edu');
    persisted.eduUser = { email, school: 'CampusKit Member', verified: isEdu };
    saveState();
    syncHeaderUser();
    renderCart();
    Motion.closeModal(loginBackdrop);
    showToast(
      isEdu
        ? `Xin chào ${email}! Đã xác thực .edu.vn & mở khóa mã EDU15VIP (-15%).`
        : `Xin chào ${email}! Đã đăng nhập tài khoản CampusKit.`
    );
  });

  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletterEmail');
    const email = (input?.value || '').trim();
    if (input) input.value = '';
    showToast(`Đã gửi mã ưu đãi SINHVIEN11 (-15%) tới ${email}!`);
  });

  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
  document.getElementById('openMobileMenuBtn')?.addEventListener('click', () => Motion.openDrawer(mobileNavBackdrop, null, 'left'));
  document.getElementById('closeMobileMenuBtn')?.addEventListener('click', () => Motion.closeDrawer(mobileNavBackdrop, null, 'left'));
  mobileNavBackdrop?.addEventListener('click', (e) => {
    if (e.target === mobileNavBackdrop) Motion.closeDrawer(mobileNavBackdrop, null, 'left');
  });

  // Global Escape Key Handler (Apple Search Curtain + Modals + Drawers)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearchCurtain();
      Motion.closeModal(quickViewBackdrop);
      Motion.closeModal(infoBackdrop);
      Motion.closeModal(loginBackdrop);
      Motion.closeDrawer(cartBackdrop, null, 'right');
      Motion.closeDrawer(mobileNavBackdrop, null, 'left');
    }
  });

  // Countdown Timer (Homepage & /ma-giam-gia/)
  if (document.getElementById('cdDays')) {
    let remainingSeconds = 5 * 86400 + 14 * 3600 + 48 * 60 + 32;
    setInterval(() => {
      if (remainingSeconds <= 0) remainingSeconds = 5 * 86400;
      const d = document.getElementById('cdDays');
      const h = document.getElementById('cdHours');
      const m = document.getElementById('cdMinutes');
      const s = document.getElementById('cdSeconds');
      if (d) d.textContent = String(Math.floor(remainingSeconds / 86400)).padStart(2, '0');
      if (h) h.textContent = String(Math.floor((remainingSeconds % 86400) / 3600)).padStart(2, '0');
      if (m) m.textContent = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
      if (s) {
        s.textContent = String(remainingSeconds % 60).padStart(2, '0');
        if (window.gsap && Motion.enabled) {
          window.gsap.fromTo(
            s,
            { scale: 1.15 },
            { scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'transform' }
          );
        }
      }
      remainingSeconds -= 1;
    }, 1000);
  }

  // ===========================================================================
  // 6. SUBPAGE: /MA-GIAM-GIA/ (STUDENT .EDU.VN VERIFICATION, FILTER & FAQ)
  // ===========================================================================
  const eduVerifyForm = document.getElementById('eduVerifyForm');
  const eduVerifiedResult = document.getElementById('eduVerifiedResult');
  const eduVerifiedTitle = document.getElementById('eduVerifiedTitle');

  if (eduVerifyForm && persisted.eduUser && persisted.eduUser.verified) {
    eduVerifiedResult?.classList.remove('hidden');
    if (eduVerifiedTitle) {
      eduVerifiedTitle.textContent = `Đã xác thực: ${persisted.eduUser.email}`;
    }
    const emailIn = document.getElementById('eduEmailInput');
    if (emailIn) emailIn.value = persisted.eduUser.email;
  }

  eduVerifyForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('eduEmailInput')?.value || '').trim();
    const school = document.getElementById('eduSchoolSelect')?.value || '';
    if (!email.toLowerCase().includes('.edu')) {
      showToast('Vui lòng nhập email có đuôi .edu.vn (VD: mssv@hcmut.edu.vn) để xác thực!');
      return;
    }
    persisted.eduUser = { email, school, verified: true };
    saveState();
    syncHeaderUser();
    renderCart();
    eduVerifiedResult?.classList.remove('hidden');
    if (eduVerifiedTitle) eduVerifiedTitle.textContent = `Đã xác thực: ${email} (${school})`;
    showToast('Xác thực thành công! Đã mở khóa đặc quyền EDU15VIP (-15%).');
  });

  document.getElementById('voucherFilterBar')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-voucher-filter]');
    if (!btn) return;
    const filter = btn.dataset.voucherFilter;
    document.querySelectorAll('#voucherFilterBar [data-voucher-filter]').forEach((b) => {
      b.className =
        b === btn
          ? 'rounded-full px-4 py-2 text-xs font-medium bg-[#1d1d1f] text-white shadow-sm transition-all'
          : 'rounded-full px-4 py-2 text-xs font-medium bg-white border border-[#d2d2d7]/80 text-[#6e6e73] hover:text-[#1d1d1f] hover:border-[#86868b] transition-all';
    });
    const shownVouchers = [];
    document.querySelectorAll('.voucher-card').forEach((card) => {
      let show = true;
      if (filter === 'percent') show = card.dataset.voucherType === 'percent';
      else if (filter === 'fixed') show = card.dataset.voucherType === 'fixed';
      else if (filter === 'edu') show = card.dataset.voucherEdu === 'true';
      card.classList.toggle('hidden', !show);
      if (show) shownVouchers.push(card);
    });
    Motion.staggerReveal(shownVouchers, { y: 14, duration: 0.36, stagger: 0.04 });
  });

  document.getElementById('voucherFaqList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-faq-toggle]');
    if (!btn) return;
    const item = btn.parentElement;
    const body = item.querySelector('[data-faq-body]');
    const icon = btn.querySelector('[data-faq-icon]');
    if (!body) return;
    const isHidden = body.classList.toggle('hidden');
    if (icon) icon.textContent = isHidden ? '+' : '−';
  });

  // ===========================================================================
  // 7. SUBPAGE: /GOC-HOC-TAP/ (LOOKBOOK FILTER & HOTSPOT HOVER)
  // ===========================================================================
  document.getElementById('lookbookFilterBar')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lookbook-filter]');
    if (!btn) return;
    const group = btn.dataset.lookbookFilter;
    document.querySelectorAll('#lookbookFilterBar [data-lookbook-filter]').forEach((b) => {
      b.className =
        b === btn
          ? 'rounded-full px-4 py-2 text-xs font-medium bg-[#1d1d1f] text-white shadow-sm transition-all'
          : 'rounded-full px-4 py-2 text-xs font-medium bg-white border border-[#d2d2d7]/80 text-[#1d1d1f] hover:border-[#86868b] transition-all';
    });
    const shownLookbooks = [];
    document.querySelectorAll('.lookbook-card').forEach((card) => {
      const show = group === 'all' || card.dataset.lookbookGroup === group;
      card.classList.toggle('hidden', !show);
      if (show) shownLookbooks.push(card);
    });
    Motion.staggerReveal(shownLookbooks, { y: 18, duration: 0.42, stagger: 0.06 });
  });

  document.querySelectorAll('[data-hotspot-pin]').forEach((pin) => {
    const targetId = pin.dataset.hotspotPin;
    pin.addEventListener('mouseenter', () => {
      document.getElementById(targetId)?.classList.add('bg-[#e8f2ff]', 'ring-1', 'ring-[#0071e3]/40');
    });
    pin.addEventListener('mouseleave', () => {
      document.getElementById(targetId)?.classList.remove('bg-[#e8f2ff]', 'ring-1', 'ring-[#0071e3]/40');
    });
  });

  // ===========================================================================
  // 8. SUBPAGE: /CONG-CU/ (POMODORO, WEB AUDIO WHITE NOISE & GPA CALCULATOR)
  // ===========================================================================
  // 8A. Pomodoro Timer
  const pomoClockEl = document.getElementById('pomoClockDisplay');
  if (pomoClockEl) {
    let totalSecs = 25 * 60;
    let leftSecs = 25 * 60;
    let running = false;
    let intervalId = null;

    const statusEl = document.getElementById('pomoStatusText');
    const progressEl = document.getElementById('pomoProgressBar');
    const startBtn = document.getElementById('pomoStartPauseBtn');
    const sessionEl = document.getElementById('pomoSessionCount');

    function playChime() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.16 + 0.5);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.16);
          osc.stop(ctx.currentTime + idx * 0.16 + 0.55);
        });
      } catch (_) {}
    }

    function renderPomo() {
      const m = String(Math.floor(leftSecs / 60)).padStart(2, '0');
      const s = String(leftSecs % 60).padStart(2, '0');
      pomoClockEl.textContent = `${m}:${s}`;
      const pct = totalSecs > 0 ? Math.min(100, ((totalSecs - leftSecs) / totalSecs) * 100) : 0;
      if (progressEl) progressEl.style.width = `${pct}%`;
      if (sessionEl) sessionEl.textContent = `Hoàn thành: ${persisted.pomoSessions} phiên`;
      if (startBtn) startBtn.textContent = running ? 'Tạm dừng' : leftSecs < totalSecs ? 'Tiếp tục' : 'Bắt đầu ngay';
    }

    function stopPomo() {
      running = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    startBtn?.addEventListener('click', () => {
      if (running) {
        stopPomo();
        if (statusEl) statusEl.textContent = 'Đang tạm dừng — Giữ vững nhịp tập trung';
      } else {
        running = true;
        if (statusEl) statusEl.textContent = 'Đang trong phiên tập trung sâu — Tắt mạng xã hội';
        intervalId = setInterval(() => {
          if (leftSecs > 0) {
            leftSecs -= 1;
            renderPomo();
          } else {
            stopPomo();
            persisted.pomoSessions += 1;
            saveState();
            playChime();
            if (statusEl) statusEl.textContent = 'Hoàn thành phiên! Hãy đứng dậy vươn vai & uống nước';
            showToast('Chúc mừng! Bạn vừa hoàn thành 1 phiên Pomodoro tập trung.');
            leftSecs = totalSecs;
            renderPomo();
          }
        }, 1000);
      }
      renderPomo();
    });

    document.getElementById('pomoResetBtn')?.addEventListener('click', () => {
      stopPomo();
      leftSecs = totalSecs;
      if (statusEl) statusEl.textContent = 'Đã đặt lại đồng hồ';
      renderPomo();
    });

    document.getElementById('pomoPlus5Btn')?.addEventListener('click', () => {
      totalSecs += 5 * 60;
      leftSecs += 5 * 60;
      renderPomo();
      showToast('Đã cộng thêm 5 phút vào phiên hiện tại.');
    });

    document.getElementById('pomoModeBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pomo-mode]');
      if (!btn) return;
      stopPomo();
      const mins = Number(btn.dataset.minutes) || 25;
      totalSecs = mins * 60;
      leftSecs = totalSecs;
      document.querySelectorAll('#pomoModeBar [data-pomo-mode]').forEach((b) => {
        b.className =
          b === btn
            ? 'rounded-full py-2.5 px-3 text-xs font-semibold bg-[#1d1d1f] text-white shadow-sm transition-all'
            : 'rounded-full py-2.5 px-3 text-xs font-medium bg-white/85 hover:bg-white text-[#1d1d1f] transition-all';
      });
      if (statusEl) statusEl.textContent = `Chế độ ${mins} phút đã sẵn sàng`;
      renderPomo();
    });

    // Pomodoro Task Checklist
    const taskListEl = document.getElementById('pomoTaskList');
    function renderPomoTasks() {
      if (!taskListEl) return;
      if (persisted.pomoTasks.length === 0) {
        taskListEl.innerHTML = '<li class="p-4 text-xs text-[#86868b] text-center">Chưa có mục tiêu nào. Hãy thêm 1–3 đầu việc quan trọng nhất!</li>';
        return;
      }
      taskListEl.innerHTML = persisted.pomoTasks
        .map(
          (t) => `
          <li class="px-4 py-3 flex items-center justify-between gap-3">
            <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
              <input type="checkbox" data-task-toggle="${escapeHTML(t.id)}" ${t.done ? 'checked' : ''} class="w-4 h-4 accent-[#0071e3] rounded" />
              <span class="text-xs sm:text-[13px] ${t.done ? 'line-through text-[#86868b]' : 'text-[#1d1d1f] font-normal'} truncate">${escapeHTML(t.text)}</span>
            </label>
            <button type="button" data-task-del="${escapeHTML(t.id)}" class="text-xs text-[#86868b] hover:text-[#1d1d1f] px-1.5">✕</button>
          </li>
        `
        )
        .join('');
    }

    document.getElementById('pomoTaskForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('pomoTaskInput');
      const val = (input?.value || '').trim();
      if (!val) return;
      persisted.pomoTasks.push({ id: 't' + Date.now(), text: val, done: false });
      if (input) input.value = '';
      saveState();
      renderPomoTasks();
    });

    taskListEl?.addEventListener('click', (e) => {
      const toggleId = e.target.closest('[data-task-toggle]')?.dataset.taskToggle;
      const delId = e.target.closest('[data-task-del]')?.dataset.taskDel;
      if (toggleId) {
        const item = persisted.pomoTasks.find((x) => x.id === toggleId);
        if (item) item.done = !item.done;
        saveState();
        renderPomoTasks();
      } else if (delId) {
        persisted.pomoTasks = persisted.pomoTasks.filter((x) => x.id !== delId);
        saveState();
        renderPomoTasks();
      }
    });

    renderPomo();
    renderPomoTasks();
  }

  // 8B. Web Audio White Noise Mixer
  const whiteNoiseEl = document.getElementById('whiteNoiseChannels');
  if (whiteNoiseEl) {
    let audioCtx = null;
    const activeNodes = {};

    function ensureAudioCtx() {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function createSoundChannel(type, volumePct) {
      const ctx = ensureAudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.value = (volumePct / 100) * 0.28;
      masterGain.connect(ctx.destination);

      if (type === 'ambient') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.value = 110;
        osc2.frequency.value = 164.81;
        filter.type = 'lowpass';
        filter.frequency.value = 260;
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);
        osc1.start();
        osc2.start();
        return {
          gainNode: masterGain,
          stop: () => {
            try { osc1.stop(); osc2.stop(); masterGain.disconnect(); } catch (_) {}
          }
        };
      }

      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.2;
        }
      } else if (type === 'rain') {
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.14;
        }
      } else {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.35;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 0.65;
      } else if (type === 'brown') {
        filter.type = 'lowpass';
        filter.frequency.value = 420;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 3200;
      }

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();

      return {
        gainNode: masterGain,
        stop: () => {
          try { noise.stop(); masterGain.disconnect(); } catch (_) {}
        }
      };
    }

    function syncSoundUI() {
      const count = Object.keys(activeNodes).length;
      const badge = document.getElementById('soundMasterBadge');
      if (badge) {
        badge.textContent = count > 0 ? `Đang phát (${count} kênh)` : 'Đang tắt';
        badge.className =
          count > 0
            ? 'rounded-full bg-[#0071e3] text-white px-3.5 py-1 text-[11px] font-medium shadow-xs'
            : 'rounded-full bg-[#f5f5f7] text-[#6e6e73] px-3.5 py-1 text-[11px] font-medium';
      }
      document.querySelectorAll('[data-sound-toggle]').forEach((btn) => {
        const key = btn.dataset.soundToggle;
        const on = Boolean(activeNodes[key]);
        btn.textContent = on ? 'Đang bật' : 'Bật';
        btn.className = on
          ? 'rounded-full px-4 py-1.5 text-xs font-medium bg-[#0071e3] text-white shadow-sm transition-all shrink-0'
          : 'rounded-full px-4 py-1.5 text-xs font-medium bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#0071e3] hover:text-[#0071e3] transition-all shrink-0';
      });
    }

    whiteNoiseEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sound-toggle]');
      if (!btn) return;
      const type = btn.dataset.soundToggle;
      if (activeNodes[type]) {
        activeNodes[type].stop();
        delete activeNodes[type];
      } else {
        const slider = document.querySelector(`[data-sound-vol="${type}"]`);
        const vol = Number(slider?.value) || 50;
        activeNodes[type] = createSoundChannel(type, vol);
      }
      syncSoundUI();
    });

    whiteNoiseEl.addEventListener('input', (e) => {
      const slider = e.target.closest('[data-sound-vol]');
      if (!slider) return;
      const type = slider.dataset.soundVol;
      const val = Number(slider.value) || 50;
      const lbl = document.querySelector(`[data-sound-label="${type}"]`);
      if (lbl) lbl.textContent = `${val}%`;
      if (activeNodes[type] && activeNodes[type].gainNode) {
        activeNodes[type].gainNode.gain.value = (val / 100) * 0.28;
      }
    });

    document.getElementById('stopAllSoundsBtn')?.addEventListener('click', () => {
      Object.keys(activeNodes).forEach((k) => {
        activeNodes[k].stop();
        delete activeNodes[k];
      });
      syncSoundUI();
    });
  }

  // 8C. Exam Countdown & Packing Checklist + Deadline Tracker (/cong-cu/)
  const examListEl = document.getElementById('examList');
  if (examListEl) {
    const EXAM_KEY = 'campuskit_exams_v1';
    const CHECK_KEY = 'campuskit_exam_checklist_v1';
    const addDaysISO = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    let exams = [];
    try {
      const saved = JSON.parse(localStorage.getItem(EXAM_KEY) || 'null');
      exams = Array.isArray(saved) && saved.length ? saved : [
        { id: 'ex-1', name: 'Giải tích 1B', date: addDaysISO(3) },
        { id: 'ex-2', name: 'Nhập môn Lập trình', date: addDaysISO(7) },
        { id: 'ex-3', name: 'Xác suất Thống kê', date: addDaysISO(12) }
      ];
    } catch {
      exams = [{ id: 'ex-1', name: 'Giải tích 1B', date: addDaysISO(3) }];
    }

    const defaultChecklist = [
      { id: 'ck-1', label: 'Thẻ sinh viên / CCCD', checked: true, shopUrl: '' },
      { id: 'ck-2', label: 'Bút gel 0.5mm (2 cây dự phòng)', checked: false, shopUrl: 'san-pham/?cat=Stationery&sub=' + encodeURIComponent('Bút gel') },
      { id: 'ck-3', label: 'Bút chì 2B & gôm tô trắc nghiệm', checked: false, shopUrl: 'san-pham/?cat=Stationery&sub=' + encodeURIComponent('Bút chì') },
      { id: 'ck-4', label: 'Máy tính cầm tay chuẩn phòng thi', checked: false, shopUrl: 'san-pham/?cat=Workspace&sub=' + encodeURIComponent('Máy tính cầm tay') },
      { id: 'ck-5', label: 'Bình nước giữ nhiệt cá nhân', checked: false, shopUrl: 'san-pham/?cat=Workspace&sub=' + encodeURIComponent('Khác') + '&q=' + encodeURIComponent('Bình') }
    ];
    let checklist = defaultChecklist;
    try {
      const savedCk = JSON.parse(localStorage.getItem(CHECK_KEY) || 'null');
      if (Array.isArray(savedCk) && savedCk.length) {
        const defaultById = Object.fromEntries(defaultChecklist.map((x) => [x.id, x]));
        checklist = savedCk.map((item) => ({
          ...item,
          shopUrl: defaultById[item.id] ? defaultById[item.id].shopUrl : (item.shopUrl || '')
        }));
      }
    } catch {}

    function saveExams() {
      try { localStorage.setItem(EXAM_KEY, JSON.stringify(exams)); } catch {}
    }
    function saveChecklist() {
      try { localStorage.setItem(CHECK_KEY, JSON.stringify(checklist)); } catch {}
    }

    function daysUntil(dateStr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr + 'T00:00:00');
      return Math.round((target - today) / 86400000);
    }

    function formatDateVN(dateStr) {
      if (!dateStr || !dateStr.includes('-')) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }

    function renderExams() {
      const sorted = [...exams].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      if (!sorted.length) {
        examListEl.innerHTML = `<li class="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-xs text-[#6e6e73] text-center">Chưa có lịch thi nào. Thêm môn thi ở phía trên nhé!</li>`;
        return;
      }
      examListEl.innerHTML = sorted.map((ex) => {
        const diff = daysUntil(ex.date);
        let badgeCls = 'bg-[#e8f2ff] text-[#005bb5]';
        let badgeTxt = `Còn ${diff} ngày`;
        if (diff < 0) {
          badgeCls = 'bg-[#e5e5ea] text-[#6e6e73]';
          badgeTxt = 'Đã thi';
        } else if (diff === 0) {
          badgeCls = 'bg-[#ffe5e5] text-[#c92a2a]';
          badgeTxt = 'Thi hôm nay!';
        } else if (diff <= 3) {
          badgeCls = 'bg-[#fff0e0] text-[#b64400]';
          badgeTxt = `Gấp • Còn ${diff} ngày`;
        }
        return `
          <li class="rounded-2xl bg-[#f5f5f7] px-4 py-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[13px] font-semibold text-[#1d1d1f] truncate">${escapeHTML(ex.name)}</p>
              <p class="text-[11px] text-[#6e6e73]">Ngày thi: ${escapeHTML(formatDateVN(ex.date))}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeCls}">${badgeTxt}</span>
              <button type="button" data-exam-remove="${escapeHTML(ex.id)}" aria-label="Xóa môn thi" class="text-[#86868b] hover:text-[#1d1d1f] text-xs px-1">✕</button>
            </div>
          </li>
        `;
      }).join('');
    }

    function renderChecklist() {
      const ckEl = document.getElementById('examChecklist');
      const progEl = document.getElementById('examChecklistProgress');
      const barEl = document.getElementById('examChecklistBar');
      if (!ckEl) return;
      const doneCount = checklist.filter((c) => c.checked).length;
      if (progEl) progEl.textContent = `${doneCount}/${checklist.length} món`;
      if (barEl) barEl.style.width = `${Math.round((doneCount / Math.max(1, checklist.length)) * 100)}%`;

      ckEl.innerHTML = checklist.map((c) => `
        <li class="rounded-xl bg-white px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
          <label class="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
            <input type="checkbox" data-exam-ck="${escapeHTML(c.id)}" ${c.checked ? 'checked' : ''} class="w-4 h-4 rounded accent-[#0071e3] cursor-pointer shrink-0" />
            <span class="${c.checked ? 'line-through text-[#86868b]' : 'text-[#1d1d1f] font-medium'} truncate">${escapeHTML(c.label)}</span>
          </label>
          ${c.shopUrl && !c.checked ? `<a href="${resolveAsset(c.shopUrl)}" class="text-[11px] font-medium text-[#0066cc] hover:underline whitespace-nowrap shrink-0">Mua nhanh ›</a>` : ''}
        </li>
      `).join('');
    }

    document.getElementById('examCountdownForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameIn = document.getElementById('examNameInput');
      const dateIn = document.getElementById('examDateInput');
      const name = (nameIn?.value || '').trim();
      const date = (dateIn?.value || '').trim();
      if (!name || !date) return;
      exams.push({ id: 'ex-' + Date.now(), name, date });
      saveExams();
      renderExams();
      nameIn.value = '';
      showToast(`Đã thêm lịch thi "${name}".`);
    });

    examListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-exam-remove]');
      if (!btn) return;
      exams = exams.filter((x) => x.id !== btn.dataset.examRemove);
      saveExams();
      renderExams();
    });

    document.getElementById('examChecklist')?.addEventListener('change', (e) => {
      const id = e.target.dataset.examCk;
      if (!id) return;
      const item = checklist.find((x) => x.id === id);
      if (item) {
        item.checked = e.target.checked;
        saveChecklist();
        renderChecklist();
      }
    });

    renderExams();
    renderChecklist();
  }

  // 8D. Deadline & To-Do Tracker (/cong-cu/)
  const deadlineListEl = document.getElementById('deadlineList');
  if (deadlineListEl) {
    const DL_KEY = 'campuskit_deadlines_v1';
    const addDaysISO2 = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    let deadlines = [];
    try {
      const saved = JSON.parse(localStorage.getItem(DL_KEY) || 'null');
      deadlines = Array.isArray(saved) && saved.length ? saved : [
        { id: 'dl-1', title: 'Hoàn thiện đồ án Hugo CampusKit', priority: 'high', due: addDaysISO2(2), done: false },
        { id: 'dl-2', title: 'Ôn tập đề thi Giải tích 1B', priority: 'week', due: addDaysISO2(4), done: false },
        { id: 'dl-3', title: 'Nộp bài Lab tuần 10', priority: 'normal', due: addDaysISO2(6), done: true }
      ];
    } catch {
      deadlines = [];
    }

    let currentFilter = 'all';
    const prioMeta = {
      high: { label: 'Gấp', cls: 'bg-[#ffe5e5] text-[#c92a2a]' },
      week: { label: 'Tuần này', cls: 'bg-[#fff0e0] text-[#b64400]' },
      normal: { label: 'Bình thường', cls: 'bg-[#e8f2ff] text-[#005bb5]' }
    };

    function saveDeadlines() {
      try { localStorage.setItem(DL_KEY, JSON.stringify(deadlines)); } catch {}
    }

    function fmtDue(dateStr) {
      if (!dateStr || !dateStr.includes('-')) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}`;
    }

    function renderDeadlines() {
      const badge = document.getElementById('deadlineProgressBadge');
      const doneTotal = deadlines.filter((d) => d.done).length;
      if (badge) badge.textContent = `${doneTotal}/${deadlines.length} việc`;

      const filtered = deadlines.filter((d) => {
        if (currentFilter === 'active') return !d.done;
        if (currentFilter === 'done') return d.done;
        return true;
      });

      if (!filtered.length) {
        deadlineListEl.innerHTML = `<li class="rounded-2xl bg-[#f5f5f7] px-4 py-6 text-xs text-[#6e6e73] text-center">Không có đầu việc nào trong mục này.</li>`;
        return;
      }

      deadlineListEl.innerHTML = filtered.map((d) => {
        const pm = prioMeta[d.priority] || prioMeta.normal;
        return `
          <li class="rounded-2xl bg-[#f5f5f7] px-4 py-3 flex items-center justify-between gap-3">
            <label class="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1">
              <input type="checkbox" data-dl-toggle="${escapeHTML(d.id)}" ${d.done ? 'checked' : ''} class="w-4 h-4 rounded accent-[#0071e3] mt-0.5 cursor-pointer shrink-0" />
              <div class="min-w-0">
                <p class="text-[13px] ${d.done ? 'line-through text-[#86868b]' : 'font-medium text-[#1d1d1f]'} break-words">${escapeHTML(d.title)}</p>
                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  <span class="rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${pm.cls}">${pm.label}</span>
                  ${d.due ? `<span class="text-[11px] text-[#6e6e73]">Hạn: ${escapeHTML(fmtDue(d.due))}</span>` : ''}
                </div>
              </div>
            </label>
            <button type="button" data-dl-remove="${escapeHTML(d.id)}" aria-label="Xóa đầu việc" class="text-[#86868b] hover:text-[#1d1d1f] text-xs px-1 shrink-0">✕</button>
          </li>
        `;
      }).join('');
    }

    document.getElementById('deadlineForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleIn = document.getElementById('deadlineTitleInput');
      const prioIn = document.getElementById('deadlinePrioritySelect');
      const dueIn = document.getElementById('deadlineDueInput');
      const title = (titleIn?.value || '').trim();
      if (!title) return;
      deadlines.unshift({
        id: 'dl-' + Date.now(),
        title,
        priority: prioIn?.value || 'week',
        due: dueIn?.value || '',
        done: false
      });
      saveDeadlines();
      renderDeadlines();
      titleIn.value = '';
      showToast('Đã thêm đầu việc vào danh sách Deadline.');
    });

    document.getElementById('deadlineFilterBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dl-filter]');
      if (!btn) return;
      currentFilter = btn.dataset.dlFilter;
      document.querySelectorAll('#deadlineFilterBar [data-dl-filter]').forEach((b) => {
        const active = b.dataset.dlFilter === currentFilter;
        b.className = active
          ? 'rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#1d1d1f] text-white transition-colors'
          : 'rounded-full px-3.5 py-1.5 text-xs font-medium bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed] transition-colors';
      });
      renderDeadlines();
    });

    deadlineListEl.addEventListener('change', (e) => {
      const id = e.target.dataset.dlToggle;
      if (!id) return;
      const item = deadlines.find((x) => x.id === id);
      if (item) {
        item.done = e.target.checked;
        saveDeadlines();
        renderDeadlines();
      }
    });

    deadlineListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dl-remove]');
      if (!btn) return;
      deadlines = deadlines.filter((x) => x.id !== btn.dataset.dlRemove);
      saveDeadlines();
      renderDeadlines();
    });

    document.getElementById('clearDoneDeadlinesBtn')?.addEventListener('click', () => {
      deadlines = deadlines.filter((x) => !x.done);
      saveDeadlines();
      renderDeadlines();
      showToast('Đã dọn các đầu việc hoàn thành.');
    });

    renderDeadlines();
  }

  // ===========================================================================
  // 9. SUBPAGE: /TRA-CUU/ (APPLE ORDER STATUS & APPLECARE+ 1-FOR-1 WARRANTY)
  // ===========================================================================
  const orderResultEl = document.getElementById('orderLookupResult');
  if (orderResultEl) {
    const orderPanel = document.getElementById('trackingOrderPanel');
    const warrantyPanel = document.getElementById('trackingWarrantyPanel');
    const orderInput = document.getElementById('orderCodeInput');
    const warrantyInput = document.getElementById('warrantyQueryInput');
    const warrantyResultEl = document.getElementById('warrantyLookupResult');
    const recentBar = document.getElementById('recentPlacedOrdersBar');

    if (recentBar && persisted.placedOrders.length > 0) {
      recentBar.innerHTML = persisted.placedOrders
        .slice(0, 3)
        .map(
          (o) => `
          <button type="button" data-demo-order="${escapeHTML(o.id)}" class="rounded-full bg-[#e8f2ff] hover:bg-[#0071e3] text-[#0071e3] hover:text-white px-3.5 py-1.5 font-medium transition-colors">
            ${escapeHTML(o.id)} (Đơn bạn vừa đặt)
          </button>
        `
        )
        .join('');
    }

    document.getElementById('trackingTabBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tracking-tab]');
      if (!btn) return;
      const tab = btn.dataset.trackingTab;
      document.querySelectorAll('#trackingTabBar [data-tracking-tab]').forEach((b) => {
        b.className =
          b === btn
            ? 'rounded-full px-5 py-2.5 text-xs sm:text-[13px] font-medium bg-[#1d1d1f] text-white shadow-sm transition-all'
            : 'rounded-full px-5 py-2.5 text-xs sm:text-[13px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-all';
      });
      orderPanel?.classList.toggle('hidden', tab !== 'order');
      warrantyPanel?.classList.toggle('hidden', tab !== 'warranty');
    });

    function renderOrderLookup(query) {
      const q = (query || '').trim().toLowerCase();
      const allOrders = [...persisted.placedOrders, ...DEMO_ORDERS];
      const found = allOrders.find(
        (o) =>
          o.id.toLowerCase() === q ||
          (o.phone && o.phone.toLowerCase() === q) ||
          (o.email && o.email.toLowerCase() === q)
      );

      if (found && ['khtn', 'ktx-a', 'ktx-b'].includes((found.address || '').trim().toLowerCase())) {
        const legacyMap = {
          khtn: {
            ward: 'Điểm giao hàng Phường Chợ Quán',
            address: 'CS1 – ĐH Khoa học Tự nhiên (227 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh)'
          },
          'ktx-a': {
            ward: 'Điểm giao hàng Phường Linh Xuân',
            address: 'Ký túc xá Khu A – ĐHQG-HCM (Đường Tạ Quang Bửu, Khu phố 33, Phường Linh Xuân, TP. Hồ Chí Minh)'
          },
          'ktx-b': {
            ward: 'Điểm giao hàng Phường Đông Hòa',
            address: 'Ký túc xá Khu B – ĐHQG-HCM (Đường Mạc Đĩnh Chi, Khu phố Tân Hòa, Phường Đông Hòa, TP. Hồ Chí Minh)'
          }
        };
        const m = legacyMap[found.address.trim().toLowerCase()];
        found.address = m.address;
        found.courier = `Đang điều phối shipper tại ${m.ward}`;
        found.timeline = [
          { time: found.createdAt || 'Hôm nay', title: 'Đặt hàng thành công trên CampusKit', detail: `Điểm nhận hàng: ${m.address}`, done: true },
          { time: 'Đang xử lý', title: `Đóng gói chống sốc tại ${m.ward}`, detail: 'Kiểm tra ngoại quan & kích hoạt tem bảo hành 30 ngày', done: false },
          { time: 'Dự kiến +45p', title: 'Đang tiến hành giao', detail: 'Gọi điện trước 5 phút khi tới nơi', done: false },
          { time: 'Dự kiến +90p', title: 'Giao thành công', detail: 'Đồng kiểm 100% khi nhận hàng', done: false }
        ];
      }

      if (!found) {
        orderResultEl.innerHTML = `
          <div class="rounded-[28px] bg-white p-10 text-center shadow-[2px_4px_12px_rgba(0,0,0,0.05)]">
            <p class="text-base font-semibold text-[#1d1d1f] mb-1.5">Không tìm thấy đơn hàng "${escapeHTML(query)}"</p>
            <p class="text-sm text-[#6e6e73]">Vui lòng kiểm tra lại mã đơn (ví dụ: CK-2611-8801) hoặc số điện thoại nhận hàng.</p>
          </div>
        `;
        return;
      }

      const steps = ['Đã xác nhận', 'Đóng gói tại điểm giao hàng', 'Đang tiến hành giao', 'Giao thành công'];
      const stepperHtml = steps
        .map((label, idx) => {
          const stepNum = idx + 1;
          const isCurrent = stepNum === found.step;
          const isCompleted = stepNum < found.step;
          const stateClass = isCurrent
            ? 'bg-[#0071e3] text-white shadow-sm'
            : isCompleted
            ? 'bg-[#1d1d1f] text-white'
            : 'bg-[#f5f5f7] text-[#86868b]';
          return `
            <div class="rounded-2xl p-4 transition-all ${stateClass}">
              <span class="text-[11px] font-medium opacity-80 block">Bước 0${stepNum}</span>
              <span class="text-sm font-semibold tracking-tight mt-0.5 block">${label}</span>
            </div>
          `;
        })
        .join('');

      const itemsHtml = (found.items || [])
        .map(
          (it) => `
          <div class="py-2.5 flex items-center justify-between text-xs sm:text-[13px]">
            <span class="text-[#1d1d1f]">${escapeHTML(it.name)} <strong class="text-[#6e6e73] font-normal">×${it.qty}</strong></span>
            <span class="font-semibold text-[#1d1d1f]">${formatVND(it.price * it.qty)}</span>
          </div>
        `
        )
        .join('');

      const timelineHtml = (found.timeline || [])
        .map(
          (tl) => `
          <li class="flex gap-3.5 items-start">
            <span class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${tl.done ? 'bg-[#0071e3] ring-4 ring-[#0071e3]/15' : 'bg-[#d2d2d7]'}"></span>
            <div>
              <p class="text-xs sm:text-[13px] font-semibold ${tl.done ? 'text-[#1d1d1f]' : 'text-[#86868b]'}">${escapeHTML(tl.time)} — ${escapeHTML(tl.title)}</p>
              <p class="text-xs text-[#6e6e73] mt-0.5 leading-relaxed">${escapeHTML(tl.detail)}</p>
            </div>
          </li>
        `
        )
        .join('');

      orderResultEl.innerHTML = `
        <div class="rounded-[28px] bg-white p-6 sm:p-9 shadow-[2px_4px_12px_rgba(0,0,0,0.06)] space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#d2d2d7]/50">
            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-[#e8f2ff] text-[#0071e3] text-xs font-semibold px-3.5 py-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#0071e3]"></span>
                ${escapeHTML(found.statusLabel)}
              </span>
              <h2 class="text-2xl font-semibold tracking-[-0.02em] text-[#1d1d1f] mt-2.5">Đơn hàng ${escapeHTML(found.id)}</h2>
              <p class="text-xs sm:text-[13px] text-[#6e6e73] mt-1">Đặt lúc: ${escapeHTML(found.createdAt)} • Người nhận: <strong class="text-[#1d1d1f] font-medium">${escapeHTML(found.customer)}</strong></p>
            </div>
            <div class="sm:text-right rounded-2xl bg-[#f5f5f7] px-4 py-3">
              <span class="text-[11px] text-[#6e6e73] block">Thời gian nhận dự kiến</span>
              <span class="text-sm font-semibold text-[#0071e3]">${escapeHTML(found.eta)}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">${stepperHtml}</div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div class="rounded-2xl bg-[#f5f5f7] p-5 space-y-2 text-xs sm:text-[13px] text-[#6e6e73]">
              <h3 class="text-xs font-semibold text-[#1d1d1f] mb-2.5">Thông tin giao nhận hàng</h3>
              <p><strong class="font-medium text-[#1d1d1f]">Điểm nhận hàng:</strong> ${escapeHTML(found.address)}</p>
              <p><strong class="font-medium text-[#1d1d1f]">Điều phối viên:</strong> ${escapeHTML(found.courier)}</p>
              <p><strong class="font-medium text-[#1d1d1f]">Thanh toán:</strong> ${escapeHTML(found.payment)}</p>
            </div>

            <div class="rounded-2xl bg-[#f5f5f7] p-5">
              <h3 class="text-xs font-semibold text-[#1d1d1f] mb-2">Chi tiết sản phẩm</h3>
              <div class="divide-y divide-[#d2d2d7]/50">${itemsHtml}</div>
              <div class="pt-3 mt-2 border-t border-[#d2d2d7]/60 flex items-center justify-between">
                <span class="text-xs font-medium text-[#6e6e73]">Tổng thanh toán</span>
                <span class="text-lg font-semibold tracking-tight text-[#1d1d1f]">${formatVND(found.total)}</span>
              </div>
            </div>
          </div>

          <div class="pt-5 border-t border-[#d2d2d7]/50">
            <h3 class="text-xs font-semibold text-[#6e6e73] mb-4">Nhật ký vận chuyển chi tiết</h3>
            <ul class="space-y-4">${timelineHtml}</ul>
          </div>
        </div>
      `;
      Motion.staggerReveal(orderResultEl.querySelectorAll('.grid.grid-cols-2 > div, ul > li'), {
        y: 10,
        duration: 0.34,
        stagger: 0.04
      });
    }

    function renderWarrantyLookup(query) {
      if (!warrantyResultEl) return;
      const q = (query || '').trim().toLowerCase();
      const dynamicWarranties = persisted.placedOrders.map((o, idx) => ({
        serial: `SN-CKNEW-${8000 + idx}`,
        orderId: o.id,
        phone: o.phone,
        email: o.email,
        productName: (o.items && o.items[0]?.name) || 'Thiết bị CampusKit',
        activatedDate: 'Hôm nay',
        oneToOneUntil: 'Còn trọn 30 ngày đổi mới',
        daysLeft: 30,
        hardwareUntil: '12 tháng chính hãng',
        status: 'Đang hiệu lực (1 đổi 1 mới)',
        policy: 'Đổi mới 1-1 tận sảnh KTX miễn phí trong 30 ngày đầu.'
      }));

      const matches = [...dynamicWarranties, ...DEMO_WARRANTIES].filter(
        (w) =>
          w.serial.toLowerCase() === q ||
          w.orderId.toLowerCase() === q ||
          w.phone.toLowerCase() === q ||
          w.email.toLowerCase() === q
      );

      if (matches.length === 0) {
        warrantyResultEl.innerHTML = `
          <div class="rounded-[28px] bg-white p-8 text-center shadow-[2px_4px_12px_rgba(0,0,0,0.05)]">
            <p class="text-base font-semibold text-[#1d1d1f] mb-1.5">Không tìm thấy hồ sơ bảo hành cho "${escapeHTML(query)}"</p>
            <p class="text-sm text-[#6e6e73]">Thử tra cứu bằng SĐT mẫu 0901234567 hoặc mã Serial SN-CKMOUSE-7732.</p>
          </div>
        `;
        return;
      }

      warrantyResultEl.innerHTML = matches
        .map(
          (w) => `
          <div class="rounded-[28px] bg-white p-6 sm:p-8 shadow-[2px_4px_12px_rgba(0,0,0,0.06)] mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#d2d2d7]/50">
              <div>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-[#e8f8ee] text-[#1d7d3f] text-xs font-semibold px-3.5 py-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#1d7d3f]"></span>
                  ${escapeHTML(w.status)}
                </span>
                <h3 class="text-lg sm:text-xl font-semibold tracking-tight text-[#1d1d1f] mt-2.5">${escapeHTML(w.productName)}</h3>
              </div>
              <span class="rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-xs font-medium px-4 py-1.5 self-start sm:self-auto">
                Serial: ${escapeHTML(w.serial)}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs mb-4">
              <div class="rounded-2xl bg-[#f5f5f7] p-4">
                <span class="text-[11px] text-[#6e6e73] block mb-0.5">Mã đơn gốc</span>
                <strong class="text-sm font-semibold text-[#1d1d1f]">${escapeHTML(w.orderId)}</strong>
              </div>
              <div class="rounded-2xl bg-[#f5f5f7] p-4">
                <span class="text-[11px] text-[#6e6e73] block mb-0.5">Hạn 1 đổi 1 (30 ngày)</span>
                <strong class="text-sm font-semibold text-[#0071e3]">${escapeHTML(w.oneToOneUntil)}</strong>
              </div>
              <div class="rounded-2xl bg-[#f5f5f7] p-4">
                <span class="text-[11px] text-[#6e6e73] block mb-0.5">Bảo hành phần cứng</span>
                <strong class="text-sm font-semibold text-[#1d1d1f]">${escapeHTML(w.hardwareUntil)}</strong>
              </div>
            </div>
            <p class="text-xs sm:text-[13px] text-[#6e6e73]"><strong class="font-medium text-[#1d1d1f]">Quyền lợi CampusCare+:</strong> ${escapeHTML(w.policy)}</p>
          </div>
        `
        )
        .join('');
    }

    document.getElementById('orderLookupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      renderOrderLookup(orderInput?.value || '');
    });

    orderPanel?.addEventListener('click', (e) => {
      const demo = e.target.closest('[data-demo-order]');
      if (!demo) return;
      const code = demo.dataset.demoOrder;
      if (orderInput) orderInput.value = code;
      renderOrderLookup(code);
    });

    document.getElementById('warrantyLookupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      renderWarrantyLookup(warrantyInput?.value || '');
    });

    warrantyPanel?.addEventListener('click', (e) => {
      const demo = e.target.closest('[data-demo-warranty]');
      if (!demo) return;
      const q = demo.dataset.demoWarranty;
      if (warrantyInput) warrantyInput.value = q;
      renderWarrantyLookup(q);
    });

    document.getElementById('warrantyClaimForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('claimOrderInput')?.value || '';
      e.target.reset();
      showToast(`Đã tiếp nhận yêu cầu đổi mới 1-1 cho mã ${code}! Kỹ thuật viên tại Điểm nhận hàng CampusKit sẽ gọi lại trong 15 phút.`);
    });

    const initialOrder = params.get('order') || (persisted.placedOrders[0]?.id ?? 'CK-2611-8801');
    if (orderInput) orderInput.value = initialOrder;
    renderOrderLookup(initialOrder);
    renderWarrantyLookup('0901234567');
  }

  // Initial Cart Render
  renderCart();
});
