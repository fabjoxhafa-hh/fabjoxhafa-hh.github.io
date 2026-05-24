import { User, Post, Comment, Message, ConnectionRequest, Notification, CITEvent } from '../types';

const KEYS = {
  USERS: 'cit_connect_users',
  POSTS: 'cit_connect_posts',
  COMMENTS: 'cit_connect_comments',
  MESSAGES: 'cit_connect_messages',
  CONNECTION_REQUESTS: 'cit_connect_connection_requests',
  NOTIFICATIONS: 'cit_connect_notifications',
};

// Seed events since they are University community events, not user accounts
export const DEFAULT_EVENTS: CITEvent[] = [
  {
    id: 'e1',
    title: 'CIT Open Day 2026',
    date: 'May 28, 2026',
    description: 'Explore our campus, meet academic staff, and discover study programs first-hand.',
    link: 'https://cit.edu.al/cit-open-day/'
  },
  {
    id: 'e2',
    title: 'International Conference on Tech Innovation',
    date: 'June 17, 2026',
    description: 'Join global researchers and tech leaders discussing the future of AI and Software Systems.',
    link: 'https://cit.edu.al/scientific-conference/'
  },
  {
    id: 'e3',
    title: 'Annual Student Senate Elections',
    date: 'June 05, 2026',
    description: 'Cast your vote or run to represent your peers in the CIT Student Senate.',
    link: 'https://cit.edu.al/'
  },
  {
    id: 'e4',
    title: 'Venture Capital Startup Pitch',
    date: 'July 10, 2026',
    description: 'Present your technology projects to top regional investors and get direct feedback.',
    link: 'https://cit.edu.al/'
  }
];

// Helper to secure reading from localStorage
function get<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

// Helper to write to localStorage
function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

// USERS
export function getUsers(): User[] {
  return get<User[]>(KEYS.USERS, []);
}

export function saveUsers(users: User[]): void {
  set(KEYS.USERS, users);
}

export function addUser(user: User): void {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function deleteUserFromStorage(userId: string): void {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
  
  // Clean up user's posts, comments, likes, messages, connection requests, notifications
  const posts = getPosts().filter(p => p.authorId !== userId);
  // Remove likes from other posts
  const updatedPosts = posts.map(p => {
    if (p.likedBy.includes(userId)) {
      return {
        ...p,
        likesCount: Math.max(0, p.likesCount - 1),
        likedBy: p.likedBy.filter(id => id !== userId)
      };
    }
    return p;
  });
  savePosts(updatedPosts);

  const comments = getComments().filter(c => c.authorId !== userId);
  saveComments(comments);

  const messages = getMessages().filter(m => m.senderId !== userId && m.receiverId !== userId);
  saveMessages(messages);

  const requests = getConnectionRequests().filter(r => r.senderId !== userId && r.receiverId !== userId);
  saveConnectionRequests(requests);

  const notifications = getNotifications().filter(n => n.userId !== userId && n.senderId !== userId);
  saveNotifications(notifications);
}

// POSTS
export function getPosts(): Post[] {
  return get<Post[]>(KEYS.POSTS, []);
}

export function savePosts(posts: Post[]): void {
  set(KEYS.POSTS, posts);
}

export function addPost(post: Post): void {
  const posts = getPosts();
  posts.unshift(post); // newest first
  savePosts(posts);
}

// COMMENTS
export function getComments(): Comment[] {
  return get<Comment[]>(KEYS.COMMENTS, []);
}

export function saveComments(comments: Comment[]): void {
  set(KEYS.COMMENTS, comments);
}

export function addComment(comment: Comment): void {
  const comments = getComments();
  comments.push(comment);
  saveComments(comments);
}

// MESSAGES
export function getMessages(): Message[] {
  return get<Message[]>(KEYS.MESSAGES, []);
}

export function saveMessages(messages: Message[]): void {
  set(KEYS.MESSAGES, messages);
}

export function addMessage(message: Message): void {
  const messages = getMessages();
  messages.push(message);
  saveMessages(messages);
}

// CONNECTION REQUESTS
export function getConnectionRequests(): ConnectionRequest[] {
  return get<ConnectionRequest[]>(KEYS.CONNECTION_REQUESTS, []);
}

export function saveConnectionRequests(requests: ConnectionRequest[]): void {
  set(KEYS.CONNECTION_REQUESTS, requests);
}

export function addConnectionRequest(req: ConnectionRequest): void {
  const requests = getConnectionRequests();
  requests.push(req);
  saveConnectionRequests(requests);
}

// NOTIFICATIONS
export function getNotifications(): Notification[] {
  return get<Notification[]>(KEYS.NOTIFICATIONS, []);
}

export function saveNotifications(notifications: Notification[]): void {
  set(KEYS.NOTIFICATIONS, notifications);
}

export function addNotification(notif: Notification): void {
  const notifs = getNotifications();
  notifs.unshift(notif); // newest first
  saveNotifications(notifs);
}
