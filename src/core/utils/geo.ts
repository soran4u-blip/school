export interface LatLng {
  lat: number;
  lng: number;
}

// Great-circle distance between two points, in kilometers (haversine formula).
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// An institution/tutor's own coordinates if set, else its governorate's centroid — this is what
// lets "near me" work today even though most existing records have no per-entity coordinates yet.
export function resolveCoordinates(
  entity: { coordinates?: LatLng },
  governorate: LatLng | undefined
): LatLng | null {
  if (entity.coordinates) return entity.coordinates;
  if (governorate) return governorate;
  return null;
}
