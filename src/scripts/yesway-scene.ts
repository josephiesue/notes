/**
 * The Yes-Way background scene.
 * Gold contour terrain, a living star field, and the Joseph E. Iesue compass emblem.
 * One fixed canvas behind every page. Mode comes from <body data-scene="home|page|article">.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Mode = 'home' | 'page' | 'article';

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* ---------- Terrain: gold contour lines with a blue path running through ---------- */
function buildTerrain(lines: number, segments: number) {
  const width = 64;
  const zNear = 8;
  const zFar = -56;
  const positions = new Float32Array(lines * segments * 3);
  const lineAttr = new Float32Array(lines * segments);
  const indices: number[] = [];
  for (let l = 0; l < lines; l++) {
    const t = l / (lines - 1);
    // denser lines near the camera, looser into the distance
    const z = zNear + (zFar - zNear) * Math.pow(t, 1.35);
    for (let s = 0; s < segments; s++) {
      const i = l * segments + s;
      positions[i * 3] = -width / 2 + (width * s) / (segments - 1);
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = z;
      lineAttr[i] = t;
      if (s < segments - 1) indices.push(i, i + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aLine', new THREE.BufferAttribute(lineAttr, 1));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uIntensity: { value: 1 },
      uGoldDim: { value: new THREE.Color('#5c4214') },
      uGold: { value: new THREE.Color('#f0c95f') },
      uBlue: { value: new THREE.Color('#3b63d6') },
    },
    vertexShader: /* glsl */ `
      ${NOISE}
      uniform float uTime; uniform float uTravel;
      attribute float aLine;
      varying float vFade; varying float vGlow; varying float vPath; varying float vPulse;
      void main(){
        vec3 p = position;
        float wz = p.z - uTravel;
        float n1 = snoise(vec3(p.x*0.065, wz*0.07, uTime*0.025));
        float n2 = snoise(vec3(p.x*0.19, wz*0.17, uTime*0.04 + 7.0));
        float h = n1*1.55 + n2*0.38;
        float pathCenter = sin(wz*0.075)*4.2 + sin(wz*0.021+1.3)*2.4;
        float path = exp(-pow((p.x - pathCenter)/3.2, 2.0));
        h -= path*1.25;
        h += pow(abs(p.x)/32.0, 1.6)*3.2;   // rise toward the edges, valley through the middle
        p.y = h - 2.85;
        vGlow = smoothstep(-0.3, 1.6, h);
        vPath = path;
        float sweep = sin(p.x*0.16 - uTime*0.7 + aLine*31.0);
        vPulse = pow(max(sweep, 0.0), 48.0);
        float distFade = 1.0 - smoothstep(0.55, 1.0, aLine);
        float nearFade = smoothstep(9.0, 3.0, p.z);
        float sideFade = 1.0 - smoothstep(20.0, 31.0, abs(p.x));
        vFade = distFade * nearFade * sideFade;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uIntensity; uniform vec3 uGoldDim; uniform vec3 uGold; uniform vec3 uBlue;
      varying float vFade; varying float vGlow; varying float vPath; varying float vPulse;
      void main(){
        vec3 col = mix(uGoldDim, uGold, vGlow);
        col = mix(col, uBlue*1.4, vPath*0.55);
        col += vec3(1.0, 0.86, 0.5) * vPulse * 0.9;
        float a = vFade * (0.16 + vGlow*0.55 + vPulse*0.8 + vPath*0.18) * uIntensity;
        gl_FragColor = vec4(col * a, a);
      }`,
  });
  return new THREE.LineSegments(geometry, material);
}

