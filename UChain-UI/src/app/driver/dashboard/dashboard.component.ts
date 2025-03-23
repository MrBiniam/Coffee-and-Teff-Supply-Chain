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
    this.orderService.getMyOrder().subscribe(
      data => {
        if (!data || data.length === 0) {
          console.log("No orders found");
          return;
        }
        
        data.forEach((value) => {
          if (!value) {
            console.log("Invalid order item");
            return;
          }
          
          try {
            if(value.driver==null && value.status=='Pending'){
              this.newOrders+=1
            } else if(value.driver!=null && value.driver==id && value.status=='Pending'){
              this.acceptedOrders+=1
            } else if(value.driver!=null && value.driver==id && value.status=='Shipped'){
              this.shippedOrders+=1
            } else if(value.driver!=null && value.driver==id && value.status=='Delivered'){
              this.deliveredOrders+=1
            }
          } catch (error) {
            console.error("Error processing order:", error);
          }
        });
      }, 
      error => {
        console.error("Error fetching orders:", error);
      }
    );
  }
}
