'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  Stars,
  Line,
  Ring,
} from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────
   TerraGuard AI — Global Risk Scan Globe
   A futuristic 3D Earth with city risk markers.
   ───────────────────────────────────────────────────────────── */

export interface CityType {
  name: string;
  lat: number;
  lon: number;
  country: string;
  risk: number;
}

interface ThreeGlobeProps {
  onSelectCity: (city: CityType) => void;
  selectedCityName?: string | null;
}

/* ─────────────────────────────────────────────────────────────
   Deterministic risk hash — stable across renders
   risk = ((index * 37 + 13) % 100) / 100
   ───────────────────────────────────────────────────────────── */
function computeRisk(index: number): number {
  return ((index * 37 + 13) % 100) / 100;
}

const EARTH_RADIUS = 2;
const ATMOSPHERE_RADIUS = 2.15;
const BORDER_RADIUS = EARTH_RADIUS * 1.035;

/* ─────────────────────────────────────────────────────────────
   Geographic projection — equirectangular lat/lon → cartesian
   Y is the polar axis, so +lat sits at the top of the globe.
   ───────────────────────────────────────────────────────────── */
function latLonToVec3(lat: number, lon: number, radius: number = EARTH_RADIUS): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;

  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/* ─────────────────────────────────────────────────────────────
   City network — 50 monitored metros with deterministic risk
   ───────────────────────────────────────────────────────────── */
const CITY_SEEDS: ReadonlyArray<readonly [string, number, number, string]> = [
  ['Tokyo', 35.68, 139.69, 'Japan'],
  ['Delhi', 28.61, 77.21, 'India'],
  ['Shanghai', 31.23, 121.47, 'China'],
  ['Beijing', 39.9, 116.41, 'China'],
  ['Mumbai', 19.08, 72.88, 'India'],
  ['New York', 40.71, -74.01, 'United States'],
  ['Los Angeles', 34.05, -118.24, 'United States'],
  ['Mexico City', 19.43, -99.13, 'Mexico'],
  ['São Paulo', -23.55, -46.63, 'Brazil'],
  ['Rio de Janeiro', -22.91, -43.17, 'Brazil'],
  ['Buenos Aires', -34.6, -58.38, 'Argentina'],
  ['Lima', -12.05, -77.04, 'Peru'],
  ['Santiago', -33.45, -70.67, 'Chile'],
  ['Bogotá', 4.71, -74.07, 'Colombia'],
  ['London', 51.51, -0.13, 'United Kingdom'],
  ['Paris', 48.86, 2.35, 'France'],
  ['Berlin', 52.52, 13.4, 'Germany'],
  ['Madrid', 40.42, -3.7, 'Spain'],
  ['Rome', 41.9, 12.5, 'Italy'],
  ['Amsterdam', 52.37, 4.9, 'Netherlands'],
  ['Stockholm', 59.33, 18.07, 'Sweden'],
  ['Moscow', 55.76, 37.62, 'Russia'],
  ['Istanbul', 41.01, 28.98, 'Türkiye'],
  ['Kyiv', 50.45, 30.52, 'Ukraine'],
  ['Cairo', 30.04, 31.24, 'Egypt'],
  ['Lagos', 6.52, 3.38, 'Nigeria'],
  ['Nairobi', -1.29, 36.82, 'Kenya'],
  ['Johannesburg', -26.2, 28.05, 'South Africa'],
  ['Casablanca', 33.57, -7.59, 'Morocco'],
  ['Riyadh', 24.71, 46.68, 'Saudi Arabia'],
  ['Dubai', 25.2, 55.27, 'United Arab Emirates'],
  ['Tehran', 35.69, 51.39, 'Iran'],
  ['Karachi', 24.86, 67.01, 'Pakistan'],
  ['Dhaka', 23.81, 90.41, 'Bangladesh'],
  ['Bangkok', 13.76, 100.5, 'Thailand'],
  ['Hanoi', 21.03, 105.85, 'Vietnam'],
  ['Manila', 14.6, 120.98, 'Philippines'],
  ['Jakarta', -6.21, 106.85, 'Indonesia'],
  ['Singapore', 1.35, 103.82, 'Singapore'],
  ['Sydney', -33.87, 151.21, 'Australia'],
  ['Melbourne', -37.81, 144.96, 'Australia'],
  ['Auckland', -36.85, 174.76, 'New Zealand'],
  ['Toronto', 43.65, -79.38, 'Canada'],
  ['Vancouver', 49.28, -123.12, 'Canada'],
  ['Chicago', 41.88, -87.63, 'United States'],
  ['Houston', 29.76, -95.37, 'United States'],
  ['Miami', 25.76, -80.19, 'United States'],
  ['Anchorage', 61.22, -149.9, 'United States'],
  ['Reykjavík', 64.15, -21.94, 'Iceland'],
  ['Zurich', 47.38, 8.54, 'Switzerland'],
];

