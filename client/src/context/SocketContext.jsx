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
        // Use relative URL to let Vite proxy handle the connection
        const newSocket = io({
            transports: ['websocket', 'polling'],
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity, // Keep trying forever
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        // Handle connection errors gracefully to avoid console noise
        newSocket.on('connect_error', (err) => {
            console.warn('Socket connection error (retrying...):', err.message);
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
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
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
