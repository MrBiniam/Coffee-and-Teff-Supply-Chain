import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { TokenStorageService } from '../security/token-storage.service';
import { environment } from '../../../environments/environment';

export interface TrackingLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: string;
  orderId: string;
  driverId: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface DeliveryRoute {
  orderId: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  waypoints?: RoutePoint[];
  routeGeometry?: any; // Will store the actual route line coordinates
  estimatedTime?: number; // In minutes
  distance?: number; // In km
  createdAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Route {
  id?: number;
  order?: any;
  orderId?: number;
  driver?: any;
  startPoint: Location;
  endPoint: Location;
  routeGeometry?: any;
  distance?: number;
  estimatedTime?: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  // Fix the base URL to avoid duplicating 'api' in the path
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private currentLocationSubject = new BehaviorSubject<TrackingLocation>(null);
  public currentLocation$ = this.currentLocationSubject.asObservable();
  
  // For route simulation
  private routeSubject = new BehaviorSubject<DeliveryRoute>(null);
  public route$ = this.routeSubject.asObservable();
  
  // OpenRouteService API key (free tier)
  private openRouteServiceApiKey = '5b3ce3597851110001cf6248f89f7ab0c5654e3eb2e0d4c173d9f1ac'; // Replace with your own key

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) { }

  // Method to get HTTP headers with authorization token
  private getHeaders(): HttpHeaders {
    const token = this.tokenStorage.getToken();
    if (!token) {
      console.error('No authentication token found');
    }
    
    // Use 'Token' prefix consistently as required by the Django backend
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token || ''}`
    });
  }

  // Method to update current location for an order
  updateLocation(location: TrackingLocation): Observable<any> {
    const url = `${this.baseUrl}/api/tracking/update-location`;
    console.log(`Updating location data to URL: ${url}`);
    return this.http.post(url, location, { headers: this.getHeaders() });
  }

  // Method to get the latest location for an order
  getLocationForOrder(orderId: string): Observable<TrackingLocation> {
    const url = `${this.baseUrl}/api/tracking/location/${orderId}`;
    console.log(`Fetching location data from URL: ${url}`);
    return this.http.get<TrackingLocation>(url, { headers: this.getHeaders() });
  }

  // Method to get all tracking history for an order
  getTrackingHistory(orderId: string): Observable<TrackingLocation[]> {
    const url = `${this.baseUrl}/api/tracking/history/${orderId}`;
    console.log(`Fetching tracking history from URL: ${url}`);
    return this.http.get<TrackingLocation[]>(url, { headers: this.getHeaders() });
  }

  // Method to share current location with subscribers
  shareCurrentLocation(location: TrackingLocation) {
    this.currentLocationSubject.next(location);
  }

  // Method to get current browser geolocation with fallbacks
  getCurrentPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to Dilla University coordinates if geolocation not supported
        console.log('Geolocation not supported, using default location');
        resolve({
          coords: {
            latitude: 6.4107,
            longitude: 38.3087,
            accuracy: 1000
          }
        });
      } else {
        // First try with high accuracy but shorter timeout
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            console.log('Precise geolocation failed, trying lower accuracy', error);
            // If high accuracy fails, try with lower accuracy and longer timeout
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position),
              (finalError) => {
                console.log('Geolocation failed, using default location', finalError);
                // Final fallback to Dilla University coordinates
                resolve({
                  coords: {
                    latitude: 6.4107,
                    longitude: 38.3087,
                    accuracy: 1000
                  }
                });
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
            );
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    });
  }

  // Method to update order status
  updateOrderStatus(orderId: string, status: string): Observable<any> {
    const url = `${this.baseUrl}/api/tracking/status/${orderId}`;
    console.log(`Updating order status to URL: ${url}`);
    return this.http.post(url, { status }, { headers: this.getHeaders() });
  }
  
  // New methods for route handling
  // Save a delivery route
  saveDeliveryRoute(route: DeliveryRoute): Observable<any> {
    const url = `${this.baseUrl}/api/route/save`;
    console.log(`Saving delivery route to URL: ${url}`);
    return this.http.post(url, route, { headers: this.getHeaders() });
  }
  
  // Get a delivery route for an order
  getRouteForOrder(orderId: string): Observable<DeliveryRoute> {
    const url = `${this.baseUrl}/api/route/${orderId}`;
    console.log(`Fetching delivery route from URL: ${url}`);
    return this.http.get<DeliveryRoute>(url, { headers: this.getHeaders() });
  }
  
  // Calculate a route using local calculation to avoid CSP violations
  calculateRoute(startPoint: RoutePoint, endPoint: RoutePoint): Observable<any> {
    console.log('Using local route calculation instead of OpenRouteService due to CSP restrictions');
    
    // Create a GeoJSON-like response with a straight line route
    // This is a simplified approach to avoid CSP issues with external API calls
    const routeData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [startPoint.longitude, startPoint.latitude],
            // Add some intermediate points to make the route more natural
            [startPoint.longitude + (endPoint.longitude - startPoint.longitude) * 0.25, 
             startPoint.latitude + (endPoint.latitude - startPoint.latitude) * 0.25],
            [startPoint.longitude + (endPoint.longitude - startPoint.longitude) * 0.5, 
             startPoint.latitude + (endPoint.latitude - startPoint.latitude) * 0.5],
            [startPoint.longitude + (endPoint.longitude - startPoint.longitude) * 0.75, 
             startPoint.latitude + (endPoint.latitude - startPoint.latitude) * 0.75],
            [endPoint.longitude, endPoint.latitude]
          ]
        },
        properties: {
          summary: {
            // Calculate approximate distance in meters and duration in seconds
            distance: this.calculateDistance(startPoint, endPoint),
            duration: this.calculateDuration(startPoint, endPoint)
          }
        }
      }]
    };
    
    return of(routeData);
  }

  // Helper method to calculate distance between two points in meters
  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(point1.latitude);
    const φ2 = this.toRadians(point2.latitude);
    const Δφ = this.toRadians(point2.latitude - point1.latitude);
    const Δλ = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  // Helper method to calculate estimated duration in seconds (assuming 30km/h average speed)
  private calculateDuration(point1: RoutePoint, point2: RoutePoint): number {
    const distanceInMeters = this.calculateDistance(point1, point2);
    const speedInMetersPerSecond = 8.33; // ~30 km/h in m/s
    return distanceInMeters / speedInMetersPerSecond;
  }

  // Helper to convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  // Share route information with subscribers
  shareRouteInfo(route: DeliveryRoute) {
    this.routeSubject.next(route);
  }
  
  // Search for locations by name (using Nominatim, which is free)
  searchLocation(query: string): Observable<any> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=et&limit=5`;
    return this.http.get(url);
  }
  
  // Simulate movement along a route for demo purposes
  simulateRouteProgress(route: DeliveryRoute, currentProgress: number = 0): {lat: number, lng: number} {
    if (!route || !route.routeGeometry || !route.routeGeometry.coordinates) {
      return null;
    }
    
    const coordinates = route.routeGeometry.coordinates;
    if (coordinates.length === 0) return null;
    
    // Calculate the current position along the route based on progress percentage
    const index = Math.min(Math.floor(coordinates.length * (currentProgress / 100)), coordinates.length - 1);
    const coordinate = coordinates[index];
    
    // OpenRouteService returns coordinates as [longitude, latitude]
    return { lng: coordinate[0], lat: coordinate[1] };
  }

  // Method to update the location of a driver
  updateLocationNew(orderId: number, latitude: number, longitude: number, status?: string): Observable<any> {
    const token = this.tokenStorage.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
    
    const body = {
      orderId,
      latitude,
      longitude,
      status
    };
    
    return this.http.post(`${this.baseUrl}/api/tracking/update-location`, body, { headers });
  }

  // Method to get the current location for an order
  getOrderLocationNew(orderId: number): Observable<any> {
    const token = this.tokenStorage.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
    
    return this.http.get(`${this.baseUrl}/api/tracking/location/${orderId}`, { headers });
  }

  // Method to get tracking history for an order
  getTrackingHistoryNew(orderId: number): Observable<any> {
    const token = this.tokenStorage.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
    
    return this.http.get(`${this.baseUrl}/api/tracking/history/${orderId}`, { headers });
  }

  // Method to update order status
  updateOrderStatusNew(orderId: number, status: string): Observable<any> {
    const token = this.tokenStorage.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
    
    const body = {
      status
    };
    
    return this.http.post(`${this.baseUrl}/api/tracking/status/${orderId}`, body, { headers });
  }

  // Method to calculate a route using OpenRouteService
  calculateRouteNew(startPoint: Location, endPoint: Location): Observable<any> {
    const openRouteServiceUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.openRouteServiceApiKey
    });
    
    const body = {
      coordinates: [
        [startPoint.longitude, startPoint.latitude],
        [endPoint.longitude, endPoint.latitude]
      ],
      format: 'geojson'
    };
    
    return this.http.post(openRouteServiceUrl, body, { headers });
  }

  // Method to save a route to the backend
  saveRouteNew(route: Route): Observable<any> {
    const token = this.tokenStorage.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
    
    return this.http.post(`${this.baseUrl}/api/route/create`, route, { headers });
  }

  // Method to get a route for an order
  getRouteNew(orderId: number): Observable<any> {
    const token = this.tokenStorage.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`  // Changed from Bearer to Token to be consistent with backend
    });
    
    console.log(`Getting route for order ${orderId} from URL: ${this.baseUrl}/api/route/${orderId}`);
    return this.http.get(`${this.baseUrl}/api/route/${orderId}`, { headers });
  }
}
