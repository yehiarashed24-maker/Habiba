/**
 * Habiba Motif Art Gallery - Ultra-Luxury Curator Atelier Rail & Fluid Cross-Dissolve
 * Powered by Anime.js v4.5.0
 * Zero-Jerk / Zero-Crash / 60fps Silk Transitions
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initCuratorAtelier();
  });

  function initCuratorAtelier() {
    const dockIndicator = document.getElementById('dockIndicator');
    const tabs = document.querySelectorAll('.curator-tab');
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const statusText = document.getElementById('statusText');
    const watermark = document.getElementById('galleryWatermark');
    const ambientLayer = document.querySelector('.gallery-ambient-layer');

    if (!tabs.length || !galleryItems.length || !galleryGrid) return;

    // Anime.js instance
    const animeLib = window.anime;
    const animate = animeLib ? animeLib.animate : null;
    const stagger = animeLib ? animeLib.stagger : null;

    // Signature ambient colors per artwork slug
    const itemColors = {
      'quiet-companionship': '#3b2b1f',
      'whispers-of-copper-and-stone': '#4a2912',
      'coastal-dreams': '#112738',
      'faces-of-the-mind': '#3d2447',
      'the-forgotten-performers': '#4a1919',
      'resting-vessels': '#3b2718',
      'midnight-gondola': '#0f1a38',
      'the-mirror-of-the-mountains': '#183329',
      'nostalgia-in-green': '#113622',
      'angles-of-the-soul': '#423311',
      'kaleidoscope-city': '#3d1330',
      'the-quiet-hour': '#211d42'
    };

    const watermarkTitles = {
      all: { en: 'Habiba Motif', ar: 'حبيبة موتيف' },
      watercolor: { en: 'Watercolor Atelier', ar: 'ألوان مائية' },
      cubism: { en: 'Cubism Studies', ar: 'المدرسة التكعيبية' },
      distortion: { en: 'Distortion Expressions', ar: 'تشويه فني' },
      realistic: { en: 'Realistic Gallery', ar: 'المدرسة الواقعية' },
      sketches: { en: 'Original Sketches', ar: 'اسكتشات ورقية' }
    };

    let activeCategory = 'all';

    // -------------------------------------------------------------------------
    // 1. Sliding Rail Indicator
    // -------------------------------------------------------------------------
    function updateIndicator(activeTab, isInitial) {
      if (!dockIndicator || !activeTab) return;
      const rect = activeTab.getBoundingClientRect();
      const parentRect = activeTab.parentElement.getBoundingClientRect();
      const left = rect.left - parentRect.left;
      const width = rect.width;

      if (isInitial || !animate) {
        dockIndicator.style.transform = 'translateX(' + left + 'px)';
        dockIndicator.style.width = width + 'px';
      } else {
        animate(dockIndicator, {
          translateX: left,
          width: width,
          duration: 350,
          ease: 'outQuart'
        });
      }
    }

    const initialTab = document.querySelector('.curator-tab.active') || tabs[0];
    setTimeout(() => updateIndicator(initialTab, true), 80);

    window.addEventListener('resize', () => {
      const cur = document.querySelector('.curator-tab.active');
      if (cur) updateIndicator(cur, true);
    }, { passive: true });

    // -------------------------------------------------------------------------
    // 2. Dynamic Status & Ambient Wall Watermark
    // -------------------------------------------------------------------------
    function updateStatusAndWatermark(category) {
      const isAr = document.body.getAttribute('dir') === 'rtl';

      const statusMap = {
        all: { en: 'All Works • 12 Masterpieces', ar: 'جميع اللوحات • ١٢ عملاً فنياً' },
        watercolor: { en: 'Watercolor • 4 Masterpieces', ar: 'ألوان مائية • ٤ أعمال فنية' },
        cubism: { en: 'Cubism • 3 Masterpieces', ar: 'المدرسة التكعيبية • ٣ أعمال فنية' },
        distortion: { en: 'Distortion • 2 Masterpieces', ar: 'التشويه الفني التعبيري • عملان فنيان' },
        realistic: { en: 'Realistic • 2 Masterpieces', ar: 'المدرسة الواقعية • عملان فنيان' },
        sketches: { en: 'Sketches • 1 Masterpiece', ar: 'اسكتشات ورقية • رسمة أصلية واحدة' }
      };

      if (statusText) {
        const selected = statusMap[category] || statusMap.all;
        statusText.textContent = isAr ? selected.ar : selected.en;
      }

      if (watermark) {
        const titleItem = watermarkTitles[category] || watermarkTitles.all;
        const newTitle = isAr ? titleItem.ar : titleItem.en;
        if (animate) {
          animate(watermark, {
            opacity: [0.045, 0],
            duration: 180,
            ease: 'outQuad',
            onComplete: () => {
              watermark.textContent = newTitle;
              animate(watermark, {
                opacity: [0, 0.045],
                duration: 400,
                ease: 'outQuart'
              });
            }
          });
        } else {
          watermark.textContent = newTitle;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. SEAMLESS ZERO-CRASH FILTER TRANSITION (SILK CROSS-DISSOLVE)
    // -------------------------------------------------------------------------
    function filterGallery(targetCategory) {
      if (targetCategory === activeCategory) return;
      activeCategory = targetCategory;

      updateStatusAndWatermark(targetCategory);

      if (animate) {
        // Step 1: Rapid, elegant cross-dissolve softens the grid (130ms)
        animate(galleryGrid, {
          opacity: [1, 0.15],
          duration: 130,
          ease: 'outQuad',
          onComplete: () => {
            // Step 2: Instant DOM updates happen silently while dimmed (zero layout crash)
            galleryItems.forEach(item => {
              const itemCat = item.getAttribute('data-category');
              const matches = targetCategory === 'all' || itemCat === targetCategory;
              if (matches) {
                item.classList.remove('is-filtered-out');
              } else {
                item.classList.add('is-filtered-out');
              }
            });

            // Clean scroll reset without snap fighting
            galleryGrid.scrollLeft = 0;

            // Ambient lighting update
            const visibleFirst = galleryItems.find(el => !el.classList.contains('is-filtered-out'));
            if (visibleFirst && ambientLayer) {
              const titleEl = visibleFirst.querySelector('.gallery-item-title');
              const slug = titleEl ? titleEl.textContent.trim().toLowerCase().replace(/\s+/g, '-') : '';
              if (itemColors[slug]) {
                ambientLayer.style.backgroundColor = itemColors[slug];
              }
            }

            // Step 3: Unveil grid smoothly with 60fps golden spring wave (300ms)
            animate(galleryGrid, {
              opacity: [0.15, 1],
              duration: 250,
              ease: 'outQuart'
            });

            const activeItems = galleryItems.filter(el => !el.classList.contains('is-filtered-out'));
            animate(activeItems, {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 400,
              delay: stagger(50),
              ease: 'outQuart'
            });
          }
        });
      } else {
        // Fallback without anime
        galleryItems.forEach(item => {
          const itemCat = item.getAttribute('data-category');
          const matches = targetCategory === 'all' || itemCat === targetCategory;
          if (matches) {
            item.classList.remove('is-filtered-out');
          } else {
            item.classList.add('is-filtered-out');
          }
        });
        galleryGrid.scrollLeft = 0;
      }
    }

    // -------------------------------------------------------------------------
    // 4. Tab Click Handler
    // -------------------------------------------------------------------------
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateIndicator(tab, false);
        
        // Auto-center active tab in mobile horizontal scroll view
        try {
          tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch(err) {}

        const cat = tab.getAttribute('data-category') || 'all';
        filterGallery(cat);
      });
    });

    // -------------------------------------------------------------------------
    // 5. Language Switch Observer
    // -------------------------------------------------------------------------
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        setTimeout(() => {
          updateStatusAndWatermark(activeCategory);
          const cur = document.querySelector('.curator-tab.active');
          if (cur) updateIndicator(cur, true);
        }, 120);
      });
    }

        // -------------------------------------------------------------------------
    // 6. Zero-Scroll Window: Seamless Wheel to Horizontal Stroll
    // -------------------------------------------------------------------------
    window.addEventListener('wheel', (e) => {
      if (!galleryGrid) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        galleryGrid.scrollLeft += e.deltaY * 1.5;
      }
    }, { passive: false });

    // -------------------------------------------------------------------------
    // 7. Masterpiece Opening Entrance
    // -------------------------------------------------------------------------
    if (animate) {
      animate(galleryItems, {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.95, 1],
        delay: stagger(80, { start: 180 }),
        duration: 750,
        ease: 'outQuart'
      });
    }
  }
})();
