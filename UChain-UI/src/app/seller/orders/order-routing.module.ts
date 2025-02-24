import { OrderProfileComponent } from './order-profile/order-profile.component';
import { Page404Component } from '../../authentication/page404/page404.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderComponent } from './order/order.component';
import { AcceptedOrderComponent } from './accepted_order/accepted_order/accepted_order.component';
import { AcceptedOrderProfileComponent } from './accepted_order/accepted_order_profile/accepted_order-profile.component';
import { ShippedOrderProfileComponent } from './shipped_order/shipped_order_profile/shipped_order-profile.component';
import { ShippedOrderComponent } from './shipped_order/shipped_order/shipped_order.component';
import { DeliveredOrderProfileComponent } from './delivered_order/delivered_order_profile/delivered_order-profile.component';
import { DeliveredOrderComponent } from './delivered_order/delivered_order/delivered_order.component';

const routes: Routes = [
  {
    path: 'order',
    component: OrderComponent,
  },
  {
    path: 'accepted_order',
    component: AcceptedOrderComponent,
  },
  {
    path: 'accepted_order_profile/:id',
    component: AcceptedOrderProfileComponent,
  },
  {
    path: 'shipped_order',
    component: ShippedOrderComponent,
  },
  {
    path: 'shipped_order_profile/:id',
    component: ShippedOrderProfileComponent,
  },
  {
    path: 'delivered_order',
    component: DeliveredOrderComponent,
  },
  {
    path: 'delivered_order_profile/:id',
    component: DeliveredOrderProfileComponent,
  },
  {
    path: 'order-profile/:id',
    component: OrderProfileComponent,
  },
  { path: '**', component: Page404Component },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderRoutingModule {}