/* ---------- Star field with a milky band and a few gold flares ---------- */
function buildStars(count: number) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const flare = new Float32Array(count);
  const white = new THREE.Color('#e8ecf6');
  const blue = new THREE.Color('#6d8fe8');
  const gold = new THREE.Color('#f2cf6a');
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const inBand = Math.random() < 0.5;
    let x = (Math.random() - 0.5) * 140;
    let y = (Math.random() - 0.2) * 70;
    if (inBand) {
      // tilted river of stars, echoing the logo artwork
      x = (Math.random() - 0.5) * 130;
      y = Math.sin(x * 0.045) * 9 + x * 0.22 + (Math.random() - 0.5) * (6 + Math.random() * 8);
    }
    const z = -38 - Math.random() * 46;
    pos.set([x, y, z], i * 3);
    const r = Math.random();
    if (r < 0.07) { c.copy(gold); flare[i] = Math.random() < 0.35 ? 1 : 0; size[i] = 2.4 + Math.random() * 2.6; }
    else if (inBand) { c.copy(blue).lerp(white, Math.random() * 0.45); size[i] = 0.8 + Math.random() * 1.5; }
    else { c.copy(white).lerp(blue, Math.random() * 0.3); size[i] = 0.6 + Math.random() * 1.3; }
    if (flare[i]) size[i] = 6 + Math.random() * 5;
    col.set([c.r, c.g, c.b], i * 3);
    phase[i] = Math.random() * Math.PI * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('aFlare', new THREE.BufferAttribute(flare, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uIntensity: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPR;
      attribute float aSize; attribute float aPhase; attribute float aFlare;
      varying vec3 vColor; varying float vTw; varying float vFlare;
      void main(){
        vColor = color; vFlare = aFlare;
        vTw = 0.55 + 0.45*sin(uTime*(0.6 + fract(aPhase)*1.6) + aPhase*6.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPR * (60.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uIntensity;
      varying vec3 vColor; varying float vTw; varying float vFlare;
      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float core = pow(smoothstep(0.5, 0.0, d), vFlare > 0.5 ? 6.0 : 1.8);
        float cross = 0.0;
        if (vFlare > 0.5) {
          cross = max(0.0, 1.0 - abs(uv.x)*28.0) * smoothstep(0.5, 0.0, abs(uv.y))
                + max(0.0, 1.0 - abs(uv.y)*28.0) * smoothstep(0.5, 0.0, abs(uv.x));
          cross *= 0.7;
        }
        float a = (core + cross) * vTw * uIntensity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * a, a);
      }`,
  });
  return { points: new THREE.Points(g, m), material: m };
}

/* ---------- The compass emblem ---------- */
function starShape(tx: number, ty: number, cx: number, cy: number) {
  const s = new THREE.Shape();
  s.moveTo(0, ty);
  s.quadraticCurveTo(cx, cy, tx, 0);
  s.quadraticCurveTo(cx, -cy, 0, -ty);
  s.quadraticCurveTo(-cx, -cy, -tx, 0);
  s.quadraticCurveTo(-cx, cy, 0, ty);
  return s;
}
function starPath(tx: number, ty: number, cx: number, cy: number) {
  const p = new THREE.Path();
  p.moveTo(0, ty);
  p.quadraticCurveTo(-cx, cy, -tx, 0);
  p.quadraticCurveTo(-cx, -cy, 0, -ty);
  p.quadraticCurveTo(cx, -cy, tx, 0);
  p.quadraticCurveTo(cx, cy, 0, ty);
  return p;
}

function hammeredTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 11;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = Math.random() < 0.5 ? 40 : 200;
    g.addColorStop(0, `rgba(${v},${v},${v},.22)`);
    g.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  return tex;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,214,120,.55)');
  g.addColorStop(0.25, 'rgba(230,170,70,.18)');
  g.addColorStop(0.6, 'rgba(90,110,200,.05)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function buildEmblem() {
  const group = new THREE.Group();
  const bump = hammeredTexture();
  const gold = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2b54f'),
    metalness: 1,
    roughness: 0.3,
    roughnessMap: bump,
    bumpMap: bump,
    bumpScale: 0.6,
    envMapIntensity: 1.35,
    emissive: new THREE.Color('#3a2608'),
    emissiveIntensity: 0.35,
    transparent: true,
  });
  const extrude = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 4, curveSegments: 28 };

  const outer = starShape(1, 1.32, 0.2, 0.25);
  outer.holes.push(starPath(0.68, 0.86, 0.15, 0.18));
  const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, extrude), gold);

  const core = starShape(0.34, 0.42, 0.1, 0.12);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.1, 0, Math.PI * 2, true);
  core.holes.push(hole);
  const center = new THREE.Mesh(new THREE.ExtrudeGeometry(core, { ...extrude, depth: 0.14 }), gold);
  center.position.z = 0.02;

  const mark = new THREE.Group();
  mark.add(ring, center);
  mark.children.forEach((m) => (m as THREE.Mesh).geometry.center());
  center.position.z = 0.03;
  group.add(mark);

  // glow
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 }));
  glow.scale.set(7, 7, 1);
  glow.position.z = -0.4;
  group.add(glow);

  // compass rays, orbit rings and flare lines
  const lineMat = new THREE.LineBasicMaterial({ color: '#d4a645', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
  const rays: number[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r1 = 1.75;
    const r2 = i % 4 === 0 ? 3.3 : i % 2 === 0 ? 2.7 : 2.35;
    rays.push(Math.cos(a) * r1, Math.sin(a) * r1, -0.3, Math.cos(a) * r2, Math.sin(a) * r2, -0.3);
  }
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.Float32BufferAttribute(rays, 3));
  const rayLines = new THREE.LineSegments(rayGeo, lineMat);
  group.add(rayLines);

  const circle = (r: number, dashed: boolean, opacity: number) => {
    const pts = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2).getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, -0.3));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color: '#8fa7ff', dashSize: 0.05, gapSize: 0.07, transparent: true, opacity, depthWrite: false })
      : new THREE.LineBasicMaterial({ color: '#d4a645', transparent: true, opacity, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    if (dashed) line.computeLineDistances();
    return line;
  };
  const orbitA = circle(2.05, false, 0.35);
  const orbitB = circle(2.75, true, 0.28);
  group.add(orbitA, orbitB);

  const flareMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uOpacity; varying vec2 vUv; void main(){ float a=pow(1.0-abs(vUv.x-0.5)*2.0,2.2)*(1.0-abs(vUv.y-0.5)*2.0)*0.85*uOpacity; gl_FragColor=vec4(vec3(0.98,0.8,0.42)*a,a); }`,
  });
  const hFlare = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.018), flareMat);
  const vFlare = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 0.018), flareMat);
  vFlare.rotation.z = Math.PI / 2;
  hFlare.position.z = vFlare.position.z = -0.2;
  group.add(hFlare, vFlare);

  return { group, mark, gold, glow, rayLines, orbitA, orbitB, lineMat, flareMat };
}

