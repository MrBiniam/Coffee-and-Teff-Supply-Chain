import { HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';

/**
 * Tracking Utilities
 * 
 * This file contains helper functions to fix common issues in the tracking system.
 */

/**
 * Creates authentication headers with proper token handling.
 * Fixes the 403 Forbidden errors by ensuring proper token format.
 */
export function createAuthHeaders(token: string): HttpHeaders {
  if (!token) {
    console.warn('No authentication token available');
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
  
  return new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  });
}

/**
 * Safely updates a map marker with robust error handling.
 * Fixes the "Cannot read properties of undefined (reading '_leaflet_pos')" errors.
 */
export function safeMarkerUpdate(map: L.Map, marker: L.Marker, latLng: L.LatLng, followMarker: boolean = false): L.Marker {
  // Early bailout if map not ready
  if (!map || !map._container || !document.body.contains(map._container)) {
    console.log('Map not ready or not in DOM, skipping marker update');
    return marker;
  }
  
  try {
    // Remove marker if it exists but is in a bad state
    if (marker) {
      try {
        map.removeLayer(marker);
      } catch (e) {
        console.log('Error removing marker, but continuing', e);
      }
    }
    
    // Create a simple marker without complex HTML
    const newMarker = L.marker(latLng).addTo(map);
    
    // Only move the map view if explicitly requested
    if (followMarker && map && map._loaded) {
      try {
        map.setView(latLng, map.getZoom() || 15);
      } catch (e) {
        console.warn('Error centering map', e);
      }
    }
    
    return newMarker;
  } catch (error) {
    console.error('Error handling marker update:', error);
    return marker;
  }
}

/**
 * Draws a route between start and end points using simplified markers.
 * Uses your existing map icon instead of complex divIcons.
 */
export function drawSimpleRoute(map: L.Map, routeGeometry: any, startPoint: any, endPoint: any): void {
  if (!map || !routeGeometry) {
    console.log('Missing map or route data');
    return;
  }
  
  try {
    // Create route layer with better styling
    const routeLayer = L.geoJSON(routeGeometry, {
      style: {
        color: '#2196F3',
        weight: 6,
        opacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round'
      }
    }).addTo(map);
    
    // Create markers for start and end if they exist
    if (startPoint && endPoint) {
      const startCoords = [startPoint.latitude, startPoint.longitude];
      const endCoords = [endPoint.latitude, endPoint.longitude];
      
      // Use simple circle markers instead of icons to avoid errors
      const startMarker = L.circleMarker(startCoords as L.LatLngExpression, {
        radius: 8,
        fillColor: '#4CAF50',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);
      
      const endMarker = L.circleMarker(endCoords as L.LatLngExpression, {
        radius: 8,
        fillColor: '#F44336',
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);
      
      // Add simple text labels
      const startLabel = L.marker(startCoords as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'map-label',
          html: `<div style="background:rgba(255,255,255,0.8);padding:3px;border-radius:2px;font-weight:bold;">Pickup</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 0]
        })
      }).addTo(map);
      
      const endLabel = L.marker(endCoords as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'map-label',
          html: `<div style="background:rgba(255,255,255,0.8);padding:3px;border-radius:2px;font-weight:bold;">Delivery</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 0]
        })
      }).addTo(map);
      
      // Fit map to show the entire route
      if (routeLayer.getBounds) {
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
      }
    }
  } catch (error) {
    console.error('Error drawing route:', error);
  }
}

/**
 * Helper function to check if a tracking record shows a delivered status
 */
export function hasDeliveredStatus(trackingHistory: any[]): boolean {
  if (!trackingHistory || !Array.isArray(trackingHistory) || trackingHistory.length === 0) {
    return false;
  }
  
  // First ensure they're sorted by timestamp (newest first)
  const sortedHistory = [...trackingHistory].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Check if any entry has delivered status
  return sortedHistory.some(entry => entry.status === 'delivered');
}
