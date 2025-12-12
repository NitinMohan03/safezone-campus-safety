import { useCallback, useEffect, useState } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SEARCHBOX_BASE = 'https://api.mapbox.com/search/searchbox/v1';

const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mbx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useMapboxSearch() {
  const [suggestions, setSuggestions] = useState([]);
  const [sessionToken, setSessionToken] = useState(createSessionToken);

  useEffect(() => {
    setSessionToken(createSessionToken());
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  const search = useCallback(
    async (query, proximity) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return [];
      }

      const params = new URLSearchParams({
        q: query,
        types: 'address,poi,place',
        limit: '5',
        access_token: MAPBOX_TOKEN,
        session_token: sessionToken,
      });

      if (Array.isArray(proximity) && proximity.length === 2) {
        params.set('proximity', `${proximity[0]},${proximity[1]}`);
      }

      try {
        const res = await fetch(`${SEARCHBOX_BASE}/suggest?${params.toString()}`);
        const data = await res.json();
        const mapped =
          data.suggestions?.map((s) => ({
            id: s.mapbox_id,
            mapbox_id: s.mapbox_id,
            name: s.name,
            full_address: s.full_address,
            place_formatted: s.place_formatted,
            feature_type: s.feature_type,
            maki: s.maki,
            context: s.context,
          })) || [];
        setSuggestions(mapped);
        return mapped;
      } catch (err) {
        console.error('Mapbox SearchBox suggest failed:', err);
        setSuggestions([]);
        return [];
      }
    },
    [sessionToken],
  );

  const retrieve = useCallback(
    async (mapboxId) => {
      if (!mapboxId) return null;
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        session_token: sessionToken,
      });
      try {
        const res = await fetch(
          `${SEARCHBOX_BASE}/retrieve/${mapboxId}?${params.toString()}`,
        );
        const data = await res.json();
        const feature = data?.features?.[0];
        const coords = feature?.geometry?.coordinates;
        const address =
          feature?.properties?.full_address ||
          feature?.properties?.place_formatted ||
          feature?.place_name;
        const name =
          feature?.properties?.name ||
          feature?.text ||
          feature?.place_name ||
          address;

        if (Array.isArray(coords) && coords.length === 2) {
          return {
            coords,
            address: address || '',
            name: name || '',
          };
        }
        return null;
      } catch (err) {
        console.error('Mapbox SearchBox retrieve failed:', err);
        return null;
      } finally {
        setSessionToken(createSessionToken());
        setSuggestions([]);
      }
    },
    [sessionToken],
  );

  return {
    suggestions,
    sessionToken,
    search,
    retrieve,
    clearSuggestions,
  };
}

export default useMapboxSearch;
