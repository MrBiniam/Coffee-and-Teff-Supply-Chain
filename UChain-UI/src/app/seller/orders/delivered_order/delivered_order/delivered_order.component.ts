import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../order.model';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { OrderService } from 'src/app/buyer/orders/order.service';

@Component({
  selector: 'app-delivered_order',
  templateUrl: './delivered_order.component.html',
  styleUrls: ['./delivered_order.component.sass']
})
export class DeliveredOrderComponent implements OnInit {
  orders: Order[] = []

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar,public dialog: MatDialog) { this.getOrder()}

  ngOnInit(): void {
  }
  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    this.orders = []
    this.orderService.getMyOrder().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.driver!=null && value.product[0].seller==id && value.status=='Delivered'){
            if(value.product[0].image.includes("127.0.0.1:8000")){
              value.product[0].image = value.product[0].image.substring(21)
            }
            this.orders.push(value)
            }
          }
        );
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }
  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
  orderDetail(id) {
    this.router.navigate([`/seller/orders/delivered_order_profile/${id}`]);
  }

  getUserImageUrl(username: string, role: string): string {
    if (!username) return '';
    
    // Known user mappings with full paths
    const knownUsers: Record<string, string> = {
      'Abrham': 'abrsh_Ueota4t.jpg',
      'Eyerus': 'eyerus_eiKP4Au.jpg',
      'Habtamu': 'habtamu.jfif',
      'Abel': 'abel.jpg',
      'Biniam': 'biniam.jpg'
    };
    
    // First try: If we have a specific mapping for this user, use it
    if (knownUsers[username]) {
      return `http://127.0.0.1:8000/media/profile_images/${knownUsers[username]}`;
    }
    
    // Second try: For future users, we'll try a generic approach with the username
    return `http://127.0.0.1:8000/media/profile_images/${username.toLowerCase()}.jpg`;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    const fallbackIcon = img.nextElementSibling as HTMLElement;
    
    // Extract username from the src
    let username = '';
    const srcPath = img.src.split('/');
    const filename = srcPath[srcPath.length - 1];
    
    if (filename && filename.includes('.')) {
      username = filename.split('.')[0];
      
      // Handle special cases like abrsh_Ueota4t.jpg
      if (username.includes('_')) {
        username = username.split('_')[0];
      }
    }
    
    // Get the role from the surrounding elements
    const roleElement = img.parentElement?.nextElementSibling as HTMLElement;
    let role = 'seller';
    if (roleElement && roleElement.innerText) {
      role = roleElement.innerText.toLowerCase();
    }
    
    // Try alternative image formats - this is executed when the initial format fails
    const currentFormat = img.src.split('.').pop()?.toLowerCase() || '';
    const formats = ['jpg', 'png', 'jfif'];
    
    // Find current format index
    const currentFormatIndex = formats.indexOf(currentFormat);
    
    // If we haven't tried all formats yet
    if (currentFormatIndex < formats.length - 1) {
      // Try the next format
      const nextFormat = formats[(currentFormatIndex + 1) % formats.length];
      const newSrc = `http://127.0.0.1:8000/media/profile_images/${username.toLowerCase()}.${nextFormat}`;
      
      if (img.src !== newSrc) {
        // Try this new format
        img.src = newSrc;
        return; // Exit to let the new image load attempt work
      }
    }
    
    // If all formats fail, show the fallback icon
    if (fallbackIcon) {
      img.style.display = 'none';
      fallbackIcon.style.display = 'block';
    }
  }
}
