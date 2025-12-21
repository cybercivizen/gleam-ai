export type Message = {
  username: string;
  content: string;
  timestamp: string;
  isNew?: boolean;
};

export type MessagingEvent = {
  senderId: string;
  timestamp: number;
  message: string;
};
