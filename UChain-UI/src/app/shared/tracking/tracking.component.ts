import { Component, OnInit, OnDestroy, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenStorageService } from '../../shared/security/token-storage.service';
import { OrderService } from '../../buyer/orders/order.service';
import { UserService } from '../../shared/security/user.service';
import { Order } from '../../buyer/orders/order.model';
import { User } from '../../shared/security/user';
import { TrackingService, TrackingLocation, DeliveryRoute } from './tracking.service';
import { latLng, tileLayer, Map, marker, icon, Marker, polyline, LatLng, Icon, Layer, Polyline, geoJSON, divIcon } from 'leaflet';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouteInfoDialogComponent } from './route-info-dialog.component';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html'
})
export class TrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() orderId: any; // Can be string or number depending on context
  @Input() role: string;
  
  @ViewChild('mapContainer') mapContainer: ElementRef;
  
  map: Map;
  driverMarker: Marker;
  routeLayer: any; // GeoJSON layer for route
  currentOrder: any;
  order: any; // Added property to match the template references
  currentRoute: any;
  driverLocation: any;
  
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
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 5,
        attribution: ' OpenStreetMap contributors'
      })
    ],
    zoom: 15,
    center: latLng(6.4107, 38.3087), // Default center (Dilla, Ethiopia)
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true
  };
  locationHistory: TrackingLocation[] = [];
  statusUpdates: { status: string, completed: boolean }[] = [
    { status: 'Order Accepted', completed: true },
    { status: 'Preparing for Shipment', completed: true },
    { status: 'Picked Up & On the Way', completed: false },
    { status: 'Delivered', completed: false }
  ];
  
  // Tracking update interval (in milliseconds)
  private locationUpdateInterval = 30000; // 30 seconds
  private trackingSubscription: Subscription;
  
  // New properties for route handling
  simulationProgress = 0;
  simulationInterval: any = null;
  routeSubscription: Subscription = null;
  isTrackingEnabled = false;
  
  // Property for map resize timeout
  private mapResizeTimeout: any;
  followDriver: boolean = true; // Whether to center the map on driver's position
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private userService: UserService,
    private tokenStorage: TokenStorageService,
    private trackingService: TrackingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.currentUser = this.tokenStorage.getUsername();
    const role = this.tokenStorage.getAuthorities();
    this.userRole = Array.isArray(role) ? role[0] : role;
    
    console.log('User role in constructor:', this.userRole);
    this.isDriver = this.userRole === 'DRIVER';
    this.isBuyer = this.userRole === 'BUYER';
    this.isSeller = this.userRole === 'SELLER';
    
    console.log('Role flags:', { isDriver: this.isDriver, isBuyer: this.isBuyer, isSeller: this.isSeller });
  }

  ngOnInit() {
    this.initializeMap();
    
    // Get user role information
    this.currentUser = this.tokenStorage.getUsername();
    const role = this.tokenStorage.getAuthorities();
    this.userRole = Array.isArray(role) ? role[0] : role;
    
    console.log('User role in ngOnInit:', this.userRole);
    this.isDriver = this.userRole === 'DRIVER';
    this.isBuyer = this.userRole === 'BUYER';
    this.isSeller = this.userRole === 'SELLER';
    
    console.log('Role flags:', { isDriver: this.isDriver, isBuyer: this.isBuyer, isSeller: this.isSeller });
    
    // Get the order ID from the URL if not provided as input
    if (!this.orderId) {
      this.activatedRoute.paramMap.subscribe(params => {
        this.orderId = params.get('id');
        
        if (this.orderId) {
          this.loadOrderDetails();
          this.getOrderLocation();
          this.getTrackingHistory();
          this.loadRouteData();
        }
      });
    } else {
      this.loadOrderDetails();
      this.getOrderLocation();
      this.getTrackingHistory();
      this.loadRouteData();
    }
  }
  
  ngAfterViewInit() {
    // Map initialization is handled after view is initialized
  }
  
  ngOnDestroy() {
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
    }
    
    // Clear route simulation
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    // Unsubscribe from route updates
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    
    // Remove resize listener when component is destroyed
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Clear any pending timeouts
    if (this.mapResizeTimeout) {
      clearTimeout(this.mapResizeTimeout);
    }
  }
  
  onMapReady(map: Map) {
    console.log('Map is ready');
    this.map = map;
    
    // Initial map size invalidation to ensure proper rendering
    setTimeout(() => {
      this.invalidateMapSize();
    }, 100);
    
    // Set up window resize listener for responsive map
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Initialize map with improved UI and landmarks
    setTimeout(() => {
      // Ensure map is properly sized
      this.map.invalidateSize();
      
      // Center on Dilla University with appropriate zoom
      this.map.setView(latLng(6.4107, 38.3087), 15);
      
      // Add Dilla University marker with divIcon to avoid CSP issues
      const universityIcon = divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#2196F3;height:42px;width:30px;text-align:center;border-radius:8px 8px 0 0;position:relative;">
              <i class="material-icons" style="color:#fff;font-size:20px;margin-top:5px;">school</i>
              <div style="width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:15px solid #2196F3;position:absolute;bottom:-15px;left:0;"></div>
              </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -40]
      });
      
      // Add the university marker with interactive popup
      const universityMarker = marker([6.4107, 38.3087], { icon: universityIcon })
        .addTo(this.map)
        .bindPopup('<div style="text-align: center;"><b>Dilla University</b><br><small>Reference point</small></div>');
      
      // Display the most recent location if available
      if (this.locationHistory && this.locationHistory.length > 0) {
        const latest = this.locationHistory[0];
        this.updateMapWithLocation(latest);
      }
    }, 300);
    
    // Start tracking location if user is the driver
    if (this.isDriver) {
      this.startDriverLocationTracking();
    } else {
      // Start fetching location updates if user is buyer or seller
      this.startFetchingLocationUpdates();
    }
    
    // Check if a route already exists for this order
    this.loadRouteForOrder();
  }
  
  loadOrderDetails() {
    this.isLoading = true;
    
    this.orderService.getOneOrder(this.orderId).subscribe(
      data => {
        this.currentOrder = data;
        this.order = data; // Set the order property to match the template references
        
        console.log('Order details loaded, initial status:', this.currentOrder.status);
        
        // Check if order status is ON_ROUTE and ensure indicator is set correctly
        if (this.currentOrder.status === 'ON_ROUTE' || this.currentOrder.status === 'PICKED_UP') {
          // Pre-set the indicator here for immediate UI feedback
          this.statusUpdates[2].completed = true; // "Picked Up & On the Way"
        }
        
        // Immediately fetch tracking history to verify order status
        this.trackingService.getTrackingHistory(this.orderId).subscribe(
          (trackingHistory) => {
            if (trackingHistory && trackingHistory.length > 0) {
              // Check if there's a delivered status in the tracking history
              const hasDelivered = trackingHistory.some(entry => entry.status === 'delivered');
              
              if (hasDelivered && this.currentOrder.status !== 'DRIVER_DELIVERED' && this.currentOrder.status !== 'DELIVERED') {
                console.log('Found delivered entry in tracking but order status is', this.currentOrder.status);
                console.log('Updating order status to DRIVER_DELIVERED for consistency');
                
                // Override the status to ensure consistency
                this.currentOrder.status = 'DRIVER_DELIVERED';
                this.order.status = 'DRIVER_DELIVERED';
              }
              
              // Now proceed with regular tracking history processing
              this.locationHistory = trackingHistory;
              this.processTrackingHistory();
            }
            
            // Now update status indicators based on the potentially corrected order status
            this.updateStatusIndicators(this.currentOrder.status);
            
            // Continue loading user information
            // Load driver info if available
            if (this.currentOrder.driver) {
              this.loadUserInfo(String(this.currentOrder.driver), 'driver');
            }
            
            // Load buyer info
            if (this.currentOrder.buyer) {
              this.loadUserInfo(String(this.currentOrder.buyer), 'buyer');
            }
            
            // Load seller info
            if (this.currentOrder.product && this.currentOrder.product.length > 0 && this.currentOrder.product[0].seller) {
              this.loadUserInfo(String(this.currentOrder.product[0].seller), 'seller');
            }
            
            this.isLoading = false;
          },
          error => {
            console.error('Error loading tracking history in loadOrderDetails:', error);
            
            // Still update status indicators based on original order status
            this.updateStatusIndicators(this.currentOrder.status);
            
            // Load user information even if tracking history fails
            if (this.currentOrder.driver) {
              this.loadUserInfo(String(this.currentOrder.driver), 'driver');
            }
            if (this.currentOrder.buyer) {
              this.loadUserInfo(String(this.currentOrder.buyer), 'buyer');
            }
            if (this.currentOrder.product && this.currentOrder.product.length > 0 && this.currentOrder.product[0].seller) {
              this.loadUserInfo(String(this.currentOrder.product[0].seller), 'seller');
            }
            
            this.isLoading = false;
          }
        );
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
            
            // IMPORTANT FIX: Check for delivered status first and prioritize it
            if (latestLocation.status === 'delivered') {
              console.log('Delivered status found in tracking history!');
              
              // Always update order status to DRIVER_DELIVERED when tracking shows delivered
              this.currentOrder.status = 'DRIVER_DELIVERED';
              if (this.order) {
                this.order.status = 'DRIVER_DELIVERED';
              }
              
              // Make sure status indicators reflect delivered state
              this.updateStatusIndicators('DRIVER_DELIVERED');
            } else {
              // For non-delivered statuses, use standard processing
              this.updateStatusIndicatorsFromTracking(latestLocation.status);
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
    if (!this.map) {
      console.log('Map not initialized, cannot update location');
      return;
    }
    
    try {
      const position = latLng(location.latitude, location.longitude);
      
      // Create or update driver marker with better error handling
      if (this.driverMarker && this.map.hasLayer(this.driverMarker)) {
        // If marker exists and is on the map, just update its position
        this.driverMarker.setLatLng(position);
      } else {
        // If previous marker is not valid or not on map, clean up and create new
        if (this.driverMarker) {
          try { this.driverMarker.remove(); } catch (e) { /* ignore removal errors */ }
        }

        // Create a new driver marker using divIcon to avoid CSP issues
        const driverIcon = divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color:#FF9800;height:24px;width:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="material-icons" style="color:#fff;font-size:16px;">local_shipping</i></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12]
        });

        // Create and add the marker to the map
        this.driverMarker = marker(position, {
          icon: driverIcon,
          title: 'Driver Location'
        });

        // Make sure the map is available before adding the marker
        this.driverMarker.addTo(this.map);
        this.driverMarker.bindPopup('Driver Current Location');
      }
      
      // Only center map if followDriver is enabled
      if (this.followDriver) {
        this.map.setView(position, this.map.getZoom() || 15);
      }
    } catch (error) {
      console.error('Error updating map with location:', error);
    }
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
            const truckIcon: Icon = icon({
              iconUrl: 'assets/images/truck-icon.svg',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });

            this.driverMarker = marker(driverPosition, {
              icon: truckIcon,
              title: 'Driver Location'
            });

            this.driverMarker.addTo(this.map);
            this.driverMarker.bindPopup('Driver Current Location');
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
        { status: 'Picked Up & On the Way', completed: false },
        { status: 'Delivered', completed: false }
      ];
    } else if (orderStatus === 'SHIPPED') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'Picked Up & On the Way', completed: false },
        { status: 'Delivered', completed: false }
      ];
    } else if (orderStatus === 'PICKED_UP' || orderStatus === 'ON_ROUTE') {
      // Combined condition for both statuses
      console.log('Setting indicators for PICKED_UP or ON_ROUTE status');
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'Picked Up & On the Way', completed: true },
        { status: 'Delivered', completed: false }
      ];
    } else if (orderStatus === 'DRIVER_DELIVERED') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'Picked Up & On the Way', completed: true },
        { status: 'Delivered', completed: true }
      ];
    } else if (orderStatus === 'DELIVERED' || orderStatus === 'Delivered') {
      this.statusUpdates = [
        { status: 'Order Accepted', completed: true },
        { status: 'Preparing for Shipment', completed: true },
        { status: 'Picked Up & On the Way', completed: true },
        { status: 'Delivered', completed: true }
      ];
    }
  }
  
  updateStatusIndicatorsFromTracking(status: string) {
    // Update status indicators based on tracking status
    console.log('Updating status indicators from tracking status:', status);
    
    if (status === 'picked_up' || status === 'on_route' || status === 'On the Way') {
      console.log('Found picked_up or on_route status in tracking history, marking as picked up');
      
      // IMPORTANT FIX: Always trust tracking history for on_route/picked_up status
      // This ensures that when a driver clicks the "Picked Up" button, the indicator
      // persists after refresh even if the backend order status is still SHIPPED
      this.statusUpdates[1].completed = true; // Preparing for Shipment
      this.statusUpdates[2].completed = true; // Picked Up & On the Way
    } else if (status === 'delivered') {
      console.log('Found delivered status in tracking history, marking all indicators as completed');
      this.statusUpdates[1].completed = true;
      this.statusUpdates[2].completed = true;
      this.statusUpdates[3].completed = true;
      
      // Additional logic for all users to see the delivered status
      if (this.currentOrder.status !== 'DELIVERED' && this.currentOrder.status !== 'DRIVER_DELIVERED') {
        // Update local order status for UI consistency
        this.currentOrder.status = 'DRIVER_DELIVERED';
        // Make sure status indicators are updated
        this.updateStatusIndicators(this.currentOrder.status);
      }
    }
  }
  
  updateOrderStatus(status: string) {
    if (!this.isDriver) return;
    
    let actionMessage = '';
    let confirmationTitle = '';
    
    if (status === 'picked_up') {
      actionMessage = 'This will mark the order as picked up and prompt you for route information.';
      confirmationTitle = 'Mark Order as Picked Up';
    } else if (status === 'on_route') {
      actionMessage = 'This will mark the order as on the way to the buyer.';
      confirmationTitle = 'Mark Order as On Route';
    } else if (status === 'delivered') {
      actionMessage = 'This will mark the order as delivered by driver. The buyer will need to confirm receipt.';
      confirmationTitle = 'Mark as Delivered';
    }
    
    Swal.fire({
      title: confirmationTitle,
      text: actionMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Special handling for picked_up status
        if (status === 'picked_up') {
          // Use the onPickupClick method which has the route dialog logic
          this.onPickupClick();
          return;
        }
        
        // Use updateOrderStatusNew method with numeric order ID
        this.trackingService.updateOrderStatusNew(Number(this.orderId), status).subscribe(
          response => {
            console.log('Order status updated:', response);
            
            // Update current order status based on backend behavior
            if (this.currentOrder && this.order) {
              if (status === 'delivered') {
                // Set to DRIVER_DELIVERED for the collaborative confirmation flow
                this.currentOrder.status = 'DRIVER_DELIVERED';
                this.order.status = 'DRIVER_DELIVERED';
                
                Swal.fire({
                  title: 'Delivery Marked',
                  text: 'You have successfully marked this order as delivered. The buyer will need to confirm receipt for the delivery to be complete.',
                  icon: 'success',
                  confirmButtonText: 'OK'
                });
                
                // If there's tracking interval, clear it when marking as delivered
                if (this.locationUpdateInterval) {
                  clearInterval(this.locationUpdateInterval);
                  this.locationUpdateInterval = null;
                }
              } else if (status === 'on_route') {
                this.currentOrder.status = 'ON_ROUTE';
                this.order.status = 'ON_ROUTE';
                Swal.fire('Success', 'Order is now marked as on route to the buyer', 'success');
              } else {
                this.currentOrder.status = status.toUpperCase();
                this.order.status = status.toUpperCase();
                Swal.fire('Success', `Order status updated to ${status}`, 'success');
              }
            }
            
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
                if (!position || !position.coords) {
                  console.warn('Invalid position data received');
                  return;
                }
                
                // Create location object with the updated status
                const location: TrackingLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: new Date(),
                  status: status,
                  orderId: this.orderId,
                  driverId: this.tokenStorage.getUsername() || ''
                };
                
                // Update the driver marker on the map
                this.zone.run(() => {
                  if (this.map) {
                    this.updateDriverMarker(location);
                  }
                  
                  // Save location to server with proper status
                  // Only try to update location if user is a driver
                  if (this.isDriver) {
                    this.trackingService.updateLocation(location).subscribe(
                      () => console.log('Location updated with new status:', status),
                      err => console.error('Error updating location:', err)
                    );
                  }
                  
                  // If status is on_route, ensure route is visible if we have one
                  if (status === 'on_route' && this.currentRoute && this.routeLayer && this.map) {
                    if (!this.map.hasLayer(this.routeLayer)) {
                      this.routeLayer.addTo(this.map);
                    }
                  }
                  
                  // If status is delivered, focus map on the entire route
                  if (status === 'delivered' && this.routeLayer && this.map) {
                    try {
                      this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
                    } catch (e) {
                      console.warn('Could not fit bounds to route', e);
                    }
                  }
                });
              })
              .catch(error => {
                // Handle geolocation errors more gracefully
                console.error('Error getting position for status update:', error);
                
                this.snackBar.open('Could not get your location, but status has been updated', 'OK', {
                  duration: 5000
                });
                
                // If we have known default coordinates for the order, use those
                if (this.currentOrder && this.currentOrder.deliveryLocation) {
                  const defaultLocation: TrackingLocation = {
                    latitude: this.currentOrder.deliveryLocation.latitude || 9.0222,
                    longitude: this.currentOrder.deliveryLocation.longitude || 38.7468,
                    timestamp: new Date(),
                    status: status,
                    orderId: this.orderId,
                    driverId: this.tokenStorage.getUsername() || ''
                  };
                  
                  this.trackingService.updateLocation(defaultLocation).subscribe(
                    () => console.log('Default location updated with status:', status),
                    err => console.error('Error updating with default location:', err)
                  );
                }
              });
              
            // If status is delivered, stop any location tracking
            if (status === 'delivered') {
              if (this.locationUpdateInterval) {
                clearInterval(this.locationUpdateInterval);
                this.locationUpdateInterval = null;
              }
              this.isTrackingEnabled = false;
            }
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
    // Log role information for debugging
    console.log('Current user role:', this.userRole);
    console.log('Role flags:', { isDriver: this.isDriver, isBuyer: this.isBuyer, isSeller: this.isSeller });
    
    // Use a direct approach based on the user role string instead of the flags
    const userRole = this.tokenStorage.getAuthorities();
    console.log('Authority from token:', userRole);
    
    if (Array.isArray(userRole)) {
      if (userRole.includes('DRIVER')) {
        console.log('Navigating to driver shipped orders');
        this.router.navigate(['/driver/orders/shipped_order']);
        return;
      } else if (userRole.includes('BUYER')) {
        console.log('Navigating to buyer shipped orders');
        this.router.navigate(['/buyer/orders/shipped_order']);
        return;
      } else if (userRole.includes('SELLER')) {
        console.log('Navigating to seller shipped orders');
        this.router.navigate(['/seller/orders/shipped_order']);
        return;
      }
    } else if (typeof userRole === 'string') {
      if (userRole.includes('DRIVER')) {
        console.log('Navigating to driver shipped orders (string)');
        this.router.navigate(['/driver/orders/shipped_order']);
        return;
      } else if (userRole.includes('BUYER')) {
        console.log('Navigating to buyer shipped orders (string)');
        this.router.navigate(['/buyer/orders/shipped_order']);
        return;
      } else if (userRole.includes('SELLER')) {
        console.log('Navigating to seller shipped orders (string)');
        this.router.navigate(['/seller/orders/shipped_order']);
        return;
      }
    }
    
    // Fallback to dashboard if role detection fails
    console.log('No specific role detected, falling back to dashboard');
    this.router.navigate(['/dashboard']);
  }
  
  // New methods for route handling
  loadRouteForOrder(): void {
    this.trackingService.getRouteNew(Number(this.orderId)).subscribe(
      (route: any) => {
        if (route && route.routeGeometry) {
          this.currentRoute = route;
          this.drawRoute(route);
          
          // If order status is "On the Way", start simulating movement
          if (this.currentOrder?.status === 'On the Way') {
            this.startRouteSimulation();
          }
        }
      },
      error => {
        // Silently handle 404 errors - normal for new orders without routes
        if (error.status !== 404) {
          console.error('Error loading route:', error);
        }
      }
    );
  }

  drawRoute(routeData?: any): void {
    // If no routeData is provided but we have currentRoute with geometry, use that
    if (!routeData && this.currentRoute && this.currentRoute.routeGeometry) {
      routeData = this.currentRoute.routeGeometry;
    }
    
    // Make sure we have valid route data
    if (!routeData) {
      console.error('No valid route data provided');
      return;
    }
    
    // Remove existing route layer if present
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }
    
    // Create a new GeoJSON layer with the route data with improved styling
    this.routeLayer = geoJSON(routeData, {
      style: {
        color: '#2196F3',
        weight: 6,
        opacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round',
        dashArray: '1, 8',
        dashOffset: '0'
      }
    }).addTo(this.map);
    
    // Add markers for start and end points if they exist in currentRoute
    if (this.currentRoute && this.currentRoute.startPoint && this.currentRoute.endPoint) {
      const startCoords = [this.currentRoute.startPoint.latitude, this.currentRoute.startPoint.longitude];
      const endCoords = [this.currentRoute.endPoint.latitude, this.currentRoute.endPoint.longitude];
      
      // Create custom icons for start and end points using divIcon to avoid CSP issues
      const startIcon = divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#007bff;" class="marker-pin"></div><i class="material-icons" style="color:#fff;">place</i>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      
      const endIcon = divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#dc3545;" class="marker-pin"></div><i class="material-icons" style="color:#fff;">flag</i>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      
      // Add CSS for custom markers if it doesn't exist
      if (!document.getElementById('custom-markers-style')) {
        const style = document.createElement('style');
        style.id = 'custom-markers-style';
        style.textContent = `
          .marker-pin {
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #FFFFFF;
          }
          .custom-div-icon i {
            position: absolute;
            width: 22px;
            font-size: 22px;
            left: 4px;
            top: 3px;
            text-align: center;
            transform: rotate(45deg);
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add markers to the map with informative popups
      marker(startCoords, { icon: startIcon })
        .addTo(this.map)
        .bindPopup(`<b>Pickup Location:</b><br>${this.currentRoute.startPoint.address || 'Starting Point'}`);
      
      marker(endCoords, { icon: endIcon })
        .addTo(this.map)
        .bindPopup(`<b>Delivery Location:</b><br>${this.currentRoute.endPoint.address || 'Destination'}`);
      
      // Fit the map to show the entire route with padding
      if (this.routeLayer && this.routeLayer.getBounds) {
        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
      }
    }
  }

  startRouteSimulation(): void {
    // Only start simulation if we have a route and we're not already simulating
    if (!this.currentRoute || this.simulationInterval) {
      return;
    }

    // Reset progress
    this.simulationProgress = 0;

    // Simulation interval (update every 3 seconds)
    this.simulationInterval = setInterval(() => {
      // Increment progress
      this.simulationProgress += 1;

      // Get position at current progress
      const position = this.trackingService.simulateRouteProgress(this.currentRoute, this.simulationProgress);

      if (position) {
        // Update the driver marker
        const simulatedLocation: TrackingLocation = {
          latitude: position.lat,
          longitude: position.lng,
          timestamp: new Date(),
          status: 'On the Way',
          orderId: this.orderId,
          driverId: this.tokenStorage.getUsername() || ''
        };

        // Update UI with simulated position
        this.updateDriverMarker(simulatedLocation);

        // If we're the driver, update the backend with the simulated position
        if (this.isDriver) {
          this.trackingService.updateLocation(simulatedLocation).subscribe(
            () => console.log('Simulated location updated successfully'),
            err => console.error('Error updating simulated location:', err)
          );
        }

        // If we've reached the end of the route (100% progress)
        if (this.simulationProgress >= 100) {
          clearInterval(this.simulationInterval);
          this.simulationInterval = null;
        }
      }
    }, 3000);
  }

  stopRouteSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
  
  updateDriverMarker(location: TrackingLocation): void {
    // Check if map is initialized
    if (!this.map) {
      console.log('Map not initialized, skipping driver marker update');
      return;
    }

    // Validate location data
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.error('Invalid location data:', location);
      return;
    }

    try {
      const driverPosition = latLng(location.latitude, location.longitude);

      // Completely recreate the marker each time to avoid _leaflet_pos errors
      // First, remove existing marker if it exists
      if (this.driverMarker) {
        try {
          if (this.map.hasLayer(this.driverMarker)) {
            this.map.removeLayer(this.driverMarker);
          } else {
            try { this.driverMarker.remove(); } catch (e) { /* ignore removal errors */ }
          }
        } catch (e) {
          console.warn('Error removing existing marker, will create new one');
        }
        this.driverMarker = null;
      }

      // Create a simpler divIcon without Material icons to avoid appendChild errors
      const driverIcon = divIcon({
        className: 'driver-marker-icon',
        html: `<div style="background-color:#FF9800;height:20px;width:20px;border-radius:50%;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
      });

      // Always create a new marker
      this.driverMarker = marker(driverPosition, {
        icon: driverIcon,
        title: 'Driver Location',
        alt: 'Driver',
        riseOnHover: true
      });

      // Add to map with popup - wrap in try-catch and use NgZone to ensure proper Angular change detection
      this.zone.run(() => {
        try {
          // Verify map is still valid before adding marker
          if (this.map && this.map._container) {
            this.driverMarker.addTo(this.map);
            this.driverMarker.bindPopup(`<b>Driver Location</b><br>Driver: ${this.driverUser?.username || 'Unknown'}<br>Updated: ${new Date().toLocaleTimeString()}`);
          }
        } catch (error) {
          console.warn('Error adding marker to map:', error);
        }
      });

      // Only center map on driver position if we specifically want to follow the driver
      // Wrap in try-catch to prevent _leaflet_pos errors
      if (this.followDriver && this.map && this.map._loaded && typeof this.map.setView === 'function') {
        try {
          // Check that map is fully initialized and container exists
          if (this.map._container && document.body.contains(this.map._container)) {
            this.map.setView(driverPosition, this.map.getZoom() || 15);
          } else {
            console.warn('Map container not found in DOM, skipping setView');
          }
        } catch (e) {
          console.warn('Error centering map on driver position:', e);
        }
      }
    } catch (error) {
      console.error('Error updating driver marker:', error);
    }
  }

  onPickupClick(): void {
    // Show the route info dialog
    const dialogRef = this.dialog.open(RouteInfoDialogComponent, {
      width: '500px',
      data: { orderId: this.orderId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Save the route
        this.trackingService.saveDeliveryRoute(result).subscribe(
          response => {
            console.log('Route saved:', response);
            // Update the route display
            this.currentRoute = result;
            this.drawRoute();
            this.snackBar.open('Route saved successfully', 'OK', { duration: 3000 });

            // Continue with updating order status to ON_ROUTE
            this.updateOrderToOnRoute();
            
            // Mark the "Picked Up & On the Way" status as completed
            this.statusUpdates[0].completed = true; // Order Accepted
            this.statusUpdates[1].completed = true; // Preparing for Shipment
            this.statusUpdates[2].completed = true; // Picked Up & On the Way
          },
          error => {
            console.error('Error saving route:', error);
            // Still draw the route even if saving failed
            this.currentRoute = result;
            this.drawRoute();
            this.snackBar.open('Could not save route to server, but it is visible on the map', 'OK', { duration: 5000 });

            // Continue with updating order status even if route saving failed
            this.updateOrderToOnRoute();
            
            // Mark the "Picked Up & On the Way" status as completed even if save failed
            this.statusUpdates[0].completed = true; // Order Accepted
            this.statusUpdates[1].completed = true; // Preparing for Shipment
            this.statusUpdates[2].completed = true; // Picked Up & On the Way
          }
        );
      } else {
        // User cancelled the dialog, do not update order status
        this.snackBar.open('Route information is required to mark order as picked up', 'OK', { duration: 5000 });
      }
    });
  }
  
  // Helper method to update order status to ON_ROUTE after saving route
  private updateOrderToOnRoute(): void {
    // Update order status to ON_ROUTE
    this.trackingService.updateOrderStatusNew(this.orderId, 'on_route')
      .subscribe(
        () => {
          this.isTrackingEnabled = true;
          // Use consistent status naming
          this.currentOrder.status = 'ON_ROUTE';
          this.order.status = 'ON_ROUTE';
          this.updateStatusIndicators(this.currentOrder.status);
          
          // Start the route simulation if we have a route
          if (this.currentRoute) {
            this.startRouteSimulation();
          }

          // Get current position and update driver location
          this.trackingService.getCurrentPosition()
            .then(position => {
              if (!position || !position.coords) {
                console.warn('Invalid position data returned');
                return;
              }
              
              const location: TrackingLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date(),
                status: 'on_route',
                orderId: this.orderId,
                driverId: this.tokenStorage.getUsername() || ''
              };
              
              // Make sure we're in Angular zone when updating the UI
              this.zone.run(() => {
                // Only update the marker if the map exists
                if (this.map) {
                  this.updateDriverMarker(location);
                }
                // Only try to update location if user is a driver
                if (this.isDriver) {
                  this.trackingService.updateLocation(location).subscribe(
                    () => console.log('Location updated successfully'),
                    err => console.error('Error updating location:', err)
                  );
                }
              });
            })
            .catch(error => {
              console.error('Error getting position:', error);
            });
          
          // Set interval to update location regularly
          this.locationUpdateInterval = window.setInterval(() => {
            // Skip location update if map is not initialized
            if (!this.map) {
              console.log('Map not initialized, skipping location update');
              return;
            }
            
            this.trackingService.getCurrentPosition()
              .then(position => {
                if (!position || !position.coords) {
                  console.warn('Invalid position data returned');
                  return;
                }
                
                const location: TrackingLocation = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: new Date(),
                  status: 'on_route',
                  orderId: this.orderId,
                  driverId: this.tokenStorage.getUsername() || ''
                };
                
                // Make sure we're in Angular zone when updating the UI
                this.zone.run(() => {
                  if (this.map) {
                    this.updateDriverMarker(location);
                  }
                  this.trackingService.updateLocation(location).subscribe(
                    () => console.log('Location updated successfully'),
                    err => console.error('Error updating location:', err)
                  );
                });
              })
              .catch(error => {
                console.error('Error getting position:', error);
              });
          }, 10000) as any;
        },
        error => {
          console.error('Error updating status:', error);
          this.snackBar.open('Failed to update order status to On Route', 'OK', { duration: 5000 });
        }
      );
  }
  
  updateStatus(newStatus: string) {
    if (this.currentOrder) {
      this.currentOrder.status = newStatus.toUpperCase();
    }
  }

  getTrackingHistory() {
    if (!this.orderId) return;
    
    this.trackingService.getTrackingHistory(this.orderId).subscribe(
      (history: TrackingLocation[]) => {
        this.locationHistory = history;
        console.log('Tracking history loaded:', this.locationHistory);
        
        if (this.locationHistory && this.locationHistory.length > 0) {
          // Sort by timestamp (newest first)
          this.locationHistory.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          // Update map with the most recent location
          if (this.map) {
            setTimeout(() => {
              this.updateMapWithLocation(this.locationHistory[0]);
            }, 500);
          }
          
          // Process tracking history to update status
          this.processTrackingHistory();
        }
      },
      error => {
        console.error('Error getting tracking history:', error);
      }
    );
  }

  processTrackingHistory() {
    if (!this.locationHistory || this.locationHistory.length === 0) return;
    
    // First, make sure the location history is properly sorted by timestamp (newest first)
    this.locationHistory.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Descending order (newest first)
    });
    
    // Log the first few entries to verify sorting
    console.log('Sorted tracking history (first 3 entries):', 
      this.locationHistory.slice(0, 3).map(loc => {
        return { 
          status: loc.status, 
          timestamp: loc.timestamp,
          time: new Date(loc.timestamp).toLocaleTimeString() 
        };
      }));
    
    // Get the latest status entry (should be the first one after sorting)
    const latestStatusEntry = this.locationHistory[0];
    console.log('Latest status entry:', latestStatusEntry);
    
    if (!latestStatusEntry) return;
    
    // Check for delivered status first
    if (latestStatusEntry.status === 'delivered') {
      console.log('Found delivered status in latest tracking entry');
      
      // Always update order status to DRIVER_DELIVERED when we find a delivered status
      this.currentOrder.status = 'DRIVER_DELIVERED';
      if (this.order) {
        this.order.status = 'DRIVER_DELIVERED';
      }
      
      // Update status indicators and persist to backend
      this.updateStatusIndicators('DRIVER_DELIVERED');
      
      // Log for troubleshooting
      console.log('Order status updated to DRIVER_DELIVERED from tracking history');
      return;
    }
    
    // Only check the LATEST status, not any status in history
    if (latestStatusEntry.status === 'on_route' || latestStatusEntry.status === 'picked_up') {
      console.log('Latest status is on_route or picked_up');
      
      // MINIMAL FIX: Set the currentOrder.status to ON_ROUTE when we find on_route in tracking history
      // This ensures the picked up indicator will persist after refresh
      if (this.currentOrder && this.currentOrder.status === 'SHIPPED') {
        this.currentOrder.status = 'ON_ROUTE';
      }
      
      // Only update the status indicators based on the LATEST status
      this.updateStatusIndicatorsFromTracking(latestStatusEntry.status);
    } else {
      // For any other status, just update indicators based on that status
      console.log('Latest status is:', latestStatusEntry.status);
      this.updateStatusIndicatorsFromTracking(latestStatusEntry.status);
    }
  }
  
  onWindowResize() {
    // Debounce resize events to avoid performance issues
    if (this.mapResizeTimeout) {
      clearTimeout(this.mapResizeTimeout);
    }
    
    this.mapResizeTimeout = setTimeout(() => {
      this.invalidateMapSize();
    }, 200);
  }
  
  invalidateMapSize() {
    if (this.map) {
      // Use NgZone to ensure Angular detects the changes
      this.zone.run(() => {
        // Force map to recalculate its container size
        this.map.invalidateSize(true);
      });
    }
  }

  loadRouteData() {
    if (!this.orderId) return;
    
    this.trackingService.getRouteNew(Number(this.orderId)).subscribe(
      (routeData: any) => {
        console.log('Route data loaded:', routeData);
        if (routeData && routeData.routeGeometry) {
          this.currentRoute = routeData;
          this.drawRoute(routeData);
        }
      },
      error => {
        // Silently handle 404 errors - normal for new orders without routes
        if (error.status !== 404) {
          console.error('Error loading route data:', error);
        }
        
        // If no route exists and the user is a driver, show a message to create a route
        if (this.isDriver && this.currentOrder?.status === 'ASSIGNED') {
          this.snackBar.open('No route defined yet. Use the Set Route button to create one.', 'OK', {
            duration: 5000
          });
        }
      }
    );
  }
  
  getOrderLocation() {
    if (!this.orderId) return;
    
    this.trackingService.getOrderLocationNew(Number(this.orderId)).subscribe(
      (location: any) => {
        if (location && location.latitude && location.longitude) {
          console.log('Retrieved current location for order:', location);
          // Convert to TrackingLocation format if needed
          const trackingLocation: TrackingLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date(location.timestamp || new Date()),
            status: location.status || this.currentOrder?.status?.toLowerCase() || 'unknown',
            orderId: this.orderId,
            driverId: location.driverId || ''
          };
          this.updateMapWithLocation(trackingLocation);
        } else {
          console.log('No tracking location available for this order yet');
        }
      },
      error => {
        // Silently handle 404 errors - normal for new orders
        if (error.status !== 404) {
          console.error('Error getting order location:', error);
        }
        // Always try to get tracking history even if current location fails
        this.getTrackingHistory();
      }
    );
  }

  initializeMap() {
    // This method will be called in ngOnInit to set up the map
    console.log('Map initialization will happen in ngAfterViewInit');
  }
}
