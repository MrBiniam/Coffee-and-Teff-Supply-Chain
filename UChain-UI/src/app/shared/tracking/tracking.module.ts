import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TrackingComponent } from './tracking.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    TrackingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    LeafletModule,
    MatButtonModule,
    MatIconModule
  ],
  exports: [
    TrackingComponent
  ]
})
export class TrackingModule { }
