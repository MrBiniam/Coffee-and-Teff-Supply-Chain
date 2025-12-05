import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-fix-order-status',
    template: `
    <div class="container-fluid">
      <div class="card">
        <div class="card-header">
          <h3>Fix Order Status Utility</h3>
        </div>
        <div class="card-body">
          <p>This utility updates "Pending" orders that have drivers assigned to "Accepted" status so they appear in the driver's view.</p>
          
          <div class="row mb-4">
            <div class="col-12">
              <h4>Fix All Orders</h4>
              <p>Update all "Pending" orders that have drivers assigned to "Accepted" status.</p>
              <button mat-raised-button color="primary" (click)="fixOrderStatuses()" [disabled]="isLoading">
                <span *ngIf="!isLoading">Fix All Orders</span>
                <span *ngIf="isLoading">Processing... Please wait</span>
              </button>
            </div>
          </div>
          
          <div class="row mb-4">
            <div class="col-12">
              <h4>Fix Specific Order</h4>
              <p>Fix a specific order by entering its ID below:</p>
              <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Enter Order ID" [(ngModel)]="specificOrderId">
                <div class="input-group-append">
                  <button mat-raised-button color="accent" (click)="fixSpecificOrder(specificOrderId)" [disabled]="isLoading || !specificOrderId">
                    <span *ngIf="!isLoading">Fix Order</span>
                    <span *ngIf="isLoading">Processing...</span>
                  </button>
                </div>
              </div>
              
              <div *ngIf="getCurrentOrderId()" class="alert alert-info">
                <p>
                  <strong>Found recent order ID:</strong> {{ getCurrentOrderId() }}
                  <button mat-button (click)="useCurrentOrderId()">Use This ID</button>
                </p>
              </div>
            </div>
          </div>
          
          <div *ngIf="results.length > 0" class="mt-4">
            <h3>Results:</h3>
            <ul class="list-group">
              <li *ngFor="let result of results" class="list-group-item" [ngClass]="{'list-group-item-success': result.success, 'list-group-item-danger': !result.success}">
                {{ result.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
    standalone: false
})
export class FixOrderStatusComponent implements OnInit {
  apiUrl = environment.apiUrl;
  isLoading = false;
  results: any[] = [];
  specificOrderId: string;
  localStorage: any = localStorage;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Initialize component
  }

  fixOrderStatuses(): void {
    this.isLoading = true;
    this.results = [];
    
    // First, get all orders
    this.http.get(`${this.apiUrl}orders`).subscribe(
      (orders: any[]) => {
        console.log('Retrieved all orders:', orders);
        
        // Find orders that have a driver assigned but status is not 'Accepted'
        const ordersToFix = orders.filter(order => 
          order.driver !== null && 
          order.status && 
          order.status.toLowerCase() === 'pending'
        );
        
        console.log(`Found ${ordersToFix.length} orders to fix:`, ordersToFix);
        
        if (ordersToFix.length === 0) {
          this.results.push({ success: true, message: 'No orders need to be fixed. All driver-assigned orders have correct status.' });
          this.isLoading = false;
          this.snackBar.open('No orders need fixing', 'OK', { duration: 3000 });
          return;
        }
        
        // Update each order one by one
        let fixedCount = 0;
        let errorCount = 0;
        
        ordersToFix.forEach(order => {
          // Create update payload maintaining all original fields
          const updatePayload = {
            ...order,
            status: 'Accepted',
            seller_accepted: true
          };
          
          this.http.put(`${this.apiUrl}order/${order.id}/update`, updatePayload).subscribe(
            (response: any) => {
              fixedCount++;
              this.results.push({ success: true, message: `Successfully updated order #${order.id} to "Accepted" status` });
              console.log(`Updated order ${order.id}:`, response);
              
              // Check if we're done
              this.checkIfComplete(fixedCount, errorCount, ordersToFix.length);
            },
            (error) => {
              errorCount++;
              this.results.push({ success: false, message: `Error updating order #${order.id}: ${error.message || 'Unknown error'}` });
              console.error(`Error updating order ${order.id}:`, error);
              
              // Check if we're done
              this.checkIfComplete(fixedCount, errorCount, ordersToFix.length);
            }
          );
        });
      },
      (error) => {
        console.error('Error fetching orders:', error);
        this.results.push({ success: false, message: `Error fetching orders: ${error.message || 'Unknown error'}` });
        this.isLoading = false;
        this.snackBar.open('Error fetching orders', 'OK', { duration: 3000 });
      }
    );
  }
  
  fixSpecificOrder(orderId: string) {
    if (!orderId) {
      this.snackBar.open('Please enter an order ID first', 'Close', { duration: 3000 });
      return;
    }
    
    this.isLoading = true;
    
    // Prepare the update payload
    const updatePayload = {
      status: 'Accepted', // Change order status to "Accepted"
      seller_accepted: true // Enable the Ship button for driver
    };
    
    this.http.get(`${this.apiUrl}order/${orderId}`).subscribe(
      (order: any) => {
        if (!order) {
          this.snackBar.open(`Order #${orderId} not found.`, 'Close', { duration: 3000 });
          this.isLoading = false;
          return;
        }
        
        console.log(`Fixing specific order #${orderId}:`, order);
        
        // Update the order status to Accepted
        const updatedOrder = {
          ...order,
          ...updatePayload
        };
        
        this.http.put(`${this.apiUrl}order/${order.id}/update`, updatedOrder).subscribe(
          (response: any) => {
            console.log(`Successfully fixed order #${orderId}:`, response);
            this.snackBar.open(`Order #${orderId} updated to "Accepted" status.`, 'OK', { duration: 3000 });
            this.isLoading = false;
            this.results.push({ success: true, message: `Order #${orderId} updated to "Accepted" status.` });
          },
          (error) => {
            console.error(`Error fixing order #${orderId}:`, error);
            this.snackBar.open(`Error fixing order #${orderId}. Please try again.`, 'OK', { duration: 3000 });
            this.isLoading = false;
            this.results.push({ success: false, message: `Error fixing order #${orderId}: ${error.message || 'Unknown error'}` });
          }
        );
      },
      (error) => {
        console.error(`Error fetching order #${orderId}:`, error);
        this.snackBar.open(`Error fetching order #${orderId}. Please try again.`, 'OK', { duration: 3000 });
        this.isLoading = false;
        this.results.push({ success: false, message: `Error fetching order #${orderId}: ${error.message || 'Unknown error'}` });
      }
    );
  }
  
  useCurrentOrderId() {
    this.specificOrderId = this.localStorage.getItem('current_order_id');
  }
  
  getCurrentOrderId() {
    return this.localStorage.getItem('current_order_id');
  }
  
  private checkIfComplete(fixedCount: number, errorCount: number, totalCount: number): void {
    if (fixedCount + errorCount === totalCount) {
      this.isLoading = false;
      const successMessage = `Fixed ${fixedCount} orders with ${errorCount} errors`;
      this.snackBar.open(successMessage, 'OK', { duration: 4000 });
      this.results.push({ success: true, message: `Process complete: ${successMessage}` });
    }
  }
}
