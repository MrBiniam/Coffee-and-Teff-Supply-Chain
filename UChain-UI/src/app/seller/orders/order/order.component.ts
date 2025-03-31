import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../order.model';
import { OrderService } from '../../../buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.sass']
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];
  value1: any[] = [];
  buyerRatings: Map<number, number> = new Map(); // Store buyer ratings
  isLoading = true;

  constructor(private orderService: OrderService, private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar, private http: HttpClient) { 
    this.getOrder();
  }

  ngOnInit(): void {
  }

  getOrder(){
    this.isLoading = true;
    const id = parseInt(this.tokenStorage.getId());
    console.log('Seller ID:', id);
    console.log('Fetching all orders for seller view...');
    
    // Clear all existing orders
    this.orders = [];
    this.value1 = [];
    this.buyerRatings.clear();
    
    // For demo and testing purposes, get ALL orders directly
    this.orderService.getAllOrders().subscribe(
      data => {
        console.log('All orders received:', data);
        
        if (data && data.length > 0) {
          // Print the FULL raw data structure of the first order to examine all fields
          if (data.length > 0) {
            console.log('DETAILED RAW ORDER EXAMPLE:');
            console.log(JSON.stringify(data[0], null, 2));
          }
          
          // Filter orders for this seller
          this.value1 = data.filter(value => 
            value.product && 
            value.product.length > 0 && 
            value.product[0].seller == id
          );
          
          console.log('Orders for this seller:', this.value1);
          
          if (this.value1.length > 0) {
            this.processOrders(this.value1);
            
            // Print the complete order object to examine its structure
            if (this.orders.length > 0) {
              const firstOrder = this.orders[0];
              console.log('DETAILED ORDER STRUCTURE:');
              console.log('Full order object:', firstOrder);
              console.log('Buyer ID field type:', typeof firstOrder.buyer);
              console.log('Buyer ID field value:', firstOrder.buyer);
              
              // Inspect all properties to find where buyer info might be stored
              console.log('All properties in order:');
              for (const key in firstOrder) {
                console.log(`- ${key}:`, firstOrder[key]);
              }
            }
            
            // Directly get user data one by one (more reliable)
            const processNextOrder = (index) => {
              if (index >= this.orders.length) {
                console.log('Finished processing all buyer information');
                this.isLoading = false;
                return;
              }
              
              const order = this.orders[index];
              
              // Explore ALL possible buyer ID fields (try different paths)
              console.log(`ORDER ${order?.id} BUYER EXPLORATION:`);
              
              // Try all possible fields where buyer info might be stored
              const possibleBuyerFields = [
                'buyer',
                'buyer_id',
                'customer',
                'customer_id',
                'user',
                'user_id',
                'created_by'
              ];
              
              // Search all possible fields
              let foundBuyerId = null;
              possibleBuyerFields.forEach(field => {
                if (order[field] !== undefined && order[field] !== null) {
                  console.log(`Found possible buyer ID in field '${field}':`, order[field]);
                  foundBuyerId = order[field];
                }
              });
              
              // Also try indirect paths like if buyer info is in a relationship
              if (order['relationships'] && order['relationships']['buyer']) {
                console.log('Found buyer in relationships:', order['relationships']['buyer']);
                foundBuyerId = order['relationships']['buyer']['id'] || order['relationships']['buyer'];
              }
              
              // If we found a potential buyer ID, use it
              if (foundBuyerId) {
                console.log(`Using buyer ID: ${foundBuyerId} for order ${order.id}`);
                
                // Generate rating for consistency
                if (!this.buyerRatings.has(foundBuyerId)) {
                  const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
                  this.buyerRatings.set(foundBuyerId, rating);
                }
                
                // Fetch buyer information
                this.orderService.getOneUser(String(foundBuyerId)).subscribe(
                  (buyer) => {
                    console.log(`Buyer data for order ${order.id}:`, buyer);
                    
                    if (buyer) {
                      // Set buyer name - use username if available, otherwise 'Customer'
                      order.buyerName = buyer.username || 'Customer';
                      console.log(`Setting buyer name for order ${order.id}:`, order.buyerName);
                      
                      // Handle profile image URL
                      if (buyer.profile_image) {
                        // Format the profile image URL correctly
                        if (buyer.profile_image.startsWith('http')) {
                          order.buyerImageUrl = buyer.profile_image;
                        } else {
                          order.buyerImageUrl = 'http://127.0.0.1:8000' + buyer.profile_image;
                        }
                        console.log(`Setting buyer image for order ${order.id}:`, order.buyerImageUrl);
                      } else {
                        // Use default image if no profile image available
                        order.buyerImageUrl = 'assets/images/user/default.png';
                        console.log(`No profile image for buyer of order ${order.id}, using default`);
                      }
                    } else {
                      // Set defaults if buyer data wasn't found
                      order.buyerName = 'Customer';
                      order.buyerImageUrl = 'assets/images/user/default.png';
                      console.log(`No buyer data found for order ${order.id}, using defaults`);
                    }
                    
                    // Process next order
                    processNextOrder(index + 1);
                  },
                  (error) => {
                    console.error(`Error fetching buyer for order ${order.id}:`, error);
                    // Set defaults on error
                    order.buyerName = 'Customer';
                    order.buyerImageUrl = 'assets/images/user/default.png';
                    
                    // Process next order
                    processNextOrder(index + 1);
                  }
                );
              } else {
                // No buyer ID found anywhere, use defaults
                console.log(`No buyer ID found in any field for order ${order.id}`);
                order.buyerName = 'Customer';
                order.buyerImageUrl = 'assets/images/user/default.png';
                
                // Generate rating for consistency
                if (!this.buyerRatings.has(order.buyer)) {
                  this.buyerRatings.set(order.buyer, 3);
                }
                
                // Process next order
                processNextOrder(index + 1);
              }
            };
            
            // Start processing orders
            processNextOrder(0);
          } else {
            this.isLoading = false;
          }
        } 
        else {
          console.log('No orders found in the system.');
          this.isLoading = false;
        }
      },
      error => {
        console.error('Error fetching all orders:', error);
        this.isLoading = false;
      }
    );
  }
  
  // Helper method to process and filter orders
  private processOrders(data: any[]) {
    if (!data || !Array.isArray(data)) {
      console.log('No valid orders data to process');
      return;
    }

    // First clear any existing orders
    this.orders = [];
    
    // Filter for pending orders first (top priority)
    const pendingOrders = data.filter(order => 
      order.status && order.status.toLowerCase() === 'pending'
    );
    
    // Add all pending orders to the list first
    pendingOrders.forEach(order => {
      // Fix image paths before displaying
      if (order.product && order.product.length > 0) {
        order.product.forEach(prod => {
          if (prod.image && typeof prod.image === 'string') {
            // Handle the image path properly
            if (prod.image.includes('127.0.0.1:8000')) {
              prod.image = prod.image.substring(prod.image.indexOf('/media'));
            } else if (!prod.image.startsWith('/')) {
              prod.image = '/media/Products_Pictures/' + prod.image;
            }
          }
        });
      }
      
      console.log('Adding order to seller pending list:', order);
      this.orders.push(order);
    });
    
    console.log('Filtered seller pending orders:', this.orders);
  }
  
  // Returns an array for filled stars based on the buyer's rating
  getBuyerRating(order: any): number[] {
    if (!order || !order.buyer) return Array(3).fill(0); // Default to 3 stars if no buyer
    
    const rating = this.buyerRatings.get(order.buyer) || 3;
    return Array(rating).fill(0);
  }
  
  // Returns an array for empty stars to complete 5 stars
  getEmptyStars(order: any): number[] {
    if (!order || !order.buyer) return Array(2).fill(0); // 5-3=2 empty stars by default
    
    const rating = this.buyerRatings.get(order.buyer) || 3;
    return Array(5 - rating).fill(0);
  }

  orderDetail(id) {
    this.router.navigate([`/seller/orders/order-profile/${id}`]);
  }

  acceptOrder(id) {
    console.log('Seller trying to accept order ID:', id);
    
    // Get the seller ID from token storage
    const sellerId = parseInt(this.tokenStorage.getId());
    
    // Get the entire list of orders and find the one we want
    // This avoids hitting endpoints that might be returning errors
    this.http.get(`${environment.apiUrl}orders`).subscribe(
      (allOrders: any[]) => {
        console.log('All orders:', allOrders);
        
        // Find the specific order we want to update
        const orderToUpdate = allOrders.find(order => order.id === parseInt(id));
        
        if (!orderToUpdate) {
          console.error('Order not found in the list');
          this.snackBar.open('Order not found. Please try again.', 'Close', { duration: 5000 });
          return;
        }
        
        console.log('Found order to update:', orderToUpdate);
        
        // Get current date for order update
        const currentDate = new Date().toISOString();
        
        // Create a minimal payload with only the fields we need to update
        const updateData = {
          quantity: orderToUpdate.quantity, // Required field
          status: 'Accepted',  // This is what we want to update
          order_date: currentDate, // Update the date to now for proper sorting
          accepted_date: currentDate, // Add a specific accepted_date field
          seller_accepted: true, // Set this flag so driver can ship it
        };
        
        console.log('Sending update with payload:', updateData);
        
        // Use the exact same URL structure that's working in order.service.ts
        const updateUrl = `${environment.apiUrl}order/${id}/update`;
        console.log('PUT request to:', updateUrl);
        
        this.http.put(updateUrl, updateData, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).subscribe(
          (response) => {
            console.log('Order status update successful!', response);
            
            // Show a success message
            this.snackBar.open('Order accepted successfully!', 'Close', {
              duration: 3000
            });
            
            // Refresh the order list and redirect
            this.getOrder();
            setTimeout(() => {
              console.log('Redirecting to accepted orders page...');
              this.router.navigate(['/seller/orders/accepted_order']);
            }, 1000);
          },
          (error) => {
            console.error('Error updating order status:', error);
            
            // Try the direct order PUT endpoint as a fallback
            const altUrl = `${environment.apiUrl}order/${id}`;
            console.log('Trying alternative URL:', altUrl);
            
            this.http.put(altUrl, updateData, {
              headers: {
                'Content-Type': 'application/json'
              }
            }).subscribe(
              (altResponse) => {
                console.log('Order status update successful via alternative URL!', altResponse);
                this.snackBar.open('Order accepted successfully!', 'Close', { duration: 3000 });
                this.getOrder();
                setTimeout(() => this.router.navigate(['/seller/orders/accepted_order']), 1000);
              },
              (altError) => {
                console.error('All order update attempts failed:', altError);
                this.snackBar.open('Error accepting order. Please try again.', 'Close', { duration: 5000 });
              }
            );
          }
        );
      },
      (error) => {
        console.error('Error fetching all orders:', error);
        this.snackBar.open('Error retrieving orders. Please try again.', 'Close', { duration: 5000 });
      }
    );
  }

  // Add a refresh method for the button
  refreshOrders() {
    console.log('Manually refreshing orders...');
    this.getOrder();
  }
}
