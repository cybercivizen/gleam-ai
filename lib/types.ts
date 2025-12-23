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

export type User = {
  username: string;
  instagramId: string;
  accessToken: string;
  lastAccess?: Date;
  createdAt?: Date;
};

export type UserProfile = {
  instagramId: string;
  username: string;
  profilePictureUrl: string;
};
