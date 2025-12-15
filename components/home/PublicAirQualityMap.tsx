// components/home/PublicAirQualityMap.tsx - UPDATED with correct AQI
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AirQualityDetails {
  pm2_5: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  'us-epa-index': number;
  'gb-defra-index': number;
}

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  emotion: string;
  moodScore: number | null;
  aqi: number | null;
  airQualityDetails: AirQualityDetails | null;
  temperature: number | null;
  condition: string | null;
  timestamp: string;
}

interface PublicAirQualityMapProps {
  mapData: MapPoint[];
  showAirQuality: boolean;
  showMood: boolean;
  showGreenSpaces: boolean;
}

export default function PublicAirQualityMap({ mapData, showAirQuality, showMood, showGreenSpaces }: PublicAirQualityMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const greenSpacesLayerRef = useRef<L.LayerGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([-6.2088, 106.8456], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      greenSpacesLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      setIsMapReady(true);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        greenSpacesLayerRef.current = null;
      }
    };
  }, []);

  // Handle green spaces layer visibility with better error handling
  useEffect(() => {
    // Clear any pending fetches
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (!mapRef.current || !greenSpacesLayerRef.current || !isMapReady) {
      return;
    }

    if (!showGreenSpaces) {
      greenSpacesLayerRef.current.clearLayers();
      return;
    }

    // Delay fetch to ensure map is fully loaded
    fetchTimeoutRef.current = setTimeout(() => {
      if (!mapRef.current || !greenSpacesLayerRef.current) return;

      try {
        const bounds = mapRef.current.getBounds();
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();
        
        // Only fetch if bounds are valid
        if (isNaN(south) || isNaN(west) || isNaN(north) || isNaN(east)) {
          console.log('Invalid map bounds, skipping green spaces fetch');
          return;
        }

        // Limit the area to prevent too large queries
        const latDiff = north - south;
        const lngDiff = east - west;
        if (latDiff > 2 || lngDiff > 2) {
          console.log('Map area too large for green spaces, zoom in more');
          return;
        }

        const bbox = `${south},${west},${north},${east}`;
        const query = `[out:json][timeout:25];(way["leisure"="park"](${bbox});way["landuse"="forest"](${bbox}););out geom;`;

        fetch(`https://overpass-api.de/api/interpreter`, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Overpass API returned ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (!greenSpacesLayerRef.current) return;
            
            greenSpacesLayerRef.current.clearLayers();

            if (!data.elements || data.elements.length === 0) {
              console.log('No green spaces found in this area');
              return;
            }

            data.elements.forEach((element: any) => {
              if (!greenSpacesLayerRef.current || !element.geometry) return;

              const coordinates: [number, number][] = element.geometry.map((point: any) => [point.lat, point.lon]);

              if (coordinates.length > 2) {
                const polygon = L.polygon(coordinates, {
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.15,
                  weight: 2,
                  opacity: 0.6
                }).addTo(greenSpacesLayerRef.current!);

                const name = element.tags?.name || 'Green Space';
                const type = element.tags?.leisure || element.tags?.landuse || element.tags?.natural || 'Park';
                
                polygon.bindPopup(`
                  <div style="font-family: 'Lexend', sans-serif;">
                    <strong style="font-size: 14px; color: #10b981;">${name}</strong>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Type: ${type}</p>
                  </div>
                `);
              }
            });
          })
          .catch(error => {
            console.log('Green spaces not available:', error.message);
            // Don't show error to user, just log it
          });
      } catch (error) {
        console.log('Error setting up green spaces:', error);
      }
    }, 1000); // Wait 1 second after map is ready

  }, [showGreenSpaces, isMapReady]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    mapData.forEach(point => {
      if (!mapRef.current) return;

      const { lat, lng, emotion, aqi, temperature, condition, moodScore, airQualityDetails } = point;

      // Helper function to get AQI category and color based on US EPA Index
      // US EPA Index: 1 = Good, 2 = Moderate, 3 = Unhealthy for Sensitive, 4 = Unhealthy, 5 = Very Unhealthy, 6 = Hazardous
      const getAqiCategoryByIndex = (index: number) => {
        switch(index) {
          case 1:
            return { label: 'Good', color: '#10b981', range: '0-50' };
          case 2:
            return { label: 'Moderate', color: '#fbbf24', range: '51-100' };
          case 3:
            return { label: 'Unhealthy for Sensitive', color: '#f97316', range: '101-150' };
          case 4:
            return { label: 'Unhealthy', color: '#ef4444', range: '151-200' };
          case 5:
            return { label: 'Very Unhealthy', color: '#dc2626', range: '201-300' };
          case 6:
            return { label: 'Hazardous', color: '#991b1b', range: '300+' };
          default:
            return { label: 'Unknown', color: '#64748b', range: 'N/A' };
        }
      };

      // Determine marker appearance
      let markerColor = '#64748b';
      let markerSize = 36;
      let displayValue = '•';
      let aqiCategory = null;
      
      // Priority: If showAirQuality is true AND aqi exists, use AQI colors
      if (showAirQuality && aqi !== null) {
        aqiCategory = getAqiCategoryByIndex(aqi);
        markerColor = aqiCategory.color;
        markerSize = 38 + (aqi * 3); // Size based on EPA index (1-6)
        displayValue = String(aqi);
      } 
      // If mood is shown (and AQI is not being shown), use mood colors
      else if (showMood && moodScore !== null) {
        markerSize = 38;
        displayValue = '•';
        
        // Mood-based colors (score from -1 to 1)
        if (moodScore > 0.5) {
          markerColor = '#fbbf24'; // happy - yellow
        } else if (moodScore > 0) {
          markerColor = '#a5b4fc'; // calm - light blue
        } else if (moodScore > -0.5) {
          markerColor = '#94a3b8'; // anxious - gray
        } else {
          markerColor = '#64748b'; // sad - dark gray
        }
      }

      // Create custom icon with pulsing effect
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            position: relative;
            width: ${markerSize}px;
            height: ${markerSize}px;
          ">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              background-color: ${markerColor};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 ${markerColor};
              animation: pulse-${point.id} 2s infinite;
            "></div>
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: ${showAirQuality && aqi !== null ? '14px' : '16px'};
              font-weight: bold;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">
              ${displayValue}
            </div>
          </div>
          <style>
            @keyframes pulse-${point.id} {
              0% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 ${markerColor}; }
              50% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 8px ${markerColor}33; }
              100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 ${markerColor}; }
            }
          </style>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);

      // Create detailed popup with AQI breakdown
    //   const moodScoreDisplay = moodScore !== null ? ((moodScore + 1) / 2 * 10).toFixed(1) : 'N/A';
      const moodScoreDisplay = moodScore !== null ? moodScore.toFixed(2) : 'N/A';

      let aqiDetailsHtml = '';
      if (airQualityDetails) {
        aqiDetailsHtml = `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 8px;">AIR QUALITY BREAKDOWN</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
              <div style="background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
                <span style="color: #64748b;">PM2.5:</span> <strong>${airQualityDetails.pm2_5?.toFixed(1) || 'N/A'}</strong>
              </div>
              <div style="background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
                <span style="color: #64748b;">PM10:</span> <strong>${airQualityDetails.pm10?.toFixed(1) || 'N/A'}</strong>
              </div>
              <div style="background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
                <span style="color: #64748b;">CO:</span> <strong>${airQualityDetails.co?.toFixed(1) || 'N/A'}</strong>
              </div>
              <div style="background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
                <span style="color: #64748b;">NO2:</span> <strong>${airQualityDetails.no2?.toFixed(1) || 'N/A'}</strong>
              </div>
              <div style="background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
                <span style="color: #64748b;">O3:</span> <strong>${airQualityDetails.o3?.toFixed(1) || 'N/A'}</strong>
              </div>
              <div style="background: #f8fafc; padding: 4px 6px; border-radius: 4px;">
                <span style="color: #64748b;">SO2:</span> <strong>${airQualityDetails.so2?.toFixed(1) || 'N/A'}</strong>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
              <span>US EPA: ${airQualityDetails['us-epa-index'] || 'N/A'}</span>
              <span>GB DEFRA: ${airQualityDetails['gb-defra-index'] || 'N/A'}</span>
            </div>
          </div>
        `;
      }
      
      const popupContent = `
        <div style="font-family: 'Lexend', sans-serif; min-width: 240px; max-width: 280px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 15px; color: ${markerColor};">${emotion}</strong>
            ${aqi !== null && aqiCategory ? `
              <span style="background: ${aqiCategory.color}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                Index ${aqi}
              </span>
            ` : ''}
          </div>
          
          ${aqi !== null && aqiCategory ? `
            <div style="background: ${aqiCategory.color}15; padding: 8px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${aqiCategory.color};">
              <div style="font-size: 12px; font-weight: 600; color: ${aqiCategory.color}; margin-bottom: 2px;">${aqiCategory.label}</div>
              <div style="font-size: 10px; color: #64748b;">AQI Range: ${aqiCategory.range}</div>
            </div>
          ` : ''}
          
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
            ${moodScore !== null ? `
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #64748b;">Mood Score:</span>
                <strong style="color: #1e293b;">${moodScoreDisplay}</strong>
              </div>
            ` : ''}
            
            ${temperature !== null ? `
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #64748b;">Temperature:</span>
                <strong style="color: #1e293b;">${temperature}°C</strong>
              </div>
            ` : ''}
            
            ${condition ? `
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #64748b;">Condition:</span>
                <strong style="color: #1e293b;">${condition}</strong>
              </div>
            ` : ''}
          </div>
          
          ${aqiDetailsHtml}
          
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 10px; color: #94a3b8;">
              ${new Date(point.timestamp).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });
      
      markersRef.current.push(marker);
    });

    // Fit bounds if there are markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 });
    }

  }, [mapData, showAirQuality, showMood]);

  return (
    <>
      <div id="map" className="w-full h-full" />
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 3px 14px rgba(0,0,0,0.1);
        }
      `}</style>
    </>
  );
}