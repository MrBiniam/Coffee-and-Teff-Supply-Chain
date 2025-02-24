import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/security/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  registerFormBuyer: FormGroup;
  registerFormSeller: FormGroup;
  registerFormDriver: FormGroup;
  submitted = false;
  hide = true;
  chide = true;
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit() {
    this.registerFormBuyer = this.formBuilder.group({
      username: ['', Validators.required],
      phone_number: ['', Validators.required],
      address: ['', Validators.required],
      payment_method: ['', Validators.required],
      account_number: ['', Validators.required],
      is_buyer: [true],
      password: ['', Validators.required],
      cpassword: [''],
      termcondition: [false, [Validators.requiredTrue]],
      profile_image: ['', Validators.required],
    });
    this.registerFormSeller = this.formBuilder.group({
      username: ['', Validators.required],
      phone_number: ['', Validators.required],
      address: ['', Validators.required],
      payment_method: ['', Validators.required],
      account_number: ['', Validators.required],
      is_seller: [true],
      password: ['', Validators.required],
      cpassword: [''],
      tax_number:['', Validators.required],
      termcondition: [false, [Validators.requiredTrue]],
      profile_image: ['', Validators.required],
    });
    this.registerFormDriver = this.formBuilder.group({
      username: ['', Validators.required],
      phone_number: ['', Validators.required],
      address: ['', Validators.required],
      payment_method: ['', Validators.required],
      account_number: ['', Validators.required],
      is_driver: [true],
      password: ['', Validators.required],
      cpassword: [''],
      license_number: ['', Validators.required],
      car_model:['', Validators.required],
      termcondition: [false, [Validators.requiredTrue]],
      profile_image: ['', Validators.required],
    });
  }
  tabs = ['Buyer', 'Seller', 'Driver'];
  selected = new FormControl(0);
  addTab(selectAfterAdding: boolean) {
    this.tabs.push('New');
    if (selectAfterAdding) {
      this.selected.setValue(this.tabs.length - 1);
    }
  }
  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }
  get f() {
      return this.registerFormBuyer.controls;
  }

  onSubmit(profile: string) {
    console.log(this.registerFormBuyer.controls);
    console.log(this.f.username.value);
    const formData = new FormData();
    
    if(profile=='buyer'){
      formData.append('username', this.registerFormBuyer.get('username').value);
      formData.append('password', this.registerFormBuyer.get('password').value);
      formData.append('phone_number', this.registerFormBuyer.get('phone_number').value);
      formData.append('address', this.registerFormBuyer.get('address').value);
      formData.append('payment_method', this.registerFormBuyer.get('payment_method').value);
      formData.append('account_number', this.registerFormBuyer.get('account_number').value);
      formData.append('is_buyer', this.registerFormBuyer.get('is_buyer').value);
      formData.append('profile_image', this.registerFormBuyer.get('profile_image').value._files[0]);
    }else if(profile=='seller'){
      formData.append('username', this.registerFormSeller.get('username').value);
      formData.append('password', this.registerFormSeller.get('password').value);
      formData.append('phone_number', this.registerFormSeller.get('phone_number').value);
      formData.append('address', this.registerFormSeller.get('address').value);
      formData.append('payment_method', this.registerFormSeller.get('payment_method').value);
      formData.append('account_number', this.registerFormSeller.get('account_number').value);
      formData.append('is_seller', this.registerFormSeller.get('is_seller').value);
      formData.append('tax_number',this.registerFormSeller.get('tax_number').value);
      formData.append('profile_image', this.registerFormSeller.get('profile_image').value._files[0]);
    }else{
      formData.append('username', this.registerFormDriver.get('username').value);
      formData.append('password', this.registerFormDriver.get('password').value);
      formData.append('phone_number', this.registerFormDriver.get('phone_number').value);
      formData.append('address', this.registerFormDriver.get('address').value);
      formData.append('payment_method', this.registerFormDriver.get('payment_method').value);
      formData.append('account_number', this.registerFormDriver.get('account_number').value);
      formData.append('is_driver', this.registerFormDriver.get('is_driver').value);
      formData.append('license_number',this.registerFormDriver.get('license_number').value);
      formData.append('car_model',this.registerFormDriver.get('car_model').value);
      formData.append('profile_image', this.registerFormDriver.get('profile_image').value._files[0]);
    }

      this.authService.signUp(formData, profile).subscribe(
        data => {
            this.showNotification(
              'snackbar-success',
              'Account Created Successfully...!!!',
              'bottom',
              'center'
            );
            this.router.navigate(['/authentication/signin']);
          },
        error => {
          console.log(error);
          this.showNotification(
            'snackbar-danger',
            'Can not create account! Try Again...!!!',
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