export const CITIES: CityType[] = CITY_SEEDS.map(([name, lat, lon, country], index) => ({
  name,
  lat,
  lon,
  country,
  risk: computeRisk(index),
}));

/* ─────────────────────────────────────────────────────────────
   Risk tiers — derived from the 0..1 risk score
   ───────────────────────────────────────────────────────────── */
type RiskTier = 'low' | 'moderate' | 'severe' | 'extreme';

interface TierStyle {
  tier: RiskTier;
  label: string;
  color: string;
  threshold: number;
}

const RISK_TIERS: TierStyle[] = [
  { tier: 'low', label: 'Low', color: '#7C8FA3', threshold: 0.25 },
  { tier: 'moderate', label: 'Moderate', color: '#9D3715', threshold: 0.5 },
  { tier: 'severe', label: 'Severe', color: '#C98A2E', threshold: 0.75 },
  { tier: 'extreme', label: 'Extreme', color: '#D4451E', threshold: 1.01 },
];

const EXTREME_THRESHOLD = 0.82;

function riskTier(risk: number): TierStyle {
  return RISK_TIERS.find(t => risk < t.threshold) ?? RISK_TIERS[RISK_TIERS.length - 1];
}

function formatRisk(risk: number): string {
  return `${Math.round(risk * 100)}%`;
}

function tierRange(index: number): string {
  const from = index === 0 ? 0 : RISK_TIERS[index - 1].threshold;
  const to = Math.min(RISK_TIERS[index].threshold, 1);

  return `${Math.round(from * 100)}-${Math.round(to * 100)}%`;
}

/* ─────────────────────────────────────────────────────────────
   Starfield — deep-space backdrop with slow drift
   ───────────────────────────────────────────────────────────── */
