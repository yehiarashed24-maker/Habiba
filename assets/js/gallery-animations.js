/**
 * Habiba Motif Art Gallery - Original Native Stroll & Dynamic Ambient Lighting
 * 100% Native 60fps Scroll Snap Physics - Zero-Hang / Zero-Hijacking
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    await loadDynamicArtworks();
    initOriginalGallery();
  });

  async function loadDynamicArtworks() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    let data = null;
    const localVault = localStorage.getItem('hm_gallery_artworks');
    if (localVault) {
      try {
        const parsed = JSON.parse(localVault);
        if (Array.isArray(parsed) && parsed.length > 0) {
          data = parsed;
        }
      } catch (e) {}
    }

    if (!data) {
      try {
        const res = await fetch('assets/data/artworks.json');
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {}
    }

    if (!data || !data.length) return;

    // Render dynamic items into grid
    galleryGrid.innerHTML = '';
    data.forEach((art, idx) => {
      const a = document.createElement('a');
      a.href = art.link || '#';
      a.className = 'gallery-item';
      a.setAttribute('data-category', (art.category || 'watercolor').toLowerCase());
      if (art.ambientColor) {
        a.setAttribute('data-ambient-color', art.ambientColor);
      }
      if (art.link && art.link !== '#') {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      const catKey = `cat_${(art.category || 'watercolor').toLowerCase()}`;
      const imgSrc = art.image || art.fallbackImage || 'assets/images/logo.jpg';
      const fallbackAttr = art.fallbackImage ? `onerror="this.onerror=null;this.src='${art.fallbackImage}'"` : '';

      a.innerHTML = `
        <img src="${imgSrc}" ${fallbackAttr} alt="${escapeHtml(art.title)}" class="gallery-item-img" ${idx === 0 ? 'loading="eager"' : 'loading="lazy"'}>
        <div class="gallery-item-info">
          <span class="gallery-item-category-tag" data-i18n="${catKey}">${escapeHtml(art.category || 'Artwork')}</span>
          <h3 class="gallery-item-title">${escapeHtml(art.title)}</h3>
          <span class="gallery-item-artist">${escapeHtml(art.artist || 'Habiba maarek')}</span>
          <span class="gallery-item-price">${escapeHtml(art.price || '')}</span>
        </div>
      `;
      galleryGrid.appendChild(a);
    });

    // Translate dynamic category tags if i18n engine is active
    if (window.setLanguage && window.currentLang) {
      window.setLanguage(window.currentLang);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initOriginalGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const ambientLayer = document.querySelector('.gallery-ambient-layer');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const tabs = document.querySelectorAll('.curator-tab');
    const indicator = document.getElementById('dockIndicator');
    const watermark = document.getElementById('galleryWatermark');

    if (!galleryGrid || !galleryItems.length) return;

    // 1. Signature Ambient Colors Per Artwork
    const defaultColors = [
      "#3b2b1f", "#4a2912", "#112738", "#3d2447",
      "#4a1919", "#3b2718", "#0f1a38", "#183329",
      "#113622", "#423311", "#3d1330", "#211d42"
    ];

    // 2. Ambient Lighting via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const index = galleryItems.indexOf(entry.target);
          const dynamicColor = entry.target.getAttribute('data-ambient-color');
          const finalColor = dynamicColor || defaultColors[index % defaultColors.length] || '#3b2b1f';
          if (ambientLayer) {
            ambientLayer.style.backgroundColor = finalColor;
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
