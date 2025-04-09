import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleConfirmComponent } from './simple-confirm/simple-confirm.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UChainHomesModule } from './uchain-homes/uchain-homes.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    SimpleConfirmComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    UChainHomesModule,
    RouterModule
  ],
  exports: [
    SimpleConfirmComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    UChainHomesModule
  ],
  entryComponents: [
    SimpleConfirmComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {}
