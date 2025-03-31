import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry, timeout, switchMap } from 'rxjs/operators';
import { User } from 'src/app/shared/security/user';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private tokenService: TokenStorageService
  ) { 
  }

  /**
   * Get all drivers from the system
   */
  getAllDrivers(): Observable<User[]> {
    // Use the dedicated drivers endpoint we created in the backend
    return this.http.get<User[]>(`${this.apiUrl}user/drivers`).pipe(
      catchError(error => {
        console.error('Error fetching from driver endpoint:', error);
        
        // Fallback to filtering all users if the driver endpoint fails
        return this.http.get<User[]>(`${this.apiUrl}users`).pipe(
          map(users => users.filter(user => user.is_driver)),
          catchError(secondError => {
            console.error('Error fetching from users endpoint:', secondError);
            // Return empty array if both requests fail
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Generate a random rating between 3 and 5 stars
   */
  generateRandomRating(): number {
    // Generate a random number between 3.0 and 5.0 with one decimal place
    return Math.round((Math.random() * 2 + 3) * 10) / 10;
  }

  /**
   * Clears any stored payment status from localStorage
   */
  clearPaymentStatus(): void {
    localStorage.removeItem('payment_completed');
    localStorage.removeItem('transaction_reference');
    localStorage.removeItem('last_payment_info');
    console.log('Payment status cleared - user must complete a new payment');
  }

  /**
   * Set payment as completed - stores in localStorage with a timestamp and user ID
   * This makes the payment verification user-specific and adds a 15-second expiration
   */
  setPaymentCompleted(): void {
    // Get the current user ID
    const userId = this.tokenService.getId();
    
    if (!userId) {
      console.warn('Cannot set payment completed: No user logged in');
      return;
    }
    
    const paymentData = {
      completed: true,
      userId: userId,
      timestamp: new Date().getTime(), // Current timestamp in milliseconds
      expiresIn: 15000 // 15 seconds in milliseconds
    };
    
    localStorage.setItem('payment_completed', JSON.stringify(paymentData));
    console.log('Payment marked as completed with 15-second expiration');
  }

  /**
   * Check if user has completed payment
   * Verifies the payment is for the current user and hasn't expired
   */
  hasCompletedPayment(): boolean {
    // Get the current URL and check if coming from payment page
    const fullUrl = window.location.href;
    
    // Debug log to see URL and help with debugging
    console.log('Checking payment with URL:', fullUrl);
    
    // Check if the URL is from payment success or has payment parameters
    if (fullUrl.includes('/buyer/drivers/select-driver?payment=success') ||
        fullUrl.includes('payment=success') ||
        fullUrl.includes('/buyer/payments/success')) {
      console.log('✅ Payment verification bypassed: Coming from payment success page');
      return true;
    }
    
    // Get the current user ID
    const userId = this.tokenService.getId();
    
    if (!userId) {
      console.warn('Cannot verify payment: No user logged in');
      return false;
    }
    
    // Get payment data from localStorage
    const storedPaymentData = localStorage.getItem('payment_completed');
    if (!storedPaymentData) {
      return false;
    }
    
    try {
      // Parse the JSON data
      const paymentData = JSON.parse(storedPaymentData);
      
      // Check if payment is for current user
      if (paymentData.userId !== userId) {
        console.log('❌ Payment verification failed: Different user');
        return false;
      }
      
      // Check if payment has expired
      const currentTime = new Date().getTime();
      const expirationTime = paymentData.timestamp + paymentData.expiresIn;
      
      if (currentTime > expirationTime) {
        console.log('❌ Payment verification failed: Payment expired');
        localStorage.removeItem('payment_completed'); // Clean up expired payment
        return false;
      }
      
      console.log('✅ Payment verification passed');
      return true;
    } catch (e) {
      console.error('Error verifying payment:', e);
      return false;
    }
  }

  /**
   * Helper to check for various payment indicators in storage
   */
  private checkForPaymentInfoInStorage(): boolean {
    // Check transaction reference (should be set after successful payment)
    const txRef = localStorage.getItem('transaction_reference');
    if (txRef) {
      console.log('✓ Payment indicator found: transaction_reference');
      return true;
    }
    
    // Check for last payment info
    const paymentInfo = localStorage.getItem('last_payment_info');
    if (paymentInfo) {
      console.log('✓ Payment indicator found: last_payment_info');
      return true;
    }
    
    // Check for product ID (should be set when purchasing a product)
    const productId = localStorage.getItem('selected_product_id');
    if (productId) {
      // Only count this as payment if we also have flag indicating completion
      const paymentCompleted = localStorage.getItem('product_payment_completed');
      if (paymentCompleted === 'true') {
        console.log('✓ Payment indicator found: product_id with completed flag');
        return true;
      }
    }
    
    return false;
  }

  /**
   * Checks for payment info in localStorage
   */
  private checkForPaymentInfoInLocalStorage(): boolean {
    const paymentInfo = localStorage.getItem('payment_info');
    return !!paymentInfo;
  }

  /**
   * Select a driver and assign them to the current order
   */
  selectDriver(driverId: number): Observable<any> {
    // First verify payment one more time to ensure it's valid
    if (!this.hasCompletedPayment()) {
      return throwError(() => new Error('Payment verification failed'));
    }
    
    // Get transaction reference from localStorage
    const txRef = localStorage.getItem('transaction_reference');
    const productId = localStorage.getItem('selected_product_id');
    const tariffId = localStorage.getItem('selected_tariff_id');
    
    console.log('Driver selection parameters:', {
      driver_id: driverId,
      product_id: productId,
      transaction_ref: txRef
    });
    
    // Create the payload with full debugging information
    const payload: any = {
      driver_id: driverId,
      transaction_reference: txRef  // Always include transaction reference
    };
    
    // Get the current order ID from localStorage (added by payment success component)
    const currentOrderId = localStorage.getItem('current_order_id');
    
    // Add order_id, product_id and tariff_id if available
    if (currentOrderId) {
      console.log(`Using stored order ID from localStorage: ${currentOrderId}`);
      payload.order_id = currentOrderId;
    }
    
    if (productId) {
      payload.product_id = productId;
    }
    
    if (tariffId) {
      payload.tariff_id = tariffId;
    }
    
    console.log('Sending driver selection payload:', payload);
    
    // Call the API to select the driver with error handling
    return this.http.post(`${this.apiUrl}select-driver/`, payload)
      .pipe(
        map(response => {
          console.log('Driver selection API response:', response);
          
          // CRITICAL FIX: Ensure order has proper status by updating it
          // This is needed for the driver to see the assignment in their accepted orders page
          if (response && response['success']) {
            // Use the order ID from localStorage if available, otherwise use the API response
            const orderIdToUpdate = currentOrderId || response['order_id'];
            console.log(`Order ${orderIdToUpdate} (from ${currentOrderId ? 'localStorage' : 'API'}) assigned to driver ${response['driver_id']}, updating status to ensure driver visibility`);
            this.updateOrderStatus(orderIdToUpdate, response['driver_id']);
          }
          
          return response;
        }),
        catchError(error => {
          console.error('Driver selection API error:', error);
          if (error.status === 500) {
            console.log('Server error details:', error.error);
            // Try to extract more useful information from the error
            const errorMessage = error.error?.error || 
                               'Internal server error when selecting driver. Please try again.';
            return throwError(() => new Error(errorMessage));
          }
          return throwError(() => error);
        })
      );
  }

  private updateOrderStatus(orderId: number, driverId: number): void {
    // First, get the full order details to ensure we have all required fields
    this.http.get(`${this.apiUrl}order/${orderId}`)
      .pipe(
        switchMap(orderDetails => {
          console.log('Retrieved order details for update:', orderDetails);
          
          // Create a complete payload with all necessary fields from the original order
          // Force status to "Accepted" for the driver view while keeping it as "Pending" for buyer/seller
          const updatePayload = {
            ...orderDetails,  // Include all original fields
            driver: driverId, // Update the driver
            status: 'Accepted', // Set to "Accepted" for driver's view
            // Explicitly set these fields to ensure order is active
            delivered: false,
            delivered_date: null,
            shipped: false,
            shipped_date: null
          };
          
          console.log('Updating order with complete payload:', updatePayload);
          
          // Update the order with the complete payload
          return this.http.put(`${this.apiUrl}order/${orderId}/update`, updatePayload);
        })
      ).subscribe(
        updateResponse => {
          console.log('Order status updated to ensure driver visibility:', updateResponse);
        },
        updateError => {
          console.error('Error updating order status after driver assignment:', updateError);
        }
      );
  }
}
