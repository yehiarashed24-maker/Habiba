/**
 * ============================================================================
 * HABIBA MOTIF GALLERY - INTERACTIVE 3D PAINTERLY CANVAS BACKGROUND
 * studio-3d-bg.js
 * Rich Oil Impasto Pigments, Fluid Blending, Canvas Texture & 3D Parallax Depth
 * (Zero space grid / 100% Authentic Fine Art Oil Canvas)
 * ============================================================================
 */

(function () {
  'use strict';

  function initStudio3dBackground() {
    const canvasElem = document.getElementById('studio3dBg');
    if (!canvasElem || typeof THREE === 'undefined') {
      console.warn('Three.js or studio3dBg canvas not found.');
      return;
    }

    // -------------------------------------------------------------------------
    // 1. THREE.JS SCENE & CAMERA SETUP
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasElem,
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // -------------------------------------------------------------------------
    // 2. PAINTERLY OIL CANVAS SHADER (GLSL)
    // -------------------------------------------------------------------------
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec2 u_mouse_vel;
      uniform vec3 u_burst_color;
      uniform float u_burst_intensity;

      varying vec2 vUv;
      varying vec3 vPosition;

      // 2D Simplex Noise Function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x  = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float f = 0.0;
        float w = 0.5;
        for (int i = 0; i < 5; i++) {
          f += w * snoise(p);
          p *= 2.02;
          w *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 uv = vUv;
        vec2 aspectUV = uv;
        aspectUV.x *= (u_resolution.x / u_resolution.y);

        // Interactive mouse palette-knife swirl influence
        vec2 mUV = u_mouse;
        mUV.x *= (u_resolution.x / u_resolution.y);
        float distToMouse = length(aspectUV - mUV);
        
        // Fluid paint swirl following mouse motion
        float mouseInfluence = smoothstep(0.48, 0.0, distToMouse);
        vec2 swirlDir = vec2(-(aspectUV.y - mUV.y), aspectUV.x - mUV.x);
        vec2 mouseWarp = swirlDir * mouseInfluence * 0.22 + u_mouse_vel * mouseInfluence * 0.35;

        vec2 p = aspectUV * 2.1 + mouseWarp;
        float t = u_time * 0.09;

        // Multi-octave domain warping simulating rich oil impasto layers
        vec2 q = vec2(
          fbm(p + vec2(0.0, t * 0.28)),
          fbm(p + vec2(5.2, 1.3 - t * 0.22))
        );

        vec2 r = vec2(
          fbm(p + 3.8 * q + vec2(1.7, 9.2 + t * 0.16)),
          fbm(p + 3.8 * q + vec2(8.3, 2.8 - t * 0.18))
        );

        float paintPattern = fbm(p + 3.6 * r);

        // =====================================================================
        // AUTHENTIC ART GALLERY PIGMENT PALETTE (Zero Gold)
        // =====================================================================
        // 1. Deep Studio Canvas Base (Rich Charcoal Umber)
        vec3 colCharcoal = vec3(0.07, 0.065, 0.09);
        
        // 2. Ultramarine Cobalt Blue (Habiba Signature Blues)
        vec3 colCobalt = vec3(0.12, 0.28, 0.54);
        
        // 3. Deep Venetian Rose / Crimson Blush
        vec3 colRose = vec3(0.62, 0.22, 0.36);
        
        // 4. Burnt Terracotta & Sienna Ochre
        vec3 colTerracotta = vec3(0.68, 0.36, 0.22);
        
        // 5. Raw Belgian Linen & Titanium White Highlights
        vec3 colLinen = vec3(0.90, 0.87, 0.82);
        
        // 6. Deep Sage Olive Green
        vec3 colOlive = vec3(0.22, 0.35, 0.24);

        // Natural oil blending across warped coordinate layers
        vec3 color = mix(colCharcoal, colCobalt, smoothstep(-0.35, 0.25, q.x));
        color = mix(color, colRose, smoothstep(-0.15, 0.55, r.y));
        color = mix(color, colTerracotta, smoothstep(0.05, 0.62, q.y));
        color = mix(color, colOlive, smoothstep(0.18, 0.58, r.x) * 0.5);
        color = mix(color, colLinen, smoothstep(0.42, 0.85, paintPattern) * 0.38);

        // Interactive drawing bloom (infused from user's live painting stroke)
        if (u_burst_intensity > 0.01) {
          float bDist = length(aspectUV - mUV);
          float burstMask = smoothstep(0.55, 0.0, bDist) * u_burst_intensity;
          color = mix(color, u_burst_color, burstMask * 0.72);
        }

        // =====================================================================
        // REAL TACTILE BELGIAN LINEN WEAVE TEXTURE
        // =====================================================================
        float weaveX = sin(uv.x * u_resolution.x * 0.65);
        float weaveY = sin(uv.y * u_resolution.y * 0.65);
        float canvasWeave = (weaveX * weaveY) * 0.038;
        color += vec3(canvasWeave);

        // Impasto Oil Paint Ridge Lighting (3D specular sheen on ridges)
        float ridgeHeight = paintPattern * 1.35 + canvasWeave * 2.5;
        float ridgeSpecular = pow(clamp(ridgeHeight, 0.0, 1.0), 3.5) * 0.16;
        color += vec3(ridgeSpecular);

        // Soft Studio Vignette Lighting
        float vignette = smoothstep(1.35, 0.35, length(uv - 0.5));
        color *= (0.62 + 0.38 * vignette);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // -------------------------------------------------------------------------
    // 3. UNIFORMS & MATERIAL
    // -------------------------------------------------------------------------
    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_mouse_vel: { value: new THREE.Vector2(0.0, 0.0) },
      u_burst_color: { value: new THREE.Color(0xf5ede4) },
      u_burst_intensity: { value: 0.0 }
    };

    const canvasMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      depthWrite: false
    });

    // Fullscreen 3D Canvas Quad in perspective
    const planeGeo = new THREE.PlaneGeometry(24, 15);
    const canvasMesh = new THREE.Mesh(planeGeo, canvasMaterial);
    canvasMesh.position.set(0, 0, -2);
    scene.add(canvasMesh);

    // -------------------------------------------------------------------------
    // 4. MOUSE TRACKING, 3D PARALLAX & FLUID VELOCITY
    // -------------------------------------------------------------------------
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let currentMouseX = 0.5;
    let currentMouseY = 0.5;

    let targetRotX = 0;
    let targetRotY = 0;

    let lastRawX = window.innerWidth / 2;
    let lastRawY = window.innerHeight / 2;
    let lastTime = performance.now();
    let mouseVelX = 0;
    let mouseVelY = 0;

    window.addEventListener('mousemove', (e) => {
      const normX = e.clientX / window.innerWidth;
      const normY = 1.0 - (e.clientY / window.innerHeight);

      targetMouseX = normX;
      targetMouseY = normY;

      // 3D Canvas tilt angles
      targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.16;
      targetRotX = (e.clientY / window.innerHeight - 0.5) * -0.12;

      // Velocity calculation
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      mouseVelX = ((e.clientX - lastRawX) / dt) * 0.005;
      mouseVelY = -((e.clientY - lastRawY) / dt) * 0.005;

      lastRawX = e.clientX;
      lastRawY = e.clientY;
      lastTime = now;
    }, { passive: true });

    // Touch support for tablets/mobile
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetMouseX = touch.clientX / window.innerWidth;
        targetMouseY = 1.0 - (touch.clientY / window.innerHeight);
      }
    }, { passive: true });

    // Live painting stroke hook from studio-canvas.js
    window.studio3dEmitDraw = function (canvasX, canvasY, hexColor) {
      if (hexColor) {
        try {
          uniforms.u_burst_color.value.set(hexColor);
        } catch (e) {}
      }
      uniforms.u_burst_intensity.value = 1.0;
    };

    // -------------------------------------------------------------------------
    // 5. ANIMATION & 3D PARALLAX LOOP (LOCKED AT 60 FPS)
    // -------------------------------------------------------------------------
    const clock = new THREE.Clock();
    let isVisible = true;

    function renderLoop() {
      if (!isVisible) {
        requestAnimationFrame(renderLoop);
        return;
      }

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update shader time
      uniforms.u_time.value = elapsedTime;

      // Smooth mouse interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.065;
      currentMouseY += (targetMouseY - currentMouseY) * 0.065;
      uniforms.u_mouse.value.set(currentMouseX, currentMouseY);

      // Decaying velocity
      mouseVelX *= 0.92;
      mouseVelY *= 0.92;
      uniforms.u_mouse_vel.value.set(mouseVelX, mouseVelY);

      // Decaying burst intensity
      if (uniforms.u_burst_intensity.value > 0.005) {
        uniforms.u_burst_intensity.value -= delta * 1.25;
      } else {
        uniforms.u_burst_intensity.value = 0.0;
      }

      // Smooth 3D Canvas Mesh Tilt & Perspective
      canvasMesh.rotation.y += (targetRotY - canvasMesh.rotation.y) * 0.045;
      canvasMesh.rotation.x += (targetRotX - canvasMesh.rotation.x) * 0.045;

      renderer.render(scene, camera);
      requestAnimationFrame(renderLoop);
    }

    // -------------------------------------------------------------------------
    // 6. RESIZE & VISIBILITY HANDLERS
    // -------------------------------------------------------------------------
    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Match plane to camera view frustum at z = -2
      const dist = camera.position.z - canvasMesh.position.z;
      const vFov = (camera.fov * Math.PI) / 180;
      const planeH = 2 * Math.tan(vFov / 2) * dist;
      const planeW = planeH * camera.aspect;
      canvasMesh.scale.set(planeW / 24, planeH / 15, 1);

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      uniforms.u_resolution.value.set(w, h);
    }

    window.addEventListener('resize', onResize, { passive: true });
    onResize();

    document.addEventListener('visibilitychange', () => {
      isVisible = document.visibilityState === 'visible';
    });

    requestAnimationFrame(renderLoop);
  }

  // Self-initialize on DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudio3dBackground);
  } else {
    initStudio3dBackground();
  }
})();
