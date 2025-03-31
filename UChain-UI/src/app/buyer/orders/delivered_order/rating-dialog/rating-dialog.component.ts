import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../order.service';

@Component({
  selector: 'app-rating-dialog',
  templateUrl: './rating-dialog.component.html',
  styleUrls: ['./rating-dialog.component.sass']
})
export class RatingDialogComponent implements OnInit {
  ratingForm: FormGroup;
  title: string;
  subTitle: string;
  targetType: string; // 'seller' or 'driver'

  constructor(
    public dialogRef: MatDialogRef<RatingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {
    this.title = data.title || 'Rate Your Experience';
    this.subTitle = data.subTitle || 'Please provide your rating and feedback';
    this.targetType = data.targetType || 'seller';
    this.ratingForm = this.createRatingForm();
  }

  ngOnInit(): void {
  }

  createRatingForm(): FormGroup {
    return this.fb.group({
      rating: ['', [Validators.required]],
      comment: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.ratingForm.invalid) {
      return;
    }

    const ratingData = {
      order_id: this.data.order.id,
      rating: this.ratingForm.value.rating,
      comment: this.ratingForm.value.comment,
      target_type: this.targetType
    };

    // Here you would typically call a service method to submit the rating
    // For now, we'll simulate a successful submission
    console.log('Submitting rating:', ratingData);
    
    // In a real implementation, you would have:
    // this.orderService.submitRating(ratingData).subscribe(...)
    
    this.showNotification(
      'snackbar-success',
      `Thank you for your feedback! Your rating has been submitted.`,
      'bottom',
      'center'
    );
    
    this.dialogRef.close(true);
  }

  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, '', {
      duration: 3000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}
