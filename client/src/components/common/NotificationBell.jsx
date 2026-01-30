import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { getNotifications, markAllNotificationsRead } from '../../services/api';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import './Navbar.css'; // Re-use Navbar styles or create specific ones

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { socket } = useSocket();

    const fetchNotifications = async () => {
        try {
            const { data } = await getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Listen for real-time notifications
        if (socket) {
            socket.on('notification:new', (newNotification) => {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });
        }

        return () => {
            if (socket) {
                socket.off('notification:new');
            }
        };
    }, [socket]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen && unreadCount > 0) {
            markAllNotificationsRead();
            setUnreadCount(0);
            // Optimistically mark all as read locally
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative', marginRight: '1rem' }}>
            <button
                onClick={handleToggle}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', position: 'relative' }}
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '0.7rem',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown brute-frame" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    marginTop: '10px'
                }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>Notifications</div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>No notifications</div>
                    ) : (
                        notifications.map(n => (
                            <Link
                                key={n._id}
                                to={n.link}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    display: 'block',
                                    padding: '0.8rem',
                                    borderBottom: '1px solid #222',
                                    color: n.isRead ? '#aaa' : '#fff',
                                    textDecoration: 'none',
                                    backgroundColor: n.isRead ? 'transparent' : 'rgba(76, 175, 80, 0.1)'
                                }}
                            >
                                <div style={{ fontSize: '0.9rem' }}>{n.content}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                                    {new Date(n.createdAt).toLocaleDateString()}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
