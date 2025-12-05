import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MessageService } from 'src/app/shared/security/message_service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { UserService } from 'src/app/shared/security/user.service';
import { User } from 'src/app/shared/security/user';
import { Message } from 'src/app/shared/security/message.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  hideRequiredControl = new UntypedFormControl(false);
  floatLabelControl = new UntypedFormControl('auto');
  
  // User and message properties
  users: User[] = [];
  messages: Message[] = [];
  selectedUser: User | null = null;
  content: string = '';
  messageContent: string = '';
  sender: string = '';
  username: string = '';
  image: string = '';
  isLoading: boolean = false;
  refreshInterval: any;
  usernames: string[] = [];
  isSending: boolean = false;
  initialQueryParamsChecked: boolean = false;
  lastRefreshTime: number | null = null;
  
  @ViewChild('scrollContainer') private scrollContainer: ElementRef;

  constructor(
    private messageService: MessageService,
    private tokenStorage: TokenStorageService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Check if there's a navigation event from login
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state && navigation.extras.state['fromLogin']) {
      console.log('Navigation from login detected');
    }
  }

  ngOnInit() {
    this.sender = this.tokenStorage.getUsername();
    console.log('Current user:', this.sender);
    
    // Mark the component as loading
    this.isLoading = true;
    
    // First, check if we have a token and username - if not, redirect to login
    if (!this.sender || !this.tokenStorage.getToken()) {
      console.error('No user is logged in, redirecting to login page');
      this.router.navigate(['/authentication/signin']);
      return;
    }
    
    // Check if this is a fresh login by checking the login timestamp
    const lastLoginTime = localStorage.getItem('LAST_LOGIN_TIME');
    const currentTime = new Date().getTime();
    const loginTimeThreshold = 60 * 1000; // 60 seconds in milliseconds
    
    // If login was recent (within last minute), force a full reload
    if (lastLoginTime && (currentTime - parseInt(lastLoginTime) < loginTimeThreshold)) {
      console.log('Recent login detected, forcing chat data refresh');
      // Clear any cached data and force a new load
      this.users = [];
      this.messages = [];
      // Add a small delay before loading to ensure all auth processes are complete
      setTimeout(() => {
        this.loadContacts();
      }, 500);
    } else {
      // Regular initialization for non-fresh logins
      this.loadContacts();
    }
    
    // Set up message refresh interval with smart throttling
    this.refreshInterval = setInterval(() => {
      const now = new Date().getTime();
      const lastRefreshTime = this.lastRefreshTime || 0;
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      // Only refresh if user is viewing a conversation and sufficient time has passed
      if (this.username && timeSinceLastRefresh > 3000) { // At least 3 seconds between refreshes
        this.refreshMessages(false); // Pass false to avoid showing loading spinner
        this.lastRefreshTime = now;
      }
      
      // Periodically refresh contacts list if it's empty (less frequently)
      if (this.users.length === 0 && timeSinceLastRefresh > 10000) { // 10 seconds
        this.loadContacts();
      }
    }, 5000);  // Check every 5 seconds
  }

  ngOnDestroy() {
    // Clear the interval when component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  /**
   * Scroll to the bottom of the chat container
   */
  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        const scrollElement = this.scrollContainer.nativeElement;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Get the image for a user
   * This method helps ensure we display the right profile image
   */
  getUserImage(username: string): string {
    if (!username) {
      return 'default.jpg';
    }
    
    // Try to find user data from tokenStorage for current user
    if (username === this.sender) {
      const profileImage = this.tokenStorage.getProfileImage();
      if (profileImage) {
        // Extract just the filename if it's a full path
        if (profileImage.includes('/')) {
          const pathParts = profileImage.split('/');
          return pathParts[pathParts.length - 1];
        }
        return profileImage;
      }
    }
    
    // For other users, check if we have their data
    const userObject = this.users.find(u => u.username === username);
    if (userObject && userObject.profile_image) {
      // Extract just the filename if it's a full path
      if (userObject.profile_image.includes('/')) {
        const pathParts = userObject.profile_image.split('/');
        return pathParts[pathParts.length - 1];
      }
      return userObject.profile_image;
    }
    
    // Add special case for Abrham (temporary fix)
    if (username === 'Abrham') {
      return 'abrham.jpg';
    }
    
    // Fallback to a generated filename based on username
    return username.toLowerCase() + '.jpg';
  }

  refreshMessages(showLoading: boolean = true) {
    // Clear the messages array if we're not refreshing for a specific user
    if (!this.username) {
      this.messages = [];
      this.isLoading = false;
      return;
    }
    
    // Don't flood the console with refresh messages
    console.log(`Refreshing messages for ${this.username}`);
    if (showLoading) {
      this.isLoading = true;
    }
    
    this.messageService.getMessages().subscribe(
      data => {
        // Check if we have data before processing
        if (!data || data.length === 0) {
          this.messages = [];
          this.isLoading = false;
          return;
        }

        // Filter messages to only show the conversation with the selected user
        // Using a single pass through the array for efficiency
        const filteredMessages: Message[] = [];
        for (const msg of data) {
          if ((msg.sender === this.username && msg.receiver === this.sender) || 
              (msg.sender === this.sender && msg.receiver === this.username)) {
            filteredMessages.push(msg);
          }
        }
        
        // Only sort if we have multiple messages
        if (filteredMessages.length > 1) {
          filteredMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
        }

        // Check if there are actual changes before updating the UI
        // This avoids unnecessary renders and console logs
        let messagesChanged = false;
        
        if (this.messages.length !== filteredMessages.length) {
          messagesChanged = true;
        } else {
          // Check if any of the ids don't match (new messages or edits)
          for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].id !== filteredMessages[i].id) {
              messagesChanged = true;
              break;
            }
          }
        }
        
        if (messagesChanged) {
          this.messages = filteredMessages;
          console.log(`Found ${this.messages.length} messages with ${this.username}`);
          
          // Scroll to bottom only if messages changed
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        }
        
        // Reset loading state
        this.isLoading = false;
      },
      error => {
        console.error('Error refreshing messages:', error);
        this.showNotification('snackbar-danger', 'Error loading messages', 'bottom', 'center');
        this.isLoading = false;
      }
    );
  }

  /**
   * Get messages for a specific user
   */
  getMessages(username: string, image: string = null) {
    // Skip if we're trying to load the same user we're already viewing
    if (this.username === username && this.messages.length > 0) {
      // Just scroll to bottom to ensure latest messages are visible
      this.scrollToBottom();
      return;
    }
    
    console.log(`Loading messages with ${username}`);
    
    this.username = username;
    this.image = image;
    
    // Show a small loading indicator but don't block the UI completely
    this.isLoading = true;
    
    // Find and set the selected user
    this.selectedUser = this.users.find(u => u.username === username) || null;
    
    // If we have a username but no matching user in our list, create a basic one
    if (!this.selectedUser && username) {
      this.selectedUser = new User();
      this.selectedUser.username = username;
      // Try to guess role from username
      if (username.toLowerCase().includes('sell')) {
        this.selectedUser.is_seller = true;
      } else if (username.toLowerCase().includes('driv')) {
        this.selectedUser.is_driver = true;
      } else {
        this.selectedUser.is_buyer = true;
      }
      // Process the image path if needed
      this.processUserImage(this.selectedUser);
    }
    
    // Update URL with the selected user as a query parameter without page reload
    const queryParams = { to: username };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
    
    // Refresh the messages (show loading indicator)
    this.refreshMessages(true);
  }

  /**
   * Send a "Hello" message to initiate conversation
   */
  sendHelloMessage(username: string) {
    if (!username) {
      this.showNotification('snackbar-warning', 'Please select a user to message', 'bottom', 'center');
      return;
    }
    
    // Set the selected username and then send the message
    this.username = username;
    
    const messageData = {
      content: 'Hello! I would like to chat with you.',
      receiver: username,
      timestamp: new Date()
    };
    
    this.messageService.sendMessage(messageData).subscribe(
      response => {
        // Add the message to the current conversation
        const sentMessage: Message = {
          id: Math.floor(Math.random() * 1000).toString(), // Convert to string
          content: messageData.content,
          sender: this.sender,
          receiver: username,
          timestamp: new Date().toISOString(), // Use ISO string format
          is_read: false
        } as any; // Use type assertion to bypass the is_read property check
        
        // Add to messages array
        this.messages.push(sentMessage);
        
        // Immediately refresh all messages to get the proper ID from the server
        setTimeout(() => {
          this.refreshMessages(false); // Don't show loading indicator
        }, 500);
        
        // Show success notification
        this.showNotification('snackbar-success', 'Message sent successfully', 'bottom', 'center');
        
        // Scroll to the bottom to show the new message
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error => {
        console.error('Error sending hello message:', error);
        this.showNotification('snackbar-danger', 'Error sending message', 'bottom', 'center');
      }
    );
  }

  /**
   * Legacy method for compatibility with existing code
   * Redirects to the new sendMessage method
   */
  sendMessages(username: string) {
    if (this.username !== username) {
      this.username = username;
    }
    
    // Use the content property if messageContent is empty (for backward compatibility)
    if (!this.messageContent && this.content) {
      this.messageContent = this.content;
      this.content = '';
    }
    
    this.sendMessage();
  }

  /**
   * Send a message to the currently selected user
   */
  sendMessage() {
    if (!this.messageContent.trim()) {
      return;
    }
    
    if (!this.username) {
      this.showNotification('snackbar-warning', 'Please select a user to message', 'bottom', 'center');
      return;
    }
    
    const messageData = {
      content: this.messageContent,
      receiver: this.username,
      timestamp: new Date()
    };
    
    // Show loading indicator
    this.isSending = true;
    
    this.messageService.sendMessage(messageData).subscribe(
      response => {
        // Clear the message input
        this.messageContent = '';
        
        // Add the sent message to the messages array for immediate display
        const sentMessage: Message = {
          id: Math.floor(Math.random() * 1000).toString(), // Convert to string
          content: messageData.content,
          sender: this.sender,
          receiver: this.username,
          timestamp: new Date().toISOString(), // Use ISO string format
          is_read: false
        } as any; // Use type assertion to bypass the is_read property check
        
        this.messages.push(sentMessage);
        
        // Immediately refresh all messages to get the proper ID from the server
        setTimeout(() => {
          this.refreshMessages(false); // Don't show loading indicator
        }, 500);
        
        // Reset loading state
        this.isSending = false;
        
        // Scroll to bottom to show new message
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error => {
        console.error('Error sending message:', error);
        this.showNotification('snackbar-danger', 'Error sending message', 'bottom', 'center');
        this.isSending = false;
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

  /**
   * Load contacts from messages for the current user
   */
  loadContacts() {
    // Check if we're being forced to refresh from another component
    const forceRefresh = localStorage.getItem('FORCE_CHAT_REFRESH');
    const targetUser = localStorage.getItem('CHAT_TARGET_USER');
    const refreshTime = localStorage.getItem('CHAT_REFRESH_TIME');
    
    // If force refresh was set within the last minute, handle it
    if (forceRefresh === 'true' && refreshTime) {
      const currentTime = new Date().getTime();
      const threshold = 60 * 1000; // 60 seconds
      
      if ((currentTime - parseInt(refreshTime)) < threshold) {
        console.log('Force refresh requested for chat with', targetUser);
        // Clear the flags after processing
        localStorage.removeItem('FORCE_CHAT_REFRESH');
        localStorage.removeItem('CHAT_TARGET_USER');
        localStorage.removeItem('CHAT_REFRESH_TIME');
      }
    }
    
    // Get all users who have had conversations with the current user
    this.messageService.getMessages().subscribe(
      data => {
        this.loadUsersFromMessages(data);
        
        // Check the URL for direct chat requests - only once during initialization
        if (!this.initialQueryParamsChecked) {
          this.initialQueryParamsChecked = true;
          this.route.queryParams.subscribe(params => {
            if (params['to']) {
              console.log(`Direct navigation to chat with: ${params['to']}`);
              this.getMessages(params['to'], null);
            }
          });
        }
      },
      error => {
        console.error('Error loading messages:', error);
        this.showNotification('snackbar-danger', 'Error loading messages', 'bottom', 'center');
        this.isLoading = false;
      }
    );
  }

  /**
   * Load users from messages by extracting unique usernames
   * and fetching their details
   */
  loadUsersFromMessages(data: any[]) {
    this.isLoading = false;
    this.usernames = [];
    
    if (data && data.length > 0) {
      // Extract all unique usernames from messages
      data.forEach((value) => {
        if (value.sender === this.sender) {
          if (!this.usernames.includes(value.receiver)) {
            this.usernames.push(value.receiver);
          }
        } else if (value.receiver === this.sender) {
          if (!this.usernames.includes(value.sender)) {
            this.usernames.push(value.sender);
          }
        }
      });
      
      console.log("Unique usernames extracted:", this.usernames);
      
      // Load user details for each username
      this.userService.getUsers().subscribe(
        users => {
          console.log("Users received:", users);
          this.users = [];
          
          // Process each username from messages
          this.usernames.forEach(username => {
            // Try to find matching user in the API response
            const matchingUser = users.find(user => user.username === username);
            
            if (matchingUser) {
              // Use the API response data if available
              this.processUserImage(matchingUser);
              this.users.push(matchingUser);
            } else {
              // Create a fallback user object if not found in API response
              console.log("Creating fallback user object for:", username);
              const user = new User();
              user.username = username;
              user.id = username; // Use username as ID for now
              
              // Try to determine role from username pattern (this is a fallback)
              if (username.toLowerCase().includes('sell')) {
                user.is_seller = true;
              } else if (username.toLowerCase().includes('driv')) {
                user.is_driver = true;
              } else {
                user.is_buyer = true;
              }
              
              this.processUserImage(user);
              this.users.push(user);
            }
          });
          
          console.log("Final users list:", this.users);
        },
        error => {
          console.error('Error fetching users:', error);
          
          // Fallback to creating users from usernames if API request fails
          this.usernames.forEach(username => {
            const user = new User();
            user.username = username;
            user.id = username; // Use username as ID
            
            // Try to determine role from username pattern
            if (username.toLowerCase().includes('sell')) {
              user.is_seller = true;
            } else if (username.toLowerCase().includes('driv')) {
              user.is_driver = true;
            } else {
              user.is_buyer = true;
            }
            
            this.processUserImage(user);
            this.users.push(user);
          });
        }
      );
    }
  }

  processUserImage(user: User) {
    if (user && user.profile_image) {
      // Extract just the filename if it's a full URL
      if (user.profile_image.includes('http') || user.profile_image.includes('media')) {
        // Extract the filename from the path
        const pathParts = user.profile_image.split('/');
        const fileName = pathParts[pathParts.length - 1];
        // Store just the filename for use in template
        user.imageFileName = fileName;
      } else {
        // If it's just a filename, use it directly
        user.imageFileName = user.profile_image;
      }
    } else if (user) {
      // If no image, use a default based on username or ID
      user.imageFileName = `${user.id || user.username}.jpg`;
    }
  }
}
