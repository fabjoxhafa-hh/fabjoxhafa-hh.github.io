import React, { useState, useEffect, useRef } from 'react';
import { User, Post, ConnectionRequest, CITEvent, Notification } from './types';
import {
  getUsers,
  getPosts,
  savePosts,
  deleteUserFromStorage,
  DEFAULT_EVENTS,
  getNotifications,
  saveNotifications,
  getConnectionRequests,
  saveConnectionRequests
} from './utils/storage';
import Auth from './components/Auth';
import PostFormModal from './components/PostFormModal';
import NotificationsDropdown from './components/NotificationsDropdown';
import MessageTab from './components/MessageTab';
import DetailPages from './components/DetailPages';
import AdminPanel from './components/AdminPanel';

import { 
  Home, 
  Compass, 
  Briefcase, 
  Lightbulb, 
  MessageSquare, 
  Users, 
  User as UserIcon, 
  Menu, 
  X, 
  Bell, 
  Moon, 
  Sun, 
  Plus, 
  Search, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Smile,
  Heart,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  Info,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ACADEMIC_PROGRAMS = [
  'Software Engineering (BSc)',
  'Computer Engineering & IT (BSc)',
  'Artificial Intelligence and Data Science (BSc)',
  'Electronics Engineering (BSc)',
  'Robotics & Mechatronics Engineering (BSc)',
  'Telecommunication Engineering (BSc)',
  'Digital Marketing (BSc)',
  'Fintech and Investments (BSc)',
  'Business Analytics (BSc)',
  'International Finance and Economics (BSc)',
  'Business Administration & IT (BA)',
  'Software Engineering (MSc)',
  'Multimedia Design (MSc)',
  'Network & Cyber Security (MSc)',
  'Computer Engineering & Big Data (MSc)',
  'Business Administration (MBA)',
  'Finance and Banking (MSc)',
  'Accounting & Auditing (MSc)',
  'Digital Marketing (MSc)',
  'Business Information Technology (MSc)'
];

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(true);

  // App layouts / dark mode states
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('cit_dark_mode') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab navigation states
  const [activeTab, setActiveTab] = useState('Home'); // Home, Discovery, My Projects, My Ideas, Messages, Network, Profile, Detail_xxx
  const [activeDetailPostId, setActiveDetailPostId] = useState<string | null>(null);
  const [activeProfileUserId, setActiveProfileUserId] = useState<string | null>(null);

  // Core database replicas
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [conRequests, setConRequests] = useState<ConnectionRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Dynamic alerts list
  const [eventsList] = useState<CITEvent[]>(DEFAULT_EVENTS);

  // Search & Filter state variables
  const [globalSearchText, setGlobalSearchText] = useState('');
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);
  const [discoverySearchText, setDiscoverySearchText] = useState('');
  const [discoveryFilter, setDiscoveryFilter] = useState<'all' | 'peers' | 'projects' | 'ideas'>('all');

  // Popup form states
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile Edit modal
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  // Destroy dialogues
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  // Sync state with storage
  const syncData = () => {
    setUsers(getUsers());
    setPosts(getPosts());
    setConRequests(getConnectionRequests());
    const allNotifs = getNotifications();
    if (currentUser) {
      setNotifications(allNotifs.filter(n => n.userId === currentUser.id));
    }
  };

  useEffect(() => {
    // Check local session
    const savedUser = localStorage.getItem('cit_current_user');
    const savedAdmin = localStorage.getItem('cit_admin_session') === 'true';
    
    if (savedAdmin) {
      setIsAdminMode(true);
      setShowAuthPage(false);
    } else if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        // Verify user still exists in database
        const dbUsers = getUsers();
        const exists = dbUsers.find(item => item.id === u.id);
        if (exists) {
          setCurrentUser(exists);
          setShowAuthPage(false);
        } else {
          localStorage.removeItem('cit_current_user');
        }
      } catch (e) {
        localStorage.removeItem('cit_current_user');
      }
    }
    syncData();
  }, []);

  useEffect(() => {
    // Apply dark mode CSS wrapper toggling
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('cit_dark_mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('cit_dark_mode', 'false');
    }
  }, [darkMode]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthPage(false);
    setIsAdminMode(false);
    localStorage.setItem('cit_current_user', JSON.stringify(user));
    localStorage.removeItem('cit_admin_session');
    setActiveTab('Home');
    syncData();
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminMode(true);
    setShowAuthPage(false);
    localStorage.setItem('cit_admin_session', 'true');
    localStorage.removeItem('cit_current_user');
    syncData();
  };

  const logoutSession = () => {
    setCurrentUser(null);
    setIsAdminMode(false);
    setShowAuthPage(true);
    localStorage.removeItem('cit_current_user');
    localStorage.removeItem('cit_admin_session');
    setShowSignoutConfirm(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handlePostCreated = (post: Post) => {
    syncData();
    // Navigate straight to owner posts tab based on choice
    if (post.type === 'project') {
      setActiveTab('My Projects');
    } else {
      setActiveTab('My Ideas');
    }
  };

  // Connection management
  const sendConnectionRequest = (targetUserId: string) => {
    if (!currentUser) return;
    
    // Check if request already exists
    const requests = getConnectionRequests();
    const existing = requests.find(
      r => (r.senderId === currentUser.id && r.receiverId === targetUserId) ||
           (r.senderId === targetUserId && r.receiverId === currentUser.id)
    );

    if (existing) return;

    const newReq: ConnectionRequest = {
      id: 'req_' + Date.now(),
      senderId: currentUser.id,
      receiverId: targetUserId,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('en-US')
    };

    saveConnectionRequests([...requests, newReq]);
    
    // Send standard alert notification to receiver
    const newNotif: Notification = {
      id: 'notif_' + Date.now(),
      userId: targetUserId,
      type: 'connection_request',
      senderId: currentUser.id,
      message: 'sent you a connection request.',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      read: false
    };
    saveNotifications([newNotif, ...getNotifications()]);

    syncData();
  };

  const acceptConnectionRequest = (reqId: string) => {
    const requests = getConnectionRequests();
    const targetReq = requests.find(r => r.id === reqId);
    if (!targetReq) return;

    const updated = requests.map(r => {
      if (r.id === reqId) {
        return { ...r, status: 'accepted' as const };
      }
      return r;
    });
    saveConnectionRequests(updated);

    // Create confirmation alert for sender
    const newNotif: Notification = {
      id: 'notif_' + Date.now(),
      userId: targetReq.senderId,
      type: 'connection_accepted',
      senderId: targetReq.receiverId,
      message: 'accepted your connection request.',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      read: false
    };
    saveNotifications([newNotif, ...getNotifications()]);

    syncData();
  };

  const declineConnectionRequest = (reqId: string) => {
    const updated = getConnectionRequests().filter(r => r.id !== reqId);
    saveConnectionRequests(updated);
    syncData();
  };

  const cancelOutgoingRequest = (targetUserId: string) => {
    if (!currentUser) return;
    const updated = getConnectionRequests().filter(
      r => !(r.senderId === currentUser.id && r.receiverId === targetUserId && r.status === 'pending')
    );
    saveConnectionRequests(updated);
    syncData();
  };

  const removeConnection = (targetUserId: string) => {
    if (!currentUser) return;
    const updated = getConnectionRequests().filter(
      r => !(
        (r.senderId === currentUser.id && r.receiverId === targetUserId && r.status === 'accepted') ||
        (r.senderId === targetUserId && r.receiverId === currentUser.id && r.status === 'accepted')
      )
    );
    saveConnectionRequests(updated);
    syncData();
  };

  const isConnected = (targetUserId: string) => {
    if (!currentUser) return false;
    return conRequests.some(
      r => r.status === 'accepted' && 
           ((r.senderId === currentUser.id && r.receiverId === targetUserId) ||
            (r.senderId === targetUserId && r.receiverId === currentUser.id))
    );
  };

  const isPendingSent = (targetUserId: string) => {
    if (!currentUser) return false;
    return conRequests.some(
      r => r.status === 'pending' && r.senderId === currentUser.id && r.receiverId === targetUserId
    );
  };

  const isPendingReceived = (targetUserId: string) => {
    if (!currentUser) return false;
    return conRequests.some(
      r => r.status === 'pending' && r.senderId === targetUserId && r.receiverId === currentUser.id
    );
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      if (!currentUser) return;

      const allUsers = getUsers();
      const updatedUsers = allUsers.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            profilePhoto: base64Data
          };
        }
        return u;
      });

      localStorage.setItem('cit_connect_users', JSON.stringify(updatedUsers));
      const matched = updatedUsers.find(u => u.id === currentUser.id);
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('cit_current_user', JSON.stringify(matched));
      }
      syncData();
    };
    reader.readAsDataURL(file);
  };

  const handleEditProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const allUsers = getUsers();
    const updatedUsers = allUsers.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          bio: editBio,
          skills: editSkills.split(',').map(s => s.trim()).filter(s => s.length > 0),
          socialLinks: {
            linkedin: editLinkedin,
            github: editGithub,
            website: editWebsite
          }
        };
      }
      return u;
    });

    localStorage.setItem('cit_connect_users', JSON.stringify(updatedUsers));
    const matched = updatedUsers.find(u => u.id === currentUser.id);
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('cit_current_user', JSON.stringify(matched));
    }
    setShowProfileEditModal(false);
    syncData();
  };

  const handleAccountDeletion = () => {
    if (!currentUser) return;
    deleteUserFromStorage(currentUser.id);
    setShowAccountDeleteConfirm(false);
    logoutSession();
  };

  // Open Edit Modals for posts
  const openPostEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDescription(post.description);
    setShowEditModal(true);
  };

  const savePostEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    const allPosts = getPosts();
    const updated = allPosts.map(p => {
      if (p.id === editingPost.id) {
        return {
          ...p,
          title: editTitle.trim(),
          description: editDescription.trim()
        };
      }
      return p;
    });

    savePosts(updated);
    setShowEditModal(false);
    setEditingPost(null);
    syncData();
  };

  // Navigations routing helpers
  const navigateToDetail = (postId: string) => {
    setActiveDetailPostId(postId);
    setActiveTab(`Detail_${postId}`);
  };

  const navigateToProfile = (userId: string) => {
    if (currentUser && userId === currentUser.id) {
      setActiveTab('Profile');
    } else {
      setActiveProfileUserId(userId);
      setActiveTab(`Profile_${userId}`);
    }
  };

  // Unread badge count calculation
  const getUnreadNotificationsCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  // Suggestions logic: users who aren't connected yet and not current user
  const getSuggestedConnections = () => {
    if (!currentUser) return [];
    return users.filter(u => {
      if (u.id === currentUser.id) return false;
      if (isConnected(u.id)) return false;
      if (isPendingSent(u.id)) return false;
      if (isPendingReceived(u.id)) return false;
      return true;
    }).slice(0, 5);
  };

  const suggestions = getSuggestedConnections();

  // Feed section posts: display connecting posts. If empty, encourage exploring discovery
  const getFeedPosts = () => {
    if (!currentUser) return [];
    // Get list of connected user ids
    const connectedIds = conRequests
      .filter(r => r.status === 'accepted')
      .map(r => r.senderId === currentUser.id ? r.receiverId : r.senderId);

    // feed includes connected users + your own posts sorted by recent
    return posts.filter(p => connectedIds.includes(p.authorId) || p.authorId === currentUser.id);
  };

  const feedPosts = getFeedPosts();

  // Search filter across users, projects, ideas
  const getGlobalSearchResults = () => {
    if (!globalSearchText.trim()) return { users: [], posts: [] };
    const query = globalSearchText.toLowerCase();

    return {
      users: users.filter(u => u.name.toLowerCase().includes(query) || u.studyProgram.toLowerCase().includes(query)),
      posts: posts.filter(p => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.tags.some(t => t.toLowerCase().includes(query)))
    };
  };

  const globalResults = getGlobalSearchResults();

  // Discovery Filtered lists
  const getDiscoveryResults = () => {
    let resultPosts = [...posts];
    let resultPeers = [...users].filter(u => currentUser ? u.id !== currentUser.id : true);

    if (discoverySearchText.trim()) {
      const q = discoverySearchText.toLowerCase();
      resultPosts = resultPosts.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
      resultPeers = resultPeers.filter(u => u.name.toLowerCase().includes(q) || u.studyProgram.toLowerCase().includes(q));
    }

    return { posts: resultPosts, peers: resultPeers };
  };

  const discoveryResults = getDiscoveryResults();

  // Auth portal route check
  if (showAuthPage) {
    return (
      <Auth 
        onLoginSuccess={handleLoginSuccess} 
        onAdminLoginSuccess={handleAdminLoginSuccess} 
        darkMode={darkMode} 
      />
    );
  }

  // Admin Portal layout route check
  if (isAdminMode) {
    return (
      <AdminPanel 
        onLogoutAdmin={logoutSession} 
        darkMode={darkMode} 
      />
    );
  }

  // Main UI components render
  const profileToView = activeProfileUserId ? users.find(u => u.id === activeProfileUserId) : null;

  const renderFooter = (isMobile: boolean) => {
    return (
      <footer className={isMobile
        ? `w-full mt-8 px-4 py-4 border-t text-center text-[10px] text-gray-400 select-none ${
            darkMode ? 'bg-cit-dark-700/35 border-gray-800' : 'bg-gray-50/50 border-gray-150'
          }`
        : `w-full py-3 px-6 border-t text-center text-[10px] text-gray-400 select-none ${
            darkMode ? 'bg-cit-dark-500 border-gray-800' : 'bg-white border-gray-150'
          }`
      }>
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex gap-2.5 sm:gap-4 font-semibold justify-center">
            <button 
              onClick={() => { 
                setActiveTab('Terms'); 
                setActiveDetailPostId(null); 
                setActiveProfileUserId(null); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }} 
              className="hover:underline cursor-pointer"
            >
              Terms of Use
            </button>
            <button 
              onClick={() => { 
                setActiveTab('Privacy'); 
                setActiveDetailPostId(null); 
                setActiveProfileUserId(null); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }} 
              className="hover:underline cursor-pointer"
            >
              Student Privacy Policy
            </button>
            <a href="https://cit.edu.al/contacts/" target="_blank" rel="noreferrer" className="hover:underline">CIT Contacts</a>
          </div>
          <div>
            <span>© {new Date().getFullYear()} CitConnect — Canadian Institute of Technology. All Rights Reserved.</span>
            <p className="mt-1 text-gray-500 font-mono text-[9px]">
              Created in collaboration for CIT from Fabjo Xhafa and Gentian Muzhaqi
            </p>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className={`h-screen overflow-hidden flex flex-col ${darkMode ? 'cit-pattern-dark text-gray-100' : 'cit-pattern-light text-gray-800'} transition-colors duration-200`}>
      
      {/* 1. HEADER (UNIVERSALLY POLISHED HEADER) */}
      <header className={`sticky top-0 z-40 px-4 md:px-6 h-16 border-b flex items-center justify-between backdrop-blur-md ${
        darkMode ? 'bg-cit-dark-500/90 border-gray-800 text-white' : 'bg-white/90 border-gray-150 text-gray-950'
      }`}>
        
        {/* Logo and Brand Title */}
        <div className="flex items-center gap-2.5">
          <button 
            id="mobile-hamburguer-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition bg-white border border-gray-100" onClick={() => { setActiveTab('Home'); setMobileMenuOpen(false); }}>
            <img 
              src="https://lh3.googleusercontent.com/a/ACg8ocIT7NbQDdciW747F9oxMVVKtsB_SwzWIx6y4nj6U0cbzWrazqglYQ=s100-c" 
              alt="CIT Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <span 
            onClick={() => setActiveTab('Home')}
            className="font-display font-bold text-base tracking-tight cursor-pointer hover:opacity-90 hidden sm:block"
          >
            CitConnect
          </span>
        </div>

        {/* Global Search box in center */}
        <div className="relative flex-1 max-w-sm md:max-w-md mx-4 block">
          <div className="relative">
            <input
              type="text"
              id="global-search-input"
              value={globalSearchText}
              onChange={(e) => {
                setGlobalSearchText(e.target.value);
                setShowGlobalSearchResults(true);
              }}
              onFocus={() => setShowGlobalSearchResults(true)}
              placeholder="Search users, research projects, student ideas..."
              className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cit-blue-500 transition ${
                darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 shrink-0" />
            
            {globalSearchText && (
              <button 
                id="clear-global-search-btn"
                onClick={() => { setGlobalSearchText(''); setShowGlobalSearchResults(false); }}
                className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Floated Search Suggestion logs */}
          {showGlobalSearchResults && globalSearchText && (
            <div 
              onMouseLeave={() => setShowGlobalSearchResults(false)}
              className={`absolute left-0 right-0 mt-2 p-3 rounded-xl border shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1 ${
                darkMode ? 'bg-cit-dark-500 border-gray-800' : 'bg-white border-gray-200'
              }`}
            >
              <div className="space-y-4">
                {/* Users block category */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-gray-450 border-b pb-1 dark:border-gray-800 mb-1.5 flex items-center">
                    <Users className="w-3 h-3 mr-1 text-cit-blue-500" /> Classmate Peers
                  </h4>
                  {globalResults.users.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic pl-1">No classmates matched.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {globalResults.users.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => {
                            navigateToProfile(u.id);
                            setGlobalSearchText('');
                            setShowGlobalSearchResults(false);
                          }}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-850/30 cursor-pointer text-xs"
                        >
                          <img src={u.profilePhoto} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <span className="text-[9px] text-gray-400">{u.studyProgram}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Posts block */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-gray-450 border-b pb-1 dark:border-gray-800 mb-1.5 flex items-center">
                    <Briefcase className="w-3 h-3 mr-1 text-cit-red-500" /> Published Projects & Ideas
                  </h4>
                  {globalResults.posts.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic pl-1">No matching uploads.</p>
                  ) : (
                    <div className="space-y-1">
                      {globalResults.posts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            navigateToDetail(p.id);
                            setGlobalSearchText('');
                            setShowGlobalSearchResults(false);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-850/30 cursor-pointer text-xs"
                        >
                          <p className="font-bold truncate">{p.title}</p>
                          <span className={`text-[9px] capitalize ${p.type === 'project' ? 'text-cit-blue-400 font-semibold' : 'text-cit-red-400 font-semibold'}`}>
                            {p.type} model
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action button triggers & badges */}
        <div className="flex items-center gap-2.5">
          <button
            id="header-create-post-btn"
            onClick={() => setShowPostModal(true)}
            className="bg-cit-blue-500 hover:bg-cit-blue-600 text-white font-bold text-xs py-1.5 md:py-2 px-3 md:px-4 rounded-xl flex items-center gap-1 shadow-sm shrink-0 transition"
          >
            <Plus className="w-4 h-4 shrink-0 text-white" />
            <span className="hidden sm:block">Upload</span>
          </button>

          {/* Notifications bell with badge */}
          <div className="relative shrink-0">
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition ${
                showNotifications 
                  ? 'bg-cit-blue-50 dark:bg-cit-dark-600 text-cit-blue-500' 
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              {getUnreadNotificationsCount() > 0 && (
                <span id="unread-badge-count text-white" className="absolute top-1 right-1 bg-cit-red-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {getUnreadNotificationsCount()}
                </span>
              )}
            </button>

            {/* Notifications overlay panel */}
            <AnimatePresence>
              {showNotifications && currentUser && (
                <NotificationsDropdown 
                  userId={currentUser.id} 
                  darkMode={darkMode} 
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    setShowNotifications(false);
                  }}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <button
            id="header-dark-mode-btn"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 text-gray-500 hover:text-gray-705 transition shrink-0"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          </button>

          {/* Quick Signout button */}
          <button
            id="header-signout-btn"
            onClick={() => setShowSignoutConfirm(true)}
            className="p-2 rounded-xl hover:bg-red-50 hover:text-cit-red-500 dark:hover:bg-cit-red-500/10 text-gray-400 transition"
            title="Log Out Student Session"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>

      </header>

      {/* 2. BODY GENERAL CONTAINER WORKSPACE */}
      <div className="flex-1 w-full flex min-h-0 overflow-hidden">
        
        {/* A. LEFT SIDE NAVBAR (DESKTOP NAVIGATION BLOCK - FIXED) */}
        <aside className="w-64 shrink-0 border-r border-gray-150 dark:border-gray-800 p-4 space-y-6 hidden md:flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-450 dark:text-[#a1a1aa] px-3.5 mb-2 select-none">Student Portal</h3>
            
            {[
              { name: 'Home', icon: Home },
              { name: 'Discovery', icon: Compass },
              { name: 'My Projects', icon: Briefcase },
              { name: 'My Ideas', icon: Lightbulb },
              { name: 'Messages', icon: MessageSquare },
              { name: 'Network', icon: Users }
            ].map(item => {
              const Icon = item.icon;
              const matches = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  id={`nav-item-${item.name.toLowerCase().replace(' ', '-')}`}
                  onClick={() => {
                    setActiveTab(item.name);
                    setActiveProfileUserId(null);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
                    matches 
                      ? 'bg-cit-blue-500 text-white shadow-md' 
                      : 'text-gray-500 hover:text-cit-blue-500 hover:bg-cit-blue-100/15'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop profile bottom drawer block wrapper */}
          {currentUser && (
            <div 
              id="desktop-nav-profile-bottom-card"
              onClick={() => {
                setActiveTab('Profile');
                setActiveProfileUserId(null);
              }}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-855 transition ${
                activeTab === 'Profile' ? 'border-cit-blue-500 ring-2 ring-cit-blue-500/15' : 'border-gray-150 dark:border-gray-800'
              }`}
            >
              <img
                src={currentUser.profilePhoto}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-250 dark:border-gray-800"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-medium text-xs text-gray-950 dark:text-gray-100 truncate">{currentUser.name}</h4>
                <p className="text-[9px] text-gray-500 dark:text-gray-450 truncate font-medium">{currentUser.studyProgram}</p>
              </div>
            </div>
          )}

        </aside>

        {/* B. MAIN DYNAMIC WORKSPACE COMPONENT (CENTER SCROLLABLE VIEW) */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto scrollbar bg-white/20 dark:bg-cit-dark-600/10">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              
              {/* HOME TAB */}
              {activeTab === 'Home' && (
                <div id="home-tab-content" className="space-y-6">
                  {/* Small Intro Info Window */}
                  <div className="p-6 md:p-8 rounded-2xl border border-cit-blue-200/50 dark:border-gray-800 bg-linear-to-r from-cit-blue-50 to-white dark:from-cit-dark-500 dark:to-cit-dark-600 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-15">
                      <Sparkles className="w-20 h-20 text-cit-red-500 animate-pulse" />
                    </div>
                    <div className="relative max-w-lg space-y-2">
                      <div className="flex items-center gap-1 hover:scale-105 transition self-start bg-cit-red-100/50 dark:bg-cit-red-900/10 border border-cit-red-500/20 px-2.5 py-1 rounded-md text-[10px] text-cit-red-500 font-extrabold uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5" /> Official CIT Academic Social Domain
                      </div>
                      <h2 className="font-display font-extrabold text-lg md:text-xl text-gray-900 dark:text-white tracking-tight leading-tight pt-1">
                        Welcome to CitConnect, {currentUser?.name}!
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                        A custom research database crafted purely for Canadian Institute of Technology students. Post collaborative work milestones, exchange technical specifications, and network across faculties.
                      </p>
                    </div>
                  </div>

                  {/* Desktop view: Sidebar SUGGESTION layout renders on right (desktop only).
                      Mobile view: Render suggested connections straight inside dynamic tabs to fulfill specific "Right side panel content moves into scrollable tabs..." mandate! */}
                  <div className="md:hidden block space-y-4">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400">Classmate Suggestions</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar snap-x">
                      {suggestions.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No companions registered yet.</p>
                      ) : (
                        suggestions.map(peer => (
                          <div 
                            key={peer.id} 
                            className={`p-3 rounded-xl border shrink-0 w-44 snap-center ${
                              darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                            } flex flex-col items-center text-center space-y-2`}
                          >
                            <img src={peer.profilePhoto} alt={peer.name} className="w-10 h-10 rounded-full object-cover shrink-0 border" />
                            <h4 className="font-bold text-[11px] truncate w-full">{peer.name}</h4>
                            <p className="text-[9px] text-gray-500 dark:text-gray-450 truncate w-full">{peer.studyProgram}</p>
                            <button
                              id={`connect-peer-suggest-mob-${peer.id}`}
                              onClick={() => sendConnectionRequest(peer.id)}
                              className="w-full bg-cit-blue-500 text-white text-[10px] py-1 rounded-md font-bold"
                            >
                              Connect
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Interactive Connection-Filtered Feed */}
                  <div className="space-y-4">
                    <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest">Connect Students Feed</h3>

                    {feedPosts.length === 0 ? (
                      /* Empty state: Encorage navigating to discovery */
                      <div id="home-feed-empty" className={`p-8 md:p-12 text-center rounded-2xl border space-y-4 ${
                        darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                      }`}>
                        <div className="w-14 h-14 rounded-full bg-cit-blue-50 dark:bg-cit-blue-900/10 mx-auto flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-cit-blue-500 animate-bounce" />
                        </div>
                        <div className="max-w-sm mx-auto space-y-1">
                          <h4 className="font-display font-medium text-xs text-gray-800 dark:text-gray-100">No companion activity currently tracked</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                            You don't have connections yet or connected peers haven't published academic posts. Open the Discovery dashboard to connect with peers and find ideas!
                          </p>
                        </div>
                        <button
                          id="feed-empty-discover-btn"
                          onClick={() => setActiveTab('Discovery')}
                          className="bg-cit-red-500 hover:bg-cit-red-600 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow-xs"
                        >
                          Explore Discovery Tab
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {feedPosts.map(post => {
                          const author = users.find(u => u.id === post.authorId);
                          return (
                            <div 
                              key={post.id}
                              onClick={() => navigateToDetail(post.id)}
                              className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md hover:border-cit-blue-500 dark:hover:border-cit-blue-500 transition-all ${
                                darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                    post.type === 'project' ? 'bg-cit-blue-500/10 text-cit-blue-500' : 'bg-cit-red-500/10 text-cit-red-500'
                                  }`}>
                                    {post.type}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium">Shared {post.createdAt}</span>
                                </div>
                                <h4 className="font-display font-bold text-sm tracking-tight text-gray-800 dark:text-white line-clamp-2">
                                  {post.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                                  {post.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-850/80 pt-3">
                                <div className="flex items-center gap-2">
                                  <img src={author?.profilePhoto} alt={author?.name} className="w-6 h-6 rounded-full object-cover border" />
                                  <span className="text-[10px] text-gray-400">{author?.name}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                  <Heart className="w-3.5 h-3.5 fill-cit-red-500 text-cit-red-500" /> {post.likesCount}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* CIT Events section: Mobile layout moves right-side CIT events to bottom scrollable area of home or discovery! */}
                  <div className="md:hidden block space-y-4">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400">CIT Campus Events</h3>
                    <div className="space-y-3">
                      {eventsList.map(ev => (
                        <div key={ev.id} className="p-4 rounded-xl border bg-gray-50/50 dark:bg-cit-dark-500 border-gray-150 dark:border-gray-800 space-y-1">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-cit-red-500">{ev.date}</span>
                          <h4 className="font-medium text-xs">{ev.title}</h4>
                          <a href={ev.link} target="_blank" rel="noreferrer" className="text-[10px] text-cit-blue-500 dark:text-cit-blue-300 font-semibold flex items-center gap-1">
                            Link cit.edu.al <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* DISCOVERY TAB */}
              {activeTab === 'Discovery' && (
                <div id="discovery-tab-content" className="space-y-6">
                  
                  {/* Internal Tab Search and Select Filters */}
                  <div className="flex flex-col md:flex-row gap-3 items-stretch shadow-xs pb-1 shrink-0">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="discovery-tab-search"
                        value={discoverySearchText}
                        onChange={(e) => setDiscoverySearchText(e.target.value)}
                        placeholder="Search specific topics, classmate portfolios, technology tags..."
                        className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cit-blue-500 ${
                          darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-150 text-gray-800'
                        }`}
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    </div>

                    {/* Filter selector options */}
                    <div className="flex overflow-x-auto gap-1.5 p-1 bg-gray-100/50 dark:bg-cit-dark-600/50 rounded-xl">
                      {[
                        { id: 'all', label: 'All Results' },
                        { id: 'peers', label: 'Peers' },
                        { id: 'projects', label: 'Projects' },
                        { id: 'ideas', label: 'Ideas' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          id={`discovery-filter-btn-${opt.id}`}
                          onClick={() => setDiscoveryFilter(opt.id as any)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 uppercase tracking-wider text-[10px] ${
                            discoveryFilter === opt.id
                              ? 'bg-cit-blue-500 text-white shadow-xs'
                              : 'text-gray-500 hover:text-cit-blue-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Empty state conditional calculated with singular mapping for post types */}
                  {(() => {
                    const activePostType = discoveryFilter === 'projects' ? 'project' : (discoveryFilter === 'ideas' ? 'idea' : 'all');
                    const filteredDiscoveryPosts = discoveryResults.posts.filter(p => activePostType === 'all' ? true : p.type === activePostType);
                    const showEmptyState = 
                      ((discoveryFilter === 'all' || discoveryFilter === 'projects' || discoveryFilter === 'ideas') && filteredDiscoveryPosts.length === 0 && (discoveryFilter !== 'all' || discoveryResults.peers.length === 0)) ||
                      (discoveryFilter === 'peers' && discoveryResults.peers.length === 0);

                    if (showEmptyState) {
                      return (
                        <div id="discovery-empty-state" className="p-12 text-center text-gray-400">
                          <Compass className="w-10 h-10 mx-auto mb-2 text-cit-red-500 animate-spin" />
                          <p className="text-xs font-semibold">No results found matching your search. Please adjust filters.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        
                        {/* Projects & Ideas Category list */}
                        {(discoveryFilter === 'all' || discoveryFilter === 'projects' || discoveryFilter === 'ideas') && (
                          <div className="space-y-4">
                            <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest">
                              Shared Ideas & Projects ({filteredDiscoveryPosts.length})
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredDiscoveryPosts.map(p => {
                                const author = users.find(u => u.id === p.authorId);
                                return (
                                  <div
                                    key={p.id}
                                    id={`post-disc-card-${p.id}`}
                                    onClick={() => navigateToDetail(p.id)}
                                    className={`rounded-2xl border overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                                      darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250'
                                    }`}
                                  >
                                    {p.images && p.images.length > 0 && (
                                      <div className="h-44 bg-slate-900 overflow-hidden">
                                        <img referrerPolicy="no-referrer" src={p.images[0]} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition" />
                                      </div>
                                    )}
                                    <div className="p-5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                          p.type === 'project' ? 'bg-cit-blue-500/10 text-cit-blue-500' : 'bg-cit-red-500/10 text-cit-red-500'
                                        }`}>
                                          {p.type}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-semibold">{p.createdAt}</span>
                                      </div>

                                      <h4 className="font-display font-extrabold text-xs leading-snug truncate text-gray-800 dark:text-white">{p.title}</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
                                      
                                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-850/80">
                                        {author && (
                                          <div className="flex items-center gap-2">
                                            <img src={author.profilePhoto} alt={author.name} className="w-5.5 h-5.5 rounded-full object-cover border" />
                                            <span className="text-[10px] text-gray-400">{author.name}</span>
                                          </div>
                                        )}
                                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                          <Heart className="w-3 h-3 fill-cit-red-500 text-cit-red-500" /> {p.likesCount}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Peers Category list */}
                        {(discoveryFilter === 'all' || discoveryFilter === 'peers') && (
                          <div className="space-y-4">
                            <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest">
                              Classmate Directory ({discoveryResults.peers.length})
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {discoveryResults.peers.map(peer => (
                                <div
                                  key={peer.id}
                                  id={`peer-disc-card-${peer.id}`}
                                  className={`p-4 rounded-2xl border flex flex-col items-center text-center justify-between gap-4 ${
                                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                                  }`}
                                >
                                  <div className="space-y-2 cursor-pointer w-full flex flex-col items-center" onClick={() => navigateToProfile(peer.id)}>
                                    <img src={peer.profilePhoto} alt={peer.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-200" />
                                    <div>
                                      <h4 className="font-display font-extrabold text-gray-900 dark:text-white hover:underline truncate w-full text-xs">{peer.name}</h4>
                                      <p className="text-[10px] text-gray-400 font-semibold truncate w-full mt-0.5">{peer.studyProgram}</p>
                                      <p className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">Academic cohort: Yr {peer.yearOfStudy}</p>
                                    </div>
                                  </div>

                                  {/* Connection contextual action */}
                                  {isConnected(peer.id) ? (
                                    <span className="bg-cit-blue-50 dark:bg-cit-blue-500/10 text-cit-blue-500 text-[10px] font-bold px-4 py-1.5 rounded-lg border flex items-center">
                                      Connected
                                    </span>
                                  ) : isPendingSent(peer.id) ? (
                                    <button
                                      id={`cancel-request-${peer.id}`}
                                      onClick={() => cancelOutgoingRequest(peer.id)}
                                      className="border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-cit-red-500 text-[10px] font-bold px-4 py-1.5 rounded-lg transition"
                                    >
                                      Pending Cancel
                                    </button>
                                  ) : isPendingReceived(peer.id) ? (
                                    <button
                                      id={`nav-reply-req-${peer.id}`}
                                      onClick={() => setActiveTab('Network')}
                                      className="bg-cit-red-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg transition"
                                    >
                                      Accept request
                                    </button>
                                  ) : (
                                    <button
                                      id={`connect-peer-${peer.id}`}
                                      onClick={() => sendConnectionRequest(peer.id)}
                                      className="bg-cit-blue-500 hover:bg-cit-blue-600 text-white text-[10px] font-bold px-5 py-1.5 rounded-lg transition"
                                    >
                                      Connect Peer
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()}

                </div>
              )}

              {/* MY PROJECTS TAB */}
              {activeTab === 'My Projects' && (
                <div id="my-projects-tab-content" className="space-y-4">
                  <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest">My Published Projects</h3>

                  {posts.filter(p => p.authorId === currentUser?.id && p.type === 'project').length === 0 ? (
                    <div id="my-projects-empty" className="p-12 text-center text-gray-400">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-cit-blue-500 opacity-20" />
                      <p className="text-xs font-semibold">You haven't posted any projects yet.</p>
                      <button
                        id="shortcut-projects-post-btn"
                        onClick={() => setShowPostModal(true)}
                        className="bg-cit-blue-500 text-white font-bold text-xs mt-3 px-4 py-2 rounded-lg"
                      >
                        Publish Your First Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posts
                        .filter(p => p.authorId === currentUser?.id && p.type === 'project')
                        .map(p => (
                          <div 
                            key={p.id}
                            className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                              darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250'
                            }`}
                          >
                            <div className="space-y-2 cursor-pointer" onClick={() => navigateToDetail(p.id)}>
                              <span className="text-[10px] text-gray-400 font-mono">{p.createdAt}</span>
                              <h4 className="font-display font-bold text-xs text-gray-800 dark:text-white line-clamp-2">{p.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
                            </div>
                            
                            <div className="flex gap-2 justify-end border-t border-gray-100 dark:border-gray-850/80 pt-3">
                              <button
                                id={`edit-own-project-${p.id}`}
                                onClick={() => openPostEdit(p)}
                                className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                              >
                                Edit Title
                              </button>
                              <button
                                id={`delete-own-project-${p.id}`}
                                onClick={() => navigateToDetail(p.id)}
                                className="text-[10px] font-bold uppercase tracking-wider bg-red-100/15 hover:bg-cit-red-500 hover:text-white text-red-500 px-3 py-1.5 rounded-lg"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* MY IDEAS TAB */}
              {activeTab === 'My Ideas' && (
                <div id="my-ideas-tab-content" className="space-y-4">
                  <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest">My Collaborative Ideas</h3>

                  {posts.filter(p => p.authorId === currentUser?.id && p.type === 'idea').length === 0 ? (
                    <div id="my-ideas-empty" className="p-12 text-center text-gray-400">
                      <Lightbulb className="w-8 h-8 mx-auto mb-2 text-cit-red-500 opacity-20" />
                      <p className="text-xs font-semibold">You haven't posted any ideas yet.</p>
                      <button
                        id="shortcut-ideas-post-btn"
                        onClick={() => setShowPostModal(true)}
                        className="bg-cit-red-500 text-white font-bold text-xs mt-3 px-4 py-2 rounded-lg"
                      >
                        Publish Your First Idea
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posts
                        .filter(p => p.authorId === currentUser?.id && p.type === 'idea')
                        .map(p => (
                          <div 
                            key={p.id}
                            className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                              darkMode ? 'bg-cit-dark-500 border-gray-855' : 'bg-gray-150 border-gray-250'
                            }`}
                          >
                            <div className="space-y-2 cursor-pointer" onClick={() => navigateToDetail(p.id)}>
                              <span className="text-[10px] text-gray-400 font-mono">{p.createdAt}</span>
                              <h4 className="font-display font-bold text-xs text-gray-800 dark:text-white line-clamp-2">{p.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
                            </div>
                            
                            <div className="flex gap-2 justify-end border-t border-gray-100 dark:border-gray-855/80 pt-3">
                              <button
                                id={`edit-own-idea-${p.id}`}
                                onClick={() => openPostEdit(p)}
                                className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                              >
                                Edit Title
                              </button>
                              <button
                                id={`delete-own-idea-${p.id}`}
                                onClick={() => navigateToDetail(p.id)}
                                className="text-[10px] font-bold uppercase tracking-wider bg-red-100/15 hover:bg-cit-red-500 hover:text-white text-red-500 px-3 py-1.5 rounded-lg"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* MESSAGES TAB */}
              {activeTab === 'Messages' && currentUser && (
                <MessageTab 
                  currentUser={currentUser} 
                  darkMode={darkMode} 
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}

              {/* NETWORK TAB */}
              {activeTab === 'Network' && (
                <div id="network-tab-content" className="space-y-6">
                  
                  {/* Incoming Requests */}
                  <div className="space-y-3">
                    <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest flex items-center">
                      Incoming Connection Requests ({conRequests.filter(r => r.status === 'pending' && r.receiverId === currentUser?.id).length})
                    </h3>

                    {conRequests.filter(r => r.status === 'pending' && r.receiverId === currentUser?.id).length === 0 ? (
                      <div id="network-requests-empty" className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-xl border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-cit-dark-500">
                        No pending incoming requests. Share your projects with peers to foster academic connections!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {conRequests
                          .filter(r => r.status === 'pending' && r.receiverId === currentUser?.id)
                          .map(req => {
                            const sender = users.find(u => u.id === req.senderId);
                            if (!sender) return null;
                            return (
                              <div key={req.id} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                                darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <img src={sender.profilePhoto} alt={sender.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                  <div>
                                    <h5 className="font-bold text-xs">{sender.name}</h5>
                                    <p className="text-[10px] text-gray-500 leading-none">{sender.studyProgram}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 text-[10px] font-bold">
                                  <button
                                    id={`accept-request-${req.id}`}
                                    onClick={() => acceptConnectionRequest(req.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    id={`decline-request-${req.id}`}
                                    onClick={() => declineConnectionRequest(req.id)}
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-650 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Active Connections */}
                  <div className="space-y-3">
                    <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-widest flex items-center">
                      Your Connections ({conRequests.filter(r => r.status === 'accepted' && (r.senderId === currentUser?.id || r.receiverId === currentUser?.id)).length})
                    </h3>

                    {conRequests.filter(r => r.status === 'accepted' && (r.senderId === currentUser?.id || r.receiverId === currentUser?.id)).length === 0 ? (
                      <div id="network-connections-empty" className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-cit-dark-500">
                        No classmate connections established yet. Search peers in the Discovery directories!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {conRequests
                          .filter(r => r.status === 'accepted' && (r.senderId === currentUser?.id || r.receiverId === currentUser?.id))
                          .map(req => {
                            const peerId = req.senderId === currentUser?.id ? req.receiverId : req.senderId;
                            const peer = users.find(u => u.id === peerId);
                            if (!peer) return null;
                            return (
                              <div key={req.id} className={`p-4 rounded-xl border flex flex-col items-center text-center justify-between gap-3 ${
                                darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                              }`}>
                                <div className="space-y-2 cursor-pointer items-center flex flex-col" onClick={() => navigateToProfile(peer.id)}>
                                  <img src={peer.profilePhoto} alt={peer.name} className="w-12 h-12 rounded-full object-cover shrink-0 border" />
                                  <div>
                                    <h5 className="font-bold text-xs truncate hover:underline">{peer.name}</h5>
                                    <p className="text-[10px] text-gray-450 truncate">{peer.studyProgram}</p>
                                  </div>
                                </div>
                                <button
                                  id={`remove-connection-${peer.id}`}
                                  onClick={() => removeConnection(peer.id)}
                                  className="w-full bg-red-50 dark:bg-red-950/25 text-red-500 text-[10px] font-bold py-1.5 rounded-lg hover:bg-cit-red-500 hover:text-white transition"
                                >
                                  Remove Connection
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* LOGGED IN USER PROFILE TAB */}
              {activeTab === 'Profile' && currentUser && (
                <div id="logged-profile-content" className="space-y-6">
                  
                  {/* Personal card metadata */}
                  <div className={`p-6 md:p-8 rounded-2xl border ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                  } shadow-md flex flex-col sm:flex-row gap-6 justify-between items-start`}>
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <div className="relative group cursor-pointer" title="Click to change profile picture" onClick={() => pfpInputRef.current?.click()}>
                        <img 
                          src={currentUser.profilePhoto} 
                          alt={currentUser.name} 
                          className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 dark:border-cit-dark-600 shadow-md transition duration-200" 
                        />
                        <div className="absolute inset-0 bg-[#004B8D]/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Camera className="w-5 h-5 text-white" />
                          <span className="text-[8px] text-white font-bold uppercase tracking-wider mt-0.5">Change</span>
                        </div>
                        <input
                          type="file"
                          ref={pfpInputRef}
                          onChange={handleProfilePhotoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <div className="text-center sm:text-left space-y-1">
                        <h2 className="font-display font-extrabold text-lg text-gray-950 dark:text-white leading-none">{currentUser.name}</h2>
                        <p className="text-xs text-cit-blue-500 dark:text-cit-blue-300 font-bold">{currentUser.studyProgram}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">Academic cohort: Year {currentUser.yearOfStudy}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold max-w-sm pt-2">{currentUser.bio}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 self-stretch sm:self-auto text-xs">
                      <button
                        id="edit-profile-btn"
                        onClick={() => {
                          setEditBio(currentUser.bio || '');
                          setEditSkills(currentUser.skills.join(', '));
                          setEditLinkedin(currentUser.socialLinks.linkedin || '');
                          setEditGithub(currentUser.socialLinks.github || '');
                          setEditWebsite(currentUser.socialLinks.website || '');
                          setShowProfileEditModal(true);
                        }}
                        className="flex-1 sm:flex-none uppercase tracking-wider font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl transition"
                      >
                        Edit Profile
                      </button>
                      <button
                        id="delete-account-btn"
                        onClick={() => setShowAccountDeleteConfirm(true)}
                        className="flex-1 sm:flex-none uppercase tracking-wider font-bold bg-red-100/15 hover:bg-cit-red-500 hover:text-white text-red-500 px-4 py-2 rounded-xl transition font-mono"
                      >
                        Purge User
                      </button>
                    </div>
                  </div>

                  {/* Skills tags and social links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-855' : 'bg-white border-gray-150'}`}>
                      <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-gray-450 mb-3">Academic Specialties / Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.skills && currentUser.skills.length > 0 ? (
                          currentUser.skills.map(s => (
                            <span key={s} className="text-[10px] uppercase font-bold tracking-widest bg-gray-100 dark:bg-cit-dark-600 px-3 py-1 rounded-md text-gray-500">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No academic specialties registered yet. Click Edit Profile.</span>
                        )}
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-855' : 'bg-white border-gray-150'}`}>
                      <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-gray-450 mb-3">Professional Social References</h4>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-gray-400">LinkedIn:</span>
                          <span className="text-cit-blue-500 truncate max-w-sm">{currentUser.socialLinks?.linkedin || 'Not linked'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">GitHub:</span>
                          <span className="text-cit-blue-500 truncate max-w-sm">{currentUser.socialLinks?.github || 'Not linked'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Personal Website:</span>
                          <span className="text-cit-blue-500 truncate max-w-sm">{currentUser.socialLinks?.website || 'Not linked'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats list of uploader posts */}
                  <div className="space-y-4">
                    <h3 className="font-display font-extrabold text-xs text-gray-450 uppercase tracking-widest">My Published Assets</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'}`}>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Total Projects Uploaded</span>
                        <span className="font-display font-extrabold text-2xl">{posts.filter(p => p.authorId === currentUser.id && p.type === 'project').length}</span>
                      </div>
                      <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'}`}>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Total Ideas Shared</span>
                        <span className="font-display font-extrabold text-2xl">{posts.filter(p => p.authorId === currentUser.id && p.type === 'idea').length}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* OTHER USER'S PROFILE TAB */}
              {activeTab.startsWith('Profile_') && profileToView && (
                <div id="other-profile-content" className="space-y-6">
                  <button
                    id="profile-back-btn"
                    onClick={() => setActiveTab('Discovery')}
                    className="text-xs text-gray-450 hover:text-cit-blue-500 font-semibold flex items-center gap-1.5"
                  >
                    Back to classmate listing
                  </button>

                  <div className={`p-6 md:p-8 rounded-2xl border ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                  } shadow-md flex flex-col sm:flex-row gap-6 justify-between items-start`}>
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <img src={profileToView.profilePhoto} alt={profileToView.name} className="w-20 h-20 rounded-full object-cover border" />
                      <div className="text-center sm:text-left space-y-1">
                        <h2 className="font-display font-extrabold text-lg text-gray-950 dark:text-white leading-none">{profileToView.name}</h2>
                        <p className="text-xs text-cit-blue-500 dark:text-cit-blue-300 font-bold">{profileToView.studyProgram}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">Academic cohort: Year {profileToView.yearOfStudy}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold max-w-sm pt-2">{profileToView.bio}</p>
                      </div>
                    </div>

                    {/* Social connection actions */}
                    {isConnected(profileToView.id) ? (
                      <button
                        id={`remove-con-profile-${profileToView.id}`}
                        onClick={() => removeConnection(profileToView.id)}
                        className="bg-red-50 dark:bg-red-950/25 hover:bg-cit-red-500 hover:text-white text-cit-red-500 text-xs font-bold px-5 py-2.5 rounded-xl self-stretch sm:self-auto transition"
                      >
                        Remove Connection
                      </button>
                    ) : isPendingSent(profileToView.id) ? (
                      <button
                        id={`cancel-req-profile-${profileToView.id}`}
                        onClick={() => cancelOutgoingRequest(profileToView.id)}
                        className="border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-cit-red-500 text-xs font-bold px-5 py-2.5 rounded-xl self-stretch sm:self-auto transition"
                      >
                        Pending: Cancel
                      </button>
                    ) : isPendingReceived(profileToView.id) ? (
                      <button
                        id={`reply-req-profile-${profileToView.id}`}
                        onClick={() => setActiveTab('Network')}
                        className="bg-cit-red-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl self-stretch sm:self-auto transition animate-bounce"
                      >
                        View incoming request
                      </button>
                    ) : (
                      <button
                        id={`connect-profile-${profileToView.id}`}
                        onClick={() => sendConnectionRequest(profileToView.id)}
                        className="bg-cit-blue-500 hover:bg-cit-blue-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl self-stretch sm:self-auto transition"
                      >
                        Connect Peer
                      </button>
                    )}
                  </div>

                  {/* Secondary info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-855' : 'bg-white border-gray-150'}`}>
                      <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-gray-450 mb-3">Academic Specialties</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {profileToView.skills && profileToView.skills.length > 0 ? (
                          profileToView.skills.map(s => (
                            <span key={s} className="text-[10px] uppercase font-bold tracking-widest bg-gray-100 dark:bg-cit-dark-600 px-3 py-1 rounded-md text-gray-500">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No listed academic specialties.</span>
                        )}
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-855' : 'bg-white border-gray-150'}`}>
                      <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-gray-450 mb-3">Professional Social References</h4>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-gray-400">LinkedIn:</span>
                          <span className="text-cit-blue-500 truncate max-w-sm">{profileToView.socialLinks?.linkedin || 'Not linked'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">GitHub:</span>
                          <span className="text-cit-blue-500 truncate max-w-sm">{profileToView.socialLinks?.github || 'Not linked'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats list of other's posts */}
                  <div className="space-y-4">
                    <h3 className="font-display font-extrabold text-xs text-gray-450 uppercase tracking-widest">Student Upload Portfolio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posts.filter(p => p.authorId === profileToView.id).length === 0 ? (
                        <p className="md:col-span-2 text-xs italic text-gray-400 pl-1">Student has not published portfolio models yet on CitConnect.</p>
                      ) : (
                        posts
                          .filter(p => p.authorId === profileToView.id)
                          .map(p => (
                            <div 
                              key={p.id}
                              onClick={() => navigateToDetail(p.id)}
                              className={`p-4 rounded-xl border cursor-pointer hover:shadow hover:border-cit-blue-500 transition-all ${
                                darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250'
                              }`}
                            >
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-cit-blue-450">{p.type}</span>
                              <h4 className="font-bold text-xs mt-1 truncate">{p.title}</h4>
                              <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">{p.description}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* POST DETAIL PAGE INLETS (PROJECT OR IDEA DETAIL ROUTER) */}
              {activeTab.startsWith('Detail_') && activeDetailPostId && currentUser && (
                <DetailPages 
                  postId={activeDetailPostId} 
                  currentUser={currentUser} 
                  darkMode={darkMode} 
                  onBack={() => {
                    // Back to dynamic lists
                    const postType = posts.find(p => p.id === activeDetailPostId)?.type;
                    if (postType === 'project') {
                      setActiveTab('Discovery');
                    } else if (postType === 'idea') {
                      setActiveTab('Discovery');
                    } else {
                      setActiveTab('Home');
                    }
                  }} 
                  onViewProfile={navigateToProfile}
                  onPostDeleted={() => syncData()}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onOpenEditModal={(post) => openPostEdit(post)}
                />
              )}

              {/* TERMS OF USE / PERMISSIONS OF USE */}
              {activeTab === 'Terms' && (
                <div id="terms-of-use-page" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="font-display font-extrabold text-2xl tracking-tight text-gray-950 dark:text-white">
                        Permissions of Use
                      </h1>
                      <p className="text-xs text-cit-blue-500 font-bold uppercase tracking-wider mt-1">
                        CitConnect Academic Governance & Integrity Agreement
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('Home')}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-cit-blue-500 hover:bg-cit-blue-600 text-white transition shadow-md cursor-pointer"
                    >
                      Back to Home
                    </button>
                  </div>

                  <div className={`p-6 md:p-8 rounded-2xl border ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250 text-gray-955 shadow-sm'
                  } space-y-6 shadow-md`}>
                    <div className="flex items-center gap-3 border-b pb-4 border-gray-250 dark:border-gray-800">
                      <ShieldCheck className="w-6 h-6 text-cit-blue-500 shrink-0" />
                      <div>
                        <h2 className="font-display font-bold text-base leading-none">1. Scope of Student & Academic Reuse</h2>
                        <span className="text-[10px] text-gray-400 dark:text-gray-450 uppercase font-bold tracking-wider">CIT Student Union Guidelines</span>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      All academic assets, project implementations, database schematics, software designs, and resource materials uploaded on the <strong>CitConnect</strong> application space are registered under the Canadian Institute of Technology peer agreement. 
                      Students are authorized to review, suggest modifications, and establish joint collaborations for mutual academic growth.
                    </p>

                    <div className="space-y-4 pt-2">
                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-cit-blue-500 mt-2 shrink-0"></span>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">Acknowledge Shared Intellectual Ownership</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            No student user of CitConnect is empowered to download, duplicate, clone, or publish custom-engineered academic assets on third-party public software hosting repositories (e.g. GitHub, GitLab) under their sole name without appropriate attribution to the original author(s) at CIT.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-cit-blue-500 mt-2 shrink-0"></span>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">Authorized Use of Discussion Channels</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            The communication utilities, integrated peer-to-peer message boxes, and research project discussion comments are reserved strictly for genuine collaborative exchange. Spamming, advertisement, harassment, or non-educational content are strictly prohibited.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-cit-blue-500 mt-2 shrink-0"></span>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">Compliance with Academic Integrity Laws</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            Using materials discovered here to complete graded exercises, tests, examinations, or assignments without explicit instructor/faculty permission constitutes a direct violation of Canadian Institute of Technology Honor Code policies.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 md:p-8 rounded-2xl border ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250 text-gray-955 shadow-sm'
                  } space-y-4 shadow-md`}>
                    <h2 className="font-display font-bold text-sm text-gray-900 dark:text-gray-100">2. Student Liability & Platform Disclaimers</h2>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      This application is developed as part of custom peer-led initiatives. While Canadian Institute of Technology administration fully supports safe online connectivity and creative collaboration channels, the school does not assume liability for temporary downtime, peer communication disputes, or third-party hyperlinked properties. 
                      Students are advised to store critical drafts and secure software backups independently of this sandbox node.
                    </p>
                  </div>
                </div>
              )}

              {/* STUDENT PRIVACY POLICY */}
              {activeTab === 'Privacy' && (
                <div id="privacy-policy-page" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="font-display font-extrabold text-2xl tracking-tight text-gray-950 dark:text-white">
                        Student Privacy Policy
                      </h1>
                      <p className="text-xs text-cit-blue-500 font-bold uppercase tracking-wider mt-1">
                        Your Identity and Academic Footprints are Protected under Student Governance
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('Home')}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-cit-blue-500 hover:bg-cit-blue-600 text-white transition shadow-md cursor-pointer"
                    >
                      Back to Home
                    </button>
                  </div>

                  <div className={`p-6 md:p-8 rounded-2xl border ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250 text-gray-955 shadow-sm'
                  } space-y-6 shadow-md`}>
                    <div className="flex items-center gap-3 border-b pb-4 border-gray-250 dark:border-gray-800">
                      <BookOpen className="w-6 h-6 text-cit-blue-500 shrink-0" />
                      <div>
                        <h2 className="font-display font-bold text-base leading-none">1. Data Storage Model & Student Autonomy</h2>
                        <span className="text-[10px] text-gray-400 dark:text-gray-450 uppercase font-bold tracking-wider">CIT Student Privacy Framework</span>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      We believe students have an inalienable right to privacy and absolute authority over their digital information.
                      All profile settings, research specialization listings, peer-to-peer chat history, project portfolios, and visual reference metrics are managed on an offline-first storage concept.
                    </p>

                    <div className="space-y-4 pt-2">
                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-cit-blue-500 mt-2 shrink-0"></span>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">Total Erasure Rights (Purge Account)</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            Under our Student Privacy Charter, you maintain the right to instantly drop and erase your entire student record. Using the <strong>"Purge User"</strong> procedure from your active Student Portal drops authorization credentials, uploaded models, messages, academic suggestions, comments, likes, and connection listings permanently.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-cit-blue-500 mt-2 shrink-0"></span>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">Confidential Communication</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            Direct messages and connected chat logs are shared strictly between you and your trusted classmates. There is no automated central text scraping or database harvesting for commercial advertisements or outside training algorithms.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-cit-blue-500 mt-2 shrink-0"></span>
                        <div>
                          <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">Identity Shielding</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            Your full academic program, cohort year, biography text, profile photo, and social links are visible exclusively to authenticated students who are active on this application. Visitor accounts and unauthorized bots cannot index this portal or download index records of CIT scholars.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 md:p-8 rounded-2xl border ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250 text-gray-955 shadow-sm'
                  } space-y-4 shadow-md`}>
                    <h2 className="font-display font-bold text-sm text-gray-900 dark:text-gray-100">2. Security Auditing & Governance Contact</h2>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      If you discover sensitive student entries or security flaws, or wish to query any matter pertaining to security configurations on Canadian Institute of Technology local servers, please contact the administrators under the Student Union Registry or notify through CIT Contacts.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Mobile Footer - Sit only at the end of the tabs */}
          <div className="md:hidden">
            {renderFooter(true)}
          </div>

        </main>

        {/* C. RIGHT SIDEBAR (DESKTOP USER SUGGESTIONS PANEL - FIXED WHILE SCROLLING) */}
        <aside className="w-80 shrink-0 border-l border-gray-150 dark:border-gray-800 p-4 space-y-6 hidden lg:block h-full overflow-y-auto scrollbar select-none">
          
          {/* Suggestions block */}
          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-[10px] uppercase tracking-widest text-gray-450 dark:text-[#a1a1aa] px-1">Suggested Connections</h3>
            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-[11px] text-gray-400">
                  <Smile className="w-5 h-5 mx-auto mb-1 text-cit-blue-500" />
                  No student suggestions yet. Encourage peers to Register!
                </div>
              ) : (
                suggestions.map(peer => (
                  <div
                    key={peer.id}
                    id={`peer-right-card-${peer.id}`}
                    className={`p-3.5 rounded-xl border ${
                      darkMode ? 'bg-cit-dark-500/80 border-gray-850' : 'bg-white border-gray-150 shadow-xs'
                    } flex items-center justify-between gap-3`}
                  >
                    <div 
                      onClick={() => navigateToProfile(peer.id)}
                      className="flex items-center gap-2.5 cursor-pointer min-w-0"
                    >
                      <img src={peer.profilePhoto} alt={peer.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-display font-medium text-[11px] text-gray-800 dark:text-gray-100 hover:underline truncate">{peer.name}</h4>
                        <p className="text-[9px] text-gray-400 truncate">{peer.studyProgram}</p>
                      </div>
                    </div>
                    
                    <button
                      id={`connect-peer-right-${peer.id}`}
                      onClick={() => sendConnectionRequest(peer.id)}
                      className="bg-cit-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-cit-blue-600 transition tracking-widest uppercase"
                    >
                      Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CIT Events list block */}
          <div className="space-y-4 pt-4 border-t border-gray-150 dark:border-gray-800">
            <h3 className="font-display font-extrabold text-[10px] uppercase tracking-widest text-gray-450 dark:text-[#a1a1aa] px-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-cit-red-500" /> CIT Community Events
            </h3>
            
            <div className="space-y-3">
              {eventsList.map(ev => (
                <div 
                  key={ev.id} 
                  className={`p-3.5 rounded-xl border ${
                    darkMode ? 'bg-cit-dark-500/50 border-gray-850/80' : 'bg-gray-50/50 border-gray-150/60'
                  } space-y-2`}
                >
                  <div className="flex justify-between items-center text-[8px] uppercase font-mono tracking-widest text-cit-red-500 font-extrabold">
                    <span>{ev.date}</span>
                    <span className="w-2 h-2 rounded-full bg-cit-red-500 animate-pulse"></span>
                  </div>
                  
                  <h4 className="font-display font-medium text-[11px] text-gray-800 dark:text-gray-205 leading-snug">
                    {ev.title}
                  </h4>
                  
                  <p className="text-[10px] text-gray-400 line-clamp-2">
                    {ev.description}
                  </p>
                  
                  <a 
                    href={ev.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] font-bold uppercase tracking-wider text-cit-blue-500 dark:text-cit-blue-300 hover:underline flex items-center gap-0.5"
                  >
                    Learn More on CIT <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>

      {/* 3. FOOTER (CAMPUS CREDITS, LAWS & TERMS) */}
      <div className="hidden md:block shrink-0">
        {renderFooter(false)}
      </div>

      {/* 4. BOTTOM NAVIGATION BAR (MOBILE USERS ONLY) */}
      <nav className={`fixed bottom-0 left-0 right-0 h-14 border-t z-40 md:hidden flex items-center justify-around ${
        darkMode ? 'bg-cit-dark-500/95 border-gray-800 text-white' : 'bg-white/95 border-gray-150 text-gray-900'
      }`}>
        {[
          { name: 'Home', icon: Home },
          { name: 'Discovery', icon: Compass },
          { name: 'Messages', icon: MessageSquare },
          { name: 'Network', icon: Users },
          { name: 'Profile', icon: UserIcon }
        ].map(item => {
          const Icon = item.icon;
          const matches = activeTab === item.name;
          return (
            <button
              key={item.name}
              id={`mob-nav-${item.name.toLowerCase()}`}
              onClick={() => {
                setActiveTab(item.name);
                setActiveProfileUserId(null);
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center p-2.5 transition ${
                matches ? 'text-cit-blue-500 font-bold' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-semibold mt-0.5">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Hamburger Lateral List drawer sliding */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className={`relative w-64 max-w-xs h-full p-4 flex flex-col justify-between ${
            darkMode ? 'bg-cit-dark-500/95 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b dark:border-gray-800">
                <span className="font-display font-extrabold text-gray-950 dark:text-white">CitConnect Sidebar</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1">
                {[
                  { name: 'Home', icon: Home },
                  { name: 'Discovery', icon: Compass },
                  { name: 'My Projects', icon: Briefcase },
                  { name: 'My Ideas', icon: Lightbulb },
                  { name: 'Messages', icon: MessageSquare },
                  { name: 'Network', icon: Users },
                  { name: 'Profile', icon: UserIcon }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      id={`mob-hamb-${item.name.toLowerCase().replace(' ', '-')}`}
                      onClick={() => {
                        setActiveTab(item.name);
                        setActiveProfileUserId(null);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition ${
                        activeTab === item.name 
                          ? 'bg-cit-blue-500 text-white' 
                          : 'text-gray-500 hover:text-cit-blue-500 hover:bg-cit-blue-100/15'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick staff selector in drawer bottom */}
            <div className="p-2 border-t dark:border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-400">Administration:</span>
              <button
                id="mob-to-admin-panel"
                onClick={() => {
                  setIsAdminMode(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs bg-gray-100 dark:bg-gray-850 px-3 py-1 mr-1 text-[#ff5a5f] rounded font-bold"
              >
                Supervise Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: WRITE POST MODAL */}
      {showPostModal && currentUser && (
        <PostFormModal 
          onClose={() => setShowPostModal(false)} 
          onPostCreated={handlePostCreated} 
          userId={currentUser.id} 
          darkMode={darkMode} 
        />
      )}

      {/* POPUP: EDIT SUBMITTED CARD */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <form 
            onSubmit={savePostEdit}
            className={`p-6 rounded-2xl border ${
              darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-gray-150 border-gray-250 text-gray-955'
            } shadow-2xl max-w-md w-full space-y-4`}
          >
            <h3 className="font-display font-extrabold text-xs uppercase tracking-widest text-gray-950 dark:text-white flex items-center">
              <BookOpen className="w-4 h-4 mr-1 text-cit-blue-500" /> Adjust Published Metadata
            </h3>
            
            <div className="space-y-3 font-semibold text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Title (Max 100 characters)</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value.substring(0, 100))}
                  className={`w-full p-2.5 rounded-lg border text-sm pr-1 focus:outline-none focus:ring-1 focus:ring-cit-blue-500 ${
                    darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Description (Max 100 characters)</label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value.substring(0, 1000))}
                  className={`w-full p-2.5 rounded-lg border text-xs pr-1 focus:outline-none focus:ring-1 focus:ring-cit-blue-500 ${
                    darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                id="edit-cancel-own-post"
                onClick={() => { setShowEditModal(false); setEditingPost(null); }}
                className={`px-4 py-2 border rounded ${darkMode ? 'border-gray-800 text-gray-300' : 'border-gray-250 text-gray-750 hover:bg-gray-100/50'}`}
              >
                Cancel Adjustments
              </button>
              <button
                type="submit"
                id="edit-save-own-post"
                className="bg-cit-blue-500 font-bold px-4 py-2 text-white rounded hover:bg-cit-blue-650 transition"
              >
                Apply Updates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: EDIT PROFILE MODAL */}
      {showProfileEditModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <form 
            onSubmit={handleEditProfileSave}
            className={`p-6 rounded-2xl border ${
              darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-react-type text-gray-800'
            } shadow-2xl max-w-lg w-full space-y-4`}
          >
            <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-gray-950 dark:text-white">
              Edit Classmate Biography & Socials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Short Biography (Max 300 characters)</label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell classmates about your major research directions or current internships..."
                  className={`w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
                    darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-150 text-gray-905'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Academic Skills (Comma separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="React, CSS, Figma, Marketing"
                  className={`w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
                    darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-150 text-gray-905'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">LinkedIn Profile Link</label>
                <input
                  type="text"
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className={`w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
                    darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-150 text-gray-905'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">GitHub Developer Profile</label>
                <input
                  type="text"
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  placeholder="github.com/username"
                  className={`w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
                    darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-150 text-gray-905'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Personal Portfolio Site</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="my-portfolio.com"
                  className={`w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
                    darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-150 text-gray-905'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                id="edit-profile-cancel"
                onClick={() => setShowProfileEditModal(false)}
                className={`px-4 py-2 border rounded ${darkMode ? 'border-gray-800 text-gray-300' : 'border-gray-250 text-gray-750 hover:bg-gray-100/50'}`}
              >
                Cancel Edit
              </button>
              <button
                type="submit"
                id="edit-profile-save"
                className="bg-cit-blue-500 hover:bg-cit-blue-600 text-white font-bold px-4 py-2 rounded transition"
              >
                Save Biography
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECURE FORCE DELETE ACCOUNT DIALOG */}
      {showAccountDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-800'
          } shadow-2xl max-w-sm w-full space-y-4`}>
            <h4 className="font-display font-extrabold text-cit-red-500">Purging Registered Profile</h4>
            <p className="text-xs text-gray-400">
              Are you sure you want to permanently delete your student account? This drops your profile, research uploads, connection parameters, messages, likes and comments completely across CitConnect.
            </p>
            <div className="flex justify-end gap-3 text-xs font-mono font-bold">
              <button id="del-acc-cancel" className={`px-3.5 py-1.5 rounded border ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-800/20' : 'border-gray-250 text-gray-750 hover:bg-gray-100/50'}`} onClick={() => setShowAccountDeleteConfirm(false)}>CANCEL</button>
              <button id="del-acc-confirm" className="px-3.5 py-1.5 bg-cit-red-500 text-white rounded" onClick={handleAccountDeletion}>PURGE_PROFILE</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: SIGNOUT CONFIRMATION DIALOG */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-855'
          } shadow-2xl max-w-xs w-full space-y-4`}>
            <h4 className="font-display font-extrabold text-xs uppercase tracking-widest text-cit-blue-500">Log Out Student Session</h4>
            <p className="text-xs text-gray-400">
              Are you sure you want to drop your current authenticated session? Your offline-first data remains saved securely.
            </p>
            <div className="flex justify-end gap-3 text-xs font-bold">
              <button id="logout-cancel-btn" className={`px-3.5 py-1.5 rounded border ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-800/20' : 'border-gray-250 text-gray-750 hover:bg-gray-100/50'}`} onClick={() => setShowSignoutConfirm(false)}>Cancel</button>
              <button id="logout-confirm-btn" className="px-3.5 py-1.5 bg-cit-red-500 text-white rounded hover:bg-cit-red-600 transition" onClick={logoutSession}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
