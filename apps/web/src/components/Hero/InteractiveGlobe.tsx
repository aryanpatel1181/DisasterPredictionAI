'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mesh } from 'topojson-client';
import { Minus, Plus, RotateCcw, Pause, Play } from 'lucide-react';
import CountryOutlines from './CountryOutlines';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type GlobeActions = { zoom: (factor: number) => void; reset: () => void };
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.65;

function position([lon, lat]: number[]) {
  const phi = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta));
}

// Subdivide long segments onto the sphere so coastlines never sink into its surface.
function lineGeometry(lines: number[][][]) {
  const vertices: number[] = [];
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const a = position(line[i - 1]);
      const b = position(line[i]);
      const steps = Math.max(1, Math.ceil(a.angleTo(b) / 0.015));
      for (let step = 0; step < steps; step++) {
        for (const t of [step / steps, (step + 1) / steps]) {
          vertices.push(...a.clone().lerp(b, t).normalize().multiplyScalar(1.003).toArray());
        }
      }
    }
  }
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
}

export default function InteractiveGlobe() {
  const router = useRouter();
  const holder = useRef<HTMLDivElement>(null);
  const actions = useRef<GlobeActions | null>(null);
  const paused = useRef(false);
  const [isPaused, setPaused] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    const host = holder.current;
    if (!host) return;
    const abort = new AbortController();
    let renderer: THREE.WebGLRenderer;
    try {
      // Retain the small canvas buffer for reliable paused frames and screenshots.
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    } catch {
      setStatus('fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'group');
    canvas.setAttribute('aria-label', 'Interactive Earth globe');
    canvas.setAttribute('aria-describedby', 'globe-instructions');
    host.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.22, 1.22, 1.22, -1.22, 0.1, 20);
    camera.position.copy(position([20, 18]).multiplyScalar(4));
    scene.add(camera);
    scene.add(new THREE.AmbientLight('#a9dfc9', 0.65));
    const light = new THREE.DirectionalLight('#c0f5da', 2.2);
    light.position.set(-3, 3, 4);
    camera.add(light);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 80, 64), new THREE.MeshPhongMaterial({color: '#163f32', shininess: 14, specular: '#305a49'}));
    scene.add(sphere);
    const grid: number[][][] = [];
    for (let lat = -60; lat <= 60; lat += 30) grid.push(Array.from({length: 181}, (_, i) => [-180 + i * 2, lat]));
    for (let lon = -180; lon < 180; lon += 30) grid.push(Array.from({length: 91}, (_, i) => [lon, -90 + i * 2]));
    scene.add(new THREE.LineSegments(lineGeometry(grid), new THREE.LineBasicMaterial({color: '#8cdcb5', transparent: true, opacity: 0.18})));

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.6;
    controls.minZoom = MIN_ZOOM;
    controls.maxZoom = MAX_ZOOM;
    controls.autoRotateSpeed = 0.35;
    controls.saveState();
    let interacting = false;
    let resumeAt = 0;
    let frame = 0;
    let previous = performance.now();
    let visible = false;
    let disposed = false;
    let failed = false;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => { paused.current = motion.matches; setPaused(motion.matches); };
    syncMotion();
    motion.addEventListener('change', syncMotion);
    const pauseBriefly = () => { controls.autoRotate = false; resumeAt = performance.now() + 4000; };
    controls.addEventListener('start', () => { interacting = true; pauseBriefly(); });
    controls.addEventListener('end', () => { interacting = false; pauseBriefly(); });

    function zoom(factor: number) {
      pauseBriefly();
      camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      camera.updateProjectionMatrix();
    }
    function reset() {
      pauseBriefly();
      // Drain any remaining drag inertia before restoring the saved view.
      controls.enableDamping = false;
      controls.update();
      controls.target.set(0, 0, 0);
      camera.position.copy(position([20, 18]).multiplyScalar(4));
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      camera.lookAt(controls.target);
      controls.update();
      controls.enableDamping = true;
      renderer.render(scene, camera);
    }
    actions.current = {zoom, reset};
    function openWeather(point:THREE.Vector3) {
      const normal=point.clone().normalize();
      const lat=THREE.MathUtils.radToDeg(Math.asin(normal.y));
      const lon=THREE.MathUtils.radToDeg(Math.atan2(normal.x,normal.z));
      router.push(`/weather?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`);
    }
    const pointers=new Set<number>();
    let press:{x:number;y:number;time:number}|null=null;
    const raycaster=new THREE.Raycaster();
    function pointerDown(event:PointerEvent) {
      pointers.add(event.pointerId);
      if(pointers.size>1 || event.button!==0){press=null;return;}
      press={x:event.clientX,y:event.clientY,time:performance.now()};
    }
    function pointerUp(event:PointerEvent) {
      pointers.delete(event.pointerId);
      const start=press;press=null;
      if(!start||event.type==='pointercancel'||Math.hypot(event.clientX-start.x,event.clientY-start.y)>6||performance.now()-start.time>500)return;
      const rect=canvas.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
      const hit=raycaster.intersectObject(sphere)[0];
      if(hit)openWeather(hit.point);
    }
    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointerup',pointerUp);
    canvas.addEventListener('pointercancel',pointerUp);
    function keydown(event: KeyboardEvent) {
      if(event.key==='Enter'){event.preventDefault();openWeather(camera.position);return;}
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home', ' '].includes(event.key)) return;
      event.preventDefault();
      pauseBriefly();
      if (event.key === '+' || event.key === '=') zoom(1.15);
      else if (event.key === '-') zoom(1 / 1.15);
      else if (event.key === 'Home') reset();
      else if (event.key === ' ') { paused.current = !paused.current; setPaused(paused.current); }
      else {
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        spherical.theta += event.key === 'ArrowLeft' ? 0.12 : event.key === 'ArrowRight' ? -0.12 : 0;
        spherical.phi += event.key === 'ArrowUp' ? -0.12 : event.key === 'ArrowDown' ? 0.12 : 0;
        spherical.makeSafe();
        camera.position.setFromSpherical(spherical);
        controls.update();
      }
    }
    canvas.addEventListener('keydown', keydown);
    function animate(now: number) {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      controls.autoRotate = !paused.current && !interacting && now > resumeAt && !host!.matches(':hover, :focus-within');
      controls.update(delta);
      renderer.render(scene, camera);
      canvas.dataset.view = [camera.position.x, camera.position.y, camera.position.z, camera.zoom].map(n => n.toFixed(4)).join(',');
      frame = requestAnimationFrame(animate);
    }
    function updateVisibility() {
      cancelAnimationFrame(frame);
      if (visible && !document.hidden && !disposed && !failed) { previous = performance.now(); frame = requestAnimationFrame(animate); }
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updateVisibility(); });
    observer.observe(host);
    document.addEventListener('visibilitychange', updateVisibility);
    const resize = new ResizeObserver(() => { renderer.setSize(host.clientWidth, host.clientHeight); });
    resize.observe(host);
    function contextLost(event: Event) { event.preventDefault(); failed = true; cancelAnimationFrame(frame); visible = false; setStatus('fallback'); }
    canvas.addEventListener('webglcontextlost', contextLost);

    fetch('/geo/countries-110m.json', {signal: abort.signal})
      .then(response => { if (!response.ok) throw new Error('Country outlines unavailable'); return response.json(); })
      .then(topology => {
        if (disposed || failed) return;
        const borders = mesh(topology, topology.objects.countries);
        scene.add(new THREE.LineSegments(lineGeometry(borders.coordinates), new THREE.LineBasicMaterial({color: '#bcebd1', transparent: true, opacity: 0.88})));
        setStatus('ready');
      })
      .catch(error => { if (error.name !== 'AbortError' && !disposed) { failed = true; setStatus('fallback'); visible = false; cancelAnimationFrame(frame); } });

    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
      motion.removeEventListener('change', syncMotion);
      canvas.removeEventListener('keydown', keydown);
      canvas.removeEventListener('pointerdown',pointerDown);
      canvas.removeEventListener('pointerup',pointerUp);
      canvas.removeEventListener('pointercancel',pointerUp);
      canvas.removeEventListener('webglcontextlost', contextLost);
      controls.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
      canvas.remove();
      actions.current = null;
    };
  }, [router]);

  return <div className="orbital-art interactive-orbit">
    <div className="orbit orbit-one" aria-hidden="true"/><div className="orbit orbit-two" aria-hidden="true"/>
    <div ref={holder} className="globe-canvas" hidden={status === 'fallback'} aria-busy={status === 'loading'}/>
    {status === 'fallback' && <div className="planet" role="img" aria-label="Static Earth with country outlines"><CountryOutlines/></div>}
    <Link href="/weather" className="orbital-coordinate" style={{pointerEvents:'auto'}}>OPEN WEATHER ATLAS ↗</Link>
    <div className="globe-toolbar" role="group" aria-label="Globe controls">
      <button aria-label="Zoom out globe" title="Zoom out" disabled={status !== 'ready'} onClick={() => actions.current?.zoom(1 / 1.15)}><Minus size={16}/></button>
      <button aria-label="Zoom in globe" title="Zoom in" disabled={status !== 'ready'} onClick={() => actions.current?.zoom(1.15)}><Plus size={16}/></button>
      <button aria-label="Reset globe view" title="Reset view" disabled={status !== 'ready'} onClick={() => actions.current?.reset()}><RotateCcw size={15}/></button>
      <button aria-label={isPaused ? 'Resume globe rotation' : 'Pause globe rotation'} title={isPaused ? 'Resume rotation' : 'Pause rotation'} disabled={status !== 'ready'} onClick={() => {paused.current = !paused.current; setPaused(paused.current);}}>{isPaused ? <Play size={15}/> : <Pause size={15}/>}</button>
    </div>
    <p className="globe-instructions" id="globe-instructions">{status === 'fallback' ? '3D unavailable · showing static Earth' : status === 'loading' ? 'Preparing your planet…' : 'Drag · Scroll to zoom · Click for weather'}<span className="sr-only">. Arrow keys rotate, plus and minus zoom, Home resets, Space pauses rotation, Enter opens the weather atlas.</span></p>
    <span className="art-note">NATURAL EARTH BOUNDARIES · ILLUSTRATIVE</span>
  </div>;
}
