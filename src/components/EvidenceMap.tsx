import { Link } from "@tanstack/react-router";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { EvidenceMapPoint } from "@/lib/archive-index";

type EvidenceMapProps = {
  points: EvidenceMapPoint[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const markerColor = (point: EvidenceMapPoint) => {
  if (point.location.category === "broad-region") return "#7a4d26";
  return "#1f1b15";
};

export default function EvidenceMap({ points, selectedId, onSelect }: EvidenceMapProps) {
  const mappedPoints = points.filter((point) => point.location.coordinates);

  return (
    <MapContainer
      center={[24, 24]}
      zoom={2}
      minZoom={2}
      maxZoom={7}
      scrollWheelZoom
      className="h-[34rem] w-full border border-border bg-secondary"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mappedPoints.map((point) => {
        const active = point.location.id === selectedId;
        const [lat, lng] = point.location.coordinates!;

        return (
          <CircleMarker
            key={point.location.id}
            center={[lat, lng]}
            radius={active ? 14 : 10}
            pathOptions={{
              color: markerColor(point),
              fillColor: markerColor(point),
              fillOpacity: active ? 0.82 : 0.58,
              opacity: 0.9,
              weight: active ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelect(point.location.id),
            }}
          >
            <Popup>
              <div className="min-w-56 text-stone-900">
                <div className="font-serif text-lg font-black">{point.location.label}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                  Approximate Archive Region
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[10px] uppercase tracking-widest">
                  <span>{point.cases.length} cases</span>
                  <span>{point.episodes.length} eps</span>
                  <span>{point.fileCount} files</span>
                </div>
                <div className="mt-3 text-xs text-stone-700">
                  {point.dateSpan} · {point.agencies.join(", ") || "Agency unknown"}
                </div>
                {point.episodes[0] && (
                  <Link
                    to="/cases/$caseId/episodes/$episodeId"
                    params={{
                      caseId: point.episodes[0].caseItem.caseId,
                      episodeId: point.episodes[0].episode.episodeId,
                    }}
                    className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-stone-900 underline underline-offset-4"
                  >
                    Open first episode
                  </Link>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
