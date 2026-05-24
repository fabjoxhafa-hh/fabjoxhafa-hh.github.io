import React, { useState, useEffect } from 'react';
import { Post, User, Comment } from '../types';
import { getUsers, getComments, saveComments, getPosts, savePosts, addMessage } from '../utils/storage';
import { Heart, MessageSquare, Share2, ArrowLeft, Trash2, Edit2, Calendar, UserPlus, Users, Sparkles, Send, Check } from 'lucide-react';

interface DetailPagesProps {
  postId: string;
  currentUser: User;
  darkMode: boolean;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
  onPostDeleted: (postId: string) => void;
  onNavigateToTab: (tabName: string) => void;
  onOpenEditModal: (post: Post) => void;
}

export default function DetailPages({
  postId,
  currentUser,
  darkMode,
  onBack,
  onViewProfile,
  onPostDeleted,
  onNavigateToTab,
  onOpenEditModal
}: DetailPagesProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Dialog trackers
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Read post and comments from storage
    const allPosts = getPosts();
    const matchedPost = allPosts.find(p => p.id === postId);
    if (matchedPost) {
      setPost(matchedPost);
      const allUsers = getUsers();
      setAuthor(allUsers.find(u => u.id === matchedPost.authorId) || null);
      setIsLiked(matchedPost.likedBy.includes(currentUser.id));
      
      const postComments = getComments().filter(c => c.postId === matchedPost.id);
      setComments(postComments);
    }
  }, [postId, currentUser]);

  if (!post || !author) {
    return (
      <div className="p-8 text-center text-gray-400">
        <ArrowLeft className="w-5 h-5 mx-auto mb-2 cursor-pointer" onClick={onBack} />
        Post details could not be found or author has deleted their account.
      </div>
    );
  }

  const handleLike = () => {
    const allPosts = getPosts();
    const updated = allPosts.map(p => {
      if (p.id === post.id) {
        let newLikedBy = [...p.likedBy];
        let newLikesCount = p.likesCount;

        if (isLiked) {
          newLikedBy = newLikedBy.filter(id => id !== currentUser.id);
          newLikesCount = Math.max(0, newLikesCount - 1);
        } else {
          newLikedBy.push(currentUser.id);
          newLikesCount += 1;
        }

        const updatedPost = {
          ...p,
          likesCount: newLikesCount,
          likedBy: newLikedBy
        };
        setPost(updatedPost);
        setIsLiked(!isLiked);
        return updatedPost;
      }
      return p;
    });
    savePosts(updated);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: 'comment_' + Date.now(),
      postId: post.id,
      authorId: currentUser.id,
      content: newComment.trim(),
      createdAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updatedComments = [...getComments(), newCommentObj];
    saveComments(updatedComments);
    setComments(prev => [...prev, newCommentObj]);
    setNewComment('');
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = getComments().filter(c => c.id !== commentId);
    saveComments(updated);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleCollaborate = () => {
    // Generate collaborate request message in database
    const collaborateMessageContent = `Hi, I'm interested in collaborating on your idea: "${post.title}"`;
    
    const newMsgObj = {
      id: 'msg_' + Date.now(),
      senderId: currentUser.id,
      receiverId: post.authorId,
      content: collaborateMessageContent,
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    const allMsgs = [...getComments(), newMsgObj]; // Wait: should use getMessages helper from storage.ts but let's add via local state or storage
    // Read current messages and push
    const currentMessages = JSON.parse(localStorage.getItem('cit_connect_messages') || '[]');
    currentMessages.push(newMsgObj);
    localStorage.setItem('cit_connect_messages', JSON.stringify(currentMessages));

    // Also push a notification to the author's notifications
    const newNotif = {
      id: 'notif_' + Date.now(),
      userId: post.authorId,
      type: 'collaborate' as const,
      senderId: currentUser.id,
      postId: post.id,
      message: `sent you a collaboration message regarding: ${post.title}`,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      read: false
    };
    const currentNotifs = JSON.parse(localStorage.getItem('cit_connect_notifications') || '[]');
    currentNotifs.unshift(newNotif);
    localStorage.setItem('cit_connect_notifications', JSON.stringify(currentNotifs));

    // Redirect to messages
    onNavigateToTab('Messages');
  };

  const handleDeletePost = () => {
    const allPosts = getPosts();
    const filtered = allPosts.filter(p => p.id !== post.id);
    savePosts(filtered);
    
    // clean comments
    const filteredComments = getComments().filter(c => c.postId !== post.id);
    saveComments(filteredComments);

    onPostDeleted(post.id);
    onBack();
  };

  const getCommentAuthor = (authorId: string) => {
    return getUsers().find(u => u.id === authorId);
  };

  const isUploader = post.authorId === currentUser.id;

  return (
    <div className="space-y-6">
      
      {/* Top action header info */}
      <div className="flex items-center justify-between">
        <button
          id="detail-back-btn"
          onClick={onBack}
          className={`flex items-center gap-1.5 text-xs font-bold ${
            darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-cit-blue-500'
          } transition`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </button>

        {isUploader && (
          <div className="flex items-center gap-2">
            <button
              id="edit-post-btn"
              onClick={() => onOpenEditModal(post)}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-1.5 rounded-lg hover:bg-cit-blue-50 dark:hover:bg-cit-blue-500/15 font-semibold flex items-center"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
            </button>
            <button
              id="delete-post-btn"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs bg-red-50 dark:bg-red-950/20 text-red-500 px-3.5 py-1.5 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-500/10 font-semibold flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Main card */}
      <div className={`rounded-2xl border ${
        darkMode ? 'bg-cit-dark-500 border-gray-850' : 'bg-gray-150 border-gray-250 shadow-md'
      } overflow-hidden shadow-md`}>
        
        {/* Images Carousel */}
        {post.images && post.images.length > 0 && (
          <div className="relative h-64 md:h-96 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
            <img 
              referrerPolicy="no-referrer"
              src={post.images[activeImageIndex]} 
              alt={post.title} 
              className="max-h-full max-w-full object-contain"
            />
            {post.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {post.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition ${activeImageIndex === idx ? 'bg-cit-red-500 scale-125' : 'bg-white/40 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content detail padding */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                post.type === 'project' 
                  ? 'bg-cit-blue-500/10 text-cit-blue-500 dark:text-cit-blue-300 border border-cit-blue-500/20' 
                  : 'bg-cit-red-500/10 text-cit-red-500 border border-cit-red-500/20'
              }`}>
                {post.type}
              </span>
              <span className="text-gray-400 text-xs flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" /> Shared {post.createdAt}
              </span>
            </div>

            <h1 className="font-display font-bold text-xl md:text-2xl tracking-tight text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h1>
          </div>

          <p className="text-xs md:text-sm text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {post.description}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {post.tags.map(t => (
              <span key={t} className="text-[10px] uppercase font-bold tracking-widest bg-gray-50 dark:bg-cit-dark-600 px-3 py-1 rounded-md text-gray-500">
                #{t}
              </span>
            ))}
          </div>

          {/* Social Stats actions row */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-150 dark:border-gray-800/80">
            <div className="flex items-center gap-5">
              <button 
                id="like-btn"
                onClick={handleLike} 
                className={`flex items-center gap-1 text-xs font-bold transition ${isLiked ? 'text-cit-red-500' : 'text-gray-450 hover:text-cit-red-500'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-cit-red-500 text-cit-red-500' : ''}`} />
                <span>{post.likesCount} student likes</span>
              </button>
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> {comments.length} academic replies
              </span>
            </div>

            <button 
              id="share-btn"
              onClick={handleShare} 
              className="text-xs text-cit-blue-500 dark:text-cit-blue-300 hover:underline font-bold flex items-center gap-1"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> Share URL
                </>
              )}
            </button>
          </div>

          {/* Author info card and collaborate context box */}
          <div className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            darkMode ? 'bg-cit-dark-600 border-gray-800' : 'bg-gray-50 border-gray-150/80'
          }`}>
            <div className="flex items-center gap-3">
              <img
                src={author.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-250 dark:border-gray-800 cursor-pointer hover:opacity-90"
                onClick={() => onViewProfile(author.id)}
              />
              <div>
                <h4 
                  onClick={() => onViewProfile(author.id)}
                  className="font-display font-medium text-xs text-gray-900 dark:text-white cursor-pointer hover:underline"
                >
                  {author.name}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                  {author.studyProgram} • Year {author.yearOfStudy}
                </p>
                <p className="text-[10px] text-gray-400">Joined CIT on {author.joinDate}</p>
              </div>
            </div>

            {/* Context conditional actions */}
            {!isUploader ? (
              <div className="flex gap-2 shrink-0">
                <button
                  id="author-profile-link"
                  onClick={() => onViewProfile(author.id)}
                  className={`text-xs px-4 py-2 rounded-lg font-bold border transition ${
                    darkMode ? 'border-gray-800 hover:bg-gray-800 text-white' : 'border-gray-200 hover:bg-white text-gray-700'
                  }`}
                >
                  View Profile
                </button>
                {post.type === 'idea' && (
                  <button
                    id="collaborate-btn"
                    onClick={handleCollaborate}
                    className="text-xs bg-cit-red-500 hover:bg-cit-red-600 text-white px-5 py-2 rounded-lg font-bold shadow-xs transition"
                  >
                    Collaborate
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-450 dark:text-[#a1a1aa] bg-gray-200/50 dark:bg-zinc-800 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 self-start md:self-auto select-none">
                <Sparkles className="w-3.5 h-3.5 text-cit-red-500 animate-pulse" /> My Post
              </span>
            )}
          </div>

          {/* Academic Conversation / Replies Box */}
          <div className="space-y-4 pt-4 border-t border-gray-150 dark:border-gray-800">
            <h3 className="font-display font-bold text-xs text-gray-600 dark:text-gray-300 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-cit-blue-500" /> Peer Discussions
            </h3>

            {/* Comment logs */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar">
              {comments.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400 italic">
                  No replies posted yet. Be the first to start academic dialogue!
                </div>
              ) : (
                comments.map(c => {
                  const comAuthor = getCommentAuthor(c.authorId);
                  if (!comAuthor) return null;
                  
                  return (
                    <div 
                      key={c.id} 
                      className={`p-3 md:p-4 rounded-xl border flex gap-3 ${
                        darkMode ? 'bg-cit-dark-600 border-gray-850' : 'bg-slate-50/50 border-gray-100'
                      }`}
                    >
                      <img 
                        src={comAuthor.profilePhoto} 
                        alt={comAuthor.name} 
                        className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer"
                        onClick={() => onViewProfile(comAuthor.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <div>
                            <span 
                              onClick={() => onViewProfile(comAuthor.id)}
                              className="text-xs font-bold hover:underline cursor-pointer text-gray-800 dark:text-white"
                            >
                              {comAuthor.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-medium">
                              {comAuthor.studyProgram}
                            </span>
                          </div>
                          
                          {/* Owner can delete comment */}
                          {(c.authorId === currentUser.id || isUploader) && (
                            <button
                              id={`delete-comment-${c.id}`}
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-xs text-red-500 hover:bg-red-200/10 p-1 rounded transition shrink-0"
                              title="Delete Academic Reply"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                          {c.content}
                        </p>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium block mt-1.5">{c.createdAt}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                id="comment-text-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write an academic feedback or join the collaboration discussion..."
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-medium focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
                  darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                required
              />
              <button
                type="submit"
                id="post-comment-btn"
                className="bg-cit-blue-500 hover:bg-cit-blue-600 text-white px-4 rounded-xl flex items-center justify-center transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`p-6 rounded-2xl border ${
            darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-gray-150 border-gray-250 text-gray-950'
          } shadow-2xl max-w-sm w-full space-y-4`}>
            <h3 className="font-display font-bold text-lg text-cit-red-500">Destructive Deletion</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to permanently delete this {post.type} post? This action cannot be reversed.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                id="delete-cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border ${darkMode ? 'border-gray-800 text-gray-300' : 'border-gray-200 text-gray-600'}`}
              >
                Cancel Deletion
              </button>
              <button
                id="delete-confirm-btn"
                onClick={handleDeletePost}
                className="bg-cit-red-500 hover:bg-cit-red-600 text-white px-5 py-2 rounded-lg text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
