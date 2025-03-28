import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/shared/security/user';
import { DriverService } from '../driver.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { environment } from 'src/environments/environment';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-select-driver',
  templateUrl: './select-driver.component.html',
  styleUrls: ['./select-driver.component.scss']
})
export class SelectDriverComponent implements OnInit {
  drivers: User[] = [];
  driverRatings: { [key: string]: number } = {}; // Store ratings by driver ID
  loading = true;
  error = '';
  hasPaymentInfo = false;
  hasActiveOrders = false;
  private apiUrl = environment.apiUrl;
  paymentSuccess = false;

  constructor(
    private driverService: DriverService,
    private tokenStorage: TokenStorageService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('SelectDriverComponent initialized');
    
    // Parse URL parameters first (might include payment info)
    this.extractPaymentInfoFromUrl();
    
    // Check if payment has been made
    this.checkPaymentInfo();
    
    // Check if we need to retrieve product ID from localStorage
    this.checkStoredProductDetails();
    
    // Always load drivers regardless of payment status
    this.loadDrivers();
    
    // Ensure we have a transaction reference (for driver selection)
    this.ensureTransactionReference();
  }

  /**
   * Extract payment and product information from URL
   */
  extractPaymentInfoFromUrl(): void {
    // Log the current URL to debug
    console.log('Current URL: ', window.location.href);
    console.log('Current localStorage product ID: ', localStorage.getItem('selected_product_id'));
    
    // Check for URL fragment with hash and query parameters
    const urlHash = window.location.hash;
    const fragmentAndQuery = urlHash.split('#')[1] || '';
    
    console.log('URL Fragment and Query: ', fragmentAndQuery);
    
    // Check if we came from payment page
    if (window.location.href.includes('payment') || window.location.href.includes('tx_ref')) {
      this.paymentSuccess = true;
      console.log('User is coming from payment page. Success mode enabled.');
    }
    
    // Extract query parameters manually
    if (fragmentAndQuery.includes('?')) {
      const queryString = fragmentAndQuery.split('?')[1] || '';
      console.log('Query String: ', queryString);
      
      // Check for tx_ref parameter
      if (queryString.includes('tx_ref=')) {
        const txRef = this.extractParamFromQueryString(queryString, 'tx_ref');
        if (txRef) {
          localStorage.setItem('transaction_reference', txRef);
          console.log('Saved transaction reference from URL:', txRef);
          this.paymentSuccess = true;
        }
      }
      
      // Check for product_id parameter
      if (queryString.includes('product_id')) {
        const productId = this.extractParamFromQueryString(queryString, 'product_id');
        if (productId) {
          localStorage.setItem('selected_product_id', productId);
          console.log('Saved product ID from URL:', productId);
        }
      }
      
      // Check for tariff_id parameter (for future use)
      if (queryString.includes('tariff_id')) {
        const tariffId = this.extractParamFromQueryString(queryString, 'tariff_id');
        if (tariffId) {
          localStorage.setItem('selected_tariff_id', tariffId);
          console.log('Saved tariff ID from URL:', tariffId);
        }
      }
    }
    
    // Also check URL search params (non-hash part)
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Search Params: ', window.location.search);
    
    // Try to extract from URL search params as well
    const txRefFromSearch = urlParams.get('tx_ref');
    if (txRefFromSearch) {
      localStorage.setItem('transaction_reference', txRefFromSearch);
      console.log('Saved transaction reference from URL search:', txRefFromSearch);
    }
    
    const productIdFromSearch = urlParams.get('product_id');
    if (productIdFromSearch) {
      localStorage.setItem('selected_product_id', productIdFromSearch);
      console.log('Saved product ID from URL search:', productIdFromSearch);
    }
  }
  
