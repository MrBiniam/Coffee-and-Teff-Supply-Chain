import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/security/auth.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { User } from 'src/app/shared/security/user';
import { UserService } from 'src/app/shared/security/user.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {
  registerFormSeller: FormGroup
  id = this.tokenStorageService.getId()
  user: User =  new User()
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private tokenStorageService: TokenStorageService
  ) {
    this.getUser()
    this.registerFormSeller = this.formBuilder.group({
      username: [this.user.username],
      phone_number: [this.user.phone_number, Validators.required],
      address: [this.user.address, Validators.required],
      payment_method: [this.user.payment_method, Validators.required],
      account_number: [this.user.account_number, Validators.required],
      profile_image: [this.user.profile_image, Validators.required],
      tax_number: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }
  getUser(){
    this.userService.getOneUser(this.id).subscribe(
      data=>{
        this.user = data
        console.log(this.user)
        this.registerFormSeller = this.formBuilder.group({
          username: [this.user.username],
          phone_number: [this.user.phone_number, Validators.required],
          address: [this.user.address, Validators.required],
          payment_method: [this.user.payment_method, Validators.required],
          account_number: [this.user.account_number, Validators.required],
          profile_image: [this.user.profile_image, Validators.required],
          tax_number: [data.seller_profile.tax_number,Validators.required]
        });
      },
      _=>{
        console.log("can't get user")
      }
    )
  }
  onSubmit() {
    const formData = new FormData();
      formData.append('phone_number', this.registerFormSeller.get('phone_number').value);
      formData.append('address', this.registerFormSeller.get('address').value);
      formData.append('payment_method', this.registerFormSeller.get('payment_method').value);
      formData.append('account_number', this.registerFormSeller.get('account_number').value);
      formData.append('profile_image', this.registerFormSeller.get('profile_image').value._files[0]);

      this.userService.updateUser(this.id,formData).subscribe(
        data => {
            this.showNotification(
              'snackbar-success',
              'Account Updated Successfully...!!!',
              'bottom',
              'center'
            );
            this.router.navigate(['/seller/settings']);
          },
        error => {
          console.log(error);
          this.showNotification(
            'snackbar-danger',
            'Can not Update account! Try Again...!!!',
            'bottom',
            'center'
          );
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

}
