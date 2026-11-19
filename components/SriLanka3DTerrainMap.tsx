'use client';

import React, { memo, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { CmsExperienceMapPin } from '@/lib/cms-defaults';
import { EMBEDDED_TERRAIN } from '@/lib/sri-lanka-terrain-data';

export interface SriLanka3DTerrainMapProps {
  pins: CmsExperienceMapPin[];
  activePinId: string | null;
  onSelectPin: (pinId: string) => void;
  enableHoverSelect?: boolean;
  editable?: boolean;
  onMovePin?: (pinId: string, coords: { x: number; y: number }) => void;
  onStageClick?: (coords: { x: number; y: number }) => void;
  className?: string;
}

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aXZ;
layout(location=1) in float aElevation;
layout(location=2) in float aShade;
layout(location=3) in vec3 aNormal;
layout(location=4) in float aBottom;
uniform mat4 uVP;
uniform float uRelief;
out vec3 vNormal;
out float vElevation;
out float vShade;
void main(){
  float elevation=max(0.0,aElevation);
  float y=mix(0.025+elevation*0.00054*uRelief,-0.085,aBottom);
  gl_Position=uVP*vec4(aXZ.x,y,aXZ.y,1.0);
  vNormal=normalize(vec3(aNormal.x*uRelief,aNormal.y,aNormal.z*uRelief));
  vElevation=elevation;
  vShade=aShade;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vElevation;
in float vShade;
uniform int uMode;
uniform int uSide;
out vec4 fragColor;
vec3 palette(float h){
  if(h<160.0)return mix(vec3(.18,.38,.20),vec3(.27,.45,.23),smoothstep(0.0,160.0,h));
  if(h<650.0)return mix(vec3(.27,.45,.23),vec3(.48,.56,.29),smoothstep(160.0,650.0,h));
  if(h<1200.0)return mix(vec3(.48,.56,.29),vec3(.67,.59,.31),smoothstep(650.0,1200.0,h));
  if(h<1900.0)return mix(vec3(.67,.59,.31),vec3(.55,.39,.27),smoothstep(1200.0,1900.0,h));
  return mix(vec3(.65,.46,.34),vec3(.93,.86,.72),smoothstep(1900.0,2600.0,h));
}
void main(){
  vec3 norm=normalize(vNormal);
  vec3 light=normalize(vec3(-.55,1.45,.75));
  float diffuse=max(dot(norm,light),.02);
  vec3 color;
  if(uSide==1){
    color=vec3(.13,.29,.24)*(0.72+0.3*diffuse);
  } else if(uMode==2){
    float steepness=1.0-clamp(norm.y,0.0,1.0);
    float s=smoothstep(.015,.44,steepness);
    color=mix(vec3(.24,.47,.40),vec3(.85,.54,.34),s);
    color*=.79+.26*diffuse;
  } else {
    color=palette(vElevation);
    if(uMode==1){
      float contour=abs(fract(vElevation/250.0)-0.5)*2.0;
      float line=smoothstep(.91,.98,contour);
      color=mix(color,color*.87,line*.34);
    }
    if(uMode==0){
      float shine=mix(.88,1.08,clamp(vShade,0.0,1.0));
      color*=shine;
    }
    color*=.79+.31*diffuse;
    color=mix(color,vec3(.93,.95,.87),.035);
  }
  fragColor=vec4(pow(clamp(color,0.0,1.0),vec3(.92)),1.0);
}`;

const SX = 4.3;
const SZ = 7.8;
const RELIEF = 0.86;

let cachedIsSoftwareGl: boolean | null = null;
function detectSoftwareWebGL(): boolean {
  if (cachedIsSoftwareGl !== null) return cachedIsSoftwareGl;
  if (typeof document === 'undefined') return false;
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) {
      cachedIsSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedIsSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      gpu
    );
  } catch {
    cachedIsSoftwareGl = false;
  }
  return cachedIsSoftwareGl;
}

function norm3(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

function cross3(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number
): [number, number, number] {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

function writeMult(a: Float32Array, b: Float32Array, out: Float32Array) {
  for (let c = 0; c < 4; c++) {
    const c4 = c * 4;
    const b0 = b[c4];
    const b1 = b[c4 + 1];
    const b2 = b[c4 + 2];
    const b3 = b[c4 + 3];
    for (let r = 0; r < 4; r++) {
      out[c4 + r] =
        a[r] * b0 + a[4 + r] * b1 + a[8 + r] * b2 + a[12 + r] * b3;
    }
  }
}

function writePerspective(aspect: number, out: Float32Array) {
  const f = 1 / Math.tan((46 * Math.PI) / 360);
  const n = 0.1;
  const fa = 80;
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (fa + n) / (n - fa);
  out[11] = -1;
  out[14] = (2 * fa * n) / (n - fa);
}

function writeLookAt(
  ex: number,
  ey: number,
  ez: number,
  tx: number,
  ty: number,
  tz: number,
  out: Float32Array
) {
  const [zx, zy, zz] = norm3(ex - tx, ey - ty, ez - tz);
  const [xx, xy, xz] = norm3(
    ...cross3(0, 1, 0, zx, zy, zz)
  );
  const [yx, yy, yz] = cross3(zx, zy, zz, xx, xy, xz);
  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
}

function SriLanka3DTerrainMapComponent({
  pins,
  activePinId,
  onSelectPin,
  enableHoverSelect = true,
  editable = false,
  onMovePin,
  onStageClick,
  className = '',
}: SriLanka3DTerrainMapProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pinButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pinLastPosRef = useRef<
    Map<string, { x: number; y: number; visible: boolean }>
  >(new Map());
  const draggingPinIdRef = useRef<string | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  const pinsRef = useRef<CmsExperienceMapPin[]>(pins);
  useEffect(() => {
    pinsRef.current = pins;
    requestRenderRef.current?.();
  }, [pins]);

  const onMovePinRef = useRef(onMovePin);
  useEffect(() => {
    onMovePinRef.current = onMovePin;
  }, [onMovePin]);

  const onStageClickRef = useRef(onStageClick);
  useEffect(() => {
    onStageClickRef.current = onStageClick;
  }, [onStageClick]);

  const pickTerrainUVRef = useRef<
    ((clientX: number, clientY: number) => { x: number; y: number } | null) | null
  >(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const W = isSoftwareGl ? 115 : 230;
    const H = isSoftwareGl ? 208 : 416;
    const TOTAL = W * H;

    let disposed = false;
    let isNearViewport = false;
    let initializedGl = false;

    let gl: WebGL2RenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let uni: {
      vp: WebGLUniformLocation | null;
      relief: WebGLUniformLocation | null;
      mode: WebGLUniformLocation | null;
      side: WebGLUniformLocation | null;
    } | null = null;

    type GlMesh = {
      vao: WebGLVertexArrayObject;
      buffers: WebGLBuffer[];
      count: number;
      drawIndices: boolean;
    };

    let topMesh: GlMesh | null = null;
    let sideMesh: GlMesh | null = null;

    const isLand = new Uint8Array(TOTAL);
    const alt = new Float32Array(TOTAL);
    const refShade = new Float32Array(TOTAL);
    const normals = new Float32Array(TOTAL * 3);
    const xz = new Float32Array(TOTAL * 2);

    // Pre-allocated matrices to avoid per-frame GC allocations
    const projMatrix = new Float32Array(16);
    const viewMatrix = new Float32Array(16);
    const vpMatrix = new Float32Array(16);

    let stageCssW = Math.max(1, stage.clientWidth || 500);
    let stageCssH = Math.max(1, stage.clientHeight || 420);

    let yaw = 0.28;
    let pitch = 0.98;
    let target: [number, number, number] = [0, 0.33, 0];
    let targetYaw = yaw;
    let targetPitch = pitch;

    function defaultZoom() {
      const aspect = Math.max(0.25, stageCssW / Math.max(1, stageCssH));
      return Math.max(13.4, 8.6 / aspect);
    }

    let distance = defaultZoom();
    let targetDist = distance;

    let rafId = 0;
    let syncTimerId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastFrameTime = 0;

    function gridIndex(x: number, y: number) {
      return y * W + x;
    }

    function getEye(): [number, number, number] {
      const cosPitch = Math.cos(pitch);
      return [
        target[0] + distance * Math.sin(yaw) * cosPitch,
        target[1] + distance * Math.sin(pitch),
        target[2] + distance * Math.cos(yaw) * cosPitch,
      ];
    }

    function terrainWorldPoint(
      uNorm: number,
      vNorm: number
    ): [number, number, number] {
      const u = Math.max(0, Math.min(1, uNorm));
      const v = Math.max(0, Math.min(1, vNorm));
      const xi = Math.min(W - 1, Math.max(0, Math.round(u * (W - 1))));
      const yi = Math.min(H - 1, Math.max(0, Math.round(v * (H - 1))));
      const id = yi * W + xi;
      const elev = isLand[id] ? Math.max(0, alt[id]) : 0;
      return [
        (u - 0.5) * SX,
        0.025 + elev * 0.00054 * RELIEF,
        (v - 0.5) * SZ,
      ];
    }

    function afterSoftwareDraw(cb: () => void) {
      if (!gl || disposed) return;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        syncTimerId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed || !gl) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          syncTimerId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          syncTimerId = window.setTimeout(cb, 80);
        }
      };
      syncTimerId = window.setTimeout(poll, 5);
    }

    function deleteMesh(m: GlMesh | null) {
      if (!m || !gl) return;
      for (const b of m.buffers) {
        gl.deleteBuffer(b);
      }
      gl.deleteVertexArray(m.vao);
    }

    function projectPins(vp: Float32Array) {
      const currentPins = pinsRef.current;
      const cssW = stageCssW;
      const cssH = stageCssH;
      const m0 = vp[0],
        m1 = vp[1],
        m3 = vp[3];
      const m4 = vp[4],
        m5 = vp[5],
        m7 = vp[7];
      const m8 = vp[8],
        m9 = vp[9],
        m11 = vp[11];
      const m12 = vp[12],
        m13 = vp[13],
        m15 = vp[15];

      for (let i = 0; i < currentPins.length; i++) {
        const pin = currentPins[i];
        const btn = pinButtonRefs.current.get(pin.id);
        if (!btn) continue;

        const [x, y, z] = terrainWorldPoint(pin.x / 100, pin.y / 100);
        const rw = m3 * x + m7 * y + m11 * z + m15;
        let visible = false;
        let px = 0;
        let py = 0;

        if (rw > 0) {
          const invW = 1 / rw;
          const ndcX = (m0 * x + m4 * y + m8 * z + m12) * invW;
          const ndcY = (m1 * x + m5 * y + m9 * z + m13) * invW;
          if (Math.abs(ndcX) < 1.5 && Math.abs(ndcY) < 1.5) {
            visible = true;
            px = Math.round((ndcX * 0.5 + 0.5) * cssW * 2) / 2;
            py = Math.round((0.5 - ndcY * 0.5) * cssH * 2) / 2;
          }
        }

        const prev = pinLastPosRef.current.get(pin.id);
        if (
          prev &&
          prev.visible === visible &&
          (!visible ||
            (Math.abs(prev.x - px) < 0.25 && Math.abs(prev.y - py) < 0.25))
        ) {
          continue;
        }

        pinLastPosRef.current.set(pin.id, { x: px, y: py, visible });

        if (visible) {
          btn.style.setProperty('--pin-x', `${px}px`);
          btn.style.setProperty('--pin-y', `${py}px`);
          if (btn.style.display !== 'inline-flex') {
            btn.style.display = 'inline-flex';
          }
        } else if (btn.style.display !== 'none') {
          btn.style.display = 'none';
        }
      }
    }

    function drawFrame(now: number) {
      if (disposed || !gl || !prog || !uni) {
        renderBusy = false;
        return;
      }

      if (!isNearViewport) {
        renderBusy = false;
        renderDirty = true;
        return;
      }

      const dt =
        lastFrameTime > 0 ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0.016;
      lastFrameTime = now;

      let stillAnimating = false;
      if (isSoftwareGl) {
        distance = targetDist;
        pitch = targetPitch;
        yaw = targetYaw;
      } else {
        const dDist = targetDist - distance;
        const dPitch = targetPitch - pitch;
        const dYaw = targetYaw - yaw;
        if (
          Math.abs(dDist) > 0.002 ||
          Math.abs(dPitch) > 0.0005 ||
          Math.abs(dYaw) > 0.0005
        ) {
          distance += dDist * Math.min(1, dt * 11);
          pitch += dPitch * Math.min(1, dt * 13);
          yaw += dYaw * Math.min(1, dt * 13);
          stillAnimating = true;
        } else {
          distance = targetDist;
          pitch = targetPitch;
          yaw = targetYaw;
        }
      }

      const dpr = isSoftwareGl
        ? 1
        : Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(stageCssW * dpr));
      const h = Math.max(1, Math.round(stageCssH * dpr));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl.viewport(0, 0, w, h);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      const [ex, ey, ez] = getEye();
      writeLookAt(ex, ey, ez, target[0], target[1], target[2], viewMatrix);
      writePerspective(w / h, projMatrix);
      writeMult(projMatrix, viewMatrix, vpMatrix);

      if (topMesh && sideMesh) {
        gl.useProgram(prog);
        gl.uniformMatrix4fv(uni.vp, false, vpMatrix);
        gl.uniform1f(uni.relief, RELIEF);
        gl.uniform1i(uni.mode, 0);
        gl.uniform1i(uni.side, 1);
        gl.bindVertexArray(sideMesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, sideMesh.count);
        gl.uniform1i(uni.side, 0);
        gl.bindVertexArray(topMesh.vao);
        gl.drawElements(gl.TRIANGLES, topMesh.count, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
      }

      projectPins(vpMatrix);

      const finishFrame = () => {
        renderBusy = false;
        if (!stillAnimating) {
          lastFrameTime = 0;
        }
        if ((renderDirty || stillAnimating) && !disposed && isNearViewport) {
          renderDirty = false;
          requestRender();
        }
      };

      if (isSoftwareGl) {
        afterSoftwareDraw(finishFrame);
      } else {
        finishFrame();
      }
    }

    function requestRender() {
      if (disposed || !initializedGl) return;
      if (!isNearViewport) {
        renderDirty = true;
        return;
      }
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      renderDirty = false;
      rafId = requestAnimationFrame(drawFrame);
    }

    requestRenderRef.current = requestRender;

    function initWebGLScene() {
      if (initializedGl || disposed) return;
      initializedGl = true;

      gl = canvas!.getContext('webgl2', {
        alpha: true,
        antialias: !isSoftwareGl,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
      });
      if (!gl) return;

      const context = gl;

      function compileShader(type: number, source: string) {
        const s = context.createShader(type)!;
        context.shaderSource(s, source);
        context.compileShader(s);
        if (!context.getShaderParameter(s, context.COMPILE_STATUS)) {
          throw new Error(context.getShaderInfoLog(s) || 'Shader compile error');
        }
        return s;
      }

      const vs = compileShader(context.VERTEX_SHADER, VERT);
      const fs = compileShader(context.FRAGMENT_SHADER, FRAG);
      prog = context.createProgram()!;
      context.attachShader(prog, vs);
      context.attachShader(prog, fs);
      context.linkProgram(prog);
      context.deleteShader(vs);
      context.deleteShader(fs);
      if (!context.getProgramParameter(prog, context.LINK_STATUS)) {
        throw new Error(context.getProgramInfoLog(prog) || 'Program link error');
      }

      uni = {
        vp: context.getUniformLocation(prog, 'uVP'),
        relief: context.getUniformLocation(prog, 'uRelief'),
        mode: context.getUniformLocation(prog, 'uMode'),
        side: context.getUniformLocation(prog, 'uSide'),
      };

      function recalcNormals() {
        const dx = SX / (W - 1);
        const dz = SZ / (H - 1);
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = gridIndex(x, y);
            const L = alt[gridIndex(Math.max(x - 1, 0), y)];
            const R = alt[gridIndex(Math.min(x + 1, W - 1), y)];
            const T = alt[gridIndex(x, Math.max(y - 1, 0))];
            const B = alt[gridIndex(x, Math.min(y + 1, H - 1))];
            const nx = (-(R - L) * 0.00054) / (2 * dx);
            const ny = 1;
            const nz = (-(B - T) * 0.00054) / (2 * dz);
            const len = Math.hypot(nx, ny, nz) || 1;
            normals[i * 3] = nx / len;
            normals[i * 3 + 1] = ny / len;
            normals[i * 3 + 2] = nz / len;
          }
        }
      }

      function makeBuffers(
        vertices: Float32Array,
        heights: Float32Array,
        shades: Float32Array,
        norms: Float32Array,
        bottoms: Float32Array,
        indices: Uint32Array | null
      ): GlMesh {
        const vao = context.createVertexArray()!;
        const buffers: WebGLBuffer[] = [];
        context.bindVertexArray(vao);
        const attribs: [Float32Array, number, number][] = [
          [vertices, 0, 2],
          [heights, 1, 1],
          [shades, 2, 1],
          [norms, 3, 3],
          [bottoms, 4, 1],
        ];
        for (const [a, loc, n] of attribs) {
          const b = context.createBuffer()!;
          buffers.push(b);
          context.bindBuffer(context.ARRAY_BUFFER, b);
          context.bufferData(context.ARRAY_BUFFER, a, context.STATIC_DRAW);
          context.vertexAttribPointer(loc, n, context.FLOAT, false, 0, 0);
          context.enableVertexAttribArray(loc);
        }
        const mesh: GlMesh = {
          vao,
          buffers,
          count: indices ? indices.length : heights.length,
          drawIndices: !!indices,
        };
        if (indices) {
          const b = context.createBuffer()!;
          buffers.push(b);
          context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, b);
          context.bufferData(
            context.ELEMENT_ARRAY_BUFFER,
            indices,
            context.STATIC_DRAW
          );
        }
        context.bindVertexArray(null);
        return mesh;
      }

      function rebuild() {
        if (disposed) return;
        recalcNormals();
        const bottoms = new Float32Array(TOTAL);
        const active = new Uint8Array((W - 1) * (H - 1));
        const indices: number[] = [];
        for (let y = 0; y < H - 1; y++) {
          for (let x = 0; x < W - 1; x++) {
            const a = gridIndex(x, y);
            const b = a + 1;
            const c = a + W;
            const d = c + 1;
            if (isLand[a] && isLand[b] && isLand[c] && isLand[d]) {
              active[y * (W - 1) + x] = 1;
              indices.push(a, c, b, b, c, d);
            }
          }
        }
        deleteMesh(topMesh);
        topMesh = makeBuffers(
          xz,
          alt,
          refShade,
          normals,
          bottoms,
          new Uint32Array(indices)
        );

        const wp: number[] = [];
        const wh: number[] = [];
        const ws: number[] = [];
        const wn: number[] = [];
        const wb: number[] = [];

        function addVertex(
          idx: number,
          bottom: number,
          nx: number,
          nz: number
        ) {
          wp.push(xz[idx * 2], xz[idx * 2 + 1]);
          wh.push(alt[idx]);
          ws.push(refShade[idx]);
          wn.push(nx, 0, nz);
          wb.push(bottom);
        }

        function wall(a: number, b: number, nx: number, nz: number) {
          addVertex(a, 0, nx, nz);
          addVertex(b, 0, nx, nz);
          addVertex(a, 1, nx, nz);
          addVertex(b, 0, nx, nz);
          addVertex(b, 1, nx, nz);
          addVertex(a, 1, nx, nz);
        }

        for (let y = 0; y < H - 1; y++) {
          for (let x = 0; x < W - 1; x++) {
            if (!active[y * (W - 1) + x]) continue;
            const a = gridIndex(x, y);
            const b = a + 1;
            const c = a + W;
            const d = c + 1;
            if (y === 0 || !active[(y - 1) * (W - 1) + x]) wall(a, b, 0, -1);
            if (y === H - 2 || !active[(y + 1) * (W - 1) + x]) wall(c, d, 0, 1);
            if (x === 0 || !active[y * (W - 1) + (x - 1)]) wall(a, c, -1, 0);
            if (x === W - 2 || !active[y * (W - 1) + (x + 1)]) wall(b, d, 1, 0);
          }
        }
        deleteMesh(sideMesh);
        sideMesh = makeBuffers(
          new Float32Array(wp),
          new Float32Array(wh),
          new Float32Array(ws),
          new Float32Array(wn),
          new Float32Array(wb),
          null
        );
        pinLastPosRef.current.clear();
        requestRender();
      }

      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (disposed) return;
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, W, H);
        const src = ctx.getImageData(0, 0, W, H).data;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = gridIndex(x, y);
            const k = i * 4;
            isLand[i] = src[k + 3] > 115 ? 1 : 0;
            alt[i] = src[k] * 256 + src[k + 1];
            refShade[i] = src[k + 2] / 255;
            xz[i * 2] = (x / (W - 1) - 0.5) * SX;
            xz[i * 2 + 1] = (y / (H - 1) - 0.5) * SZ;
          }
        }
        rebuild();
      };
      img.src = EMBEDDED_TERRAIN;
    }

    pickTerrainUVRef.current = (clientX: number, clientY: number) => {
      const rect = stage!.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = 1 - ((clientY - rect.top) / rect.height) * 2;
      const [ex, ey, ez] = getEye();
      const [zx, zy, zz] = norm3(ex - target[0], ey - target[1], ez - target[2]);
      const [xx, xy, xzAxis] = norm3(...cross3(0, 1, 0, zx, zy, zz));
      const [yx, yy, yz] = cross3(zx, zy, zz, xx, xy, xzAxis);
      const tanHalfFov = Math.tan((46 * Math.PI) / 360);
      const aspect = rect.width / Math.max(1, rect.height);

      const dir = norm3(
        xx * ndcX * aspect * tanHalfFov + yx * ndcY * tanHalfFov - zx,
        xy * ndcX * aspect * tanHalfFov + yy * ndcY * tanHalfFov - zy,
        xzAxis * ndcX * aspect * tanHalfFov + yz * ndcY * tanHalfFov - zz
      );

      if (Math.abs(dir[1]) < 1e-4) return null;

      const tTop = Math.max(0.1, (1.4 - ey) / dir[1]);
      const tBase = Math.max(tTop + 0.05, (0.025 - ey) / dir[1]);
      const steps = 64;
      let hitU: number | null = null;
      let hitV: number | null = null;

      for (let s = 0; s <= steps; s++) {
        const t = tTop + ((tBase - tTop) * s) / steps;
        const rx = ex + t * dir[0];
        const ry = ey + t * dir[1];
        const rz = ez + t * dir[2];
        const u = rx / SX + 0.5;
        const v = rz / SZ + 0.5;
        if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
          const xi = Math.min(W - 1, Math.max(0, Math.round(u * (W - 1))));
          const yi = Math.min(H - 1, Math.max(0, Math.round(v * (H - 1))));
          const id = yi * W + xi;
          if (isLand[id]) {
            const ty = 0.025 + Math.max(0, alt[id]) * 0.00054 * RELIEF;
            if (ry <= ty) {
              hitU = u;
              hitV = v;
              break;
            }
          }
        }
      }

      if (hitU === null || hitV === null) {
        const rx = ex + tBase * dir[0];
        const rz = ez + tBase * dir[2];
        hitU = rx / SX + 0.5;
        hitV = rz / SZ + 0.5;
      }

      return {
        x: Math.round(Math.max(2, Math.min(98, hitU * 100)) * 10) / 10,
        y: Math.round(Math.max(2, Math.min(98, hitV * 100)) * 10) / 10,
      };
    };

    // Observe container dimensions without forced synchronous layout reads per frame
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const nextW = Math.max(1, Math.round(entry.contentRect.width));
            const nextH = Math.max(1, Math.round(entry.contentRect.height));
            if (nextW !== stageCssW || nextH !== stageCssH) {
              stageCssW = nextW;
              stageCssH = nextH;
              if (!initializedGl) {
                distance = targetDist = defaultZoom();
              }
              pinLastPosRef.current.clear();
              requestRender();
            }
          })
        : null;
    resizeObserver?.observe(stage);

    // Lazy-init WebGL & gate rendering strictly to when the map is near/in viewport
    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const intersecting = Boolean(entries[0]?.isIntersecting);
              isNearViewport = intersecting;
              if (intersecting) {
                if (!initializedGl) {
                  stageCssW = Math.max(1, stage.clientWidth || 500);
                  stageCssH = Math.max(1, stage.clientHeight || 420);
                  distance = targetDist = defaultZoom();
                  initWebGLScene();
                } else if (renderDirty) {
                  requestRender();
                }
              }
            },
            { rootMargin: '350px 0px', threshold: 0.01 }
          )
        : null;

    if (intersectionObserver) {
      intersectionObserver.observe(stage);
    } else {
      isNearViewport = true;
      initWebGLScene();
    }

    // Pointer & keyboard interaction on the 3D terrain canvas
    const pointers = new Map<
      number,
      { x: number; y: number; startX: number; startY: number }
    >();
    let pinchDistance = 0;
    let pointerDraggedDistance = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
      });
      pointerDraggedDistance = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      if (pointers.size === 2) {
        const a = [...pointers.values()];
        pinchDistance = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const old = pointers.get(e.pointerId)!;
      const dx = e.clientX - old.x;
      const dy = e.clientY - old.y;
      pointers.set(e.pointerId, {
        ...old,
        x: e.clientX,
        y: e.clientY,
      });
      pointerDraggedDistance += Math.hypot(dx, dy);

      if (pointers.size >= 2) {
        const a = [...pointers.values()];
        const next = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        if (pinchDistance > 5 && next > 5) {
          targetDist = Math.max(
            4.4,
            Math.min(26, (targetDist * pinchDistance) / next)
          );
        }
        pinchDistance = next;
      } else {
        targetYaw -= dx * 0.007;
        targetPitch = Math.min(1.49, Math.max(0.17, targetPitch + dy * 0.007));
      }
      requestRender();
    };

    const onPointerUp = (e: PointerEvent) => {
      const hadPointer = pointers.has(e.pointerId);
      pointers.delete(e.pointerId);
      pinchDistance = 0;
      if (!pointers.size) {
        canvas.style.cursor = 'grab';
      }
      if (
        hadPointer &&
        pointerDraggedDistance < 5 &&
        onStageClickRef.current &&
        pickTerrainUVRef.current
      ) {
        const coords = pickTerrainUVRef.current(e.clientX, e.clientY);
        if (coords) {
          onStageClickRef.current(coords);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDist = Math.max(
        4.4,
        Math.min(26, targetDist * Math.exp(e.deltaY * 0.001))
      );
      requestRender();
    };

    const onDblClick = () => {
      targetYaw = 0.28;
      targetPitch = 0.98;
      targetDist = defaultZoom();
      target = [0, 0.33, 0];
      requestRender();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      let changed = false;
      if (e.key === 'ArrowLeft') {
        targetYaw -= 0.12;
        changed = true;
      }
      if (e.key === 'ArrowRight') {
        targetYaw += 0.12;
        changed = true;
      }
      if (e.key === 'ArrowUp') {
        targetPitch = Math.max(0.17, targetPitch - 0.1);
        changed = true;
      }
      if (e.key === 'ArrowDown') {
        targetPitch = Math.min(1.49, targetPitch + 0.1);
        changed = true;
      }
      if (e.key === '+' || e.key === '=') {
        targetDist = Math.max(4.4, targetDist * 0.85);
        changed = true;
      }
      if (e.key === '-') {
        targetDist = Math.min(26, targetDist * 1.15);
        changed = true;
      }
      if (changed) requestRender();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('keydown', onKeyDown);

    return () => {
      disposed = true;
      requestRenderRef.current = null;
      cancelAnimationFrame(rafId);
      window.clearTimeout(syncTimerId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('keydown', onKeyDown);
      deleteMesh(topMesh);
      deleteMesh(sideMesh);
      if (gl && prog) {
        gl.deleteProgram(prog);
      }
    };
  }, []);

  const handlePinPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    pinId: string
  ) => {
    e.stopPropagation();
    onSelectPin(pinId);
    if (editable) {
      e.currentTarget.setPointerCapture(e.pointerId);
      draggingPinIdRef.current = pinId;
    }
  };

  const handlePinPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    pinId: string
  ) => {
    if (!editable || draggingPinIdRef.current !== pinId) return;
    e.stopPropagation();
    if (pickTerrainUVRef.current && onMovePinRef.current) {
      const coords = pickTerrainUVRef.current(e.clientX, e.clientY);
      if (coords) {
        onMovePinRef.current(pinId, coords);
      }
    }
  };

  const handlePinPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    pinId: string
  ) => {
    if (editable && draggingPinIdRef.current === pinId) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture release errors
      }
      draggingPinIdRef.current = null;
    }
  };

  return (
    <div
      ref={stageRef}
      data-lenis-prevent
      className={`relative w-full h-full overflow-hidden bg-transparent select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Interactive Sri Lanka terrain, drag to rotate and scroll to zoom"
        className="w-full h-full block absolute inset-0 touch-none bg-transparent outline-none cursor-grab"
      />

      {pins.map((pin) => {
        const isCurrent = activePinId === pin.id;
        return (
          <button
            key={pin.id}
            ref={(el) => {
              if (el) {
                pinButtonRefs.current.set(pin.id, el);
              } else {
                pinButtonRefs.current.delete(pin.id);
                pinLastPosRef.current.delete(pin.id);
              }
            }}
            type="button"
            data-map-pin-button="true"
            style={{
              display: 'none',
            }}
            title={
              editable
                ? `Drag to move "${pin.label}" on 3D terrain (${pin.x}%, ${pin.y}%)`
                : pin.label
            }
            aria-label={pin.label || 'Map location pin'}
            aria-pressed={isCurrent}
            onMouseEnter={() => {
              if (enableHoverSelect && !editable) {
                onSelectPin(pin.id);
              }
            }}
            onFocus={() => {
              if (enableHoverSelect && !editable) {
                onSelectPin(pin.id);
              }
            }}
            onClick={() => onSelectPin(pin.id)}
            onPointerDown={(e) => handlePinPointerDown(e, pin.id)}
            onPointerMove={(e) => handlePinPointerMove(e, pin.id)}
            onPointerUp={(e) => handlePinPointerUp(e, pin.id)}
            className={`discover-map-pin ${isCurrent ? 'is-active' : ''} ${
              editable ? 'touch-none cursor-grab active:cursor-grabbing' : ''
            } ${pin.visible === false ? 'opacity-50' : ''}`}
          >
            <MapPin className="discover-map-pin-icon" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

const SriLanka3DTerrainMap = memo(SriLanka3DTerrainMapComponent);
export default SriLanka3DTerrainMap;
