import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../order.model';
import { OrderService } from '../order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';


@Component({
  selector: 'app-product',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.sass']
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService) { }

  ngOnInit(): void {
    this.getOrder();
  }
  
  getOrder() {
    // Clear previous orders before fetching new ones
    this.orders = [];
    
    const id = parseInt(this.tokenStorage.getId());
    console.log('Fetching orders for buyer ID:', id);
    
    this.orderService.getMyOrder().subscribe(
      data => {
        console.log('All orders received:', data);
        
        data.forEach((value) => {
          if (value.buyer == id && value.status == 'Pending' && value.driver == null) {
            // Fix image paths
            if (value.product && value.product.length > 0) {
              value.product.forEach(prod => {
                if (prod.image && typeof prod.image === 'string') {
                  if (prod.image.includes('127.0.0.1:8000')) {
                    prod.image = prod.image.substring(21);
                  } else if (!prod.image.startsWith('http') && !prod.image.startsWith('/')) {
                    prod.image = '/' + prod.image;
                  }
                }
              });
            }
            
            this.orders.push(value);
          }
        });
        
        console.log('Filtered pending orders:', this.orders);
      },
      error => {
        console.error('Failed to get orders:', error);
      }
    );
  }
  
  orderDetail(id) {
    this.router.navigate([`/buyer/orders/order-profile/${id}`]);
  }
}
