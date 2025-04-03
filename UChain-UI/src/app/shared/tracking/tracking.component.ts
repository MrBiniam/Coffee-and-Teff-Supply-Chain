import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenStorageService } from '../../shared/security/token-storage.service';
import { OrderService } from '../../buyer/orders/order.service';
import { UserService } from '../../shared/security/user.service';
import { Order } from '../../buyer/orders/order.model';
import { User } from '../../shared/security/user';
import { TrackingService, TrackingLocation } from './tracking.service';
import { latLng, tileLayer, marker, icon, Map, LeafletMouseEvent, Marker, LatLng } from 'leaflet';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss']
})
export class TrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  orderId: string;
  order: Order = new Order();
  driverUser: User = new User();
  buyerUser: User = new User();
  sellerUser: User = new User();
  isLoading: boolean = true;
  userRole: string = '';
  isDriver: boolean = false;
  isBuyer: boolean = false;
  isSeller: boolean = false;
  currentUser: string = '';
  
  // Map related properties
  map: Map;
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      })
    ],
    zoom: 13,
    center: latLng(9.0222, 38.7468) // Default to Addis Ababa, Ethiopia
  };
  driverMarker: Marker;
  locationHistory: TrackingLocation[] = [];
  statusUpdates: { status: string, completed: boolean }[] = [
    { status: 'Order Accepted', completed: true },
    { status: 'Preparing for Shipment', completed: true },
    { status: 'On the Way', completed: false },
    { status: 'Delivered', completed: false }
  ];
  
  // Tracking update interval (in milliseconds)
  private locationUpdateInterval = 30000; // 30 seconds
  private trackingSubscription: Subscription;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private userService: UserService,
    private tokenStorage: TokenStorageService,
    private trackingService: TrackingService
  ) {
    this.orderId = this.route.snapshot.paramMap.get('id');
    this.currentUser = this.tokenStorage.getUsername();
    const role = this.tokenStorage.getAuthorities();
    this.userRole = role;
    this.isDriver = role === 'DRIVER';
    this.isBuyer = role === 'BUYER';
    this.isSeller = role === 'SELLER';
  }

  ngOnInit() {
    if (!this.orderId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    this.loadOrderDetails();
  }
  
  ngAfterViewInit() {
    // Map initialization is handled after view is initialized
  }
  
  ngOnDestroy() {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
    }
  }
  
  onMapReady(map: Map) {
    console.log('Map is ready');
    this.map = map;
    
    // Fix initial map display
    setTimeout(() => {
      this.map.invalidateSize();
      if (this.locationHistory && this.locationHistory.length > 0) {
        const latest = this.locationHistory[0];
        this.updateMapWithLocation(latest);
      }
    }, 500);
    
    // Start tracking location if user is the driver
    if (this.isDriver) {
      this.startDriverLocationTracking();
    } else {
      // Start fetching location updates if user is buyer or seller
      this.startFetchingLocationUpdates();
    }
  }
  
  loadOrderDetails() {
    this.isLoading = true;
    
    this.orderService.getOneOrder(this.orderId).subscribe(
      data => {
        this.order = data;
        console.log('Order loaded:', this.order);
        
        // Update status indicators based on order status
        this.updateStatusIndicators(this.order.status);
        
        // Load driver info if available
        if (this.order.driver) {
          this.loadUserInfo(String(this.order.driver), 'driver');
        }
        
        // Load buyer info
        if (this.order.buyer) {
          this.loadUserInfo(String(this.order.buyer), 'buyer');
        }
        
        // Load seller info
        if (this.order.product && this.order.product.length > 0 && this.order.product[0].seller) {
          this.loadUserInfo(String(this.order.product[0].seller), 'seller');
        }
        
        // Fetch any existing tracking data
        this.loadTrackingHistory();
        
        this.isLoading = false;
      },
      error => {
        console.error('Error loading order:', error);
        this.isLoading = false;
      }
    );
  }
  
  loadUserInfo(userId: string, userType: 'driver' | 'buyer' | 'seller') {
    this.userService.getOneUser(userId).subscribe(
      userData => {
        console.log(`${userType} info loaded:`, userData);
        if (userType === 'driver') {
          this.driverUser = userData;
        } else if (userType === 'buyer') {
          this.buyerUser = userData;
        } else if (userType === 'seller') {
          this.sellerUser = userData;
        }
      },
      error => {
        console.error(`Error loading ${userType} info:`, error);
      }
    );
  }
  
  loadTrackingHistory() {
    this.trackingService.getTrackingHistory(this.orderId).subscribe(
      (locations: TrackingLocation[]) => {
        this.locationHistory = locations;
        console.log('Tracking history loaded:', this.locationHistory);
        
        // Find the latest location update
        if (this.locationHistory.length > 0) {
          // Sort by timestamp to get the most recent
          const sortedLocations = [...this.locationHistory].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          const latestLocation = sortedLocations[0];
          
          // Update the map with the latest position
          if (latestLocation.latitude && latestLocation.longitude) {
            setTimeout(() => {
              this.updateMapWithLocation(latestLocation);
            }, 500);
          }
          
          // Ensure status indicators are updated based on the latest status
          if (latestLocation.status) {
            console.log('Updating status based on tracking history:', latestLocation.status);
            this.updateStatusIndicatorsFromTracking(latestLocation.status);
            
            // If the latest status is 'delivered', make sure it's reflected
            if (latestLocation.status === 'delivered' && 
                this.order.status !== 'DELIVERED' && 
                this.order.status !== 'DRIVER_DELIVERED') {
              // Update local order status for UI consistency
              this.order.status = 'DRIVER_DELIVERED';
              // Make sure status indicators are updated
              this.updateStatusIndicators(this.order.status);
            }
          }
        }
      },
      error => {
        console.error('Error loading tracking history:', error);
      }
    );
  }
  
  updateMapWithLocation(location: TrackingLocation) {
    if (!this.map) return;
    
    const position = latLng(location.latitude, location.longitude);
    
    // Create or update driver marker
    if (!this.driverMarker) {
      const mapIcon = icon({
        // Use base64 icon to avoid CSP issues
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQpSURBVFiF7ZZNaFxVFMd/577JtBNCm9RJJtOY1I+A1RZRBKtVopRQxUVFRQTFRVdK3bhxoYIL6UJwIVpcqLgKolSECi5qP8AQldJVaqrYJJN2aJqPeZ33jou8mcxk3nvJ1FUXPbjw3rnn/O//nHvuHbiPe4QYqBdWViZwMQbXZpJqnQBhgMzWdwT6r2dABbIOurkDo5mDjxGZIE3XmJ6eufvJt+ONN15DUXF8hJwZ2YF+NzhwMYZoS4Xht1lY+PnuJu9FHA9BnVJcJklgcoRsQOUHDpx5H+dqnDz554DRLHGcQ6kCnMU5cK7L1hJFZ8HLQUS2iPxPwHSJ3XFJu1VXVw8TRV9x5MjULk4qJAln8YVRLUr5IwB0VhAe+uOsVssk1TkqlRfJsmCgZwSQZc8jspm/9Rps3XWdZ/zzHjgX1giCA4ggYTWgWHwEkS8Jwy95+OFXSdNbDA19w+joLX+eLWAqw8DNANiYDg2rXRsO9UGBjKD6JbC1jVLpaxYXV/zdN08YdVwBF+fLLyIcv1H2jPvwfKf3dHY6DaGKj/Mxlpc/YHNzljiGKIIo+pEsO0QQzFOtekCcgNk7Ay5QJ4xe3B9q2jM9AEol2zLGbHfx+XN3OC4p3x1E0UsEwTnySkDlP1RfJ8u+I47rxPGLDAUf98DtJQjD5/j772cdO3NlJ7o2vMj7t5V/FqD87+JcN8dOL8CrVLgAnPEI/wPqzwsLoRBU0xbOt4BtAe2k7PaKcwHPPHOeIFghji9SqQhh+C5JcpE4XqVWu0aafk8YTpHlbzO/DERuOK3BjnB9QLm1gfXMu9yFhXdIkmtUKpNE0RuI3CCOPyWKPsS5aUQuk6YLtDOtJfI6Ly+ZAzUCQmpdNb6BZx5EBZFftmRZQBB8Tpoe9QSnMzj3YbvD7nC0HCHv0TBFZNbDMUaWxcRxpzQ7cG4KkVmiaCflbtrg2EXAQ/4f8AnHKHn95OI9p2eQZUXCsMbGxnIPBwgWWV9/qieoAQSMPAuRKe/e9PQMLurcm9YdUMuzYz7J44B/EPtAXKZej9umPhZVB3AaI51aAcaY3ry1gPpLBVVwbr4jtLwNbVCZoVB4vSfcD05OHkf1bXqL0wTVXJl9ueVgjGXOnfuCJKli5gxsAnOIzBMEDXA36fDa8OkzaZqQpoc7YkEQ7ZJ3B1qOOx+kJm52fAScQ+Q1kqRAnM8JZuZs79pwc3OBNIWFhReIoqsdRNu1vqfk26ugnqYLRNEMcWyCr1SOceqUDcATT1wgDOcBeOSRK6h+lzvHR0Sk4ywwvttyYOL2QQRA99GyS15sBvTXAbG34xojjTbmNnVdOFDgVVn/4f83gZF/AAyNBKZuIbUEAAAAAElFTkSuQmCC',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      this.driverMarker = marker(position, {
        icon: mapIcon
      }).addTo(this.map);
    } else {
      this.driverMarker.setLatLng(position);
    }
    
    // Center map on the marker
    this.map.setView(position, 15);
  }
  
  startDriverLocationTracking() {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'Geolocation is not supported by your browser', 'error');
      return;
    }
    
    // Set up periodic location updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Driver location updated:', latitude, longitude);
        
        // Update the map
        if (this.map) {
          const driverPosition = latLng(latitude, longitude);
          
          if (!this.driverMarker) {
            const truckIcon = icon({
              // Use base64 icon to avoid CSP issues
              iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAQpSURBVFiF7ZZNaFxVFMd/577JtBNCm9RJJtOY1I+A1RZRBKtVopRQxUVFRQTFRVdK3bhxoYIL6UJwIVpcqLgKolSECi5qP8AQldJVaqrYJJN2aJqPeZ33jou8mcxk3nvJ1FUXPbjw3rnn/O//nHvuHbiPe4QYqBdWViZwMQbXZpJqnQBhgMzWdwT6r2dABbIOurkDo5mDjxGZIE3XmJ6eufvJt+ONN15DUXF8hJwZ2YF+NzhwMYZoS4Xht1lY+PnuJu9FHA9BnVJcJklgcoRsQOUHDpx5H+dqnDz554DRLHGcQ6kCnMU5cK7L1hJFZ8HLQUS2iPxPwHSJ3XFJu1VXVw8TRV9x5MjULk4qJAln8YVRLUr5IwB0VhAe+uOsVssk1TkqlRfJsmCgZwSQZc8jspm/9Rps3XWdZ/zzHjgX1giCA4ggYTWgWHwEkS8Jwy95+OFXSdNbDA19w+joLX+eLWAqw8DNANiYDg2rXRsO9UGBjKD6JbC1jVLpaxYXV/zdN08YdVwBF+fLLyIcv1H2jPvwfKf3dHY6DaGKj/Mxlpc/YHNzljiGKIIo+pEsO0QQzFOtekCcgNk7Ay5QJ4xe3B9q2jM9AEol2zLGbHfx+XN3OC4p3x1E0UsEwTnySkDlP1RfJ8u+I47rxPGLDAUf98DtJQjD5/j772cdO3NlJ7o2vMj7t5V/FqD87+JcN8dOL8CrVLgAnPEI/wPqzwsLoRBU0xbOt4BtAe2k7PaKcwHPPHOeIFghji9SqQhh+C5JcpE4XqVWu0aafk8YTpHlbzO/DERuOK3BjnB9QLm1gfXMu9yFhXdIkmtUKpNE0RuI3CCOPyWKPsS5aUQuk6YLtDOtJfI6Ly+ZAzUCQmpdNb6BZx5EBZFftmRZQBB8Tpoe9QSnMzj3YbvD7nC0HCHv0TBFZNbDMUaWxcRxpzQ7cG4KkVmiaCflbtrg2EXAQ/4f8AnHKHn95OI9p2eQZUXCsMbGxnIPBwgWWV9/qieoAQSMPAuRKe/e9PQMLurcm9YdUMuzYz7J44B/EPtAXKZej9umPhZVB3AaI51aAcaY3ry1gPpLBVVwbr4jtLwNbVCZoVB4vSfcD05OHkf1bXqL0wTVXJl9ueVgjGXOnfuCJKli5gxsAnOIzBMEDXA36fDa8OkzaZqQpoc7YkEQ7ZJ3B1qOOx+kJm52fAScQ+Q1kqRAnM8JZuZs79pwc3OBNIWFhReIoqsdRNu1vqfk26ugnqYLRNEMcWyCr1SOceqUDcATT1wgDOcBeOSRK6h+lzvHR0Sk4ywwvttyYOL2QQRA99GyS15sBvTXAbG34xojjTbmNnVdOFDgVVn/4f83gZF/AAyNBKZuIbUEAAAAAElFTkSuQmCC',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            
            this.driverMarker = marker(driverPosition, {
              icon: truckIcon
            }).addTo(this.map);
          } else {
            this.driverMarker.setLatLng(driverPosition);
          }
          
          // Center map on the marker
          this.map.setView(driverPosition, 15);
          
          // Send location update to server
          this.updateDriverLocation(latitude, longitude);
        }
      },
      (error) => {
        console.error('Error getting driver location:', error);
        Swal.fire('Error', 'Unable to access your location: ' + error.message, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
    
    // Clean up on component destroy
    this.trackingSubscription = new Subscription(() => {
      navigator.geolocation.clearWatch(watchId);
    });
  }
  
  updateDriverLocation(latitude: number, longitude: number) {
    const locationData: TrackingLocation = {
      orderId: this.orderId,
      driverId: this.tokenStorage.getId(),
      latitude: latitude,
      longitude: longitude,
      status: 'on_route',
      timestamp: new Date()
    };
    
    this.trackingService.updateLocation(locationData).subscribe(
      response => {
        console.log('Location updated successfully:', response);
      },
      error => {
        console.error('Error updating location:', error);
      }
    );
  }
  
  startFetchingLocationUpdates() {
    // For buyers and sellers, periodically fetch the latest location
    this.trackingSubscription = interval(this.locationUpdateInterval)
      .pipe(
        switchMap(() => this.trackingService.getLocationForOrder(this.orderId))
      )
      .subscribe(
        (location: TrackingLocation) => {
          console.log('Received location update:', location);
          this.updateMapWithLocation(location);
          
          // Update status indicators if needed
          if (location.status) {
            this.updateStatusIndicatorsFromTracking(location.status);
          }
        },
        error => {
          console.error('Error fetching location updates:', error);
        }
      );
  }
  
  updateStatusIndicators(orderStatus: string) {
    // Update status indicators based on order status
    if (orderStatus === 'ACCEPTED') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: false },
        { status: 'On the Way', completed: false },
        { status: 'Delivered', completed: false }
      ];
    } else if (orderStatus === 'SHIPPED') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'On the Way', completed: true },
        { status: 'Delivered', completed: false }
      ];
    } else if (orderStatus === 'DRIVER_DELIVERED') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'On the Way', completed: true },
        { status: 'Delivered', completed: true }
      ];
    } else if (orderStatus === 'DELIVERED') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'On the Way', completed: true },
        { status: 'Delivered', completed: true }
      ];
    }
  }
  
  updateStatusIndicatorsFromTracking(status: string) {
    // Update status indicators based on tracking status
    if (status === 'picked_up') {
      this.statusUpdates[1].completed = true;
    } else if (status === 'on_route') {
      this.statusUpdates[1].completed = true;
      this.statusUpdates[2].completed = true;
    } else if (status === 'delivered') {
      this.statusUpdates[1].completed = true;
      this.statusUpdates[2].completed = true;
      this.statusUpdates[3].completed = true;
      
      // Additional logic for all users to see the delivered status
      if (this.order.status !== 'DELIVERED' && this.order.status !== 'DRIVER_DELIVERED') {
        this.order.status = 'DRIVER_DELIVERED';
        // Update the status indicators for all users
        this.updateStatusIndicators(this.order.status);
      }
    }
  }
  
  updateOrderStatus(status: string) {
    if (!this.isDriver) return;
    
    Swal.fire({
      title: 'Update Order Status',
      text: `Are you sure you want to update the status to ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.trackingService.updateOrderStatus(this.orderId, status).subscribe(
          response => {
            console.log('Order status updated:', response);
            Swal.fire('Success', `Order status updated to ${status}`, 'success');
            
            // Update status indicators
            if (status === 'picked_up') {
              this.statusUpdates[1].completed = true;
            } else if (status === 'on_route') {
              this.statusUpdates[1].completed = true;
              this.statusUpdates[2].completed = true;
            } else if (status === 'delivered') {
              this.statusUpdates[1].completed = true;
              this.statusUpdates[2].completed = true;
              this.statusUpdates[3].completed = true;
            }
            
            // Get the current location for the status update
            this.trackingService.getCurrentPosition()
              .then(position => {
                this.updateDriverLocation(
                  position.coords.latitude,
                  position.coords.longitude
                );
              })
              .catch(error => {
                console.error('Error getting position for status update:', error);
              });
          },
          error => {
            console.error('Error updating order status:', error);
            Swal.fire('Error', 'Failed to update order status', 'error');
          }
        );
      }
    });
  }
  
  goBack() {
    // Navigate back based on user role
    if (this.isDriver) {
      this.router.navigate(['/driver/orders/shipped_order']);
    } else if (this.isBuyer) {
      this.router.navigate(['/buyer/orders/shipped_order']);
    } else if (this.isSeller) {
      this.router.navigate(['/seller/orders/shipped_order']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
