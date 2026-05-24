import React, { useState, useEffect } from 'react';
import { User, Post, Comment } from '../types';
import { getUsers, saveUsers, getPosts, savePosts, getComments, saveComments, deleteUserFromStorage } from '../utils/storage';
import { ShieldCheck, LogOut, Trash2, Edit, Table, Grid, Users, FileText, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  onLogoutAdmin: () => void;
  darkMode: boolean;
}

export default function AdminPanel({ onLogoutAdmin, darkMode }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'posts' | 'comments'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit post states
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete modal targets
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const [feedback, setFeedback] = useState('');

  const loadData = () => {
    setUsers(getUsers());
    setPosts(getPosts());
    setComments(getComments());
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserFromStorage(userId);
    loadData();
    setUserToDelete(null);
    triggerToast('Student user and all associated records permanently purged.');
  };

  const handleDeletePost = (postId: string) => {
    const updated = getPosts().filter(p => p.id !== postId);
    savePosts(updated);
    
    // purge comments
    const updatedComments = getComments().filter(c => c.postId !== postId);
    saveComments(updatedComments);
    
    loadData();
    setPostToDelete(null);
    triggerToast('Post and replies purged successfully.');
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = getComments().filter(c => c.id !== commentId);
    saveComments(updated);
    loadData();
    setCommentToDelete(null);
    triggerToast('Comment purged successfully.');
  };

  const handleStartEditPost = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditDescription(post.description);
  };

  const handleSaveEditedPost = (e: React.FormEvent) => {
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
    loadData();
    setEditingPost(null);
    triggerToast('Post metadata edited successfully in administrator database.');
  };

  const getUserPostCount = (userId: string) => {
    return posts.filter(p => p.authorId === userId).length;
  };

  const findPostTitle = (postId: string) => {
    return posts.find(p => p.id === postId)?.title || 'Unknown Post Title';
  };

  const getAuthorName = (authorId: string) => {
    return users.find(u => u.id === authorId)?.name || 'Unknown Author';
  };

  // Filters
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.studyProgram.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getAuthorName(p.authorId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredComments = comments.filter(c => 
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getAuthorName(c.authorId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    findPostTitle(c.postId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-cit-dark-600 text-white' : 'bg-slate-50 text-gray-800'}`}>
      
      {/* EXTREMELY VISIBLE ADMIN HEADER BANNER */}
      <div className="bg-cit-red-700 text-white font-mono text-center text-xs py-2 px-4 font-bold flex items-center justify-between shadow-inner animate-pulse shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>ADMINISTRATOR SESSION MODE ACTIVATED — FULL SECURITY DOMAIN OVERRIDE</span>
        </div>
        <div className="flex items-center gap-2">
          <span>SECURE_SESSION: ACTIVE</span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        </div>
      </div>

      {/* Admin Navbar */}
      <header className={`px-6 py-4 border-b flex items-center justify-between ${
        darkMode ? 'bg-cit-dark-500 border-gray-800' : 'bg-white border-gray-150'
      } shrink-0`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cit-red-500 rounded-lg text-white">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm tracking-tight">CitConnect Admin Panel</h1>
            <p className="text-[10px] text-gray-400">Operational Database & Control Supervisors</p>
          </div>
        </div>

        {/* Sync Controls & Feedback */}
        <div className="flex items-center gap-4">
          {feedback && (
            <div id="admin-toast" className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center">
              <Check className="w-3.5 h-3.5 mr-1" /> {feedback}
            </div>
          )}

          <button
            id="admin-reload-btn"
            onClick={loadData}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-cit-red-500 hover:bg-cit-red-50/10 transition"
            title="Reload database tables"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="admin-logout-btn"
            onClick={onLogoutAdmin}
            className="bg-cit-red-500 hover:bg-cit-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition"
          >
            <LogOut className="w-3.5 h-3.5 text-white" /> Logout Panel
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto scrollbar">
        
        {/* Navigation Tabs Statistics section */}
        <div className="grid grid-cols-3 gap-4">
          <button
            id="admin-tab-users"
            onClick={() => { setActiveAdminTab('users'); setSearchQuery(''); }}
            className={`p-4 rounded-xl border text-left transition ${
              activeAdminTab === 'users'
                ? 'border-cit-red-500 bg-cit-red-550/10 text-cit-red-500'
                : (darkMode ? 'bg-cit-dark-500 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-150 hover:bg-gray-50')
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Database Accounts</span>
              <Users className="w-4 h-4 text-cit-red-500" />
            </div>
            <p className="font-display font-extrabold text-2xl tracking-tight">{users.length}</p>
            <p className="text-[10px] text-gray-400 mt-1">Genuinely Registered Students</p>
          </button>

          <button
            id="admin-tab-posts"
            onClick={() => { setActiveAdminTab('posts'); setSearchQuery(''); }}
            className={`p-4 rounded-xl border text-left transition ${
              activeAdminTab === 'posts'
                ? 'border-cit-red-500 bg-cit-red-550/10 text-cit-red-500'
                : (darkMode ? 'bg-cit-dark-500 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-150 hover:bg-gray-50')
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Total Posts published</span>
              <FileText className="w-4 h-4 text-cit-red-500" />
            </div>
            <p className="font-display font-extrabold text-2xl tracking-tight">{posts.length}</p>
            <p className="text-[10px] text-gray-400 mt-1">Academic Projects & Ideas</p>
          </button>

          <button
            id="admin-tab-comments"
            onClick={() => { setActiveAdminTab('comments'); setSearchQuery(''); }}
            className={`p-4 rounded-xl border text-left transition ${
              activeAdminTab === 'comments'
                ? 'border-cit-red-500 bg-cit-red-550/10 text-cit-red-500'
                : (darkMode ? 'bg-cit-dark-500 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-150 hover:bg-gray-50')
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Discussion Comments</span>
              <FileText className="w-4 h-4 text-cit-red-500" />
            </div>
            <p className="font-display font-extrabold text-2xl tracking-tight">{comments.length}</p>
            <p className="text-[10px] text-gray-400 mt-1">Inter-student replies</p>
          </button>
        </div>

        {/* Global Filter Query Box */}
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'}`}>
          <input
            type="text"
            id="admin-filter-query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search across ${activeAdminTab}...`}
            className={`w-full px-4 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cit-red-500 ${
              darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
        </div>

        {/* CONDITIONAL TAB DATA RENDERS */}
        <div>
          {/* USERS MANAGEMENT TABLE */}
          {activeAdminTab === 'users' && (
            <div className={`rounded-xl border overflow-hidden shadow-sm ${
              darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
            }`}>
              <div className="overflow-x-auto scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-wider border-b ${
                      darkMode ? 'bg-cit-dark-600 border-gray-800/80 text-gray-405' : 'bg-slate-50 border-gray-150 text-gray-500'
                    }`}>
                      <th className="p-4">Student Profile</th>
                      <th className="p-4">Credentials & email</th>
                      <th className="p-4">Study program</th>
                      <th className="p-4">Year</th>
                      <th className="p-4">Reg Date</th>
                      <th className="p-4">Posts Count</th>
                      <th className="p-4 text-right">Database Purge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                          No registered student accounts in the local pool matching search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20">
                          <td className="p-4 flex items-center gap-3">
                            <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0 border" />
                            <span className="font-bold text-gray-800 dark:text-gray-100">{user.name}</span>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-gray-500 dark:text-gray-400">{user.email}</td>
                          <td className="p-4 text-gray-700 dark:text-gray-350">{user.studyProgram}</td>
                          <td className="p-4 text-center font-bold font-mono">Yr {user.yearOfStudy}</td>
                          <td className="p-4 text-gray-400">{user.joinDate}</td>
                          <td className="p-4 text-center font-extrabold font-mono text-cit-blue-500 dark:text-cit-blue-300">
                            {getUserPostCount(user.id)}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              id={`admin-purge-user-${user.id}`}
                              onClick={() => setUserToDelete(user.id)}
                              className="p-1.5 rounded-lg bg-red-100/15 text-red-500 hover:bg-cit-red-500 hover:text-white transition"
                              title="Force Purge Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* POSTS LISTING TABLE */}
          {activeAdminTab === 'posts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.length === 0 ? (
                <div className="md:col-span-2 p-8 text-center text-gray-450 italic">
                  No published records found matching filters.
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                    darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
                  } shadow-xs`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          post.type === 'project' 
                            ? 'bg-cit-blue-100/10 text-cit-blue-500' 
                            : 'bg-cit-red-100/10 text-cit-red-500'
                        }`}>
                          {post.type}
                        </span>
                        <span className="text-[10px] text-gray-400">{post.createdAt}</span>
                      </div>
                      
                      <h4 className="font-display font-extrabold text-sm text-gray-800 dark:text-white truncate">{post.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{post.description}</p>
                      
                      <div className="text-[10px] text-gray-400 pt-1">
                        Author Name: <span className="font-bold text-gray-700 dark:text-gray-300">{getAuthorName(post.authorId)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-gray-100 dark:border-gray-850">
                      <button
                        id={`admin-edit-post-${post.id}`}
                        onClick={() => handleStartEditPost(post)}
                        className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-650 dark:text-gray-300 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit metadata
                      </button>
                      <button
                        id={`admin-purge-post-${post.id}`}
                        onClick={() => setPostToDelete(post.id)}
                        className="px-3 py-1.5 rounded bg-red-100/15 hover:bg-cit-red-500 hover:text-white text-red-500 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Purge Post
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* COMMENTS LISTING TABLE */}
          {activeAdminTab === 'comments' && (
            <div className={`rounded-xl border overflow-hidden shadow-sm ${
              darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-white border-gray-150'
            }`}>
              <div className="overflow-x-auto scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-wider border-b ${
                      darkMode ? 'bg-cit-dark-600 border-gray-800/80 text-gray-405' : 'bg-slate-50 border-gray-150 text-gray-500'
                    }`}>
                      <th className="p-4">Reply Uploader</th>
                      <th className="p-4">Post Title Match</th>
                      <th className="p-4">Content Message Text</th>
                      <th className="p-4">Date uploaded</th>
                      <th className="p-4 text-right">Database Purge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                    {filteredComments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                          No replies matching current search query.
                        </td>
                      </tr>
                    ) : (
                      filteredComments.map(com => (
                        <tr key={com.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/15">
                          <td className="p-4 font-bold text-gray-800 dark:text-gray-100">
                            {getAuthorName(com.authorId)}
                          </td>
                          <td className="p-4 max-w-[150px] truncate font-semibold text-cit-blue-500 dark:text-cit-blue-300">
                            {findPostTitle(com.postId)}
                          </td>
                          <td className="p-4 max-w-[250px] truncate text-gray-700 dark:text-gray-300">
                            {com.content}
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-[10px]">{com.createdAt}</td>
                          <td className="p-4 text-right">
                            <button
                              id={`admin-purge-comment-${com.id}`}
                              onClick={() => setCommentToDelete(com.id)}
                              className="p-1.5 rounded-lg bg-red-105/15 text-red-500 hover:bg-cit-red-500 hover:text-white transition"
                              title="Purge Comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* METADATA EDITOR DIALOG FOR POSTS */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleSaveEditedPost} className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-855'
          } shadow-2xl max-w-lg w-full space-y-4`}>
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-cit-red-500 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1" /> Override Post Metadata
            </h3>
            
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-400 mb-1">Override Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value.substring(0, 100))}
                  className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-cit-red-500 ${
                    darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Override Description (Max 1000 characters)</label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value.substring(0, 1000))}
                  className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-cit-red-500 ${
                    darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button
                type="button"
                id="admin-edit-cancel-btn"
                onClick={() => setEditingPost(null)}
                className={`px-4 py-2 rounded border ${darkMode ? 'border-gray-800 text-gray-300' : 'border-gray-250 text-gray-750 hover:bg-gray-100/50'}`}
              >
                Cancel Override
              </button>
              <button
                type="submit"
                id="admin-edit-save-btn"
                className="bg-cit-red-500 text-white font-bold px-4 py-2 rounded hover:bg-cit-red-600 transition"
              >
                Apply Override Updates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECURE FORCE DELETE DIALOGS */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-800'
          } shadow-2xl max-w-sm w-full space-y-4`}>
            <h4 className="font-display font-extrabold text-[#c51e3a] flex items-center">
              <AlertTriangle className="w-5 h-5 mr-1" /> Direct purging user
            </h4>
            <p className="text-xs text-gray-400">
              Are you sure you want to completely purge this user ID? This removes user profile and all posted assets, connection parameters or message rows completely across the site.
            </p>
            <div className="flex justify-end gap-3 text-xs font-bold font-mono">
              <button id="purge-user-cancel" className="px-3.5 py-1.5 rounded border" onClick={() => setUserToDelete(null)}>CANCEL</button>
              <button id="purge-user-confirm" className="px-3.5 py-1.5 rounded bg-[#c51e3a] text-white" onClick={() => handleDeleteUser(userToDelete)}>PURGE_CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-800'
          } shadow-2xl max-w-sm w-full space-y-4`}>
            <h4 className="font-display font-extrabold text-[#c51e3a] flex items-center">
              <AlertTriangle className="w-5 h-5 mr-1" /> Purging Academic Post
            </h4>
            <p className="text-xs text-gray-400">
              Force clean comment trees and resource items for post {postToDelete}?
            </p>
            <div className="flex justify-end gap-3 text-xs font-bold font-mono">
              <button id="purge-post-cancel" className="px-3.5 py-1.5 rounded border" onClick={() => setPostToDelete(null)}>CANCEL</button>
              <button id="purge-post-confirm" className="px-3.5 py-1.5 rounded bg-[#c51e3a] text-white" onClick={() => handleDeletePost(postToDelete)}>PURGE_POST_CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {commentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-800'
          } shadow-2xl max-w-sm w-full space-y-4`}>
            <h4 className="font-display font-extrabold text-[#c51e3a] flex items-center">
              <AlertTriangle className="w-5 h-5 mr-1" /> Purging Comment Message
            </h4>
            <p className="text-xs text-gray-400">
              Clear this specific student comment message?
            </p>
            <div className="flex justify-end gap-3 text-xs font-bold font-mono">
              <button id="purge-comment-cancel" className="px-3.5 py-1.5 rounded border" onClick={() => setCommentToDelete(null)}>CANCEL</button>
              <button id="purge-comment-confirm" className="px-3.5 py-1.5 rounded bg-[#c51e3a] text-white" onClick={() => handleDeleteComment(commentToDelete)}>PURGE_REPLY</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
