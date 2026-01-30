/**
 * Geocoding Service using OpenStreetMap's Nominatim API
 * Free geocoding with no API key required
 * Rate limited to 1 request per second per Nominatim usage policy
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

// Simple rate limiting - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

/**
 * Geocode an address to coordinates using Nominatim API
 * @param address Full address or partial address components
 * @returns Coordinates and display name, or null if not found
 */
export const geocodeAddress = async (options: {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}): Promise<GeocodingResult | null> => {
  const { address, city, state, country } = options;

  // Build search query from available parts
  const parts: string[] = [];
  if (address) parts.push(address);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (country) parts.push(country);

  if (parts.length === 0) {
    return null;
  }

  const query = parts.join(', ');

  try {
    // Respect rate limiting
    await waitForRateLimit();

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a User-Agent header
        'User-Agent': 'ChessFam/1.0 (chess community platform)',
      },
    });

    if (!response.ok) {
      console.error(`[Geocoding] Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as NominatimResponse[];

    if (data.length === 0) {
      console.log(`[Geocoding] No results found for: ${query}`);
      return null;
    }

    const result = data[0];
    console.log(`[Geocoding] Found coordinates for "${query}": ${result.lat}, ${result.lon}`);

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
    };
  } catch (error) {
    console.error('[Geocoding] Error geocoding address:', error);
    return null;
  }
};

/**
 * Geocode just a city and country (faster, for basic bubble assignment)
 */
export const geocodeCity = async (city: string, country?: string): Promise<GeocodingResult | null> => {
  return geocodeAddress({ city, country });
};
