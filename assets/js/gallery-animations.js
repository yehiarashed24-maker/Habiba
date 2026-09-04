/**
 * Habiba Motif Art Gallery - Original Native Stroll & Dynamic Ambient Lighting
 * 100% Native 60fps Scroll Snap Physics - Zero-Hang / Zero-Hijacking
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initOriginalGallery();
  });

  function initOriginalGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const ambientLayer = document.querySelector('.gallery-ambient-layer');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const tabs = document.querySelectorAll('.curator-tab');
    const indicator = document.getElementById('dockIndicator');
    const watermark = document.getElementById('galleryWatermark');

    if (!galleryGrid || !galleryItems.length) return;

    // 1. Signature Ambient Colors Per Artwork (Exact original palette)
    const colors = [
      "#3b2b1f", // 1. Quiet Companionship (Brown)
      "#4a2912", // 2. Whispers of Copper (Copper/Orange)
      "#112738", // 3. Coastal dreams (Deep Blue)
      "#3d2447", // 4. Faces of the mind (Purple)
      "#4a1919", // 5. Forgotten Performers (Dark Red)
      "#3b2718", // 6. Resting vessels (Clay)
      "#0f1a38", // 7. Midnight Gondola (Night Blue)
      "#183329", // 8. Mirror of mountains (Forest Green)
      "#113622", // 9. Nostalgia in green (Deep Green)
      "#423311", // 10. Angles of the soul (Gold)
      "#3d1330", // 11. Kaleidoscope City (Magenta)
      "#211d42"  // 12. The Quiet Hour (Twilight)
    ];

    // 2. Exact Original Ambient Lighting via IntersectionObserver ("كل لوحه بي اضائه وراها")
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const index = galleryItems.indexOf(entry.target);
          if (colors[index] && ambientLayer) {
            ambientLayer.style.backgroundColor = colors[index];
          }
        }
      });
    }, {
      root: galleryGrid,
      threshold: 0.5
    });

    galleryItems.forEach(item => observer.observe(item));

    // 3. Category Tabs & Indicator (Clean, Lightweight, Mobile-Optimized)
    function updateIndicator(activeTab) {
      if (!indicator || !activeTab) return;
      indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      indicator.style.width = `${activeTab.offsetWidth}px`;
    }

    const watermarkTitles = {
      all: { en: 'Habiba Motif', ar: 'حبيبة موتيف' },
      watercolor: { en: 'Watercolor Atelier', ar: 'ألوان مائية' },
      cubism: { en: 'Cubism Studies', ar: 'المدرسة التكعيبية' },
      distortion: { en: 'Distortion Expressions', ar: 'تشويه فني' },
      realistic: { en: 'Realistic Gallery', ar: 'المدرسة الواقعية' },
      sketches: { en: 'Original Sketches', ar: 'اسكتشات ورقية' }
    };

    function updateWatermark(category) {
      if (!watermark) return;
      const isAr = document.body.getAttribute('dir') === 'rtl';
      const titles = watermarkTitles[category] || watermarkTitles.all;
      watermark.textContent = isAr ? titles.ar : titles.en;
    }

    function filterGallery(category) {
      updateWatermark(category);

      let firstMatch = null;
      galleryItems.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        const match = category === 'all' || itemCat === category;
        if (match) {
          item.classList.remove('filtered-out', 'is-filtered-out');
          item.style.display = 'flex';
          if (!firstMatch) firstMatch = item;
        } else {
          item.classList.add('filtered-out', 'is-filtered-out');
          item.style.display = 'none';
        }
      });

      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        galleryGrid.scrollLeft = 0;
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateIndicator(tab);

        // Smoothly center the tapped tab in the horizontal scroll container on mobile
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

        const category = tab.getAttribute('data-category') || 'all';
        filterGallery(category);
      });
    });

    const activeTab = document.querySelector('.curator-tab.active') || tabs[0];
    if (activeTab) setTimeout(() => updateIndicator(activeTab), 100);

    window.addEventListener('resize', () => {
      const cur = document.querySelector('.curator-tab.active');
      if (cur) updateIndicator(cur);
    }, { passive: true });

    // Language switch observer
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        setTimeout(() => {
          const curTab = document.querySelector('.curator-tab.active');
          if (curTab) {
            updateIndicator(curTab);
            updateWatermark(curTab.getAttribute('data-category') || 'all');
          }
        }, 120);
      });
    }
  }
})();
