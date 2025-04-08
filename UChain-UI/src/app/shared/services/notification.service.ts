import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  
  constructor(private http: HttpClient) {
    this.loadUnreadCount();
    this.loadNotifications();
  }
  
  /**
   * Get all notifications for current user
   */
  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
      })
    );
  }
  
  /**
   * Get notifications as an observable that components can subscribe to
   */
  get notifications$(): Observable<any[]> {
    return this.notificationsSubject.asObservable();
  }
  
  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread_count/`).pipe(
      tap(response => {
        this.unreadCountSubject.next(response.count);
      })
    );
  }
  
  /**
   * Observable for unread count that components can subscribe to
   */
  get unreadCount$(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }
  
  /**
   * Mark a specific notification as read
   */
  markAsRead(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/`, { is_read: true }).pipe(
      tap(() => {
        this.loadUnreadCount();
        this.loadNotifications();
        
        // Update the local cache immediately for instant UI feedback
        const currentNotifications = this.notificationsSubject.getValue();
        const updatedNotifications = currentNotifications.map(notification => {
          if (notification.id === id) {
            return { ...notification, is_read: true };
          }
          return notification;
        });
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mark_all_read/`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
        
        // Update the local cache immediately for instant UI feedback
        const currentNotifications = this.notificationsSubject.getValue();
        const updatedNotifications = currentNotifications.map(notification => {
          return { ...notification, is_read: true };
        });
        this.notificationsSubject.next(updatedNotifications);
        
        // Refresh from server to ensure sync
        this.loadNotifications();
      })
    );
  }
  
  /**
   * Load unread count
   */
  private loadUnreadCount() {
    this.getUnreadCount().subscribe(
      () => {},
      error => console.error('Error fetching notification count:', error)
    );
  }
  
  /**
   * Load notifications
   */
  private loadNotifications() {
    this.getNotifications().subscribe(
      () => {},
      error => console.error('Error fetching notifications:', error)
    );
  }
  
  /**
   * Manually refresh notifications with immediate and delayed refresh
   * Call this after actions that might create notifications
   */
  refreshNotifications() {
    // Immediate refresh
    this.loadUnreadCount();
    this.loadNotifications();
    
    // Secondary refresh after 3 seconds to catch any delayed backend updates
    timer(3000).subscribe(() => {
      this.loadUnreadCount();
      this.loadNotifications();
    });
  }
}
