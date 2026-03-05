'use client';

/**
 * TangoGlobe — 3D interactive globe showing countries with tango events.
 *
 * Loaded only on the client side via dynamic import (ssr: false) because
 * react-globe.gl requires WebGL / browser APIs.
 *
 * Features:
 * - Dark-themed globe with country polygon overlay
 * - Countries with events highlighted in accent gold color
 * - Hover tooltip showing country name + event count
 * - Click navigates to /events?country=XX
 * - Slow auto-rotation that pauses on user interaction
 * - Responsive (fills its container)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Globe, { GlobeMethods } from 'react-globe.gl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw feature from the GeoJSON countries dataset */
interface CountryFeature {
  type: 'Feature';
  properties: {
    /** ISO 3166-1 alpha-2 country code (uppercased in the dataset) */
    ISO_A2: string;
    /** Full country name */
    ADMIN: string;
  };
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

interface GeoJsonData {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

export interface CountryEventCount {
  /** 2-letter ISO country code (uppercase) */
  countryCode: string;
  /** Total number of events in this country */
  count: number;
}

interface TangoGlobeProps {
  /** Map of country code → event count. Used to highlight and label countries. */
  eventCounts: CountryEventCount[];
  /** Width in pixels. Defaults to container width. */
  width?: number;
  /** Height in pixels. Defaults to 500. */
  height?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEOJSON_URL =
  'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

/** Transparent background to blend with the page gradient */
const GLOBE_BG_COLOR = 'rgba(0,0,0,0)';

/** Color for countries WITHOUT events — nearly invisible so earth texture shows */
const COLOR_INACTIVE = 'rgba(0, 0, 0, 0)';

/** Stroke color for all country borders — very subtle */
const COLOR_STROKE = 'rgba(255, 255, 255, 0.06)';

/** Atmosphere color — subtle gold glow */
const ATMOSPHERE_COLOR = 'rgba(212, 160, 23, 0.25)';

/** Auto-rotation speed (degrees per frame) */
const AUTO_ROTATE_SPEED = 0.25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns an RGBA color string for a country with events.
 * Intensity scales from 0.55 (1 event) to 0.95 (many events).
 */
function getActiveColor(count: number): string {
  const alpha = Math.min(0.7 + count * 0.03, 0.95);
  return `rgba(255, 195, 0, ${alpha.toFixed(2)})`;
}

/**
 * Returns an altitude offset for a country with events.
 * Countries with more events are slightly raised.
 */
function getAltitude(count: number): number {
  return Math.min(0.005 + count * 0.002, 0.03);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TangoGlobe({ eventCounts, width, height = 500 }: TangoGlobeProps) {
  const router = useRouter();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [hoveredPolygon, setHoveredPolygon] = useState<CountryFeature | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(width ?? 800);
  const [isReady, setIsReady] = useState(false);

  // Build a fast lookup map from the eventCounts prop
  const countMap = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const m = new Map<string, number>();
    for (const ec of eventCounts) {
      m.set(ec.countryCode.toUpperCase(), ec.count);
    }
    countMap.current = m;
  }, [eventCounts]);

