import { Component, OnInit, ViewChild } from '@angular/core';
import { OrderService } from 'src/app/buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass'],
})
export class DashboardComponent implements OnInit {

  newOrders: number = 0
  availableOrders: number = 0
  acceptedOrders: number=0
  shippedOrders: number=0
  deliveredOrders: number=0
  username: string = this.tokenStorage.getUsername()
  profileImage: string = this.tokenStorage.getProfileImage()

  constructor(private orderService: OrderService,private tokenStorage: TokenStorageService) {}

  ngOnInit() {
    this.getOrder();
  }

  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    
    if (isNaN(id)) {
      console.error("Invalid driver ID - cannot retrieve orders");
      return;
    }
    
    this.orderService.getMyOrder().subscribe(
      data => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log("No orders found");
          // Set all counters to 0 when no orders exist
          this.availableOrders = 0;
          this.acceptedOrders = 0;
          this.shippedOrders = 0;
          this.deliveredOrders = 0;
          return;
        }
        
        // Reset counters before counting
        this.availableOrders = 0;
        this.acceptedOrders = 0;
        this.shippedOrders = 0;
        this.deliveredOrders = 0;
        
        console.log(`Processing orders for driver ID: ${id}`);
        
        data.forEach((value) => {
          if (!value) {
            console.log("Invalid order item");
            return;
          }
          
          try {
            // Do case-insensitive status comparison to be safe
            const status = value.status ? value.status.toLowerCase() : '';
            
            // Available orders are those that are in Pending status and assigned to THIS driver
            // This definition must match the pending_order.component.ts filter logic
            if(status === 'pending' && value.driver === id){
              this.availableOrders += 1;
              console.log(`Order #${value.id} counted as available order - assigned to this driver (${id}) but still pending`);
            } 
            // Accepted orders are assigned to this driver with Accepted status
            else if(value.driver === id && status === 'accepted'){
              this.acceptedOrders += 1;
              console.log(`Order #${value.id} counted as accepted order for driver ${id}`);
            } 
            // Shipped orders have this driver and shipped status or on_route status
            else if(value.driver === id && (status === 'shipped' || status === 'on_route')){
              this.shippedOrders += 1;
              console.log(`Order #${value.id} counted as shipped order for driver ${id} (status: ${status})`);
            } 
            // Delivered orders have this driver and delivered status
            else if(value.driver === id && status === 'delivered'){
              this.deliveredOrders += 1;
              console.log(`Order #${value.id} counted as delivered order for driver ${id}`);
            }
            // Log orders that don't fit into any category but belong to this driver
            else if (value.driver === id) {
              console.warn(`Order #${value.id} with status "${value.status}" assigned to driver ${id} not counted in any category`);
            }
          } catch (error) {
            console.error("Error processing order:", error, value);
          }
        });

        console.log('Final order counts for driver:', {
          availableOrders: this.availableOrders,
          acceptedOrders: this.acceptedOrders,
          shippedOrders: this.shippedOrders,
          deliveredOrders: this.deliveredOrders
        });
      }, 
      error => {
        console.error("Error fetching orders:", error);
      }
    );
  }
}
