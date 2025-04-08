import { DOCUMENT } from '@angular/common';
import {
  Component,
  Inject,
  ElementRef,
  OnInit,
  Renderer2,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { RightSidebarService } from '../../shared/services/rightsidebar.service';
import { ConfigService } from '../../shared/services/config.service';
import { AuthService } from 'src/app/shared/security/auth.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
const document: any = window.document;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass', './notification.styles.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  public config: any = {};
  userImg: string;
  homePage: string;
  isNavbarCollapsed = true;
  unreadCount: number = 0;
  private refreshSubscription: Subscription;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    public elementRef: ElementRef,
    private dataService: RightSidebarService,
    private configService: ConfigService,
    private authService: AuthService,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private notificationService: NotificationService
  ) {}

  username = this.tokenStorage.getUsername();
  notifications: any[] = [];
  ngOnInit() {
    this.config = this.configService.configData;
    this.userImg = this.authService.getUserImg();
    const userRole = this.authService.getRole();

    if (userRole === 'BUYER') {
      this.homePage = 'admin/dashboard/main';
    } else if (userRole === 'DRIVER') {
      this.homePage = 'patient/dashboard';
    } else if (userRole === 'SELLER') {
      this.homePage = 'doctor/dashboard';
    } else {
      this.homePage = 'admin/dashboard/main';
    }
    
    // Subscribe to unread count
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    // Subscribe to notifications from service
    this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      },
      error => {
        console.error('Error in notifications subscription', error);
      }
    );
    
    // Set up polling for notifications every 15 seconds
    this.refreshSubscription = interval(15000).pipe(
      startWith(0)
    ).subscribe(() => {
      this.notificationService.refreshNotifications();
    });
  }

  ngAfterViewInit() {
    // set theme on startup
    if (localStorage.getItem('theme')) {
      this.renderer.removeClass(this.document.body, this.config.layout.variant);
      this.renderer.addClass(this.document.body, localStorage.getItem('theme'));
    } else {
      this.renderer.addClass(this.document.body, this.config.layout.variant);
    }

    if (localStorage.getItem('menuOption')) {
      this.renderer.addClass(
        this.document.body,
        localStorage.getItem('menuOption')
      );
    } else {
      this.renderer.addClass(
        this.document.body,
        'menu_' + this.config.layout.sidebar.backgroundColor
      );
    }

    if (localStorage.getItem('choose_logoheader')) {
      this.renderer.addClass(
        this.document.body,
        localStorage.getItem('choose_logoheader')
      );
    } else {
      this.renderer.addClass(
        this.document.body,
        'logo-' + this.config.layout.logo_bg_color
      );
    }

    if (localStorage.getItem('sidebar_status')) {
      if (localStorage.getItem('sidebar_status') === 'close') {
        this.renderer.addClass(this.document.body, 'side-closed');
        this.renderer.addClass(this.document.body, 'submenu-closed');
      } else {
        this.renderer.removeClass(this.document.body, 'side-closed');
        this.renderer.removeClass(this.document.body, 'submenu-closed');
      }
    } else {
      if (this.config.layout.sidebar.collapsed === true) {
        this.renderer.addClass(this.document.body, 'side-closed');
        this.renderer.addClass(this.document.body, 'submenu-closed');
      }
    }
  }
  callFullscreen() {
    if (
      !document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }
  mobileMenuSidebarOpen(event: any, className: string) {
    const hasClass = event.target.classList.contains(className);
    if (hasClass) {
      this.renderer.removeClass(this.document.body, className);
    } else {
      this.renderer.addClass(this.document.body, className);
    }
  }
  callSidemenuCollapse() {
    const hasClass = this.document.body.classList.contains('side-closed');
    if (hasClass) {
      this.renderer.removeClass(this.document.body, 'side-closed');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
    } else {
      this.renderer.addClass(this.document.body, 'side-closed');
      this.renderer.addClass(this.document.body, 'submenu-closed');
    }
  }
  public toggleRightSidebar(): void {
    this.dataService.changeMsg(
      (this.dataService.currentStatus._isScalar = !this.dataService
        .currentStatus._isScalar)
    );
  }
  logout() {
    this.authService.logout().subscribe((res) => {
      if (!res.success) {
        this.router.navigate(['/authentication/signin']);
      }
    });
  }
  
  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications = this.notifications.map(notification => {
        return { ...notification, is_read: true };
      });
    });
  }
  
  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe();
  }
  
  getNotificationIcon(type: string): string {
    switch(type) {
      case 'order_placed': return 'add_shopping_cart';
      case 'order_accepted': return 'check_circle';
      case 'driver_assigned': return 'person';
      case 'order_shipped': return 'local_shipping';
      case 'order_delivered': return 'done_all';
      case 'message_received': return 'chat';
      default: return 'notifications';
    }
  }
  
  getNotificationTime(createdAt: string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} days ago`;
    }
  }
}
