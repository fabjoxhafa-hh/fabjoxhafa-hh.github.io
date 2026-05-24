import { useState, useEffect } from 'react';
import { Notification, User } from '../types';
import { getUsers, getNotifications, saveNotifications } from '../utils/storage';
import { Bell, Check, Trash, UserPlus, Heart, MessageSquare, Briefcase, FileText } from 'lucide-react';

interface NotificationsDropdownProps {
  userId: string;
  darkMode: boolean;
  onNavigateToTab: (tabName: string) => void;
  onClose: () => void;
}

export default function NotificationsDropdown({ userId, darkMode, onNavigateToTab, onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Lock reading notifications for logged in user
    const allNotifs = getNotifications();
    const myNotifs = allNotifs.filter(n => n.userId === userId);
    setNotifications(myNotifs);
    setUsers(getUsers());
  }, [userId]);

  const markAllAsRead = () => {
    const allNotifs = getNotifications();
    const updated = allNotifs.map(n => {
      if (n.userId === userId) {
        return { ...n, read: true };
      }
      return n;
    });
    saveNotifications(updated);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    const allNotifs = getNotifications();
    const filtered = allNotifs.filter(n => n.userId !== userId);
    saveNotifications(filtered);
    setNotifications([]);
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read first
    const allNotifs = getNotifications();
    const updated = allNotifs.map(n => {
      if (n.id === notif.id) {
        return { ...n, read: true };
      }
      return n;
    });
    saveNotifications(updated);

    // Navigate to respective tab
    if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
      onNavigateToTab('Network');
    } else if (notif.type === 'message' || notif.type === 'collaborate') {
      onNavigateToTab('Messages');
    } else if (notif.type === 'like') {
      onNavigateToTab('Discovery');
    }
    
    onClose();
  };

  const getSenderDetails = (senderId: string) => {
    return users.find(u => u.id === senderId);
  };

  return (
    <div 
      id="notifications-panel-dropdown"
      className={`absolute right-0 mt-2.5 w-80 md:w-96 rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'} shadow-2xl overflow-hidden z-50`}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-150 dark:border-gray-800 bg-cit-blue-500 text-white">
        <h3 className="font-display font-bold text-sm flex items-center">
          <Bell className="w-4 h-4 mr-2" /> Academic Alerts
        </h3>
        <div className="flex gap-2">
          {notifications.some(n => !n.read) && (
            <button 
              id="mark-all-read-btn"
              onClick={markAllAsRead} 
              className="text-[10px] font-bold underline text-cit-blue-100 hover:text-white transition"
              title="Mark all as read"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              id="clear-all-notifs-btn"
              onClick={clearAllNotifications}
              className="text-[10px] text-red-300 hover:text-red-100 font-bold transition flex items-center"
              title="Clear all history"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50 scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20 text-cit-blue-500" />
            No new academic notifications or social requests received.
          </div>
        ) : (
          notifications.map(notif => {
            const sender = getSenderDetails(notif.senderId);
            return (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 flex items-start gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer transition ${!notif.read ? 'bg-cit-blue-50/40 dark:bg-cit-blue-500/5 border-l-2 border-cit-red-500' : ''}`}
              >
                {/* Visual Type Indicator */}
                <div className="shrink-0 relative">
                  {sender?.profilePhoto ? (
                    <img 
                      src={sender.profilePhoto} 
                      alt={sender.name} 
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-cit-blue-100 text-cit-blue-900 font-bold text-center text-xs flex items-center justify-center">
                      {sender?.name.toUpperCase().substring(0, 2) || "?"}
                    </div>
                  )}
                  {/* Badge visual */}
                  <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[8px] ${
                    notif.type === 'connection_request' ? 'bg-green-500' :
                    notif.type === 'connection_accepted' ? 'bg-cit-blue-500' :
                    notif.type === 'message' ? 'bg-yellow-500' :
                    notif.type === 'like' ? 'bg-cit-red-500' : 'bg-purple-500'
                  }`}>
                    {notif.type === 'connection_request' && <UserPlus className="w-2.5 h-2.5" />}
                    {notif.type === 'connection_accepted' && <Check className="w-2.5 h-2.5" />}
                    {notif.type === 'message' && <MessageSquare className="w-2.5 h-2.5" />}
                    {notif.type === 'like' && <Heart className="w-2.5 h-2.5 bg-red-600 rounded-full" />}
                    {notif.type === 'collaborate' && <Briefcase className="w-2.5 h-2.5" />}
                  </span>
                </div>

                {/* Info Text */}
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs text-gray-800 dark:text-gray-205">
                    <span className="font-bold">{sender?.name || 'Unknown Student'}</span> {notif.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {notif.createdAt}
                    </span>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cit-red-500 block"></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-150 dark:border-gray-800/80 bg-gray-50 dark:bg-cit-dark-600/50 p-2.5 text-center text-[10px] text-gray-400">
        Persistently synced to local session storage
      </div>
    </div>
  );
}
