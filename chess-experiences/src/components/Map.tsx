import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (color: string, isOnline?: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${isOnline ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 12px;
            height: 12px;
            background: #22c55e;
            border-radius: 50%;
            border: 2px solid white;
            transform: rotate(45deg);
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapMarker {
  id: number;
  name: string;
  position: [number, number];
  info?: string;
  rating?: number;
  isOnline?: boolean;
  image?: string;
}

interface MapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: number) => void;
  markerColor?: string;
  height?: string;
}

// Component to fit bounds to markers
const FitBounds = ({ markers }: { markers: MapMarker[] }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
};

const Map = ({
  markers,
  center = [40.7128, -74.006],
  zoom = 10,
  onMarkerClick,
  markerColor = '#f59e0b',
  height = '300px',
}: MapProps) => {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createCustomIcon(markerColor, marker.isOnline)}
            eventHandlers={{
              click: () => onMarkerClick?.(marker.id),
            }}
          >
            <Popup>
              <div className="text-gray-900 min-w-[150px]">
                {marker.image && (
                  <img
                    src={marker.image}
                    alt={marker.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                )}
                <h3 className="font-semibold text-sm">{marker.name}</h3>
                {marker.rating && (
                  <p className="text-xs text-gray-600">{marker.rating} ELO</p>
                )}
                {marker.info && <p className="text-xs text-gray-500 mt-1">{marker.info}</p>}
                {marker.isOnline !== undefined && (
                  <p className={`text-xs mt-1 ${marker.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                    {marker.isOnline ? '● Online' : '○ Offline'}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;
