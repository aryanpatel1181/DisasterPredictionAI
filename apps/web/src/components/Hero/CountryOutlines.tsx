'use client';

import { useEffect, useState } from 'react';
import { mesh } from 'topojson-client';

type Position = number[];
type Point3 = { x: number; y: number; z: number };
const radians = Math.PI / 180;
const latitude = 18 * radians;
const radius = 144;

// Orthographic projection: only the hemisphere facing the viewer is drawn.
function project([lon, lat]: Position): Point3 {
  const lambda = (lon - 20) * radians;
  const phi = lat * radians;
  return {
    x: Math.cos(phi) * Math.sin(lambda),
    y: Math.cos(latitude) * Math.sin(phi) - Math.sin(latitude) * Math.cos(phi) * Math.cos(lambda),
    z: Math.sin(latitude) * Math.sin(phi) + Math.cos(latitude) * Math.cos(phi) * Math.cos(lambda),
  };
}

function screen(p: Point3) {
  return `${(145 + radius * p.x).toFixed(2)},${(145 - radius * p.y).toFixed(2)}`;
}

function horizon(a: Point3, b: Point3): Point3 {
  const t = a.z / (a.z - b.z);
  const x = a.x + t * (b.x - a.x);
  const y = a.y + t * (b.y - a.y);
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length, z: 0 };
}

function outline(lines: Position[][]): string {
  const commands: string[] = [];
  for (const line of lines) {
    let previous: Point3 | undefined;
    for (const coordinate of line) {
      const point = project(coordinate);
      if (!previous) {
        if (point.z >= 0) commands.push('M' + screen(point));
      } else if (point.z >= 0 && previous.z >= 0) {
        commands.push('L' + screen(point));
      } else if (point.z >= 0) {
        commands.push('M' + screen(horizon(previous, point)), 'L' + screen(point));
      } else if (previous.z >= 0) {
        commands.push('L' + screen(horizon(previous, point)));
      }
      previous = point;
    }
  }
  return commands.join(' ');
}

const graticule: Position[][] = [];
for (let lat = -60; lat <= 60; lat += 30) {
  graticule.push(Array.from({ length: 181 }, (_, i) => [-180 + i * 2, lat]));
}
for (let lon = -180; lon < 180; lon += 30) {
  graticule.push(Array.from({ length: 91 }, (_, i) => [lon, -90 + i * 2]));
}
const grid = outline(graticule);

export default function CountryOutlines() {
  const [borders, setBorders] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/geo/countries-110m.json', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Country geometry unavailable');
        return response.json();
      })
      .then(topology => {
        const boundaries = mesh(topology, topology.objects.countries);
        setBorders(outline(boundaries.coordinates));
      })
      .catch(error => {
        if (error.name !== 'AbortError') console.warn('Hero country outlines unavailable', error);
      });
    return () => controller.abort();
  }, []);

  return <svg className="country-outlines" viewBox="0 0 290 290" aria-hidden="true">
    <path className="earth-graticule" d={grid}/>
    <path className="earth-borders-glow" d={borders}/>
    <path className="earth-borders" d={borders}/>
  </svg>;
}