  /**
   * Helper method to extract parameters from query string
   */
  private extractParamFromQueryString(queryString: string, paramName: string): string | null {
    // Handle both standard format and semicolon format
    const patterns = [
      new RegExp(`${paramName}=([^&;]+)`),  // Standard format: param=value&
      new RegExp(`${paramName}%3D([^&;]+)`) // URL encoded format: param%3Dvalue&
    ];
    
    for (const pattern of patterns) {
      const match = queryString.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Check payment information on component initialization
   */
  checkPaymentInfo() {
    // Check if user is coming from payment success page
    const urlHash = window.location.hash;
    const fragmentAndQuery = urlHash.split('#')[1] || '';
    const comingFromPayment = fragmentAndQuery.includes('payment=success');
    
    if (comingFromPayment) {
      // If user is coming directly from payment success page, enable driver selection
      this.hasPaymentInfo = true;
      console.log('User coming from payment success page. Driver selection enabled.');
    } else {
      // Otherwise use the regular payment verification
      this.hasPaymentInfo = this.driverService.hasCompletedPayment();
      
      if (this.hasPaymentInfo) {
        console.log('Payment verification passed. Driver selection enabled.');
      } else {
        console.log('Payment verification failed. Driver selection disabled.');
        
        // Clear any stored payment status if we've navigated here directly (not from payment)
        if (!fragmentAndQuery.includes('payment')) {
          this.driverService.clearPaymentStatus();
        }
      }
    }
  }

  /**
   * Check if the user has any active orders
   */
  checkForActiveOrders(): void {
    // Get the current user id from token storage
    const userId = this.tokenStorage.getId();
    if (!userId) {
      console.log('Cannot check orders - no user logged in');
      this.hasActiveOrders = false;
      return;
    }

    // Fetch orders for the current user
    console.log('Checking for active orders for user:', userId);
    
    this.http.get(`${this.apiUrl}orders`).pipe(
      catchError(error => {
        console.error('Error fetching orders:', error);
        return of([]);
      })
    ).subscribe(orders => {
      // Check if there are any orders
      const hasOrders = Array.isArray(orders) && orders.length > 0;
      
      this.hasActiveOrders = hasOrders;
      console.log('Active orders found:', hasOrders ? 'Yes' : 'No');
    });
  }

  /**
   * Load drivers from the backend
   */
  loadDrivers(): void {
    this.loading = true;
    this.error = '';
    
    // Use the driver service to get all drivers
    this.driverService.getAllDrivers().subscribe({
      next: (drivers) => {
        this.processDrivers(drivers);
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.error = 'Failed to load drivers. Please try again later.';
        this.createSampleDrivers();
        this.loading = false;
      }
    });
  }

  /**
   * Process the drivers data received from the API
   */
  processDrivers(drivers: User[]): void {
    this.drivers = drivers;
    
    // If no drivers were found from the API, create sample ones
    if (this.drivers.length === 0) {
      this.createSampleDrivers();
      return;
    }
    
    // Loop through all drivers
    this.drivers.forEach(driver => {
      // Generate random ratings
      this.driverRatings[driver.id] = this.driverService.generateRandomRating();
      
      // Get the driver profile from database if it doesn't exist
      if (!driver.driver_profile && driver.is_driver) {
        console.log('Fetching driver profile for driver:', driver.id);
        this.http.get<any>(`${this.apiUrl}driver-profile/${driver.id}/`)
          .subscribe({
            next: (profile) => {
              if (profile) {
                driver.driver_profile = {
                  license_number: profile.license_number,
                  car_model: profile.car_model || 'Commercial Vehicle'
                };
              } else {
                // Fallback if API returns nothing
                driver.driver_profile = {
                  license_number: 'ETH-' + Math.floor(10000 + Math.random() * 90000),
                  car_model: 'Commercial Vehicle'
                };
              }
            },
            error: () => {
              // Fallback profile
              driver.driver_profile = {
                license_number: 'ETH-' + Math.floor(10000 + Math.random() * 90000),
                car_model: 'Commercial Vehicle'
              };
            }
          });
      } else if (driver.is_driver && (!driver.driver_profile || !driver.driver_profile.car_model)) {
        // Ensure car_model exists for drivers
        const existingProfile = driver.driver_profile || { license_number: '', car_model: '' };
        driver.driver_profile = {
          license_number: existingProfile.license_number || 'ETH-' + Math.floor(10000 + Math.random() * 90000),
          car_model: existingProfile.car_model || 'Commercial Vehicle'
        };
      }
    });
    
    this.loading = false;
  }

  /**
   * Create sample drivers as a fallback
   */
  createSampleDrivers(): void {
    console.log('Creating sample drivers as fallback');
    // Create sample drivers for demonstration if the API fails
    this.drivers = [
      {
        id: '1',
        username: 'driver1',
        email: 'driver1@example.com',
        phone_number: '+251912345678',
        address: 'Ambo',
        profile_image: 'assets/images/profile/user.jpg',
        is_driver: true,
        is_buyer: false,
        is_seller: false,
        password: '',
        registration_date: new Date(),
        payment_method: 'Bank',
        account_number: '',
        buyer_profile: null,
        seller_profile: null,
        driver_profile: {
          license_number: 'ABC123',
          car_model: 'Sino Truck'
        }
      },
      {
        id: '2',
        username: 'driver2',
        email: 'driver2@example.com',
        phone_number: '+251987654321',
        address: 'Addis Ababa',
        profile_image: 'assets/images/profile/user.jpg',
        is_driver: true,
        is_buyer: false,
        is_seller: false,
        password: '',
        registration_date: new Date(),
        payment_method: 'Mobile Money',
        account_number: '',
        buyer_profile: null,
        seller_profile: null,
        driver_profile: {
          license_number: 'XYZ789',
          car_model: 'Toyota Hilux'
        }
      },
      {
        id: '3',
        username: 'driver3',
        email: 'driver3@example.com',
        phone_number: '+251654321987',
        address: 'Woliso',
        profile_image: 'assets/images/profile/user.jpg',
        is_driver: true,
        is_buyer: false,
        is_seller: false,
        password: '',
        registration_date: new Date(),
        payment_method: 'Bank',
        account_number: '',
        buyer_profile: null,
        seller_profile: null,
        driver_profile: {
          license_number: 'DEF456',
          car_model: 'Land Cruiser'
        }
      }
    ];
    
    // Generate random ratings for the sample drivers
    this.drivers.forEach(driver => {
      this.driverRatings[driver.id] = this.driverService.generateRandomRating();
    });
    
    this.loading = false;
  }

  /**
   * Get the image URL for a driver
   */
  getImageUrl(driver: User): string {
    if (!driver.profile_image) {
      return 'assets/images/user/default.png'; // Using the default image in user directory
    }
    
    // If the image URL is a relative path, use the assets folder
    if (driver.profile_image.startsWith('assets/')) {
      return driver.profile_image;
    }
    
    // If the image already has the full URL, return it
    if (driver.profile_image.includes('http')) {
      return driver.profile_image;
    }
    
    // Otherwise, construct the full URL
    return environment.apiUrl.replace('/api/', '') + driver.profile_image;
  }

  /**
   * Generate an array of stars for the rating
   */
  getStars(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    const starsArray = [];
    
    // Add full stars (1)
    for (let i = 0; i < fullStars; i++) {
      starsArray.push(1);
    }
    
    // Add half star (0.5) if needed
    if (hasHalfStar) {
      starsArray.push(0.5);
    }
    
    // Add empty stars (0)
    for (let i = 0; i < emptyStars; i++) {
      starsArray.push(0);
    }
    
    return starsArray;
  }

  /**
   * Select a driver
   */
  selectDriver(driver: User): void {
    console.log('Driver selection attempted for:', driver);
    
    // Check if coming from payment success or has valid payment
    const url = window.location.href;
    const urlPath = window.location.hash;
    const comingFromPayment = url.includes('payment=success') || urlPath.includes('payment=success');
    
    if (!comingFromPayment && !this.driverService.hasCompletedPayment()) {
      // Show error message to user
      this.snackBar.open('Please complete payment for a product before selecting a driver.', 'OK', {
        duration: 4000,
        panelClass: ['error-notification']
      });
      return;
    }
    
    // Ensure we have a transaction reference
    const txRef = this.ensureTransactionReference();
    const storedProductId = localStorage.getItem('selected_product_id');
    
    console.log('Product ID from localStorage:', storedProductId);
    console.log('Transaction reference:', txRef);
    
    // Make API call to select driver
    this.driverService.selectDriver(Number(driver.id)).subscribe({
      next: (response) => {
        console.log('Driver selection API response:', response);
        
        // Show success message
        if (driver && driver.username) {
          // For users from payment page - show green centered message
          if (this.paymentSuccess) {
            this.createSuccessOverlay(`Driver ${driver.username} selected successfully!`, true);
          } else {
            // Regular success message
            this.createSuccessOverlay(`Driver ${driver.username} selected successfully!`);
          }
          
          console.log('Showing driver selection success message for: ' + driver.username);
        }
      },
      error: (error) => {
        console.error('Error selecting driver:', error);
        this.snackBar.open('Error selecting driver. Please try again.', 'OK', {
          duration: 4000,
          panelClass: ['error-notification']
        });
      }
    });
    
    // Set loading to false
    this.loading = false;
  }
  
  /**
   * Create a success overlay with animation using direct DOM manipulation
   */
  private createSuccessOverlay(message: string, isGreen = false): void {
    // Check if payment is verified before showing success message
    if (!this.driverService.hasCompletedPayment()) {
      console.log('Cannot show success message - payment not verified');
      return;
    }

    // Check if we already have an overlay visible (prevent duplicates)
    const existingOverlay = document.querySelector('.driver-success-overlay');
    if (existingOverlay) {
      console.log('Success overlay already exists, not creating another one');
      return;
    }

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.classList.add('driver-success-overlay'); // Add class for easy identification
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    
    // Create message box - bigger and more visually striking for payment success
    const messageBox = document.createElement('div');
    messageBox.style.backgroundColor = this.paymentSuccess ? '#2ecc71' : '#3f51b5'; // Green for payment success, blue for regular
    messageBox.style.color = 'white';
    messageBox.style.padding = this.paymentSuccess ? '40px' : '30px';
    messageBox.style.borderRadius = '10px';
    messageBox.style.textAlign = 'center';
    messageBox.style.maxWidth = '80%';
    messageBox.style.transform = 'scale(0.8)';
    messageBox.style.transition = 'transform 0.3s ease-in-out';
    messageBox.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    
    // Create check icon
    const icon = document.createElement('div');
    icon.innerHTML = '✓';
    icon.style.fontSize = this.paymentSuccess ? '90px' : '70px';
    icon.style.marginBottom = '20px';
    
    // Create message text
    const text = document.createElement('div');
    text.innerHTML = message;
    text.style.fontSize = this.paymentSuccess ? '28px' : '24px';
    text.style.fontWeight = 'bold';
    
    // Add extra message for payment success
    if (this.paymentSuccess) {
      const subText = document.createElement('div');
      subText.innerHTML = 'Your payment was successful and driver has been assigned!';
      subText.style.fontSize = '18px';
      subText.style.marginTop = '15px';
      subText.style.opacity = '0.9';
      messageBox.appendChild(icon);
      messageBox.appendChild(text);
      messageBox.appendChild(subText);
    } else {
      // Regular success message
      messageBox.appendChild(icon);
      messageBox.appendChild(text);
    }
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    
    // Force reflow and animate in
    setTimeout(() => {
      overlay.style.opacity = '1';
      messageBox.style.transform = 'scale(1)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      overlay.style.opacity = '0';
      messageBox.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }, 5000);
  }
  
  /**
   * Check for product details in localStorage and set selected_product_id if needed
   */
  checkStoredProductDetails(): void {
    // Check if product ID is missing but we have product details
    if (!localStorage.getItem('selected_product_id')) {
      console.log('Product ID not found in localStorage, checking for product details...');
      
      // Check if we have product details in localStorage
      const productDetails = localStorage.getItem('last_product_checkout');
      if (productDetails) {
        try {
          const product = JSON.parse(productDetails);
          if (product && product.id) {
            localStorage.setItem('selected_product_id', product.id.toString());
            console.log('Retrieved product ID from stored details:', product.id);
          }
        } catch (e) {
          console.error('Error parsing stored product details:', e);
        }
      }
    }
  }

  /**
   * Creates a transaction reference if none exists in localStorage
   * This ensures we always have a reference ID for the backend
   */
  private ensureTransactionReference(): string {
    // Check if we already have a transaction reference
    let txRef = localStorage.getItem('transaction_reference');
    
    // If we have a tx_ref in the URL, use that (from Chapa payment)
    if (window.location.href.includes('tx_ref=')) {
      const urlHash = window.location.hash;
      const fragmentAndQuery = urlHash.split('#')[1] || '';
      
      if (fragmentAndQuery.includes('?')) {
        const queryString = fragmentAndQuery.split('?')[1] || '';
        const urlTxRef = this.extractParamFromQueryString(queryString, 'tx_ref');
        
        if (urlTxRef) {
          // Extract just the transaction reference part (sometimes it comes with additional params)
          const cleanTxRef = urlTxRef.split(';')[0].trim();
          console.log('Using transaction reference from URL:', cleanTxRef);
          localStorage.setItem('transaction_reference', cleanTxRef);
          return cleanTxRef;
        }
      }
    }
    
    // If no transaction reference exists, create one
    if (!txRef) {
      // Generate a random transaction reference
      const timestamp = new Date().getTime();
      const randomNum = Math.floor(Math.random() * 10000);
      txRef = `TX-${timestamp}-${randomNum}`;
      
      // Store it for future use
      localStorage.setItem('transaction_reference', txRef);
      console.log('Generated transaction reference:', txRef);
    }
    
    return txRef;
  }
}
