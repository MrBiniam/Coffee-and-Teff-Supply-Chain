import { AuthGuard } from "./shared/security/auth.guard";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { Role } from "./shared/security/role";
import { Page404Component } from "./authentication/page404/page404.component";
import { AuthLayoutComponent } from "./layout/app-layout/auth-layout/auth-layout.component";
import { MainLayoutComponent } from "./layout/app-layout/main-layout/main-layout.component";
const routes: Routes = [
  {
    path: "",
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: "", redirectTo: "/authentication/signin", pathMatch: "full" },
      {
        path: "buyer",
        canActivate: [AuthGuard],
        data: {
          role: Role.BUYER,
        
        },
        loadChildren: () =>
          import("./buyer/buyer.module").then((m) => m.BuyerModule),
      },
      {
        path: "seller",
        canActivate: [AuthGuard],
        data: {
          role: Role.SELLER || Role.BUYER,
        },
        loadChildren: () =>
          import("./seller/seller.module").then((m) => m.SellerModule),
      },
      {
        path: "driver",
        canActivate: [AuthGuard],
        data: {
          role: Role.DRIVER,
        },
        loadChildren: () =>
          import("./driver/driver.module").then((m) => m.DriverModule),
      },
      {
        path: "apps",
        loadChildren: () =>
          import("./apps/apps.module").then((m) => m.AppsModule),
      },
    ],
  },
  {
    path: "authentication",
    component: AuthLayoutComponent,
    loadChildren: () =>
      import("./authentication/authentication.module").then(
        (m) => m.AuthenticationModule
      ),
  },
  { path: "**", component: Page404Component },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
