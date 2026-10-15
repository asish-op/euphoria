'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * PixelSculpt — an image rebuilt as a relief of instanced tiles that ripple under the pointer.
 *
 * This is an original implementation of the same idea as React Bits Pro's "Pixel Sculpt"
 * (that component is license-gated). Swap it for the Pro version if you install it; the props here
 * are intentionally close: src, columns, depth, tileGap.
 *
 * Pass `analyserRef` (a ref holding a Web Audio AnalyserNode) and the relief dances to the music:
 * bass drives a travelling swell, beat ripples and light pulses; the spectrum maps outward from the
 * centre, like a circular equalizer.
 */
const SPEC = 48; // spectrum bands mapped onto concentric rings

export default function PixelSculpt({
  src,
  columns = 96,
  depth = 2.4,
  tileGap = 0.1,
  rippleColor = '#e879f9',
  fit = 1.18,
  analyserRef,
  className = 'relative h-full w-full'
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 720;
    const cols = isSmall ? Math.round(columns * 0.65) : columns;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return undefined; // No WebGL: the container keeps its static poster background.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    const stage = new THREE.Group();
    scene.add(stage);

    // Lighting: cool key, magenta pointer light, violet rim — the light does most of the 3D work.
    scene.add(new THREE.AmbientLight(0x8b7bd8, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-6, 8, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7c3aed, 2.2);
    rim.position.set(8, -4, 3);
    scene.add(rim);
    const glow = new THREE.PointLight(new THREE.Color(rippleColor), 0, 14, 1.4);
    glow.position.set(0, 0, 3);
    stage.add(glow);

    const state = {
      ready: false,
      visible: true,
      rows: 1,
      width: 16,
      height: 10,
      count: 0,
      colors: null,
      base: null,
      dist: null,
      ring: null,
      edge: null,
      material: null,
      mesh: null,
      dispose: [],
      pointer: { x: 0, y: 0, presence: 0, target: 0, inside: false },
      tilt: { x: 0, y: 0, tx: 0, ty: 0 },
      ripples: []
    };

    const buildFromImage = img => {
      // On phones, centre-crop to a square: a wide slab would leave a tall portrait frame mostly empty.
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (isSmall) {
        const side = Math.min(sw, sh);
        sx = (sw - side) / 2;
        sy = (sh - side) / 2;
        sw = side;
        sh = side;
      }
      const aspect = sw / sh;
      const rows = Math.max(8, Math.round(cols / aspect));
      state.rows = rows;
      state.width = 16;
      state.height = (16 * rows) / cols;

      const sampler = document.createElement('canvas');
      sampler.width = cols;
      sampler.height = rows;
      const ctx = sampler.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      const pixels = ctx.getImageData(0, 0, cols, rows).data;

      const count = cols * rows;
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.28 });
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const base = new Float32Array(count);
      const dist = new Float32Array(count);
      const ring = new Uint8Array(count);
      const edge = new Float32Array(count);
      const cell = state.width / cols;
      const color = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const r = pixels[i * 4] / 255;
        const g = pixels[i * 4 + 1] / 255;
        const b = pixels[i * 4 + 2] / 255;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        base[i] = Math.pow(lum, 1.25) * depth;
        // Distance from the centre of the slab: bass sits in the middle, treble rings the edge.
        const px = -state.width / 2 + cell / 2 + (i % cols) * cell;
        const py = state.height / 2 - cell / 2 - Math.floor(i / cols) * cell;
        dist[i] = Math.hypot(px, py);
        // Tiles shrink toward the slab's rim (elliptical falloff) so it dissolves into the page instead of ending in a hard edge.
        const e = Math.hypot(px / (state.width / 2), py / (state.height / 2));
        const t = Math.min(1, Math.max(0, (e - 0.55) / 0.5));
        edge[i] = 1 - t * t * (3 - 2 * t);
        ring[i] = Math.min(SPEC - 1, Math.floor((dist[i] / (state.height * 0.85)) * (SPEC - 1)));
        // Push saturation and value a touch so the relief reads even where the photo is dark.
        color.setRGB(r, g, b, THREE.SRGBColorSpace);
        const hsl = {};
        color.getHSL(hsl);
        color.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.05), Math.min(0.85, hsl.l * 1.15 + 0.03));
        mesh.setColorAt(i, color);
      }
      mesh.instanceColor.needsUpdate = true;

      state.count = count;
      state.base = base;
      state.dist = dist;
      state.ring = ring;
      state.edge = edge;
      state.material = material;
      state.mesh = mesh;
      state.dispose.push(geometry, material);
      stage.add(mesh);
      state.ready = true;
      layout();
    };

    const layout = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Fit the whole tilted slab, using whichever axis is the tighter constraint.
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const fitW = state.width / 2 / Math.tan(hfov / 2);
      const fitH = state.height / 2 / Math.tan(vfov / 2);
      const dist = Math.max(fitW, fitH * 1.05) * (camera.aspect < 0.9 ? fit * 0.66 : fit);
      camera.position.set(0, 0, dist + 1);
      camera.updateProjectionMatrix();
    };

    const raycaster = new THREE.Raycaster();
    const localRay = new THREE.Ray();
    const inverse = new THREE.Matrix4();
    const ndc = new THREE.Vector2();

    // Project the pointer onto the slab's own plane (stage space, z = 0).
    const pointerToPlane = () => {
      raycaster.setFromCamera(ndc, camera);
      stage.updateMatrixWorld();
      inverse.copy(stage.matrixWorld).invert();
      localRay.copy(raycaster.ray).applyMatrix4(inverse);
      const dz = localRay.direction.z;
      if (Math.abs(dz) < 1e-5) return null;
      const t = -localRay.origin.z / dz;
      return { x: localRay.origin.x + localRay.direction.x * t, y: localRay.origin.y + localRay.direction.y * t };
    };

    const onMove = e => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      ndc.set(nx * 2 - 1, -(ny * 2 - 1));
      state.pointer.inside = true;
      state.pointer.target = 1;
      state.tilt.tx = (nx - 0.5) * 0.35;
      state.tilt.ty = (ny - 0.5) * 0.22;
    };
    const onLeave = () => {
      state.pointer.inside = false;
      state.pointer.target = 0;
      state.tilt.tx = 0;
      state.tilt.ty = 0;
    };
    const onDown = e => {
      onMove(e);
      const p = pointerToPlane();
      if (!p) return;
      state.ripples.push({ x: p.x, y: p.y, t0: clock.elapsedTime });
      if (state.ripples.length > 5) state.ripples.shift();
    };
    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerdown', onDown, { passive: true });
    container.addEventListener('pointerleave', onLeave, { passive: true });
    container.addEventListener('pointercancel', onLeave, { passive: true });

    // Minimal clock (THREE.Clock is deprecated).
    const clock = {
      elapsedTime: 0,
      last: performance.now(),
      getDelta() {
        const now = performance.now();
        const dt = (now - this.last) / 1000;
        this.last = now;
        this.elapsedTime += Math.min(dt, 0.05);
        return dt;
      }
    };
    const audio = {
      freq: null,
      spec: new Float32Array(SPEC),
      bass: 0,
      mid: 0,
      high: 0,
      level: 0,
      avgBass: 0,
      lastBeat: -1
    };
    const ease = (cur, next, up, down) => cur + (next - cur) * (next > cur ? up : down);

    const analyse = t => {
      const analyser = analyserRef?.current;
      const f = analyser ? audio.freq : null;
      if (analyser) {
        if (!audio.freq || audio.freq.length !== analyser.frequencyBinCount) {
          audio.freq = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(audio.freq);
      }
      const band = (a, b) => {
        if (!f) return 0;
        let sum = 0;
        for (let i = a; i < b; i++) sum += f[i];
        return sum / ((b - a) * 255);
      };
      const bass = band(1, 4);
      const mid = band(4, 24);
      const high = band(24, 96);
      audio.bass = ease(audio.bass, bass, 0.65, 0.1);
      audio.mid = ease(audio.mid, mid, 0.5, 0.1);
      audio.high = ease(audio.high, high, 0.5, 0.12);
      audio.level = Math.max(audio.bass, audio.mid, audio.high);

      const usable = f ? Math.min(f.length - 1, 120) : 0;
      for (let k = 0; k < SPEC; k++) {
        const bin = 1 + Math.floor(Math.pow(k / (SPEC - 1), 1.35) * usable);
        // Higher bands carry less energy, so tilt the gain up to keep the outer rings alive.
        const v = f ? Math.pow(f[bin] / 255, 1.5) * (1 + k * 0.04) : 0;
        audio.spec[k] = ease(audio.spec[k], v, 0.6, 0.14);
      }

      // Beat: bass jumps above its own running average.
      audio.avgBass += (bass - audio.avgBass) * 0.03;
      if (bass > 0.35 && bass > audio.avgBass * 1.18 && t - audio.lastBeat > 0.28) {
        audio.lastBeat = t;
        state.ripples.push({ x: 0, y: 0, t0: t, amp: 0.55 + bass * 0.9 });
        if (state.ripples.length > 6) state.ripples.shift();
      }
    };

    let raf = 0;
    let running = false;

    const render = () => {
      raf = 0;
      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.elapsedTime;

      // Ease pointer presence and camera-ish tilt.
      analyse(t);
      state.pointer.presence += (state.pointer.target - state.pointer.presence) * (1 - Math.exp(-dt * 8));
      state.tilt.x += (state.tilt.tx - state.tilt.x) * (1 - Math.exp(-dt * 4));
      state.tilt.y += (state.tilt.ty - state.tilt.y) * (1 - Math.exp(-dt * 4));
      stage.rotation.x = -0.62 + state.tilt.y;
      stage.rotation.z = 0.06 + state.tilt.x * 0.25 + Math.sin(t * 1.3) * audio.mid * 0.06;
      stage.rotation.y = state.tilt.x + Math.sin(t * 0.5) * audio.level * 0.08;
      stage.scale.setScalar(1 + audio.bass * 0.05); // the whole slab pumps on the kick

      if (state.ready) {
        const hit = state.pointer.presence > 0.01 ? pointerToPlane() : null;
        const px = hit ? hit.x : 0;
        const py = hit ? hit.y : 0;
        if (hit) glow.position.set(px, py, 2.6);
        else if (audio.level > 0.03) {
          // No pointer: let the light wander on its own while music plays.
          glow.position.set(Math.cos(t * 0.7) * state.width * 0.28, Math.sin(t * 0.9) * state.height * 0.25, 2.6);
        }
        glow.intensity = state.pointer.presence * 20 + audio.bass * 6;
        state.material.emissive.set(rippleColor);
        state.material.emissiveIntensity = audio.bass * 0.06;

        state.ripples = state.ripples.filter(r => t - r.t0 < 3.2);

        const array = state.mesh.instanceMatrix.array;
        const cell = state.width / cols;
        const size = cell * (1 - tileGap);
        const x0 = -state.width / 2 + cell / 2;
        const y0 = state.height / 2 - cell / 2;
        const presence = state.pointer.presence;
        const idle = reduced ? 0 : 1;

        for (let r = 0; r < state.rows; r++) {
          const y = y0 - r * cell;
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            const x = x0 + c * cell;
            let h = state.base[i];

            // Slow ambient swell so the slab feels alive even before anyone touches it.
            h += idle * 0.1 * Math.sin(x * 0.55 + t * 0.9) * Math.sin(y * 0.65 - t * 0.7);

            // Music: spectrum ring + a bass swell that travels outward from the centre.
            if (audio.level > 0.004) {
              const d = state.dist[i];
              h += audio.spec[state.ring[i]] * 1.9 * (1 - Math.min(0.45, d * 0.04));
              h += audio.bass * 0.55 * (0.5 + 0.5 * Math.sin(d * 1.6 - t * 7));
            }

            // Pointer: a soft crater-and-crest that follows the cursor.
            if (presence > 0.01) {
              const dx = x - px;
              const dy = y - py;
              const d2 = dx * dx + dy * dy;
              const d = Math.sqrt(d2);
              h += presence * Math.exp(-d2 / 3.2) * (0.55 + 0.85 * Math.sin(d * 3.4 - t * 6)) * 0.9;
            }

            // Click ripples: an expanding ring that decays.
            for (let k = 0; k < state.ripples.length; k++) {
              const rp = state.ripples[k];
              const age = t - rp.t0;
              const dx = x - rp.x;
              const dy = y - rp.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              const front = age * 6.5;
              const ring = Math.exp(-((d - front) * (d - front)) / 1.1);
              h += ring * Math.exp(-age * 0.85) * 2.4 * (rp.amp ?? 1) * Math.cos((d - front) * 2.2);
            }

            const fall = state.edge[i];
            const height = Math.max(0.08, h) * (0.4 + 0.6 * fall);
            const tile = size * Math.pow(fall, 0.8);
            const o = i * 16;
            array[o] = tile;
            array[o + 1] = 0;
            array[o + 2] = 0;
            array[o + 3] = 0;
            array[o + 4] = 0;
            array[o + 5] = tile;
            array[o + 6] = 0;
            array[o + 7] = 0;
            array[o + 8] = 0;
            array[o + 9] = 0;
            array[o + 10] = height;
            array[o + 11] = 0;
            array[o + 12] = x;
            array[o + 13] = y;
            array[o + 14] = height / 2;
            array[o + 15] = 1;
          }
        }
        state.mesh.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);

      // Keep going while something is moving or the page wants ambient motion.
      const active =
        state.visible && (!reduced || state.pointer.presence > 0.01 || state.ripples.length > 0 || audio.level > 0.004);
      if (active) raf = requestAnimationFrame(render);
      else running = false;
    };

    const wake = () => {
      if (running || !state.visible) return;
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(render);
    };

    const wakeOnInput = () => wake();
    container.addEventListener('pointermove', wakeOnInput, { passive: true });
    container.addEventListener('pointerdown', wakeOnInput, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      layout();
      wake();
    });
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (state.visible) wake();
    });
    intersection.observe(container);

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      buildFromImage(img);
      wake();
    };
    img.src = src;

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointercancel', onLeave);
      container.removeEventListener('pointermove', wakeOnInput);
      container.removeEventListener('pointerdown', wakeOnInput);
      img.onload = null;
      state.mesh?.dispose();
      state.dispose.forEach(d => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    };
  }, [src, columns, depth, tileGap, rippleColor, fit, analyserRef]);

  return <div ref={containerRef} className={className} />;
}
