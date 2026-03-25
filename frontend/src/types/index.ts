export interface Post {
  _id: string;
  title: string;
  authorId: string | { _id: string; email: string };
  text: string;
  image?: string;
  commentsCount: number;
  likesCount: number;
  topics?: string[];
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
