import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { normalizeUser } from '../utils/userProfile';
import { apiFetch } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch actual profile from backend to get real name & image
    const fetchProfile = async (fallbackUser) => {
        try {
            const res = await apiFetch('/api/profile/');
            if (res.ok) {
                const data = await res.json();
                const profile = data.profile || {};
                // Merge backend profile data over JWT data
                setUser(normalizeUser({
                    ...fallbackUser,
                    name: profile.name || fallbackUser.name,
                    profile_image: profile.profile_image || fallbackUser.profile_image,
                    email: profile.email || fallbackUser.email,
                }));
            }
        } catch (e) {
            // Silently fall back to JWT data
            console.warn('[Auth] Could not fetch profile, using JWT data');
        }
    };

    useEffect(() => {
        // Check for existing token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    const jwtUser = normalizeUser({
                        id: decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        profile_image: decoded.profile_image,
                        provider: decoded.provider,
                        role: decoded.role,
                        ...decoded
                    });
                    setUser(jwtUser);
                    // Fetch real profile from API to get actual name/image
                    fetchProfile(jwtUser);
                }
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        const jwtUser = normalizeUser({ id: decoded.sub, ...decoded, ...userData });
        setUser(jwtUser);
        // Fetch real profile to update name/image
        fetchProfile(jwtUser);
    };

    const updateUser = (partialUser) => {
        setUser((current) => normalizeUser({ ...(current || {}), ...(partialUser || {}) }));
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auralis_custom_display_name');
        localStorage.removeItem('auralis_custom_avatar_url');
        setUser(null);
        window.location.href = '/login';
    };

    const value = {
        user,
        loading,
        login,
        updateUser,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

