import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
    private tokenStorage: TokenStorageService
  ) { }

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
   * Clear payment status - use this when testing or when a new session begins
   */
  clearPaymentStatus(): void {
    localStorage.removeItem('payment_completed');
    localStorage.removeItem('transaction_reference');
    localStorage.removeItem('last_payment_info');
    console.log('Payment status cleared - user must complete a new payment');
  }

  /**
   * Check if user has payment info from previous page
   */
  hasCompletedPayment(): boolean {
    // First check if we have a URL parameter to clear payment (for testing)
    if (window.location.search.includes('clear_payment=true')) {
      this.clearPaymentStatus();
      return false;
    }
    
    // Check first in localStorage
    const storedPaymentState = localStorage.getItem('payment_completed');
    if (storedPaymentState === 'true') {
      console.log('✓ Payment verified: Found stored payment_completed=true');
      return true;
    }
    
    // Also check for transaction reference (simplest check)
    const txRef = localStorage.getItem('transaction_reference');
    if (txRef) {
      console.log('✓ Payment verified: Found transaction reference');
      // Automatically set payment as completed if transaction reference exists
      this.setPaymentCompleted();
      return true;
    }
    
    // Final fallback - check for payment info object
    const paymentInfoExists = this.checkForPaymentInfoInStorage();
    if (paymentInfoExists) {
      console.log('✓ Payment verified: Found payment info in storage');
      // Since we found payment info, update the localStorage value
      this.setPaymentCompleted();
      return true;
    }
    
    // No payment found
    console.log('✗ Payment not verified: No payment information found');
    return false;
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
   * Set payment as completed by storing in localStorage
   */
  setPaymentCompleted(): void {
    localStorage.setItem('payment_completed', 'true');
  }
  
  /**
   * Select a driver for delivery
   */
  selectDriver(driverId: string): Observable<any> {
    // First verify payment one more time to ensure it's valid
    if (!this.hasCompletedPayment()) {
      return throwError(() => new Error('Payment verification failed'));
    }
    
    // Get transaction reference from localStorage
    let txRef = localStorage.getItem('transaction_reference');
    
    // If no transaction reference exists, create one
    if (!txRef) {
      const timestamp = new Date().getTime();
      const randomNum = Math.floor(Math.random() * 10000);
      txRef = `TX-${timestamp}-${randomNum}`;
      localStorage.setItem('transaction_reference', txRef);
      console.log('Generated transaction reference:', txRef);
    }
    
    // Get product ID and tariff ID from localStorage
    const productId = localStorage.getItem('selected_product_id');
    const tariffId = localStorage.getItem('selected_tariff_id');
    
    // Create the payload - prioritize transaction reference for first-time users
    const payload: any = {
      driver_id: driverId,
      transaction_reference: txRef  // Always include transaction reference
    };
    
    // Add product_id and tariff_id if available (secondary items)
    if (productId) {
      payload.product_id = productId;
    }
    
    if (tariffId) {
      payload.tariff_id = tariffId;
    }
    
    console.log('Sending driver selection payload:', payload);
    
    // Call the API to select the driver
    return this.http.post(`${this.apiUrl}select-driver/`, payload);
  }
}
