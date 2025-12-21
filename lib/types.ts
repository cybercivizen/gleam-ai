export type Message = {
  username: string;
  content: string;
  timestamp: string;
};

export type MessagingEvent = {
  senderId: string;
  timestamp: number;
  message: string;
};
