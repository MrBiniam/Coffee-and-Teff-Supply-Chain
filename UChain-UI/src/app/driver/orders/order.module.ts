import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OrderRoutingModule } from './order-routing.module';
import { OrderComponent } from './order/order.component';
import { OrderProfileComponent } from './order-profile/order-profile.component';
import { FormDialogComponent } from './dialog/form-dialog/form-dialog.component';
import { DeleteComponent } from './dialog/delete/delete.component';
import { AcceptedOrderComponent } from './accepted_order/accepted_order/accepted_order.component';
import { AcceptedOrderProfileComponent } from './accepted_order/accepted_order_profile/accepted_order-profile.component';
import { ShipOrderComponent } from './accepted_order/ship_order/ship_order.component';
import { ShippedOrderComponent } from './shipped_order/shipped_order/shipped_order.component';
import { DeliveredOrderComponent } from './delivered_order/delivered_order/delivered_order.component';
import { DeliveredOrderProfileComponent } from './delivered_order/delivered_order_profile/delivered_order-profile.component';
import { FixOrderStatusComponent } from '../orders/fix-order-status.component';
import { PendingOrderModule } from './pending_order/pending_order.module';

@NgModule({
  declarations: [
    OrderComponent,
    OrderProfileComponent,
    FormDialogComponent,
    DeleteComponent,
    AcceptedOrderComponent,
    AcceptedOrderProfileComponent,
    ShipOrderComponent,
    ShippedOrderComponent,
    DeliveredOrderComponent,
    DeliveredOrderProfileComponent,
    FixOrderStatusComponent,
  ],
  
  imports: [
    CommonModule,
    OrderRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSortModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatSelectModule,
    MatRadioModule,
    MatMenuModule,
    MatCheckboxModule,
    PendingOrderModule,
  ],
})
export class OrderModule {}