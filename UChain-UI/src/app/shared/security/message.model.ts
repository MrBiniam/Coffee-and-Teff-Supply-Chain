/**
 * Message model representing chat messages between users
 */
export interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
}
