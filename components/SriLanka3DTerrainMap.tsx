'use client';

import React, { useEffect, useRef } from 'react';
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
 float y=mix(0.055+elevation*0.00061*uRelief,-0.21,aBottom);
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
 if(h<160.0)return mix(vec3(.14,.39,.29),vec3(.31,.52,.36),smoothstep(0.0,160.0,h));
 if(h<650.0)return mix(vec3(.31,.52,.36),vec3(.61,.69,.45),smoothstep(160.0,650.0,h));
 if(h<1200.0)return mix(vec3(.61,.69,.45),vec3(.74,.65,.43),smoothstep(650.0,1200.0,h));
 if(h<1900.0)return mix(vec3(.74,.65,.43),vec3(.65,.46,.34),smoothstep(1200.0,1900.0,h));
 return mix(vec3(.65,.46,.34),vec3(.93,.86,.72),smoothstep(1900.0,2600.0,h));
}
void main(){
 vec3 norm=normalize(vNormal);
 vec3 light=normalize(vec3(-.5,.95,.8));
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
     float shine=mix(.76,1.12,clamp(vShade,0.0,1.0));
     color*=shine;
   }
   color*=.72+.45*diffuse;
   color=mix(color,vec3(.93,.95,.87),.035);
 }
 fragColor=vec4(pow(clamp(color,0.0,1.0),vec3(.92)),1.0);
}`;

const W = 230;
const H = 416;
const SX = 4.3;
const SZ = 7.8;
const LON0 = 79.49;
const LON1 = 82.07;
const LAT0 = 9.91;
const LAT1 = 5.83;
const TOTAL = W * H;
const RELIEF = 1.6;

function index(x: number, y: number) {
  return y * W + x;
}

function norm(v: number[]): [number, number, number] {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function sub(a: number[], b: number[]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: number[], b: number[]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function mult(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
      }
    }
  }
  return o;
}

function perspective(aspect: number): Float32Array {
  const f = 1 / Math.tan((46 * Math.PI) / 360);
  const n = 0.1;
  const fa = 80;
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (fa + n) / (n - fa),
    -1,
    0,
    0,
    (2 * fa * n) / (n - fa),
    0,
  ]);
}

function lookAt(e: number[], t: number[]): Float32Array {
  const z = norm(sub(e, t));
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([
    x[0],
    y[0],
    z[0],
    0,
    x[1],
    y[1],
    z[1],
    0,
    x[2],
    y[2],
    z[2],
    0,
    -dot(x, e),
    -dot(y, e),
    -dot(z, e),
    1,
  ]);
}

function project(
  pt: [number, number, number],
  m: Float32Array,
  w: number,
  h: number
): { x: number; y: number; visible: boolean } | null {
  const [x, y, z] = pt;
  const rx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const ry = m[1] * x + m[5] * y + m[9] * z + m[13];
  const rw = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (rw <= 0) return null;
  return {
    x: ((rx / rw) * 0.5 + 0.5) * w,
    y: (0.5 - (ry / rw) * 0.5) * h,
    visible: Math.abs(rx / rw) < 1.5 && Math.abs(ry / rw) < 1.5,
  };
}

function merc(lon: number, lat: number) {
  const n = 2 ** 8;
  return {
    x: ((lon + 180) / 360) * n,
    y: ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n,
  };
}

function terrariumPixel(data: Uint8ClampedArray, k: number) {
  return data[k] * 256 + data[k + 1] + data[k + 2] / 256 - 32768;
}

export default function SriLanka3DTerrainMap({
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
  const draggingPinIdRef = useRef<string | null>(null);

  const pinsRef = useRef<CmsExperienceMapPin[]>(pins);
  useEffect(() => {
    pinsRef.current = pins;
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

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) {
      return;
    }

    let disposed = false;
    let rafId = 0;

    function compileShader(type: number, source: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        throw new Error(gl!.getShaderInfoLog(s) || 'Shader compile error');
      }
      return s;
    }

    function createProg(v: string, f: string) {
      const p = gl!.createProgram()!;
      gl!.attachShader(p, compileShader(gl!.VERTEX_SHADER, v));
      gl!.attachShader(p, compileShader(gl!.FRAGMENT_SHADER, f));
      gl!.linkProgram(p);
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
        throw new Error(gl!.getProgramInfoLog(p) || 'Program link error');
      }
      return p;
    }

    const prog = createProg(VERT, FRAG);
    const uni = {
      vp: gl.getUniformLocation(prog, 'uVP'),
      relief: gl.getUniformLocation(prog, 'uRelief'),
      mode: gl.getUniformLocation(prog, 'uMode'),
      side: gl.getUniformLocation(prog, 'uSide'),
    };

    const isLand = new Uint8Array(TOTAL);
    const alt = new Float32Array(TOTAL);
    const refShade = new Float32Array(TOTAL);
    const normals = new Float32Array(TOTAL * 3);
    const xz = new Float32Array(TOTAL * 2);

    type GlMesh = {
      vao: WebGLVertexArrayObject;
      count: number;
      drawIndices: boolean;
    };

    let topMesh: GlMesh | null = null;
    let sideMesh: GlMesh | null = null;

    let yaw = 0.39;
    let pitch = 0.86;
    let distance = 13.4;
    let target: [number, number, number] = [0, 0.33, 0];
    let targetYaw = yaw;
    let targetPitch = pitch;
    let targetDist = distance;

    function defaultZoom() {
      const aspect = Math.max(
        0.25,
        stage!.clientWidth / Math.max(1, stage!.clientHeight)
      );
      return Math.max(13.4, 8.6 / aspect);
    }

    function getEye(): [number, number, number] {
      return [
        target[0] + distance * Math.sin(yaw) * Math.cos(pitch),
        target[1] + distance * Math.sin(pitch),
        target[2] + distance * Math.cos(yaw) * Math.cos(pitch),
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
      const wx = (u - 0.5) * SX;
      const wz = (v - 0.5) * SZ;
      const wy = 0.055 + elev * 0.00061 * RELIEF;
      return [wx, wy, wz];
    }

    pickTerrainUVRef.current = (clientX: number, clientY: number) => {
      const rect = stage!.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = 1 - ((clientY - rect.top) / rect.height) * 2;
      const eye = getEye();
      const zAxis = norm(sub(eye, target));
      const xAxis = norm(cross([0, 1, 0], zAxis));
      const yAxis = cross(zAxis, xAxis);
      const tanHalfFov = Math.tan((46 * Math.PI) / 360);
      const aspect = rect.width / Math.max(1, rect.height);

      const dir = norm([
        xAxis[0] * ndcX * aspect * tanHalfFov +
          yAxis[0] * ndcY * tanHalfFov -
          zAxis[0],
        xAxis[1] * ndcX * aspect * tanHalfFov +
          yAxis[1] * ndcY * tanHalfFov -
          zAxis[1],
        xAxis[2] * ndcX * aspect * tanHalfFov +
          yAxis[2] * ndcY * tanHalfFov -
          zAxis[2],
      ]);

      if (Math.abs(dir[1]) < 1e-4) return null;

      const tTop = Math.max(0.1, (2.85 - eye[1]) / dir[1]);
      const tBase = Math.max(tTop + 0.05, (0.055 - eye[1]) / dir[1]);
      const steps = 90;
      let hitU: number | null = null;
      let hitV: number | null = null;

      for (let s = 0; s <= steps; s++) {
        const t = tTop + ((tBase - tTop) * s) / steps;
        const rx = eye[0] + t * dir[0];
        const ry = eye[1] + t * dir[1];
        const rz = eye[2] + t * dir[2];
        const u = rx / SX + 0.5;
        const v = rz / SZ + 0.5;
        if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
          const xi = Math.min(W - 1, Math.max(0, Math.round(u * (W - 1))));
          const yi = Math.min(H - 1, Math.max(0, Math.round(v * (H - 1))));
          const id = yi * W + xi;
          if (isLand[id]) {
            const ty = 0.055 + Math.max(0, alt[id]) * 0.00061 * RELIEF;
            if (ry <= ty) {
              hitU = u;
              hitV = v;
              break;
            }
          }
        }
      }

      if (hitU === null || hitV === null) {
        const rx = eye[0] + tBase * dir[0];
        const rz = eye[2] + tBase * dir[2];
        hitU = rx / SX + 0.5;
        hitV = rz / SZ + 0.5;
      }

      return {
        x: Math.round(Math.max(2, Math.min(98, hitU * 100)) * 10) / 10,
        y: Math.round(Math.max(2, Math.min(98, hitV * 100)) * 10) / 10,
      };
    };

    function recalcNormals() {
      const dx = SX / (W - 1);
      const dz = SZ / (H - 1);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = index(x, y);
          const L = alt[index(Math.max(x - 1, 0), y)];
          const R = alt[index(Math.min(x + 1, W - 1), y)];
          const T = alt[index(x, Math.max(y - 1, 0))];
          const B = alt[index(x, Math.min(y + 1, H - 1))];
          const nx = (-(R - L) * 0.00061) / (2 * dx);
          const ny = 1;
          const nz = (-(B - T) * 0.00061) / (2 * dz);
          const len = Math.hypot(nx, ny, nz) || 1;
          normals[i * 3] = nx / len;
          normals[i * 3 + 1] = ny / len;
          normals[i * 3 + 2] = nz / len;
        }
      }
    }

    function makeBuffers(
      vertices: number[],
      heights: number[],
      shades: number[],
      norms: number[],
      bottoms: number[],
      indices: number[] | null
    ): GlMesh {
      const vao = gl!.createVertexArray()!;
      gl!.bindVertexArray(vao);
      const attribs: [Float32Array, number, number][] = [
        [new Float32Array(vertices), 0, 2],
        [new Float32Array(heights), 1, 1],
        [new Float32Array(shades), 2, 1],
        [new Float32Array(norms), 3, 3],
        [new Float32Array(bottoms), 4, 1],
      ];
      for (const [a, loc, n] of attribs) {
        const b = gl!.createBuffer();
        gl!.bindBuffer(gl!.ARRAY_BUFFER, b);
        gl!.bufferData(gl!.ARRAY_BUFFER, a, gl!.STATIC_DRAW);
        gl!.vertexAttribPointer(loc, n, gl!.FLOAT, false, 0, 0);
        gl!.enableVertexAttribArray(loc);
      }
      const mesh: GlMesh = {
        vao,
        count: indices ? indices.length : heights.length,
        drawIndices: !!indices,
      };
      if (indices) {
        const b = gl!.createBuffer();
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, b);
        gl!.bufferData(
          gl!.ELEMENT_ARRAY_BUFFER,
          new Uint32Array(indices),
          gl!.STATIC_DRAW
        );
      }
      gl!.bindVertexArray(null);
      return mesh;
    }

    function deleteMesh(m: GlMesh | null) {
      if (m) gl!.deleteVertexArray(m.vao);
    }

    function rebuild() {
      if (disposed) return;
      recalcNormals();
      const positions: number[] = [];
      const heights: number[] = [];
      const shades: number[] = [];
      const norms: number[] = [];
      const bottoms: number[] = [];
      const active = new Uint8Array((W - 1) * (H - 1));
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = index(x, y);
          positions.push(xz[i * 2], xz[i * 2 + 1]);
          heights.push(alt[i]);
          shades.push(refShade[i]);
          norms.push(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
          bottoms.push(0);
        }
      }
      const indices: number[] = [];
      for (let y = 0; y < H - 1; y++) {
        for (let x = 0; x < W - 1; x++) {
          const a = index(x, y);
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
        positions,
        heights,
        shades,
        norms,
        bottoms,
        indices
      );

      const wp: number[] = [];
      const wh: number[] = [];
      const ws: number[] = [];
      const wn: number[] = [];
      const wb: number[] = [];

      function addVertex(idx: number, bottom: number, nx: number, nz: number) {
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
          const a = index(x, y);
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
      sideMesh = makeBuffers(wp, wh, ws, wn, wb, null);
    }

    async function loadDem() {
      try {
        const min = merc(LON0, LAT0);
        const max = merc(LON1, LAT1);
        const tiles = new Map<string, Uint8ClampedArray>();
        const jobs: Promise<void>[] = [];
        for (let x = Math.floor(min.x); x <= Math.floor(max.x); x++) {
          for (let y = Math.floor(min.y); y <= Math.floor(max.y); y++) {
            jobs.push(
              (async () => {
                const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/8/${x}/${y}.png`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Elevation tile unavailable');
                const img = await createImageBitmap(await res.blob());
                const c = document.createElement('canvas');
                c.width = 256;
                c.height = 256;
                const ct = c.getContext('2d', { willReadFrequently: true })!;
                ct.drawImage(img, 0, 0);
                tiles.set(
                  `${x}/${y}`,
                  ct.getImageData(0, 0, 256, 256).data
                );
                img.close?.();
              })()
            );
          }
        }
        await Promise.all(jobs);
        if (disposed) return;
        let valid = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = index(x, y);
            if (!isLand[i]) continue;
            const u = x / (W - 1);
            const v = y / (H - 1);
            const lon = LON0 + u * (LON1 - LON0);
            const lat = LAT0 + v * (LAT1 - LAT0);
            const xy = merc(lon, lat);
            const tx = Math.floor(xy.x);
            const ty = Math.floor(xy.y);
            const pixels = tiles.get(`${tx}/${ty}`);
            if (!pixels) continue;
            const px = Math.min(255, Math.max(0, Math.floor((xy.x - tx) * 256)));
            const py = Math.min(255, Math.max(0, Math.floor((xy.y - ty) * 256)));
            const h = terrariumPixel(pixels, (py * 256 + px) * 4);
            if (Number.isFinite(h)) {
              alt[i] = Math.max(0, Math.min(2800, h));
              valid++;
            }
          }
        }
        if (valid >= 10000 && !disposed) {
          rebuild();
        }
      } catch {
        // Fallback to embedded terrain data silently
      }
    }

    const img = new Image();
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
          const i = index(x, y);
          const k = i * 4;
          isLand[i] = src[k + 3] > 115 ? 1 : 0;
          alt[i] = src[k] * 256 + src[k + 1];
          refShade[i] = src[k + 2] / 255;
          xz[i * 2] = (x / (W - 1) - 0.5) * SX;
          xz[i * 2 + 1] = (y / (H - 1) - 0.5) * SZ;
        }
      }
      rebuild();
      loadDem();
    };
    img.src = EMBEDDED_TERRAIN;

    let prev = performance.now();
    function draw(now: number) {
      if (disposed) return;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      distance += (targetDist - distance) * Math.min(1, dt * 10);
      pitch += (targetPitch - pitch) * Math.min(1, dt * 12);
      yaw += (targetYaw - yaw) * Math.min(1, dt * 12);

      const rect = stage!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
      }

      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
      gl!.enable(gl!.DEPTH_TEST);
      gl!.disable(gl!.CULL_FACE);

      const eye = getEye();
      const view = lookAt(eye, target);
      const vp = mult(perspective(w / h), view);

      if (topMesh && sideMesh) {
        gl!.useProgram(prog);
        gl!.uniformMatrix4fv(uni.vp, false, vp);
        gl!.uniform1f(uni.relief, RELIEF);
        gl!.uniform1i(uni.mode, 0);
        gl!.uniform1i(uni.side, 1);
        gl!.bindVertexArray(sideMesh.vao);
        gl!.drawArrays(gl!.TRIANGLES, 0, sideMesh.count);
        gl!.uniform1i(uni.side, 0);
        gl!.bindVertexArray(topMesh.vao);
        gl!.drawElements(
          gl!.TRIANGLES,
          topMesh.count,
          gl!.UNSIGNED_INT,
          0
        );
        gl!.bindVertexArray(null);
      }

      // Project all 3D pins onto the 2D stage overlay in real time
      const currentPins = pinsRef.current;
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      for (const pin of currentPins) {
        const btn = pinButtonRefs.current.get(pin.id);
        if (!btn) continue;
        const pt3d = terrainWorldPoint(pin.x / 100, pin.y / 100);
        const proj = project(pt3d, vp, cssW, cssH);
        if (proj && proj.visible) {
          btn.style.left = `${proj.x}px`;
          btn.style.top = `${proj.y}px`;
          btn.style.display = 'inline-flex';
        } else {
          btn.style.display = 'none';
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    distance = targetDist = defaultZoom();
    rafId = requestAnimationFrame(draw);

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
    };

    const onPointerUp = (e: PointerEvent) => {
      const hadPointer = pointers.has(e.pointerId);
      pointers.delete(e.pointerId);
      pinchDistance = 0;
      if (!pointers.size) {
        canvas.style.cursor = 'grab';
      }
      // If user clicked the 3D terrain without dragging to rotate, place/move pin in editable mode
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
    };

    const onDblClick = () => {
      targetYaw = 0.39;
      targetPitch = 0.86;
      targetDist = defaultZoom();
      target = [0, 0.33, 0];
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') targetYaw -= 0.12;
      if (e.key === 'ArrowRight') targetYaw += 0.12;
      if (e.key === 'ArrowUp') targetPitch = Math.max(0.17, targetPitch - 0.1);
      if (e.key === 'ArrowDown')
        targetPitch = Math.min(1.49, targetPitch + 0.1);
      if (e.key === '+' || e.key === '=')
        targetDist = Math.max(4.4, targetDist * 0.85);
      if (e.key === '-') targetDist = Math.min(26, targetDist * 1.15);
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
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('keydown', onKeyDown);
      deleteMesh(topMesh);
      deleteMesh(sideMesh);
      gl.deleteProgram(prog);
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
              }
            }}
            type="button"
            data-map-pin-button="true"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
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
