import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Simple confirm dialog that uses inline template and styles for better compatibility.
 * Used in order management to confirm delivery and other actions.
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2>{{data.title || 'Confirm'}}</h2>
    <div>
      <p>{{data.message || 'Are you sure?'}}</p>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <button style="margin-right: 8px;" (click)="dialogRef.close(false)">
        {{data.cancelButtonText || 'No'}}
      </button>
      <button style="background-color: #3f51b5; color: white; border: none; padding: 8px 16px;" (click)="dialogRef.close(true)">
        {{data.confirmButtonText || 'Yes'}}
      </button>
    </div>
  `,
  styles: []
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