/* ---------- Boot ---------- */
export function startScene(canvas: HTMLCanvasElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const lite = coarse || small;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: false, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  const pr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
  renderer.setPixelRatio(pr);
  renderer.setClearColor('#04070d', 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#04070d', 0.012);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

  const mode = (document.body.dataset.scene as Mode) || 'page';
  const terrain = buildTerrain(lite ? 56 : 92, lite ? 150 : 240);
  scene.add(terrain);
  const stars = buildStars(lite ? 1400 : 2800);
  scene.add(stars.points);

  const emblem = buildEmblem();
  emblem.group.visible = mode === 'home';
  if (mode === 'home') scene.add(emblem.group);

  // dawn glow where the path meets the horizon (replaces the emblem on inner pages)
  const horizonCanvas = document.createElement('canvas');
  horizonCanvas.width = horizonCanvas.height = 256;
  const hc = horizonCanvas.getContext('2d')!;
  const hg = hc.createRadialGradient(128, 128, 0, 128, 128, 128);
  hg.addColorStop(0, 'rgba(255,205,120,.75)');
  hg.addColorStop(0.2, 'rgba(230,165,70,.28)');
  hg.addColorStop(0.55, 'rgba(60,90,190,.06)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  hc.fillStyle = hg; hc.fillRect(0, 0, 256, 256);
  const horizon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(horizonCanvas), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false }));
  horizon.scale.set(110, 14, 1);
  horizon.position.set(0, -5.2, -46);
  const horizonBase = { home: 0.25, page: 0.6, article: 0.35 }[mode];
  scene.add(horizon);

  const key = new THREE.DirectionalLight('#fff1d0', 1.6);
  key.position.set(-4, 5, 6);
  scene.add(key);
  const glint = new THREE.PointLight('#ffd38a', 18, 12, 2);
  scene.add(glint);

  const terrainU = (terrain.material as THREE.ShaderMaterial).uniforms;
  const intensity = { home: 1, page: 0.75, article: 0.42 }[mode];
  terrainU.uIntensity.value = intensity;
  stars.material.uniforms.uIntensity.value = mode === 'article' ? 0.7 : 1;
  stars.material.uniforms.uPR.value = pr;

  // layout of the emblem per viewport
  const layout = { x: 0, y: 0, s: 1 };
  let lastW = 0;
  let lastH = 0;
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // ignore mobile URL-bar height jitter
    if (w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10;
    const halfW = halfH * camera.aspect;
    if (mode === 'home') {
      if (camera.aspect > 1.05) { layout.x = halfW * 0.44; layout.y = 0.75; layout.s = Math.min(1.25, halfH * 0.26); }
      else { layout.x = 0; layout.y = halfH * 0.5; layout.s = Math.min(0.78, halfW * 0.3); }
    }
    render(performance.now());
  };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduce) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let scrollEase = 0;
  const clock = { start: performance.now() };

  function render(now: number) {
    const t = reduce ? 12 : (now - clock.start) / 1000;
    const vh = window.innerHeight || 1;
    const scrollY = window.scrollY;
    scrollEase += (scrollY - scrollEase) * (reduce ? 1 : 0.08);
    const heroP = Math.min(1, scrollEase / vh);

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    camera.position.set(pointer.x * 0.55, 2.3 - heroP * 0.6 - pointer.y * 0.25, 10);
    camera.lookAt(pointer.x * 0.2, 0.55 - heroP * 0.9, 0);

    terrainU.uTime.value = t;
    terrainU.uIntensity.value = intensity * (mode === 'home' ? 1 - heroP * 0.3 : 1);
    terrainU.uTravel.value = t * 0.55 + scrollEase * 0.012;
    stars.material.uniforms.uTime.value = t;
    stars.points.rotation.z = Math.sin(t * 0.02) * 0.03;
    stars.points.position.y = -scrollEase * 0.0025;

    // horizon breathes slowly and drifts with the path
    (horizon.material as THREE.SpriteMaterial).opacity = horizonBase * (0.85 + Math.sin(t * 0.25) * 0.15);
    horizon.position.x = Math.sin(t * 0.04) * 3;

    // emblem (home hero only)
    if (mode !== 'home') { renderer.render(scene, camera); return; }
    const g = emblem.group;
    const fade = 1 - THREE.MathUtils.smoothstep(heroP, 0.1, 0.5);
    g.position.set(layout.x, layout.y + (mode === 'home' ? heroP * 2.6 : 0) + Math.sin(t * 0.6) * 0.06, mode === 'home' ? -heroP * 2 : 0);
    const breathe = 1 + Math.sin(t * 0.9) * 0.012;
    g.scale.setScalar(layout.s * breathe * (mode === 'home' ? 1 - heroP * 0.25 : 1));
    emblem.mark.rotation.y = 0.26 + Math.sin(t * 0.32) * 0.3 + pointer.x * 0.45;
    emblem.mark.rotation.x = -0.12 + Math.sin(t * 0.21) * 0.08 - pointer.y * 0.25;
    emblem.rayLines.rotation.z = t * 0.02;
    emblem.orbitB.rotation.z = -t * 0.05;
    emblem.gold.opacity = fade;
    emblem.lineMat.opacity = 0.2 * fade;
    (emblem.orbitA.material as THREE.LineBasicMaterial).opacity = 0.35 * fade;
    (emblem.orbitB.material as THREE.LineDashedMaterial).opacity = 0.28 * fade;
    emblem.flareMat.uniforms.uOpacity.value = fade * (0.75 + Math.sin(t * 1.3) * 0.25);
    (emblem.glow.material as THREE.SpriteMaterial).opacity = 0.85 * fade;
    g.visible = fade > 0.01;

    glint.position.set(layout.x + Math.cos(t * 0.7) * 2.6, layout.y + Math.sin(t * 0.9) * 1.8, 2.4);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  let raf = 0;
  const loop = (now: number) => { render(now); raf = requestAnimationFrame(loop); };
  if (reduce) {
    render(performance.now());
    window.addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    });
  }
  requestAnimationFrame(() => document.documentElement.classList.add('scene-ready'));
}
