import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'], // Enable polling fallback
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('notification', (notif) => {
            toast(notif.message, { icon: '🔔' });
        });

        newSocket.on('prediction_result', (data) => {
            const isDirect = data.precisionLevel === 'direct';
            let message = data.isCorrect
                ? `🎯 BOOM! Prediction on ${data.symbol} was CORRECT! (+Reputation)`
                : `❌ Prediction on ${data.symbol} was incorrect. Better luck next time!`;

            if (isDirect) {
                message = `🔥 BULLSEYE! Dynamic Direct Hit on ${data.symbol}! (+Massive XP)`;
            }

            toast(message, {
                icon: isDirect ? '💎' : (data.isCorrect ? '💰' : '📉'),
                duration: 6000,
                style: {
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0px #000',
                    background: data.isCorrect ? 'var(--color-success)' : 'var(--color-danger)',
                    color: '#fff'
                }
            });
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const value = {
        socket,
        connected
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
