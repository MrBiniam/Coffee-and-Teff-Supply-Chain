import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../order.model';
import { OrderService } from '../../../buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';


@Component({
  selector: 'app-product',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.sass']
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService) { this.getOrder()}

  ngOnInit(): void {
  }
  getOrder(){
    const id = parseInt(this.tokenStorage.getId());
    this.orderService.getMyOrder().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.product[0].seller==id && value.driver==null){
            if(value.product[0].image.includes("127.0.0.1:8000")){
              value.product[0].image = value.product[0].image.substring(21)
            }
            this.orders.push(value);
          }
        });
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }
  orderDetail(id) {
    this.router.navigate([`/seller/orders/order-profile/${id}`]);
  }
}
