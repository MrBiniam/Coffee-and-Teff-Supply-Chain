import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HashLocationStrategy, LocationStrategy } from "@angular/common";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HeaderComponent } from "./layout/header/header.component";
import { PageLoaderComponent } from "./layout/page-loader/page-loader.component";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { RightSidebarComponent } from "./layout/right-sidebar/right-sidebar.component";
import { AuthLayoutComponent } from "./layout/app-layout/auth-layout/auth-layout.component";
import { MainLayoutComponent } from "./layout/app-layout/main-layout/main-layout.component";

import { DynamicScriptLoaderService } from "./shared/services/dynamic-script-loader.service";
import { ConfigService } from "./shared/services/config.service";
import { RightSidebarService } from "./shared/services/rightsidebar.service";
import { AuthGuard } from "./shared/security/auth.guard";
import { AuthService } from "./shared/security/auth.service";
import { ProductService } from "./seller/products/product.service";
import { OrderService } from "./buyer/orders/order.service";
import { UserService } from "./shared/security/user.service";
import { MessageService } from "./shared/security/message_service";
import { httpInterceptorProviders } from "./shared/security/auth-interceptor";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatListModule } from "@angular/material/list";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";

import { TrackingModule } from './shared/tracking/tracking.module';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    PageLoaderComponent,
    SidebarComponent,
    RightSidebarComponent,
    AuthLayoutComponent,
    MainLayoutComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatButtonToggleModule,
    MatDialogModule,
    SharedModule,
    TrackingModule,
  ],
  providers: [
    httpInterceptorProviders,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    DynamicScriptLoaderService,
    ConfigService,
    RightSidebarService,
    AuthService,
    AuthGuard,
    ProductService,
    OrderService,
    UserService,
    MessageService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

