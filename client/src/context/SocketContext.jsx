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
        // Use explicit URL to avoid proxy issues
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (import.meta.env.MODE === 'development') {
            console.log(' Connecting to WebSocket at:', SOCKET_URL);
        }

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'], // Try websocket first if possible? No, standard array is safer.
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        // Handle connection errors gracefully to avoid console noise
        newSocket.on('connect_error', (err) => {
            console.warn('Socket connection error (retrying...):', err.message);
        });

        newSocket.on('connect', () => {
            if (import.meta.env.MODE === 'development') {
                console.log(' WebSocket Connected!', newSocket.id);
            }
            setConnected(true);
        });

        newSocket.on('notification', (notif) => {
            toast(notif.message);
        });

        newSocket.on('prediction_result', (data) => {
            const isDirect = data.precisionLevel === 'direct';
            let message = data.isCorrect
                ? `Prediction on ${data.symbol} was CORRECT! (+Reputation)`
                : `Prediction on ${data.symbol} was incorrect. Better luck next time!`;

            if (isDirect) {
                message = `BULLSEYE! Dynamic Direct Hit on ${data.symbol}! (+Massive XP)`;
            }

            toast(message, {
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