function Starfield() {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });

  return (
    <group ref={ref}>
      <Stars radius={80} depth={30} count={2600} factor={4.5} saturation={0} fade speed={0.5} />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────
   CityMarker — pulsing surface pin with hover label
   ───────────────────────────────────────────────────────────── */
interface CityMarkerProps {
  city: CityType;
  index: number;
  selected: boolean;
  showLabel: boolean;
  onSelect: (city: CityType) => void;
}

function CityMarker({ city, index, selected, showLabel, onSelect }: CityMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pinRef = useRef<THREE.Group>(null);

  const style = riskTier(city.risk);
  const position = useMemo(() => latLonToVec3(city.lat, city.lon, EARTH_RADIUS * 1.004), [city.lat, city.lon]);
  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(position[0], position[1], position[2]).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }, [position]);

  const active = selected || hovered;

  useFrame(({ clock }) => {
    const cycle = (clock.elapsedTime * 0.5 + index * 0.17) % 1;

    if (pulseRef.current) {
      const spread = 0.6 + cycle * (active ? 3.4 : 2.2);
      pulseRef.current.scale.setScalar(spread);
      const material = pulseRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - cycle) * (active ? 0.75 : 0.4);
    }

    if (pinRef.current) {
      const target = active ? 1.7 : 1;
      pinRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    }
  });

  return (
    <group position={position}>
      <group ref={pinRef}>
        <mesh
          onPointerOver={event => {
            event.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
          onClick={event => {
            event.stopPropagation();
            onSelect(city);
          }}
        >
          <sphereGeometry args={[0.045, 20, 20]} />
          <meshBasicMaterial color={style.color} />
        </mesh>

        <mesh>
          <sphereGeometry args={[0.1, 20, 20]} />
          <meshBasicMaterial color={style.color} transparent opacity={0.16} depthWrite={false} />
        </mesh>

        {selected && (
          <Ring args={[0.16, 0.185, 64]} quaternion={quaternion}>
            <meshBasicMaterial color={style.color} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
          </Ring>
        )}
      </group>

      {/* Expanding scan ripple, oriented tangentially to the surface */}
      <mesh ref={pulseRef} quaternion={quaternion}>
        <ringGeometry args={[0.12, 0.14, 48]} />
        <meshBasicMaterial color={style.color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {showLabel && active && (
        <Html position={[0, 0.22, 0]} center distanceFactor={9} zIndexRange={[24, 0]} style={{ pointerEvents: 'none' }}>
          <div className="pointer-events-none -translate-y-2 whitespace-nowrap rounded border border-accent/25 bg-ink-surface/95 px-3 py-2 text-left shadow-raised backdrop-blur-sm">
            <p className="text-[11px] font-semibold tracking-wide text-content-primary">{city.name}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-content-tertiary">
              {city.country} · {city.lat.toFixed(1)}°, {city.lon.toFixed(1)}°
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: style.color }}>
                {style.label}
              </span>
              <span className="text-[9px] tabular-nums text-content-secondary">{formatRisk(city.risk)}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────
   Graticule — lat/lon wireframe built from the same projection
   ───────────────────────────────────────────────────────────── */
function buildGraticule(): Array<{ id: string; points: [number, number, number][] }> {
  const lines: Array<{ id: string; points: [number, number, number][] }> = [];
  const surface = EARTH_RADIUS * 1.002;

  for (let lat = -60; lat <= 60; lat += 30) {
    const points: [number, number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 3) points.push(latLonToVec3(lat, lon, surface));
    lines.push({ id: `lat-${lat}`, points });
  }

  for (let lon = -180; lon < 180; lon += 30) {
    const points: [number, number, number][] = [];
    for (let lat = -90; lat <= 90; lat += 3) points.push(latLonToVec3(lat, lon, surface));
    lines.push({ id: `lon-${lon}`, points });
  }

  return lines;
}

/* ─────────────────────────────────────────────────────────────
   Response links — arcs from extreme-risk cities to the
   highest-risk hub, drawn as bezier tubes above the surface
   ───────────────────────────────────────────────────────────── */
function buildLinks(): Array<{ id: string; points: THREE.Vector3[]; color: string }> {
  const extreme = CITIES.filter(city => city.risk >= EXTREME_THRESHOLD);
  if (extreme.length < 2) return [];

  const hub = CITIES.reduce((top, city) => (city.risk > top.risk ? city : top));
  const surface = EARTH_RADIUS * 1.01;

  return extreme
    .filter(city => city.name !== hub.name)
    .slice(0, 9)
    .map(city => {
      const start = new THREE.Vector3(...latLonToVec3(city.lat, city.lon, surface));
      const end = new THREE.Vector3(...latLonToVec3(hub.lat, hub.lon, surface));
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS * 1.5);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

      return { id: `${city.name}->${hub.name}`, points: curve.getPoints(40), color: riskTier(city.risk).color };
    });
}


/* ─────────────────────────────────────────────
   Country borders — TopoJSON outlines
   three@0.160 ships no examples/jsm TopologyLoader,
   so the same minimal loader is defined locally.
   ───────────────────────────────────────────── */
type LonLat = [number, number];

interface TopologyData {
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: LonLat[][];
  objects: { countries?: { geometries: Array<{ arcs: unknown }> } };
}

class Topology extends THREE.Loader<TopologyData> {
  parse(text: string): TopologyData {
    return JSON.parse(text) as TopologyData;
  }
}

/* TopoJSON arcs are delta-encoded and quantized when a `transform`
   is present — reconstruct absolute [lon, lat] degrees. */
function decodeArcs(topology: TopologyData): LonLat[][] {
  const scale = topology.transform?.scale ?? [1, 1];
  const translate = topology.transform?.translate ?? [0, 0];

  return topology.arcs.map(arc => {
    const out: LonLat[] = new Array(arc.length);
    let x = 0;
    let y = 0;

    for (let i = 0; i < arc.length; i += 1) {
      x += arc[i][0];
      y += arc[i][1];
      out[i] = [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    }

    return out;
  });
}

/* `geometry.arcs` is nested by ring/part depth — flatten to indices. */
function collectArcIndices(node: unknown, out: number[]): void {
  if (typeof node === 'number') {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) collectArcIndices(node[i], out);
  }
}

function buildBorderSegments(topology: TopologyData): Float32Array {
  const arcs = decodeArcs(topology);
  const positions: number[] = [];

  for (const geometry of topology.objects?.countries?.geometries ?? []) {
    const indices: number[] = [];
    collectArcIndices(geometry.arcs, indices);

    for (const i of indices) {
      const reversed = i < 0;
      const idx = reversed ? ~i : i;
      const arc = arcs[idx];
      if (!arc || arc.length < 2) continue;

      for (let p = 0; p < arc.length - 1; p += 1) {
        const a = arc[reversed ? arc.length - 1 - p : p] as LonLat;
        const b = arc[reversed ? arc.length - 2 - p : p + 1] as LonLat;
        positions.push(...latLonToVec3(a[1], a[0], BORDER_RADIUS));
        positions.push(...latLonToVec3(b[1], b[0], BORDER_RADIUS));
      }
    }
  }

  return new Float32Array(positions);
}

function CountryBorders() {
  const topology = useLoader(Topology as any, '/geo/countries-110m.json') as TopologyData;
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => buildBorderSegments(topology), [topology]);

  useEffect(() => () => geometryRef.current?.dispose(), []);

  if (positions.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef} key={positions.length}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#582F24" transparent opacity={0.55} />
    </lineSegments>
  );
}

/* Keeps a failed geometry load from tearing down the whole Canvas. */
class BorderBoundary extends React.Component<{ children?: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[globe] country borders unavailable:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ─────────────────────────────────────────────────────────────
   EarthGroup — rotating planet, atmosphere and all markers
   ───────────────────────────────────────────────────────────── */
interface EarthGroupProps {
  selectedCityName?: string | null;
  showLabels: boolean;
  autoRotate: boolean;
  onSelectCity: (city: CityType) => void;
}

function EarthGroup({ selectedCityName, showLabels, autoRotate, onSelectCity }: EarthGroupProps) {
  const earthRef = useRef<THREE.Group>(null);
  const graticule = useMemo(buildGraticule, []);
  const links = useMemo(buildLinks, []);

  useFrame((_, delta) => {
    if (earthRef.current && autoRotate) earthRef.current.rotation.y += delta * 0.07;
  });

  return (
    <group ref={earthRef}>
      {/* Planet body */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#150C09" emissive="#3D2B23" emissiveIntensity={0.9} roughness={0.85} metalness={0.25} />
      </mesh>

      {/* Structural shell */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.012, 32, 32]} />
        <meshBasicMaterial color="#9D3715" wireframe transparent opacity={0.06} />
      </mesh>

      {/* Graticule */}
      <group>
        {graticule.map(({ id, points }) => (
          <Line key={id} points={points} color="#9D3715" lineWidth={0.5} transparent opacity={0.16} />
        ))}
      </group>

      {/* Country borders */}
      <BorderBoundary>
        <Suspense fallback={null}>
          <CountryBorders />
        </Suspense>
      </BorderBoundary>

      {/* Response arcs */}
      {links.map(({ id, points, color }) => (
        <Line key={id} points={points} color={color} lineWidth={1.1} transparent opacity={0.55} />
      ))}

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[ATMOSPHERE_RADIUS, 48, 48]} />
        <meshStandardMaterial
          color="#110C0A"
          emissive="#C4501F"
          emissiveIntensity={0.35}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* City markers */}
      {CITIES.map((city, index) => (
        <CityMarker
          key={city.name}
          city={city}
          index={index}
          selected={city.name === selectedCityName}
          showLabel={showLabels}
          onSelect={onSelectCity}
        />
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────
   ThreeGlobe — canvas host with HUD overlay
   ───────────────────────────────────────────────────────────── */
export default function ThreeGlobe({ onSelectCity, selectedCityName }: ThreeGlobeProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const selected = useMemo(
    () => CITIES.find(city => city.name === selectedCityName) ?? null,
    [selectedCityName],
  );

  const stats = useMemo(() => {
    const extreme = CITIES.filter(city => city.risk >= EXTREME_THRESHOLD).length;
    const mean = CITIES.reduce((sum, city) => sum + city.risk, 0) / CITIES.length;

    return { monitored: CITIES.length, extreme, mean: formatRisk(mean) };
  }, []);

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden rounded-lg border border-ink-border bg-ink-bg">
      <Canvas
        camera={{ position: [0, 1.1, 5.4], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0A0605']} />
        <fog attach="fog" args={['#0A0605', 12, 26]} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 3, 5]} intensity={1.4} color="#F4EDE9" />
        <pointLight position={[-5, -2, -4]} intensity={0.8} color="#C4501F" />

        <Starfield />
        <Suspense fallback={null}>
          <EarthGroup
            selectedCityName={selectedCityName}
            showLabels={showLabels}
            autoRotate={autoRotate}
            onSelectCity={onSelectCity}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.55}
          zoomSpeed={0.7}
          minDistance={3.1}
          maxDistance={9}
        />
      </Canvas>

      {/* ══ HUD overlay ══════════════════════════════════════════ */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {/* Top-left: scan status */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded border border-status-ok/20 bg-ink-surface/70 px-3 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ok opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-status-ok" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-status-ok">Global scan live</span>
        </div>

        {/* Top-left second row: scan parameters */}
        <div className="absolute left-4 top-12 hidden rounded border border-ink-border bg-ink-surface/60 px-3 py-2 backdrop-blur-sm sm:block">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-content-tertiary">TerraGuard AI</p>
          <p className="mt-1 text-[11px] font-medium text-content-primary">Hazard mesh · orbital view</p>
        </div>

        {/* Top-right: metrics */}
        <div className="absolute right-4 top-4 rounded border border-ink-border bg-ink-surface/60 px-3 py-2.5 text-right backdrop-blur-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-content-tertiary">Monitored metros</p>
          <p className="mt-1 text-lg font-semibold tabular-nums leading-none text-content-primary">{stats.monitored}</p>
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-status-critical/80">Extreme signals</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums leading-none text-status-critical">{stats.extreme}</p>
        </div>

        {/* Right: tier legend */}
        <div className="absolute right-4 top-32 hidden rounded border border-ink-border bg-ink-surface/60 px-3 py-2.5 backdrop-blur-sm md:block">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-content-tertiary">Risk index</p>
          <ul className="space-y-1.5">
            {RISK_TIERS.map((tier, index) => (
              <li key={tier.tier} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
                <span className="text-[10px] tracking-wide text-content-secondary">{tier.label}</span>
                <span className="ml-auto text-[9px] tabular-nums text-content-tertiary">{tierRange(index)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom-left: controls */}
        <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
          <div className="pointer-events-auto flex overflow-hidden rounded border border-ink-border bg-ink-surface/70 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setAutoRotate(value => !value)}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                autoRotate ? 'bg-accent/15 text-accent-bright' : 'text-content-tertiary hover:text-content-secondary'
              }`}
            >
              {autoRotate ? 'Auto-rotate on' : 'Auto-rotate off'}
            </button>
            <button
              type="button"
              onClick={() => setShowLabels(value => !value)}
              className={`border-l border-ink-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                showLabels ? 'bg-accent/15 text-accent-bright' : 'text-content-tertiary hover:text-content-secondary'
              }`}
            >
              {showLabels ? 'Labels on' : 'Labels off'}
            </button>
          </div>
          <p className="hidden text-[10px] tracking-wide text-content-tertiary lg:block">
            Drag to orbit · Scroll to zoom · Select a marker
          </p>
        </div>

        {/* Bottom-right: selected city readout */}
        <div className="absolute bottom-4 right-4 w-60 rounded border border-ink-border bg-ink-surface/75 p-3.5 backdrop-blur-sm">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-content-tertiary">{selected.country}</p>
                  <h3 className="mt-1 text-sm font-semibold tracking-tight text-content-primary">{selected.name}</h3>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    color: riskTier(selected.risk).color,
                    backgroundColor: `${riskTier(selected.risk).color}1f`,
                  }}
                >
                  {riskTier(selected.risk).label}
                </span>
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-raised">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(selected.risk * 100)}%`, backgroundColor: riskTier(selected.risk).color }}
                />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.14em] text-content-tertiary">Risk</dt>
                  <dd className="mt-0.5 text-xs font-semibold tabular-nums text-content-primary">{formatRisk(selected.risk)}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.14em] text-content-tertiary">Lat</dt>
                  <dd className="mt-0.5 text-xs font-semibold tabular-nums text-content-primary">{selected.lat.toFixed(2)}°</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.14em] text-content-tertiary">Lon</dt>
                  <dd className="mt-0.5 text-xs font-semibold tabular-nums text-content-primary">{selected.lon.toFixed(2)}°</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-[11px] leading-5 text-content-tertiary">
              No metro selected. Click any marker to pull its calibrated risk profile. Network mean index{' '}
              <span className="font-semibold text-content-secondary">{stats.mean}</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

