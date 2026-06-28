"use client";

import { useEffect, useRef } from "react";
import { LocateFixed, MapPinned } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Itinerary, Poi } from "@/lib/types";

type MapPanelProps = {
  itinerary: Itinerary | null;
  pois: Poi[];
};

export function MapPanel({ itinerary, pois }: MapPanelProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const stops = itinerary?.stops || pois.slice(0, 3);

  useEffect(() => {
    if (!token || !containerRef.current || stops.length === 0) {
      return;
    }

    mapboxgl.accessToken = token;
    const center = stops[0].coordinates;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lng, center.lat],
      zoom: 13.4
    });

    stops.forEach((stop, index) => {
      const element = document.createElement("div");
      element.className =
        "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-black text-white shadow-lg";
      element.textContent = `${index + 1}`;

      new mapboxgl.Marker(element).setLngLat([stop.coordinates.lng, stop.coordinates.lat]).addTo(mapRef.current!);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, stops]);

  return (
    <section className="sticky top-4 overflow-hidden rounded-lg border border-border bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <p className="text-sm font-bold">Mapped route</p>
          <p className="text-xs text-muted-foreground">Same-city stops only</p>
        </div>
        <Badge tone="amber">{itinerary ? `${itinerary.totalTravelMinutes} min transfer` : "Preview"}</Badge>
      </div>

      <div className="relative h-[420px] bg-[#a9d8d2]">
        {token && stops.length > 0 ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <FallbackMap stops={stops} />
        )}
        <Button size="icon" variant="secondary" className="absolute bottom-4 right-4 shadow-soft" aria-label="Recenter map">
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border text-center text-xs">
        <div className="p-3">
          <p className="font-bold">{stops.length || 0}</p>
          <p className="text-muted-foreground">stops</p>
        </div>
        <div className="p-3">
          <p className="font-bold">{itinerary?.input.transportMode || "walk"}</p>
          <p className="text-muted-foreground">mode</p>
        </div>
        <div className="p-3">
          <p className="font-bold">{itinerary ? `${Math.round(itinerary.confidence * 100)}%` : "mock"}</p>
          <p className="text-muted-foreground">fit</p>
        </div>
      </div>
    </section>
  );
}

function FallbackMap({ stops }: { stops: Array<Poi | Itinerary["stops"][number]> }) {
  const positions = [
    "left-[28%] top-[28%]",
    "left-[62%] top-[42%]",
    "left-[46%] top-[58%]"
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute -left-12 top-1/3 h-[560px] w-16 -rotate-[28deg] rounded-full bg-amber-300/80" />
      <div className="absolute -left-8 top-1/3 h-[560px] w-10 -rotate-[28deg] rounded-full bg-emerald-100/80" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-2xl" />
      {stops.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold">
            <MapPinned className="h-4 w-4 text-emerald-700" />
            Waiting for route
          </div>
        </div>
      ) : null}
      {stops.slice(0, 3).map((stop, index) => (
        <div
          key={stop.id}
          className={`absolute ${positions[index]} flex h-10 w-10 animate-[marker-pop_.45s_ease-out] items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-black text-white shadow-lift`}
          title={stop.name}
        >
          {index + 1}
          <span className="absolute top-full mt-1 h-4 w-1 rounded-full bg-primary" />
        </div>
      ))}
      <style jsx>{`
        @keyframes marker-pop {
          from {
            transform: scale(0.75);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
