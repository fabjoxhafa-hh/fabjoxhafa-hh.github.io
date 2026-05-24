import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { getUsers, getMessages, addMessage } from '../utils/storage';
import { Send, ArrowLeft, MessageSquare, ShieldAlert, Sparkles, Check, CheckCheck } from 'lucide-react';

interface MessageTabProps {
  currentUser: User;
  darkMode: boolean;
  onNavigateToTab: (tabName: string) => void;
}

export default function MessageTab({ currentUser, darkMode, onNavigateToTab }: MessageTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [text, setText] = useState('');
  
  // Mobile navigation helper
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsers(getUsers().filter(u => u.id !== currentUser.id));
    setMessages(getMessages());
  }, [currentUser]);

  useEffect(() => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeUserId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderId: currentUser.id,
      receiverId: activeUserId,
      content: text.trim(),
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    addMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setText('');
  };

  // Conversations are grouped based on communication exchanges or simply with registered peers
  // The prompt says "No messages yet. Connect with peers to start a conversation."
  // So all registered peers/connections appear as potential threads.
  const getConversations = () => {
    return users.map(user => {
      const threadMsgs = messages.filter(
        m => (m.senderId === currentUser.id && m.receiverId === user.id) ||
             (m.senderId === user.id && m.receiverId === currentUser.id)
      );
      
      const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
      const unreadCount = threadMsgs.filter(m => m.senderId === user.id && !m.read).length;

      return {
        user,
        lastMessage: lastMsg,
        unreadCount
      };
    }).sort((a, b) => {
      // sort by last message timestamp if exists
      const timeA = a.lastMessage ? a.lastMessage.id : '0';
      const timeB = b.lastMessage ? b.lastMessage.id : '0';
      return timeB.localeCompare(timeA);
    });
  };

  const conversations = getConversations();

  const handleSelectUser = (userId: string) => {
    setActiveUserId(userId);
    setMobileShowChat(true);

    // Mark messages in this active thread as read
    const allMsgs = getMessages();
    const updated = allMsgs.map(m => {
      if (m.senderId === userId && m.receiverId === currentUser.id) {
        return { ...m, read: true };
      }
      return m;
    });
    // Write back and sync local state
    localStorage.setItem('cit_connect_messages', JSON.stringify(updated));
    setMessages(updated);
  };

  const activeUser = users.find(u => u.id === activeUserId);
  const activeThreadMessages = activeUserId 
    ? messages.filter(
        m => (m.senderId === currentUser.id && m.receiverId === activeUserId) ||
             (m.senderId === activeUserId && m.receiverId === currentUser.id)
      )
    : [];

  return (
    <div className={`h-[calc(100vh-140px)] min-h-[500px] rounded-2xl border overflow-hidden flex ${
      darkMode ? 'bg-cit-dark-500 border-gray-800' : 'bg-white border-gray-150'
    } transition-all shadow-md`}>
      
      {/* LEFT CONVERSATION LIST PANEL */}
      <div className={`w-full md:w-80 border-r flex flex-col shrink-0 ${
        darkMode ? 'border-gray-800 bg-cit-dark-600/20' : 'border-gray-150 bg-gray-50/50'
      } ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-4 border-b border-gray-150 dark:border-gray-800">
          <input
            type="text"
            placeholder="Filter classmates..."
            className={`w-full px-3.5 py-2 rounded-xl text-xs focus:ring-1 focus:ring-cit-blue-500 focus:outline-none ${
              darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/20 scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-cit-blue-500 opacity-20" />
              There are currently no active students on CitConnect besides you. Encourage your group to Register!
            </div>
          ) : (
            conversations.map(({ user, lastMessage, unreadCount }) => (
              <button
                key={user.id}
                id={`chat-user-${user.id}`}
                onClick={() => handleSelectUser(user.id)}
                className={`w-full p-4 flex items-start gap-3 text-left transition ${
                  activeUserId === user.id 
                    ? (darkMode ? 'bg-cit-blue-500/10' : 'bg-cit-blue-50/60') 
                    : (darkMode ? 'hover:bg-cit-dark-500/80' : 'hover:bg-gray-50')
                }`}
              >
                {/* Photo profile */}
                <div className="relative shrink-0">
                  <img
                    src={user.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-250 dark:border-gray-800"
                  />
                  {/* Presence indicator representing CIT connection */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-cit-dark-500"></span>
                </div>

                {/* Content info info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-150 truncate">{user.name}</h4>
                    <span className="text-[9px] text-gray-400 shrink-0">
                      {lastMessage ? lastMessage.createdAt : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium truncate mb-1">
                    {user.studyProgram} • Year {user.yearOfStudy}
                  </p>
                  
                  {lastMessage ? (
                    <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-450'}`}>
                      {lastMessage.senderId === currentUser.id ? 'You: ' : ''}{lastMessage.content}
                    </p>
                  ) : (
                    <span className="text-[11px] text-cit-blue-500 dark:text-cit-blue-300 font-semibold italic">Start a collaboration chat!</span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-cit-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT ACTIVE CONVERSATION PANEL */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-zinc-900/10 ${
        !mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        {activeUserId && activeUser ? (
          <>
            {/* Thread Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              darkMode ? 'bg-cit-dark-500 border-gray-800' : 'bg-white border-gray-150'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  id="chat-back-btn"
                  onClick={() => setMobileShowChat(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden transition"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                </button>
                <img
                  src={activeUser.profilePhoto}
                  alt={activeUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-250 dark:border-gray-800"
                />
                <div>
                  <h3 className="font-display font-bold text-xs text-gray-800 dark:text-white">{activeUser.name}</h3>
                  <span className="text-[10px] text-gray-400 capitalize">
                    {activeUser.studyProgram} (Year {activeUser.yearOfStudy})
                  </span>
                </div>
              </div>

              {/* Action */}
              <button 
                id="view-partner-profile"
                onClick={() => {
                  // Pass request up or toggle to discover uploader
                  onNavigateToTab(`Profile_${activeUser.id}`);
                }}
                className="text-[10px] font-bold uppercase tracking-wider bg-cit-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-cit-blue-600 transition"
              >
                View Profile
              </button>
            </div>

            {/* Bubble logs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar bg-[#fafbfc]/30 dark:bg-[#0c0d12]/30">
              {activeThreadMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-cit-blue-100/50 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-cit-blue-500 animate-spin" />
                  </div>
                  <h4 className="font-display font-semibold text-xs text-gray-800 dark:text-white">Begin Collaborative Chat</h4>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Exchange academic documents, schedule university research meetings, or partner on exciting ideas right here.
                  </p>
                </div>
              ) : (
                activeThreadMessages.map(msg => {
                  const isOwn = msg.senderId === currentUser.id;
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3.5 rounded-2xl text-xs max-w-[75%] shadow-xs leading-relaxed ${
                        isOwn 
                          ? 'bg-cit-blue-500 text-white rounded-tr-none' 
                          : (darkMode ? 'bg-cit-dark-500 text-gray-150 rounded-tl-none' : 'bg-gray-100/90 text-gray-800 rounded-tl-none')
                      }`}>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400 px-1 font-medium select-none">
                        <span>{msg.createdAt}</span>
                        {isOwn && (
                          <span>• {msg.read ? <CheckCheck className="w-3 h-3 text-cit-blue-400 inline" /> : <Check className="w-3 h-3 text-gray-400 inline" />}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endOfChatRef} />
            </div>

            {/* Form Input */}
            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-2 ${
              darkMode ? 'bg-cit-dark-500/80 border-gray-800' : 'bg-white border-gray-150'
            }`}>
              <input
                type="text"
                id="message-text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your academic or collaboration response..."
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cit-blue-500 ${
                  darkMode ? 'bg-cit-dark-600 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
              <button
                type="submit"
                id="send-message-btn"
                className="bg-cit-red-500 hover:bg-cit-red-600 text-white px-4 rounded-xl flex items-center justify-center transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20 text-cit-red-500" />
            <span className="font-display font-semibold text-xs text-gray-700 dark:text-gray-300">Classroom Communication hub</span>
            <p className="text-[11px] text-gray-400 max-w-sm mt-1 mx-auto leading-relaxed">
              Select or open a student contact from the left list block or collaborate straight from the Idea Detail Pages!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