  // Fetch GeoJSON country boundaries
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data: GeoJsonData) => setCountries(data.features))
      .catch((err) => console.error('[TangoGlobe] Failed to fetch GeoJSON:', err));
  }, []);

  // Measure container width for responsiveness
  useEffect(() => {
    if (width) return; // caller supplied explicit width
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);

    return () => observer.disconnect();
  }, [width]);

  // Start auto-rotation once globe is ready
  const handleGlobeReady = useCallback(() => {
    setIsReady(true);
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
      controls.enableDamping = true;
    }
    // Initial camera position — slightly tilted to show both hemispheres
    globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);
  }, []);

  // Pause rotation while user is interacting
  const handlePolygonHover = useCallback(
    (polygon: object | null) => {
      const controls = globeRef.current?.controls();
      if (controls) {
        controls.autoRotate = polygon === null;
      }
      setHoveredPolygon((polygon as CountryFeature | null));
    },
    [],
  );

  // Navigate to filtered events on country click
  const handlePolygonClick = useCallback(
    (polygon: object) => {
      const feature = polygon as CountryFeature;
      const code = feature.properties?.ISO_A2;
      if (code && code !== '-99') {
        router.push(`/events?country=${code.toUpperCase()}`);
      }
    },
    [router],
  );

  // Polygon color accessor
  const polygonCapColor = useCallback(
    (d: object) => {
      const feature = d as CountryFeature;
      const code = feature.properties?.ISO_A2?.toUpperCase();
      if (!code) return COLOR_INACTIVE;
      const count = countMap.current.get(code);
      if (count === undefined) return COLOR_INACTIVE;
      return getActiveColor(count);
    },
    // countMap is a ref — intentionally no dep so we don't re-create the fn
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventCounts],
  );

  // Polygon altitude accessor
  const polygonAltitude = useCallback(
    (d: object) => {
      const feature = d as CountryFeature;
      const code = feature.properties?.ISO_A2?.toUpperCase();
      if (!code) return 0.001;
      const count = countMap.current.get(code);
      if (count === undefined) return 0.001;
      return getAltitude(count);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventCounts],
  );

  // Tooltip label accessor
  const polygonLabel = useCallback(
    (d: object) => {
      const feature = d as CountryFeature;
      const code = feature.properties?.ISO_A2?.toUpperCase();
      const name = feature.properties?.ADMIN ?? '';
      const count = code ? countMap.current.get(code) : undefined;

      if (count !== undefined) {
        return `
          <div style="
            background: rgba(26,10,0,0.92);
            border: 1px solid rgba(212,160,23,0.5);
            border-radius: 8px;
            padding: 8px 12px;
            font-family: Inter, sans-serif;
            color: #F5EDD4;
            font-size: 13px;
            line-height: 1.5;
            pointer-events: none;
          ">
            <div style="font-weight: 600; color: #D4A017; margin-bottom: 2px;">${name}</div>
            <div style="color: #E8D9B5;">${count} tango event${count !== 1 ? 's' : ''}</div>
          </div>
        `;
      }

      // Show name-only tooltip for non-event countries on hover
      if (hoveredPolygon === (d as CountryFeature)) {
        return `
          <div style="
            background: rgba(26,10,0,0.85);
            border: 1px solid rgba(63,51,24,0.5);
            border-radius: 6px;
            padding: 6px 10px;
            font-family: Inter, sans-serif;
            color: #D4C090;
            font-size: 12px;
            pointer-events: none;
          ">${name}</div>
        `;
      }

      return '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventCounts, hoveredPolygon],
  );

  const resolvedWidth = width ?? containerWidth;

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      {/* Loading skeleton while GeoJSON or globe initialises */}
      {(!isReady || countries.length === 0) && (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(42,0,0,0.5) 0%, transparent 70%)' }}
          aria-label="Loading globe"
          role="img"
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full border-2 border-accent-500/40 border-t-accent-500 animate-spin"
              aria-hidden="true"
            />
            <span className="text-warm-400 dark:text-warm-500 text-sm">Loading globe...</span>
          </div>
        </div>
      )}

      {/* The actual globe — rendered once countries data arrives */}
      {countries.length > 0 && (
        <Globe
          ref={globeRef}
          // Sizing
          width={resolvedWidth}
          height={height}
          // Background
          backgroundColor={GLOBE_BG_COLOR}
          backgroundImageUrl={null}
          // Globe appearance — subtle dark night earth texture
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          showGraticules={false}
          showAtmosphere
          atmosphereColor={ATMOSPHERE_COLOR}
          atmosphereAltitude={0.25}
          // Polygons
          polygonsData={countries}
          polygonCapColor={polygonCapColor}
          polygonSideColor={() => 'rgba(212, 160, 23, 0.08)'}
          polygonStrokeColor={() => COLOR_STROKE}
          polygonAltitude={polygonAltitude}
          polygonsTransitionDuration={300}
          polygonLabel={polygonLabel}
          onPolygonHover={handlePolygonHover}
          onPolygonClick={handlePolygonClick}
          // Lifecycle
          onGlobeReady={handleGlobeReady}
          // Performance
          animateIn={true}
        />
      )}
    </div>
  );
}
