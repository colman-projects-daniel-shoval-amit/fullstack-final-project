export interface Post {
  _id: string;
  title: string;
  authorId: string | { _id: string; email: string };
  text: string;
  image?: string;
  commentsCount: number;
  likesCount: number;
  topics?: (string | { _id: string; name: string })[];
  summary?: string;
}

export interface Comment {
  _id: string;
  postId: string;
  authorId: string;
  content: string;
}

export interface Like {
  _id: string;
  postId: string;
  userId: string;
}

export interface User {
  _id: string;
  email: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  avatar?: string;
  interests: { _id: string; name: string; slug: string }[];
  following: User[];
  followers: User[];
}

export interface RecommendedUser {
  _id: string;
  email: string;
}

export interface Message {
  _id: string;
  senderId: string;
  chatId: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  _id: string;
  title: string;
  participants: string[];
  messages?: Message[];
}
