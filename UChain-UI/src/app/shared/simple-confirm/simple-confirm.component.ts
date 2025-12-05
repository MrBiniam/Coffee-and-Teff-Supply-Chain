import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-simple-confirm',
    template: `
    <div class="confirm-dialog">
      <h2>{{data.title || 'Confirm'}}</h2>
      
      <div class="content">
        <p>{{data.message || 'Are you sure?'}}</p>
      </div>
      
      <div class="actions">
        <button class="cancel-btn" (click)="dialogRef.close(false)">
          {{data.cancelButtonText || 'No'}}
        </button>
        <button class="confirm-btn" (click)="dialogRef.close(true)">
          {{data.confirmButtonText || 'Yes'}}
        </button>
      </div>
      
      <button class="close-btn" (click)="dialogRef.close(false)">
        <span style="color: #4CAF50; font-size: 24px; font-weight: bold;">×</span>
      </button>
    </div>
  `,
    styles: [`
    .confirm-dialog {
      position: relative;
      padding: 20px;
      min-width: 300px;
    }
    h2 {
      color: #3f51b5;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin: 16px 0;
      font-size: 16px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .cancel-btn {
      padding: 8px 16px;
      margin-right: 8px;
      background: none;
      border: none;
      cursor: pointer;
    }
    .confirm-btn {
      padding: 8px 16px;
      background: linear-gradient(45deg, #3f51b5, #7986cb);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .close-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 30px;
      height: 30px;
      background: none;
      border: none;
      cursor: pointer;
    }
  `],
    standalone: false
})
export class SimpleConfirmComponent {
  constructor(
    public dialogRef: MatDialogRef<SimpleConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
