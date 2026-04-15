import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // BUG-005 FIX: Use same origin in dev to utilize Vite proxy for WebSockets
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
        const newSocket = io(SOCKET_URL, {
            path: '/socket.io',
            transports: ['polling', 'websocket'], // Start with polling for stability
            autoConnect: true,
            withCredentials: true,
        });

        console.log(`[Socket] Connecting to ${SOCKET_URL}`);

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
