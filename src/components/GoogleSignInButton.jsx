import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const GoogleSignInButton = ({ onSuccess, onError, onLoadingChange }) => {
    const [authenticating, setAuthenticating] = useState(false);

    useEffect(() => {
        onLoadingChange?.(authenticating);
    }, [authenticating, onLoadingChange]);

    useEffect(() => {
        // Load Google Sign-In script
        const scriptId = 'google-gsi-client';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            script.onload = () => {
                initializeGoogle();
            };
        } else if (window.google) {
            initializeGoogle();
        }

        function initializeGoogle() {
            if (window.google?.accounts?.id) {
                // Check if already initialized to avoid "initialized multiple times" warning
                // We use a custom flag since the GSI library doesn't provide an 'isInitialized' check
                if (!window.__google_gsi_initialized) {
                    window.google.accounts.id.initialize({
                        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                        callback: handleCredentialResponse
                    });
                    window.__google_gsi_initialized = true;
                }

                // Responsive width for Google button
                const width = window.innerWidth < 400 ? window.innerWidth - 48 : 400;
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    {
                        theme: 'outline',
                        size: 'large',
                        width,
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'left'
                    }
                );
            }
        }

        return () => {
            // Note: We don't remove the script on unmount to allow re-use of the global 'google' object
            // but we could clear the button if needed.
        };
    }, []);

    const handleCredentialResponse = async (response) => {
        setAuthenticating(true);
        try {
            const res = await apiFetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess(data);
            } else {
                onError(data.error || 'Google sign-in failed');
            }
        } catch (error) {
            onError('Network error during Google sign-in');
        } finally {
            setAuthenticating(false);
        }
    };

    return (
        <div className="my-2 flex w-full flex-col items-center">
            <div
                id="google-signin-button"
                className={`w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex justify-center transition-opacity ${
                    authenticating ? 'pointer-events-none opacity-60' : ''
                }`}
                style={{ minHeight: 44 }}
            ></div>
            {authenticating && (
                <p className="mt-3 text-xs font-semibold tracking-wide text-cyan-300">Signing in with Google...</p>
            )}
        </div>
    );
};

export default GoogleSignInButton;
