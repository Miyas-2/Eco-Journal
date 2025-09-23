import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip, LayerGroup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AirQualityData, EmotionHeatmapData } from '@/types';
import { useEffect, useState } from 'react';

interface MapComponentProps {
  weatherData: AirQualityData[];
  journalData: EmotionHeatmapData[];
  mapCenter: [number, number];
  getAqiColor: (aqi: number) => string;
  getAqiDescription: (aqi: number) => string;
  getEmotionColor: (emotion: string) => string;
  getEmotionIcon: (emotion: string) => string;
  isAverage?: boolean;
  timeRange: string;
}

export default function MapComponent({
  weatherData,
  journalData,
  mapCenter,
  getAqiColor,
  getAqiDescription,
  getEmotionColor,
  getEmotionIcon,
  isAverage,
  timeRange
}: MapComponentProps) {
  // Fix Leaflet icons in Next.js
  useEffect(() => {
    // This is needed to fix Leaflet marker icons on Next.js
    const L = require('leaflet');
    
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Create custom icon for journal markers based on emotion
  const createJournalIcon = (dominantEmotion: string, moodScore?: number) => {
    const L = require('leaflet');
    
    // Determine background color based on mood score if available
    let backgroundColor = getEmotionColor(dominantEmotion);
    if (moodScore !== undefined) {
      // For mood score: green (1.0) to red (0.0)
      backgroundColor = moodScore > 0.7 ? '#4ade80' : // green for very positive
                       moodScore > 0.5 ? '#a3e635' : // lime for positive
                       moodScore > 0.3 ? '#fbbf24' : // amber for neutral
                       '#ef4444'; // red for negative
    }
    
    // Create a custom div icon with emoji
    return new L.DivIcon({
      html: `<div style="background-color: ${backgroundColor}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px;">${getEmotionIcon(dominantEmotion)}</div>`,
      className: 'custom-journal-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };
  
  // Function to get compact emotion summary for tooltips
  const getEmotionSummary = (emotionCounts: Record<string, number>, total: number) => {
    // Get top 3 emotions
    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
      
    return sortedEmotions.map(([emotion, count]) => 
      `${getEmotionIcon(emotion)} ${emotion}: ${count} (${Math.round((count/total)*100)}%)`
    ).join(', ');
  };

  // Function to determine the mood score text color
  const getMoodScoreColor = (score: number) => {
    if (score > 0.7) return '#15803d'; // dark green
    if (score > 0.5) return '#65a30d'; // dark lime
    if (score > 0.3) return '#b45309'; // dark amber
    return '#b91c1c'; // dark red
  };

  // Get the edge color for emotion clusters based on local AQI
  const getEdgeColorByAQI = (lat: number, lon: number) => {
    // Find the closest weather data point
    if (!weatherData.length) return '#888888'; // Default gray if no data
    
    // Find distance to each weather point
    const distances = weatherData.map(point => {
      const dx = point.location.lat - lat;
      const dy = point.location.lon - lon;
      return {
        point,
        distance: Math.sqrt(dx * dx + dy * dy)
      };
    });
    
    // Get the closest point
    const closest = distances.sort((a, b) => a.distance - b.distance)[0];
    
    // If within 0.05 degrees (~5.5km), consider it local
    if (closest && closest.distance < 0.05) {
      return getAqiColor(closest.point.airQuality.aqi);
    }
    
    return '#888888'; // Default gray if no close weather data
  };

  return (
    <MapContainer
      center={mapCenter}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <LayersControl position="topright">
        {/* Air Quality Layer - API Data */}
        <LayersControl.Overlay checked name="Air Quality (API Data)">
          <LayerGroup>
            {weatherData.map((point, index) => (
              <Circle
                key={`api-${index}`}
                center={[point.location.lat, point.location.lon]}
                radius={isAverage ? 5000 : 8000} // Larger radius for today's view
                pathOptions={{
                  fillColor: getAqiColor(point.airQuality.aqi),
                  fillOpacity: 0.2, // Reduced opacity to make journal markers more visible
                  weight: 1.5, // Slightly thicker border for better visibility
                  color: '#333333', // Darker border color for better contrast
                  opacity: 0.8
                }}
              >
                {/* Add tooltip for quick info on hover */}
                <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                  <div className="font-medium">
                    {point.location.name} 
                    <span className="px-2 py-0.5 ml-1 rounded text-xs" 
                          style={{backgroundColor: getAqiColor(point.airQuality.aqi), color: '#000', fontWeight: 'bold'}}>
                      AQI: {point.airQuality.aqi} - {getAqiDescription(point.airQuality.aqi)}
                    </span>
                    <div className="text-xs mt-1">
                      {isAverage 
                        ? `${timeRange === '7days' ? 'Last 7 days' : 'Last 30 days'} average` 
                        : 'Current data'}
                      {(point as any).sampleCount ? ` (from ${(point as any).sampleCount} samples)` : ''}
                    </div>
                  </div>
                </Tooltip>
                
                <Popup>
                  <div>
                    <h3 className="font-bold">{point.location.name}</h3>
                    {isAverage && (
                      <p className="text-sm text-blue-600 mb-2">
                        {timeRange === '7days' ? '7 Days Average' : '30 Days Average'} 
                        {(point as any).sampleCount && ` (from ${(point as any).sampleCount} samples)`}
                      </p>
                    )}
                    <p className="font-semibold">Air Quality Index: {point.airQuality.aqi} ({getAqiDescription(point.airQuality.aqi)})</p>
                    <div className="mt-2">
                      <p>PM2.5: {point.airQuality.pm2_5} µg/m³</p>
                      <p>PM10: {point.airQuality.pm10} µg/m³</p>
                      <p>CO: {point.airQuality.co} µg/m³</p>
                      <p>NO₂: {point.airQuality.no2} µg/m³</p>
                      <p>O₃: {point.airQuality.o3} µg/m³</p>
                      <p>SO₂: {point.airQuality.so2} µg/m³</p>
                      <p className="text-xs mt-2 text-gray-500">Last Updated: {formatDate(point.timestamp)}</p>
                      <p className="text-xs text-gray-500">Source: Weather API</p>
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Journal Data Layer */}
        <LayersControl.Overlay checked name="Journal Entries">
          <LayerGroup>
            {isAverage ? (
              // For historical view, use emotion-colored circles with emoji icons
              journalData.map((point, index) => {
                // Get edge color based on local AQI for comparison
                const edgeColor = getEdgeColorByAQI(point.location.lat, point.location.lon);
                
                return (
                  <Circle
                    key={`journal-${index}`}
                    center={[point.location.lat, point.location.lon]}
                    radius={Math.min(500 + (point.intensity * 200), 3000)} // Size based on intensity
                    pathOptions={{
                      fillColor: getEmotionColor(point.dominantEmotion),
                      fillOpacity: Math.min(0.3 + (point.intensity * 0.05), 0.7), // Opacity based on intensity
                      weight: 2,
                      color: edgeColor, // Edge color reflects local AQI
                      opacity: 0.8,
                      dashArray: '5, 5' // Dashed border for distinguishing from AQI circles
                    }}
                  >
                    {/* Add tooltip for quick emotion summary on hover */}
                    <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                      <div>
                        <strong>{point.entryCount} Entries</strong>
                        <div className="text-sm mt-1">
                          {getEmotionSummary(point.emotionCounts, point.entryCount)}
                        </div>
                        <div className="text-xs mt-1">
                          {timeRange === '7days' ? 'Last 7 days' : 'Last 30 days'}
                        </div>
                      </div>
                    </Tooltip>
                    
                    <Marker
                      position={[point.location.lat, point.location.lon]}
                      icon={createJournalIcon(point.dominantEmotion, (point as any).averageMoodScore)}
                      zIndexOffset={1000}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-bold">Journal Entries Cluster</h3>
                          <p className="text-sm text-blue-600 mb-2">
                            {timeRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
                          </p>
                          
                          {/* Average mood score if available */}
                          {(point as any).averageMoodScore !== undefined && (
                            <p className="flex items-center gap-1 mb-2">
                              <span className="font-medium">Average Mood Score: </span>
                              <span style={{ 
                                color: getMoodScoreColor((point as any).averageMoodScore),
                                fontWeight: 'bold'
                              }}>
                                {((point as any).averageMoodScore * 100).toFixed(0)}%
                              </span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({(point as any).averageMoodScore > 0.5 ? 'Positive' : 'Negative'})
                              </span>
                            </p>
                          )}
                          
                          <p className="flex items-center gap-1">
                            <span className="font-medium">Dominant emotion:</span>
                            <span style={{ 
                              color: getEmotionColor(point.dominantEmotion),
                              backgroundColor: `${getEmotionColor(point.dominantEmotion)}20`,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <span className="mr-1">{getEmotionIcon(point.dominantEmotion)}</span>
                              {point.dominantEmotion}
                            </span>
                          </p>
                          <p className="mb-2">Number of entries: {point.entryCount}</p>
                          
                          {/* Show environmental context */}
                          <div className="flex items-center mb-2">
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: edgeColor }}></div>
                            <p className="text-sm">
                              Local air quality: {
                                edgeColor === '#888888' 
                                  ? 'Unknown (no nearby stations)' 
                                  : `${weatherData.find(w => getAqiColor(w.airQuality.aqi) === edgeColor)?.airQuality.aqi || '?'} - ${
                                      Object.entries(getAqiDescription).find(([_, color]) => color === edgeColor)?.[0] || 'Unknown'
                                    }`
                              }
                            </p>
                          </div>
                          
                          <div className="mt-2">
                            <h4 className="font-medium">Emotion Distribution:</h4>
                            <ul className="text-sm">
                              {Object.entries(point.emotionCounts)
                                .sort(([_, countA], [__, countB]) => countB - countA)
                                .map(([emotion, count]) => (
                                <li key={emotion} className="flex items-center">
                                  <span style={{ 
                                    color: getEmotionColor(emotion),
                                    backgroundColor: `${getEmotionColor(emotion)}20`,
                                    padding: '1px 4px',
                                    borderRadius: '4px',
                                    marginRight: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    <span className="mr-1">{getEmotionIcon(emotion)}</span>
                                    {emotion}
                                  </span>: {count} entries ({Math.round((count/point.entryCount)*100)}%)
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-xs mt-2 text-gray-500">Source: Journal Entries</p>
                        </div>
                      </Popup>
                    </Marker>
                  </Circle>
                );
              })
            ) : (
              // For today's view, use markers with emotion icons
              journalData.map((point, index) => (
                <Marker
                  key={`journal-${index}`}
                  position={[point.location.lat, point.location.lon]}
                  icon={createJournalIcon(point.dominantEmotion, point.moodScore)}
                >
                  {/* Add tooltip for quick info on hover */}
                  <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                    <div>
                      <span className="flex items-center">
                        {getEmotionIcon(point.dominantEmotion)} {point.dominantEmotion}
                        {point.moodScore !== undefined && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs" 
                                style={{ 
                                  backgroundColor: point.moodScore > 0.5 ? '#dcfce7' : '#fee2e2',
                                  color: point.moodScore > 0.5 ? '#166534' : '#991b1b'
                                }}>
                            Mood: {(point.moodScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </span>
                      <div className="text-xs mt-1">
                        {formatDate(point.timestamp || '')}
                      </div>
                    </div>
                  </Tooltip>
                  
                  <Popup>
                    <div>
                      <h3 className="font-bold">Journal Entry</h3>
                      
                      {/* Mood score if available */}
                      {point.moodScore !== undefined && (
                        <div className="mt-2 mb-2">
                          <p className="font-medium">Mood Score:</p>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${point.moodScore * 100}%`,
                                backgroundColor: getMoodScoreColor(point.moodScore)
                              }}
                            ></div>
                          </div>
                          <p className="text-xs mt-1 text-right" style={{ color: getMoodScoreColor(point.moodScore) }}>
                            {(point.moodScore * 100).toFixed(0)}% {point.moodScore > 0.7 ? 'Very Positive' : point.moodScore > 0.5 ? 'Positive' : point.moodScore > 0.3 ? 'Somewhat Negative' : 'Negative'}
                          </p>
                        </div>
                      )}
                      
                      <p className="flex items-center gap-1 mb-2">
                        <span className="font-medium">Primary Emotion:</span>
                        <span style={{ 
                          color: getEmotionColor(point.dominantEmotion),
                          backgroundColor: `${getEmotionColor(point.dominantEmotion)}20`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span className="mr-1">{getEmotionIcon(point.dominantEmotion)}</span>
                          {point.dominantEmotion}
                        </span>
                      </p>
                      
                      {/* Show nearby air quality if available */}
                      {(() => {
                        const edgeColor = getEdgeColorByAQI(point.location.lat, point.location.lon);
                        if (edgeColor !== '#888888') {
                          return (
                            <div className="flex items-center mb-2 mt-2">
                              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: edgeColor }}></div>
                              <p className="text-sm">
                                Local air quality: {
                                  weatherData.find(w => getAqiColor(w.airQuality.aqi) === edgeColor)?.airQuality.aqi || '?'
                                } - {getAqiDescription(weatherData.find(w => getAqiColor(w.airQuality.aqi) === edgeColor)?.airQuality.aqi || 0)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {point.timestamp && (
                        <p className="text-xs mt-2 text-gray-500">Created: {formatDate(point.timestamp)}</p>
                      )}
                      <p className="text-xs text-gray-500">Source: Journal Entry</p>
                    </div>
                  </Popup>
                </Marker>
              ))
            )}
          </LayerGroup>
        </LayersControl.Overlay>
        
        {/* Optional: Add Mood Score Heatmap Layer */}
        <LayersControl.Overlay name="Mood Score Heatmap">
          <LayerGroup>
            {isAverage ? (
              // For historical view, show mood score circles
              journalData.filter(point => (point as any).averageMoodScore !== undefined).map((point, index) => (
                <Circle
                  key={`mood-${index}`}
                  center={[point.location.lat, point.location.lon]}
                  radius={Math.min(400 + (point.intensity * 150), 2500)} // Slightly smaller than emotion circles
                  pathOptions={{
                    fillColor: (point as any).averageMoodScore > 0.7 ? '#4ade80' : // green for very positive
                               (point as any).averageMoodScore > 0.5 ? '#a3e635' : // lime for positive
                               (point as any).averageMoodScore > 0.3 ? '#fbbf24' : // amber for neutral
                               '#ef4444', // red for negative
                    fillOpacity: 0.4,
                    weight: 1,
                    color: 'white',
                    opacity: 0.5
                  }}
                >
                  <Tooltip>
                    <div>
                      <strong>Average Mood Score: {(((point as any).averageMoodScore * 100).toFixed(0))}%</strong>
                      <div>{point.entryCount} entries, {timeRange === '7days' ? 'last 7 days' : 'last 30 days'}</div>
                    </div>
                  </Tooltip>
                </Circle>
              ))
            ) : (
              // For today's view, show mood score points
              journalData.filter(point => point.moodScore !== undefined).map((point, index) => (
                <Circle
                  key={`mood-${index}`}
                  center={[point.location.lat, point.location.lon]}
                  radius={100} // Small circles for individual entries
                  pathOptions={{
                    fillColor: point.moodScore! > 0.7 ? '#4ade80' : // green for very positive
                                point.moodScore! > 0.5 ? '#a3e635' : // lime for positive
                                point.moodScore! > 0.3 ? '#fbbf24' : // amber for neutral
                                '#ef4444', // red for negative
                    fillOpacity: 0.6,
                    weight: 1,
                    color: 'white',
                    opacity: 0.5
                  }}
                >
                  <Tooltip>
                    <div>
                      <strong>Mood Score: {((point.moodScore! * 100).toFixed(0))}%</strong>
                      <div>{point.moodScore! > 0.5 ? 'Positive' : 'Negative'} mood</div>
                    </div>
                  </Tooltip>
                </Circle>
              ))
            )}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}