import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { TokenStorageService } from '../security/token-storage.service';

export interface TrackingLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: string;
  orderId: string;
  driverId: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  // Fix the base URL to avoid duplicating 'api' in the path
  private baseUrl = 'http://127.0.0.1:8000';
  private currentLocationSubject = new BehaviorSubject<TrackingLocation>(null);
  public currentLocation$ = this.currentLocationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) { }

  // Method to get HTTP headers with authorization token
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.tokenStorage.getToken()}`
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

  // Method to get current browser geolocation
  getCurrentPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
}
