import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Order } from './order.model';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User } from 'src/app/shared/security/user';

@Injectable()
export class OrderService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<Order[]> = new BehaviorSubject<Order[]>([]);
  constructor(private httpClient: HttpClient, private tokenStorage: TokenStorageService) { }
  get data(): Order[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData
  }
  getMyOrder() {
    const getMyProductUrl = environment.apiUrl + 'orders';
    console.log('Fetching orders from:', getMyProductUrl);
    return this.httpClient.get<Order[]>(getMyProductUrl)
      .pipe(
        map(orders => {
          console.log('Raw orders from API:', orders);
          if (Array.isArray(orders)) {
            return [...orders].sort((a, b) => b.id - a.id).map(order => {
              // Clean quantity field to remove transaction IDs
              order = this.cleanQuantityField(order);
              
              // Using the correct API endpoints for getting user information
              
              // For seller information
              if (order.product && order.product[0] && order.product[0].seller) {
                // The correct endpoint is 'user/{id}' not 'users/{id}'
                this.httpClient.get<any>(environment.apiUrl + 'user/' + order.product[0].seller)
                  .subscribe(
                    user => {
                      console.log('Seller user data:', user);
                      // Check different potential name fields in the response
                      if (user.username) {
                        order.seller_name = user.username;
                        order.seller_username = user.username;
                      } else if (user.user && user.user.username) {
                        // Handle nested user object
                        order.seller_name = user.user.username;
                        order.seller_username = user.user.username;
                      }
                    },
                    error => {
                      console.error('Error fetching seller data:', error);
                      // Set fallback username for the profile image
                      order.seller_username = 'default';
                    }
                  );
              }
              
              // For buyer information
              if (order.buyer) {
                // Try both possible formats - direct user ID and seller-specific endpoint
                this.httpClient.get<any>(environment.apiUrl + 'user/' + order.buyer)
                  .subscribe(
                    user => {
                      console.log('Buyer user data:', user);
                      // Handle different response formats
                      if (user.username) {
                        order.buyer_name = user.username;
                        order.buyer_username = user.username;
                      } else if (user.user && user.user.username) {
                        order.buyer_name = user.user.username;
                        order.buyer_username = user.user.username;
                      }
                    },
                    error => {
                      console.error('Error fetching buyer data from user endpoint:', error);
                      
                      // Try the buyer-specific endpoint as fallback
                      this.httpClient.get<any>(environment.apiUrl + 'buyer/' + order.buyer)
                        .subscribe(
                          user => {
                            console.log('Buyer data from buyer endpoint:', user);
                            if (user.username) {
                              order.buyer_name = user.username;
                              order.buyer_username = user.username;
                            } else if (user.user && user.user.username) {
                              order.buyer_name = user.user.username;
                              order.buyer_username = user.user.username;
                            }
                          },
                          error => {
                            console.error('Error fetching buyer from buyer endpoint:', error);
                            // Set fallback username for the profile image
                            order.buyer_username = 'default';
                          }
                        );
                    }
                  );
              }
              
              // For driver information
              if (order.driver) {
                // Try the specific driver endpoint first
                this.httpClient.get<any>(environment.apiUrl + 'driver/' + order.driver)
                  .subscribe(
                    driverData => {
                      console.log('Driver user data from driver endpoint:', driverData);
                      // The driver endpoint returns {user: id, license_number: '...', car_model: '...'}
                      // We need to fetch the actual user data using the user ID
                      if (driverData.user) {
                        // First set a temp name from what we have
                        order.driver_name = 'Driver #' + driverData.user;
                        
                        // Then fetch the actual user data
                        this.httpClient.get<any>(environment.apiUrl + 'user/' + driverData.user)
                          .subscribe(
                            userData => {
                              console.log('Driver user details:', userData);
                              if (userData.username) {
                                order.driver_name = userData.username;
                                order.driver_username = userData.username;
                              }
                            },
                            error => {
                              console.error('Error fetching driver user details:', error);
                              order.driver_username = 'default';
                            }
                          );
                      } else {
                        // Handle case where driver data doesn't have a user ID
                        order.driver_name = 'Driver';
                        order.driver_username = 'default';
                      }
                    },
                    error => {
                      console.error('Error fetching driver data from driver endpoint:', error);
                      // Try the generic user endpoint as fallback
                      this.httpClient.get<any>(environment.apiUrl + 'user/' + order.driver)
                        .subscribe(
                          userData => {
                            console.log('Driver data from user endpoint:', userData);
                            if (userData.username) {
                              order.driver_name = userData.username;
                              order.driver_username = userData.username;
                            } else if (userData.user && userData.user.username) {
                              order.driver_name = userData.user.username;
                              order.driver_username = userData.user.username;
                            }
                          },
                          error => {
                            console.error('Error fetching driver from user endpoint:', error);
                            order.driver_username = 'default';
                          }
                        );
                    }
                  );
              }
              
              return order;
            });
          }
          return orders;
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            console.error('Orders endpoint not found. Please check API configuration:', error);
          } else if (error.status === 500) {
            console.error('Server error when fetching orders. The server might be down or there might be an error in the API:', error);
          } else if (error.status === 401) {
            console.error('Unauthorized access to orders. Please check authentication:', error);
          } else {
            console.error('Error fetching orders:', error);
          }
          return of([]);  // Return empty array on error
        })
      );
  }

  /**
   * Helper method to clean quantity fields from transaction IDs
   */
  cleanQuantityField(order: any): any {
    if (!order) return order;
    
    // Clean the main quantity field if it exists
    if (order.quantity && typeof order.quantity === 'string') {
      // Remove transaction ID pattern [TX:*] from quantity
      if (order.quantity.includes('[TX:')) {
        console.log(`Cleaning quantity field: "${order.quantity}"`);
        order.quantity = order.quantity.split('[')[0].trim();
        console.log(`Cleaned quantity: "${order.quantity}"`);
      }
    }
    
    // Also check if there's a quantity inside the product array
    if (order.product && Array.isArray(order.product)) {
      order.product.forEach(prod => {
        if (prod.quantity && typeof prod.quantity === 'string') {
          if (prod.quantity.includes('[TX:')) {
            console.log(`Cleaning product quantity field: "${prod.quantity}"`);
            prod.quantity = prod.quantity.split('[')[0].trim();
            console.log(`Cleaned product quantity: "${prod.quantity}"`);
          }
        }
      });
    }
    
    return order;
  }

  // Method to get all orders (for demonstration purposes)
  getAllOrders() {
    console.log('Getting all orders for demonstration...');
    // Use the regular orders endpoint directly since 'all-orders' might not exist
    const ordersUrl = environment.apiUrl + 'orders';
    console.log('Fetching all orders from:', ordersUrl);
    
    // Don't use custom headers as they cause CORS issues
    return this.httpClient.get<Order[]>(ordersUrl)
      .pipe(
        map(orders => {
          console.log('Raw all orders from API:', orders);
          // Sort orders by newest first (assuming higher IDs are newer)
          if (Array.isArray(orders)) {
            return [...orders].sort((a, b) => b.id - a.id);
          }
          return orders;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching all orders:', error);
          return of([]); // Return empty array on error
        })
      );
  }

  getOneOrder(id) {
    const getOneProductUrl = environment.apiUrl + 'order/' + id;
    return this.httpClient.get<Order>(getOneProductUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  editOrder(data, id): Observable<string> {
    const addProductUrl = environment.apiUrl + 'order/' + id + '/update';
    return this.httpClient.put<string>(addProductUrl, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error editing order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  deleteOrder(id) {
    const deleteProductUrl = environment.apiUrl + 'order/' + id + '/destroy';
    return this.httpClient.delete(deleteProductUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error deleting order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  addOrder(data): Observable<string> {
    const addOrderUrl = environment.apiUrl + 'order/create';
    return this.httpClient.post<string>(addOrderUrl, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error adding order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  deliverOrder(data): Observable<string> {
    const deliverOrderUrl = environment.apiUrl + 'rate/';
    return this.httpClient.post<string>(deliverOrderUrl, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error delivering order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  getOneUser(id) {
    const getOneUserUrl = environment.apiUrl + 'user/' + id;
    console.log(`Fetching user data from: ${getOneUserUrl} for buyer ID: ${id}`);
    return this.httpClient.get<User>(getOneUserUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`Error fetching user with ID ${id}:`, error);
          return of(null);  // Return null on error
        })
      );
  }

  // New specialized method for driver assignments
  assignDriverToOrder(orderId: number, driverId: number): Observable<any> {
    console.log(`Assigning driver ID ${driverId} to order ID ${orderId}`);
    
    // Get the current order to preserve all fields
    return this.getOneOrder(orderId).pipe(
      switchMap(order => {
        if (!order) {
          console.error('Failed to fetch order for driver assignment');
          return of(null);
        }

        // Create payload for driver assignment
        // The key issue is to ensure the status remains appropriate for driver visibility
        const payload = {
          driver: driverId,
          // Ensure status is 'Pending' which is needed for driver visibility
          status: 'Pending',
          // Preserve other important fields
          quantity: order.quantity
        };

        console.log('Driver assignment payload:', payload);
        
        // Update the order with the driver assignment
        const updateUrl = environment.apiUrl + 'order/' + orderId + '/update';
        return this.httpClient.put(updateUrl, payload).pipe(
          map(response => {
            console.log('Driver assignment successful:', response);
            return response;
          }),
          catchError(error => {
            console.error('Error assigning driver:', error);
            return of(null);
          })
        );
      }),
      catchError(error => {
        console.error('Error in driver assignment process:', error);
        return of(null);
      })
    );
  }

  // Method to update order status (for seller/driver acceptance)
  updateOrderStatus(id: number, status: string, acceptedById: number) {
    // First, fetch the order details to ensure all required fields are included in the update request
    const getOrderUrl = environment.apiUrl + 'order/' + id;
    console.log(`Fetching order ${id} for status update to '${status}'`);
    
    return this.httpClient.get<Order>(getOrderUrl)
      .pipe(
        switchMap(order => {
          if (!order) {
            console.error('Order not found:', id);
            return of(null); // Return null if order not found
          }

          console.log('Original order data:', order);
          
          // IMPORTANT: Make first letter uppercase to match Django convention
          const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
          
          // Create a payload with the required fields from the original order
          const payload = {
            quantity: order.quantity,
            status: formattedStatus, // Use properly capitalized status
            accepted_by: acceptedById,
            seller_accepted: formattedStatus === 'Accepted' ? true : false
          };

          console.log('Updating order status with payload:', payload);

          // Use the correct API endpoint based on the URLs defined in Django backend
          const updateOrderUrl = environment.apiUrl + 'order/' + id + '/update';

          return this.httpClient.put(updateOrderUrl, payload)
            .pipe(
              map(response => {
                console.log('Order update successful! Response:', response);
                
                // Verify the response has the correct status
                if (response && response['status'] !== formattedStatus) {
                  console.warn(`Warning: Server returned status "${response['status']}" but we expected "${formattedStatus}"`);
                }
                
                return response;
              }),
              catchError((error: HttpErrorResponse) => {
                console.error('Error updating order status:', error);
                // If the primary endpoint fails, try alternative endpoints as fallbacks
                if (error.status === 404) {
                  console.log('Primary endpoint not found, trying alternatives...');
                  // Try the first alternative endpoint
                  return this.httpClient.put(environment.apiUrl + 'orders/' + id, payload)
                    .pipe(
                      map(response => {
                        console.log('Order update successful via alternative endpoint! Response:', response);
                        return response;
                      }),
                      catchError((innerError) => {
                        console.error('First alternative endpoint failed:', innerError);
                        // Try one more alternative format as last resort
                        return this.httpClient.put(environment.apiUrl + 'order/' + id, payload)
                          .pipe(
                            map(response => {
                              console.log('Order update successful via second alternative endpoint! Response:', response);
                              return response;
                            })
                          );
                      })
                    );
                }
                throw error;
              })
            );
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching order for update:', error);
          return of(null); // Return null on error
        })
      );
  }
}
