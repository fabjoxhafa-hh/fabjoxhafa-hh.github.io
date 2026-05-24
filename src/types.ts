export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  profilePhoto?: string; // base64 or generated placeholder URL
  studyProgram: string;
  yearOfStudy: number;
  bio?: string;
  skills: string[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  joinDate: string;
}

export interface Post {
  id: string;
  type: 'project' | 'idea';
  title: string;
  description: string;
  images: string[]; // array of base64 images
  tags: string[];
  createdAt: string;
  authorId: string;
  likesCount: number;
  likedBy: string[]; // user IDs of users who liked the post
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'like' | 'collaborate';
  senderId: string;
  postId?: string;
  message?: string;
  createdAt: string;
  read: boolean;
}

export interface CITEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  link: string;
}
