/**
 * ============================================================================
 * THE ARTIST ATELIER - LIVE CANVAS ENGINE (studio-canvas.js)
 * Habiba Motif Art Gallery - Tactile Studio Painting Experience
 * ============================================================================
 * Features:
 * - Ultra-lightweight, 60 FPS zero-latency drawing engine with PointerEvents.
 * - Authentic painterly brushes: Charcoal, Oil Impasto, Watercolor, Palette Knife, Eraser.
 * - Pressure & speed dynamics with smooth Bezier interpolation.
 * - 20-step Undo / Redo history stack.
 * - High-resolution artwork export with artist studio hallmark.
 * - Retina display support with native devicePixelRatio scaling.
 */

(function () {
  'use strict';

  function initStudioCanvas() {
    const canvas = document.getElementById('paintCanvas');
    const wrapper = document.querySelector('.canvas-wrapper');
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // State Variables
    let isDrawing = false;
    let currentTool = 'charcoal'; // charcoal, oil, watercolor, knife, eraser
    let currentColor = '#1c1a20'; // Default raw charcoal
    let currentSize = 12;
    let currentOpacity = 0.85;

    // Stroke points for smooth interpolation
    let points = [];
    let lastPoint = null;
    let lastTime = 0;

    // History stack (Undo / Redo)
    const undoStack = [];
    const redoStack = [];
    const MAX_HISTORY = 20;

    // Canvas Resizing with Retina DPR
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssWidth = 0;
    let cssHeight = 0;

    function resizeCanvas() {
      // Calculate responsive dimensions taking into account header and bottom dock
      const headerEl = document.getElementById('siteHeader');
      const dockEl = document.querySelector('.studio-dock');
      const headerH = headerEl ? headerEl.offsetHeight : (window.innerWidth <= 768 ? 85 : 65);
      const dockH = dockEl ? dockEl.offsetHeight : 55;

      const vpHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const vpWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;

      // Safe breathing room between header and bottom dock so canvas never crowds or pushes the dock
      const verticalPadding = window.innerWidth <= 768 ? 24 : 45;
      const horizontalPadding = window.innerWidth <= 768 ? 16 : 50;

      const maxAvailableH = Math.max(vpHeight - headerH - dockH - verticalPadding, 170);
      const maxAvailableW = Math.min(vpWidth - horizontalPadding, 1100);

      // Classic golden proportion canvas ratio (~4:3)
      const ratio = window.innerWidth <= 768 ? 0.72 : 0.68;
      let w = maxAvailableW;
      let h = w * ratio;
      if (h > maxAvailableH) {
        h = maxAvailableH;
        w = h / ratio;
      }

      cssWidth = Math.floor(w);
      cssHeight = Math.floor(h);

      wrapper.style.width = cssWidth + 'px';
      wrapper.style.height = cssHeight + 'px';

      // Save current artwork content before resizing
      let prevData = null;
      if (canvas.width > 0 && canvas.height > 0) {
        try {
          prevData = canvas.toDataURL();
        } catch (e) {}
      }

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';

      ctx.scale(dpr, dpr);

      // Fill primed canvas background
      fillCanvasBackground();

      if (prevData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
        };
        img.src = prevData;
      } else {
        saveState();
      }
    }

    // Fill natural warm primed linen canvas base
    function fillCanvasBackground() {
      ctx.fillStyle = '#fbf9f5';
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      // Subtle textured linen grain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
      for (let i = 0; i < cssWidth; i += 4) {
        ctx.fillRect(i, 0, 1, cssHeight);
      }
      for (let j = 0; j < cssHeight; j += 4) {
        ctx.fillRect(0, j, cssWidth, 1);
      }
    }

    resizeCanvas();
    const handleViewportResize = () => {
      clearTimeout(window._studioResizeTimer);
      window._studioResizeTimer = setTimeout(resizeCanvas, 150);
    };
    window.addEventListener('resize', handleViewportResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize, { passive: true });
    }

    // History Management
    function saveState() {
      if (undoStack.length >= MAX_HISTORY) {
        undoStack.shift();
      }
      undoStack.push(canvas.toDataURL());
      redoStack.length = 0; // Clear redo on new action
      updateHistoryButtons();
    }

    function undo() {
      if (undoStack.length <= 1) return;
      redoStack.push(undoStack.pop());
      const state = undoStack[undoStack.length - 1];
      restoreState(state);
      updateHistoryButtons();
    }

    function redo() {
      if (redoStack.length === 0) return;
      const state = redoStack.pop();
      undoStack.push(state);
      restoreState(state);
      updateHistoryButtons();
    }

    function restoreState(dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
      };
      img.src = dataUrl;
    }

    function updateHistoryButtons() {
      const undoBtn = document.getElementById('btnUndo');
      const redoBtn = document.getElementById('btnRedo');
      if (undoBtn) undoBtn.style.opacity = undoStack.length > 1 ? '1' : '0.4';
      if (redoBtn) redoBtn.style.opacity = redoStack.length > 0 ? '1' : '0.4';
    }

    // Helper: Convert client coordinates to canvas internal coordinates
    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5
      };
    }

    // =========================================================================
    // AUTHENTIC BRUSH STROKE RENDERERS
    // =========================================================================

    // 1. Raw Charcoal & Graphite
    function drawCharcoal(p1, p2, speed) {
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const steps = Math.max(1, Math.floor(dist * 1.5));
      const baseR = currentSize * (0.8 + p2.pressure * 0.4);

      ctx.save();
      ctx.globalAlpha = Math.min(1.0, currentOpacity * 0.7);
      ctx.fillStyle = currentColor;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = p1.x + (p2.x - p1.x) * t;
        const y = p1.y + (p2.y - p1.y) * t;

        // Charcoal core
        ctx.beginPath();
        ctx.arc(x, y, baseR * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Organic charcoal powder granules along the edges
        const grainCount = 3;
        for (let g = 0; g < grainCount; g++) {
          const angle = Math.random() * Math.PI * 2;
          const offset = Math.random() * baseR * 0.9;
          const gx = x + Math.cos(angle) * offset;
          const gy = y + Math.sin(angle) * offset;
          const grainR = Math.random() * 1.2 + 0.5;

          ctx.fillRect(gx, gy, grainR, grainR);
        }
      }
      ctx.restore();
    }

    // 2. Thick Oil Impasto
    function drawOil(p1, p2, speed) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const strokeW = currentSize * (0.9 + p2.pressure * 0.5);

      // Deep rich base stroke
      ctx.globalAlpha = currentOpacity;
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeW;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Bristle striations & wet specular edge
      ctx.globalAlpha = currentOpacity * 0.28;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, strokeW * 0.22);
      ctx.beginPath();
      ctx.moveTo(p1.x - 1, p1.y - 1);
      ctx.lineTo(p2.x - 1, p2.y - 1);
      ctx.stroke();

      // Impasto shadow ridge
      ctx.globalAlpha = currentOpacity * 0.35;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = Math.max(1.5, strokeW * 0.2);
      ctx.beginPath();
      ctx.moveTo(p1.x + 1.5, p1.y + 1.5);
      ctx.lineTo(p2.x + 1.5, p2.y + 1.5);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Fluid Watercolor Bleed
    function drawWatercolor(p1, p2, speed) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const strokeW = currentSize * 1.8;

      // Soft overlapping translucent layers simulating water absorption
      ctx.globalAlpha = currentOpacity * 0.08;
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeW * 1.4;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.globalAlpha = currentOpacity * 0.16;
      ctx.lineWidth = strokeW;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.globalAlpha = currentOpacity * 0.28;
      ctx.lineWidth = strokeW * 0.55;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.restore();
    }

    // 4. Palette Knife (Flat Chisel Blade)
    function drawKnife(p1, p2, speed) {
      ctx.save();
      ctx.globalAlpha = currentOpacity * 0.95;
      ctx.fillStyle = currentColor;

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 4;
      const bladeW = currentSize * 2.2;
      const bladeH = currentSize * 0.7;

      ctx.translate(p2.x, p2.y);
      ctx.rotate(angle);
      ctx.fillRect(-bladeW / 2, -bladeH / 2, bladeW, bladeH);

      // Knife blade edge sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(-bladeW / 2, -bladeH / 2, bladeW, 1.5);

      ctx.restore();
    }

    // 5. Eraser (Restores Canvas Texture)
    function drawEraser(p1, p2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#fbf9f5';
      ctx.lineWidth = currentSize * 2.2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.restore();
    }

    // Master Stroke Dispatcher
    function renderSegment(p1, p2, speed) {
      switch (currentTool) {
        case 'charcoal':
          drawCharcoal(p1, p2, speed);
          break;
        case 'oil':
          drawOil(p1, p2, speed);
          break;
        case 'watercolor':
          drawWatercolor(p1, p2, speed);
          break;
        case 'knife':
          drawKnife(p1, p2, speed);
          break;
        case 'eraser':
          drawEraser(p1, p2);
          break;
        default:
          drawOil(p1, p2, speed);
      }
    }

    // Pointer Event Listeners (Mouse, Touch, Stylus)
    function startStroke(e) {
      isDrawing = true;
      const pos = getCanvasPos(e);
      points = [pos];
      lastPoint = pos;
      lastTime = performance.now();

      // Render initial dot
      renderSegment(pos, { x: pos.x + 0.1, y: pos.y + 0.1, pressure: pos.pressure }, 0);

      // Trigger 3D studio background impulse
      if (window.studio3dEmitDraw) {
        window.studio3dEmitDraw(pos.x, pos.y, currentColor);
      }
    }

    function moveStroke(e) {
      if (!isDrawing) return;

      const pos = getCanvasPos(e);
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
      const speed = dist / dt;

      points.push(pos);

      // Emit subtle 3D background pulse periodically during stroke
      if (points.length % 5 === 0 && window.studio3dEmitDraw) {
        window.studio3dEmitDraw(pos.x, pos.y, currentColor);
      }

      // Smooth Bezier Curve Interpolation
      if (points.length >= 3) {
        const p0 = points[points.length - 3];
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];

        const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2, pressure: (p0.pressure + p1.pressure) / 2 };
        const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, pressure: (p1.pressure + p2.pressure) / 2 };

        const steps = Math.max(2, Math.floor(dist));
        for (let t = 0; t <= 1; t += 1 / steps) {
          const x = (1 - t) * (1 - t) * mid1.x + 2 * (1 - t) * t * p1.x + t * t * mid2.x;
          const y = (1 - t) * (1 - t) * mid1.y + 2 * (1 - t) * t * p1.y + t * t * mid2.y;
          const pressure = mid1.pressure + (mid2.pressure - mid1.pressure) * t;

          renderSegment(lastPoint, { x, y, pressure }, speed);
          lastPoint = { x, y, pressure };
        }
      } else {
        renderSegment(lastPoint, pos, speed);
        lastPoint = pos;
      }

      lastTime = now;
    }

    function endStroke() {
      if (!isDrawing) return;
      isDrawing = false;
      points = [];
      lastPoint = null;
      saveState();
    }

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      startStroke(e);
    });

    canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      moveStroke(e);
    });

    canvas.addEventListener('pointerup', (e) => {
      e.preventDefault();
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      endStroke();
    });

    canvas.addEventListener('pointercancel', (e) => {
      endStroke();
    });

    // =========================================================================
    // STUDIO TOOLBAR & CONTROLS UI
    // =========================================================================

    // Tool Buttons (Charcoal, Oil, Watercolor, Knife, Eraser)
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.getAttribute('data-tool');
      });
    });

    // Color Swatches
    document.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = swatch.getAttribute('data-color');
      });
    });

    // Native Color Picker Input
    const colorPickerInput = document.getElementById('customColorPicker');
    if (colorPickerInput) {
      colorPickerInput.addEventListener('input', (e) => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        currentColor = e.target.value;
      });
    }

    // Size Slider
    const sizeSlider = document.getElementById('sizeSlider');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value, 10);
      });
    }

    // Opacity Slider
    const opacitySlider = document.getElementById('opacitySlider');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        currentOpacity = parseInt(e.target.value, 10) / 100;
      });
    }

    // Undo / Redo Buttons
    document.getElementById('btnUndo')?.addEventListener('click', undo);
    document.getElementById('btnRedo')?.addEventListener('click', redo);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    });

    // Clear Canvas
    document.getElementById('btnClear')?.addEventListener('click', () => {
      const isArabic = document.body.getAttribute('dir') === 'rtl';
      const msg = isArabic ? 'هل ترغب في مسح الكانفاس والبدء من جديد؟' : 'Clear canvas and start fresh?';
      if (confirm(msg)) {
        fillCanvasBackground();
        saveState();
      }
    });

    // Save / Download Artwork (Exports High-Res Image with Artist Hallmark)
    const btnSave = document.getElementById('btnSave');
    const saveModal = document.getElementById('studioSaveModal');
    const saveModalImg = document.getElementById('saveModalImg');
    const saveModalClose = document.getElementById('saveModalClose');
    const saveModalBackdrop = document.getElementById('saveModalBackdrop');
    const saveModalShareBtn = document.getElementById('saveModalShareBtn');
    const saveModalDirectBtn = document.getElementById('saveModalDirectBtn');

    let currentExportBlob = null;
    let currentExportFilename = '';

    function closeSaveModal() {
      if (!saveModal) return;
      saveModal.classList.remove('active');
      saveModal.setAttribute('aria-hidden', 'true');
    }

    function openSaveModal(dataUrl, blob, filename) {
      if (!saveModal) return;
      currentExportBlob = blob;
      currentExportFilename = filename;
      if (saveModalImg) saveModalImg.src = dataUrl;
      saveModal.classList.add('active');
      saveModal.setAttribute('aria-hidden', 'false');
    }

    saveModalClose?.addEventListener('click', closeSaveModal);
    saveModalBackdrop?.addEventListener('click', closeSaveModal);

    function triggerDirectDownload(blob, filename) {
      try {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1200);
      } catch (err) {
        console.warn('Direct download error:', err);
      }
    }

    async function handleShareFile(file) {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Habiba Motif Artwork',
            text: 'Created in Habiba Motif Art Studio'
          });
          showToast();
          return true;
        } catch (err) {
          if (err.name === 'AbortError') return true; // User dismissed share sheet
          console.warn('Web Share failed:', err);
        }
      }
      return false;
    }

    saveModalShareBtn?.addEventListener('click', async () => {
      if (!currentExportBlob) return;
      const file = new File([currentExportBlob], currentExportFilename, { type: 'image/png' });
      const shared = await handleShareFile(file);
      if (!shared) {
        triggerDirectDownload(currentExportBlob, currentExportFilename);
        showToast();
      }
    });

    saveModalDirectBtn?.addEventListener('click', () => {
      if (!currentExportBlob) return;
      triggerDirectDownload(currentExportBlob, currentExportFilename);
      showToast();
    });

    btnSave?.addEventListener('click', () => {
      // Create off-screen export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const expCtx = exportCanvas.getContext('2d');

      // Draw original canvas
      expCtx.drawImage(canvas, 0, 0);

      // Stamp Artist Studio Hallmark in the corner
      const isArabic = document.body.getAttribute('dir') === 'rtl';
      expCtx.save();
      expCtx.font = `600 ${Math.floor(14 * dpr)}px 'Plus Jakarta Sans', sans-serif`;
      expCtx.fillStyle = 'rgba(25, 22, 30, 0.45)';
      expCtx.textAlign = isArabic ? 'left' : 'right';
      const stampX = isArabic ? 24 * dpr : exportCanvas.width - 24 * dpr;
      const stampY = exportCanvas.height - 20 * dpr;
      expCtx.fillText('Habiba Motif Gallery • 2026', stampX, stampY);
      expCtx.restore();

      const filename = `HabibaMotif_Artwork_${Date.now()}.png`;

      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        currentExportBlob = blob;
        currentExportFilename = filename;
        const dataUrl = exportCanvas.toDataURL('image/png');
        const file = new File([blob], filename, { type: 'image/png' });

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (window.innerWidth <= 800);
        const isInAppBrowser = /Instagram|FBAN|FBAV|Line|TikTok/i.test(navigator.userAgent);

        // Try Web Share API directly on mobile if supported
        if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Habiba Motif Artwork',
              text: 'Created in Habiba Motif Art Studio'
            });
            showToast();
            return;
          } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('Share sheet dismissed, falling back to modal:', err);
          }
        }

        // For mobile or in-app browsers, open the visual Save Modal so user can long-press to save to camera roll
        if (isMobile || isInAppBrowser) {
          openSaveModal(dataUrl, blob, filename);
          showToast();
        } else {
          // Desktop: trigger download directly
          triggerDirectDownload(blob, filename);
          showToast();
        }
      }, 'image/png');
    });

    function showToast() {
      const toast = document.getElementById('studioToast');
      if (!toast) return;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudioCanvas);
  } else {
    initStudioCanvas();
  }
})();
