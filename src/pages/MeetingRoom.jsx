import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { SpeechTranscription } from '../utils/speechRecognition';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Users, Monitor, MonitorOff,
    MessageSquare, Hand, Smile, Copy, Clock, MoreVertical, X, Check, Disc, Sparkles,
    LayoutGrid, Settings, Loader2, Bot, ShieldAlert, Plus, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { useDevices } from '../hooks/useDevices';
import SettingsDialog from '../components/SettingsDialog';
import MeetingAgentPanel from '../components/MeetingAgentPanel';

const debugLog = (...args) => {
    if (import.meta.env.DEV) console.log(...args);
};

const debugWarn = (...args) => {
    if (import.meta.env.DEV) console.warn(...args);
};

const MeetingRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();

    // Refs
    const localVideoRef = useRef(null);
    const lobbyVideoRef = useRef(null);
    const peersRef = useRef({});
    const recorderRef = useRef(null);
    const chunksRef = useRef([]); // BUG-003: Store chunks for actual recording
    const messagesEndRef = useRef(null);
    const localStreamRef = useRef(null);
    const preSSOStreamRef = useRef(null); // BUG-011: store camera stream before screen share

    useEffect(() => {
        // FEAT-003: Cleanup media devices on unmount
        return () => {
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            if (preSSOStreamRef.current) preSSOStreamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    // Speech Recognition
    const speechRef = useRef(new SpeechTranscription());

    // State
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [pendingJoiners, setPendingJoiners] = useState([]);
    const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
    const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);
    const [role, setRole] = useState('participant'); // 'host' or 'guest'
    const [isAvatarSpawning, setIsAvatarSpawning] = useState(false);
    const [caption, setCaption] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProxyEnabled, setIsProxyEnabled] = useState(false);
    const [proxySids, setProxySids] = useState(new Set());
    const [reactions, setReactions] = useState({}); // { sid: { emoji, timestamp } }
    const [networkQuality, setNetworkQuality] = useState({}); // { sid: 'good' | 'fair' | 'poor' }
    const [polls, setPolls] = useState([]);
    const [isPollsOpen, setIsPollsOpen] = useState(false);
    // BUG-017 FIX: State-based confirmation instead of window.confirm
    const [confirmDialog, setConfirmDialog] = useState(null); // {message, onConfirm}
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isReactionsOpen, setIsReactionsOpen] = useState(false);

    // Device Hook
    const { devices, selectedDevices, setDevice } = useDevices();

    // Timer Logic
    useEffect(() => {
        const startTime = Date.now();
        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // UI State
    const [isLobbyOpen, setIsLobbyOpen] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'speaker'

    // Peers Map: { [id]: { stream, pc, name, isHandRaised, reaction } }
    const [peers, setPeers] = useState({});

    const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const createPeerConnection = useCallback((targetId, stream) => {
        const pc = new RTCPeerConnection(iceServers);
        if (stream) stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit('ice_candidate', { target: targetId, candidate: e.candidate });
        };

        pc.ontrack = (e) => {
            debugLog(`Track received from ${targetId}`);
            setPeers(prev => ({
                ...prev,
                [targetId]: { ...prev[targetId], stream: e.streams[0], pc }
            }));
        };

        pc.onconnectionstatechange = (e) => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                handleUserLeft(targetId);
            }
        };

        return pc;
    }, [socket]);

    const handleUserLeft = useCallback((sid) => {
        if (peersRef.current[sid]) {
            peersRef.current[sid].pc.close();
            delete peersRef.current[sid];
        }
        setPeers(prev => {
            const newP = { ...prev };
            delete newP[sid];
            return newP;
        });
    }, []);

    const startMeeting = async () => {
        setIsConnecting(true);
        const cleanRoomId = roomId?.trim();

        // Persistent Anonymous ID for Host Recovery
        let anonId = localStorage.getItem('auralis_anon_id');
        if (!anonId) {
            anonId = 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('auralis_anon_id', anonId);
        }

        const userNameToSend = user?.name || 'Guest';
        const userIdToSend = user?.id || user?._id || anonId;

        debugLog("Joining room:", cleanRoomId, "as:", userNameToSend, "User ID:", userIdToSend);
        socket.emit('join_room', {
            room: cleanRoomId,
            user_name: userNameToSend,
            user_id: userIdToSend
        });
        sessionStorage.setItem('active_room', cleanRoomId);
    };

    // Reconnection Logic
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            debugLog("Socket connected/reconnected");
            if (!isLobbyOpen && roomId) {
                const cleanRoomId = roomId?.trim();
                const userNameToSend = user?.name || 'Guest';
                const userIdToSend = user?.id || user?._id;
                debugLog("Automatically rejoining room:", cleanRoomId, "as:", userNameToSend);
                socket.emit('join_room', {
                    room: cleanRoomId,
                    user_name: userNameToSend,
                    user_id: userIdToSend
                });
            }
        };

        socket.on('connect', handleConnect);
        return () => socket.off('connect', handleConnect);
    }, [socket, isLobbyOpen, roomId, user]);

    useEffect(() => {
        const initMedia = async () => {
            try {
                // If it's the lobby, we try to use preferred devices
                const constraints = {
                    video: selectedDevices.videoInput ? { deviceId: { exact: selectedDevices.videoInput } } : true,
                    audio: selectedDevices.audioInput ? { deviceId: { exact: selectedDevices.audioInput } } : true
                };

                debugLog("DEBUG: Requesting media with constraints:", constraints);
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                setLocalStream(stream);
                if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = stream;
            } catch (err) {
                debugWarn("Media capture failed with selected devices, falling back to defaults:", err);

                // If the error is NotFoundError, it means our saved deviceId is gone (unplugged)
                // We should clear the saved deviceId and try again with defaults
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(fallbackStream);
                    if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = fallbackStream;
                } catch (fallbackErr) {
                    console.error("Total media failure (no camera/mic found):", fallbackErr);
                }
            }
        };
        if (isLobbyOpen) initMedia();
    }, [isLobbyOpen, selectedDevices.videoInput, selectedDevices.audioInput]);

    // Keep ref in sync
    useEffect(() => {
        localStreamRef.current = localStream;
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // --- WAKE WORD DETECTION (starts only after user joins the meeting) ---
    useEffect(() => {
        if (isLobbyOpen) {
            // Check for refresh/rejoin
            const activeRoom = sessionStorage.getItem('active_room');
            if (activeRoom === roomId) {
                console.log("Rejoining active session after refresh...");
                setIsLobbyOpen(false);
                startMeeting();
            }
            return; 
        }
        if (!socket) return;

        const speech = speechRef.current;
        speech.start(
            (finalTranscript, interimTranscript) => {
                setCaption(interimTranscript || finalTranscript);

                if (!finalTranscript) return;

                const lower = finalTranscript.toLowerCase();
                const userName = (user?.name || '').toLowerCase();

                // Wake word: "auralis" or user's own name spoken by others
                if (lower.includes('auralis') || (userName && lower.includes(userName))) {
                    debugLog('[WakeWord] Triggered:', finalTranscript);
                    socket.emit('agent_chat', { room: roomId, message: finalTranscript });
                    speech.transcript = '';
                }

                socket.emit('transcript_update', {
                    room: roomId,
                    text: finalTranscript,
                    user_id: user?.id || user?._id
                });
            },
            (err) => debugWarn('[Speech] Error:', err)
        );

        return () => {
            speech.stop();
        };
    }, [isLobbyOpen, socket, roomId, user]);

    useEffect(() => {
        if (!socket) return;

        // Use ref to avoid re-running effect on stream change
        const getStream = () => localStreamRef.current;

        // ----- Socket Listeners -----
        socket.on('role_assigned', ({ role }) => {
            debugLog("Role Assigned:", role);
            setRole(role);
            setIsInWaitingRoom(false);
            setIsConnecting(false);
            setPeers({}); // Clear peers on new role assignment (fresh start)
        });

        socket.on('entry_requested', ({ sid, name }) => {
            debugLog("Entry Requested from:", name, sid);
            setPendingJoiners(prev => {
                // Prevent duplicates
                if (prev.some(p => p.sid === sid)) return prev;
                return [...prev, { sid, name }];
            });
        });

        socket.on('waiting_for_approval', () => {
            debugLog("Waiting for approval...");
            setIsInWaitingRoom(true);
            setIsConnecting(false);
        });

        socket.on('room_joined_success', ({ role }) => {
            setRole(role);
            setIsInWaitingRoom(false);
            setIsConnecting(false);
            setPeers({});
        });

        socket.on('user_joined', ({ sid, name, role: userRole, user_id }) => {
            debugLog("New user joined:", sid, name, user_id);
            setPeers(prev => {
                const newP = { ...prev };
                // Cross-check: If this user_id already exists with a different sid, prune it
                if (user_id) {
                    Object.keys(newP).forEach(oldSid => {
                        if (newP[oldSid].user_id === user_id && oldSid !== sid) {
                            debugLog("DEBUG: Pruning ghost of user_id:", user_id, "Old SID:", oldSid);
                            if (peersRef.current[oldSid]?.pc) {
                                peersRef.current[oldSid].pc.close();
                                delete peersRef.current[oldSid];
                            }
                            delete newP[oldSid];
                        }
                    });
                }
                return { ...newP, [sid]: { pc: null, stream: null, name: name || 'User', role: userRole || 'participant', user_id } };
            });
        });

        socket.on('all_users', ({ users }) => {
            const currentStream = getStream();
            setPeers({}); // Clear state

            // CRITICAL: Clear background refs to prevent ghost connections
            Object.keys(peersRef.current).forEach(sid => {
                if (peersRef.current[sid]?.pc) {
                    peersRef.current[sid].pc.close();
                }
            });
            peersRef.current = {};

            users.forEach(({ sid, name, role: userRole, user_id }) => {
                const pc = createPeerConnection(sid, currentStream);
                peersRef.current[sid] = { pc };
                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    socket.emit('offer', { target: sid, sdp: offer });
                });
                setPeers(prev => ({ ...prev, [sid]: { pc, stream: null, name: name || 'User', role: userRole || 'participant', user_id } }));
            });
        });

        socket.on('offer', async ({ sdp, caller }) => {
            const currentStream = getStream();
            let pc = peersRef.current[caller]?.pc;
            if (!pc) {
                pc = createPeerConnection(caller, currentStream);
                peersRef.current[caller] = { pc };
                setPeers(prev => ({
                    ...prev,
                    [caller]: {
                        ...(prev[caller] || {}), // Preserve existing name/state
                        pc,
                        stream: null
                    }
                }));
            }
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { target: caller, sdp: answer });
        });

        socket.on('answer', async ({ sdp, responder }) => {
            const pc = peersRef.current[responder]?.pc;
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on('ice_candidate', async ({ candidate, sender }) => {
            const pc = peersRef.current[sender]?.pc;
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('chat_message', (msg) => {
            // Prevent duplicate local appending 
            if (msg.sender === socket.id && !msg.isLocal) {
                // Ignore the echo from the server since we appended it locally
                return;
            }
            setMessages(p => [...p, msg]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        socket.on('user_left', ({ sid }) => handleUserLeft(sid));

        // --- Host Control Listeners ---
        socket.on('kicked', () => {
            // FEAT-003: Stop camera usage before navigating
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            if (preSSOStreamRef.current) preSSOStreamRef.current.getTracks().forEach(t => t.stop());
            // BUG-017 FIX: Removed alert(); navigate directly and show notification
            navigate('/');
        });

        socket.on('meeting_ended_redirect', () => {
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            navigate('/');
        });

        socket.on('mute_force', () => {
            // Force mute local tracks
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
                setIsMuted(true);
            }
        });

        socket.on('reaction_received', ({ sid, reaction }) => {
            setReactions(prev => ({ ...prev, [sid]: { emoji: reaction, timestamp: Date.now() } }));
            setTimeout(() => {
                setReactions(prev => {
                    const newR = { ...prev };
                    if (newR[sid]?.emoji === reaction) delete newR[sid];
                    return newR;
                });
            }, 3000);
        });

        socket.on('hand_status_updated', ({ sid, is_raised }) => {
            setPeers(prev => ({
                ...prev,
                [sid]: { ...prev[sid], isHandRaised: is_raised }
            }));
        });

        socket.on('poll_created', (poll) => {
            setPolls(prev => [...prev, poll]);
            if (!isPollsOpen) setIsPollsOpen(true);
        });

        socket.on('vote_received', ({ poll_id, option, voter }) => {
            setPolls(prev => prev.map(p => {
                if (p.id === poll_id) {
                    const newVotes = { ...p.votes };
                    newVotes[option] = [...(newVotes[option] || []), voter];
                    return { ...p, votes: newVotes };
                }
                return p;
            }));
        });

        socket.on('meeting_ended', () => {
            // FEAT-003: Stop camera usage
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            if (preSSOStreamRef.current) preSSOStreamRef.current.getTracks().forEach(t => t.stop());
            // BUG-017 FIX: Removed alert(); navigate directly
            navigate('/');
        });

        socket.on('move_to_breakout', ({ room: targetRoom }) => {
            // BUG-016 FIX: Use React Router navigate instead of window.location.href
            navigate(`/meeting/${targetRoom}`);
        });

        socket.on('proxy_retired', ({ user_id: retiredUserId }) => {
            debugLog("AI Proxy retiring for user:", retiredUserId);
            setPeers(prev => {
                const newP = { ...prev };
                Object.keys(newP).forEach(sid => {
                    if (newP[sid].user_id === retiredUserId && newP[sid].role === 'proxy') {
                        // Close connection if any
                        if (peersRef.current[sid]?.pc) {
                            peersRef.current[sid].pc.close();
                            delete peersRef.current[sid];
                        }
                        delete newP[sid];
                    }
                });
                return newP;
            });
        });

        // Cleanup function only runs on unmount or if socket/roomId changes (unlikely during session)
        // Network Quality Monitor
        const qualityInterval = setInterval(async () => {
            const qualities = {};
            for (const [sid, peer] of Object.entries(peersRef.current)) {
                if (peer.pc) {
                    try {
                        const stats = await peer.pc.getStats();
                        stats.forEach(report => {
                            if (report.type === 'remote-inbound-rtp' || report.type === 'inbound-rtp') {
                                if (report.roundTripTime > 0.3 || report.packetsLost > 5) qualities[sid] = 'poor';
                                else if (report.roundTripTime > 0.1 || report.packetsLost > 1) qualities[sid] = 'fair';
                                else qualities[sid] = 'good';
                            }
                        });
                    } catch (e) { debugWarn("Stats error:", e); }
                }
            }
            if (Object.keys(qualities).length > 0) setNetworkQuality(prev => ({ ...prev, ...qualities }));
        }, 5000);

        socket.on('meeting_ended', () => {
            debugLog("Meeting ended by host");
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            sessionStorage.removeItem('active_room');
            addToast({ type: 'info', title: 'Meeting Ended', message: 'The host has ended this meeting for all participants.' });
            setTimeout(() => navigate('/'), 1500);
        });

        return () => {
            clearInterval(qualityInterval);
            socket.emit('leave_room', { room: roomId });
            // BUG-010 FIX: Only remove specific listeners, not ALL socket listeners
            socket.off('role_assigned');
            socket.off('entry_requested');
            socket.off('waiting_for_approval');
            socket.off('room_joined_success');
            socket.off('user_joined');
            socket.off('all_users');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice_candidate');
            socket.off('chat_message');
            socket.off('user_left');
            socket.off('kicked');
            socket.off('mute_force');
            socket.off('reaction_received');
            socket.off('hand_status_updated');
            socket.off('poll_created');
            socket.off('vote_received');
            socket.off('meeting_ended');
            socket.off('move_to_breakout');
            socket.off('proxy_retired');
        };
    }, [socket, roomId, createPeerConnection, handleUserLeft]);

    // Handlers
    const handleApprove = (sid) => {
        socket.emit('approve_entry', { room: roomId, target_sid: sid });
        setPendingJoiners(prev => prev.filter(p => p.sid !== sid));
    };

    const handleDeny = (sid) => {
        socket.emit('deny_entry', { room: roomId, target_sid: sid });
        setPendingJoiners(prev => prev.filter(p => p.sid !== sid));
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const msgText = newMessage.trim();
        if (msgText && socket) {
            const senderId = user?.id || user?._id || localStorage.getItem('auralis_anon_id') || 'guest';
            
            // Append locally first for instant feedback
            const localMsg = {
                sender: socket.id,
                message: msgText,
                senderName: user?.name || 'You',
                isLocal: true
            };
            setMessages(p => [...p, localMsg]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

            socket.emit('chat_message', {
                room: roomId,
                message: msgText,
                sender: senderId,
                senderName: user?.name || 'Guest'
            });
            setNewMessage("");
        }
    };

    const handleKick = (sid) => {
        // BUG-017 FIX: Use state dialog instead of window.confirm
        setConfirmDialog({
            message: 'Remove this user from the meeting?',
            onConfirm: () => {
                socket.emit('kick_user', { room: roomId, target_sid: sid });
                setConfirmDialog(null);
            }
        });
    };

    const handleMuteAll = () => {
        // BUG-017 FIX: Use state dialog instead of window.confirm
        setConfirmDialog({
            message: 'Mute all participants?',
            onConfirm: () => {
                socket.emit('mute_all', { room: roomId });
                setConfirmDialog(null);
            }
        });
    };

    const handleToggleProxy = () => {
        const newState = !isProxyEnabled;
        setIsProxyEnabled(newState);
        socket.emit('toggle_proxy', { room: roomId, enabled: newState });
    };

    const handleEndMeetingForAll = () => {
        // BUG-017 FIX: Use state dialog instead of window.confirm
        setConfirmDialog({
            message: 'End meeting for all participants?',
            onConfirm: () => {
                const durationFormatted = formatTime(elapsedTime);
                socket.emit('end_meeting', {
                    room: roomId,
                    user_id: user?.id || user?._id || localStorage.getItem('auralis_anon_id'),
                    title: `Instant Meeting (${format(new Date(), 'MMM d, p')})`,
                    duration: durationFormatted,
                    participants_count: Object.keys(peers).length + 1
                });
                socket.emit('end_meeting_for_all', { room: roomId });
                sessionStorage.removeItem('active_room'); // Clear on exit
                setConfirmDialog(null);
                // FEAT-003
                if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
                setTimeout(() => navigate('/'), 500);
            }
        });
    };

    const handleJustLeave = () => {
        // If we are host leaving, we should ideally save the meeting up to this point
        const durationFormatted = formatTime(elapsedTime);
        socket.emit('end_meeting', {
            room: roomId,
            user_id: user?.id || user?._id || localStorage.getItem('auralis_anon_id'),
            title: `Instant Meeting (${format(new Date(), 'MMM d, p')})`,
            duration: durationFormatted,
            participants_count: Object.keys(peers).length + 1
        });
        sessionStorage.removeItem('active_room'); // Clear on exit
        // FEAT-003
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        setTimeout(() => navigate('/'), 500);
    };

    const toggleHand = () => {
        const newState = !isHandRaised;
        setIsHandRaised(newState);
        socket.emit('raise_hand', { room: roomId, is_raised: newState });
    };

    const sendReaction = (emoji) => {
        socket.emit('send_reaction', { room: roomId, reaction: emoji });
        // Also show local reaction
        setReactions(prev => ({ ...prev, local: { emoji, timestamp: Date.now() } }));
        setTimeout(() => {
            setReactions(prev => {
                const newR = { ...prev };
                if (newR.local?.emoji === emoji) delete newR.local;
                return newR;
            });
        }, 3000);
    };

    const createPoll = (question, options) => {
        socket.emit('create_poll', { room: roomId, question, options });
    };

    const castVote = (poll_id, option) => {
        socket.emit('cast_vote', { room: roomId, poll_id, option });
    };

    const handleDeviceChange = async (type, deviceId) => {
        setDevice(type, deviceId);

        if (type === 'audioOutput') {
            // Audio output changing is simple for most elements, but we might need 
            // to setSinkId on audio elements. For now, we trust the system/browser default.
            return;
        }

        // Hot-swap Audio or Video track
        try {
            const constraints = type === 'videoInput'
                ? { video: { deviceId: { exact: deviceId } } }
                : { audio: { deviceId: { exact: deviceId } } };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = type === 'videoInput' ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];

            if (localStream) {
                const oldTrack = type === 'videoInput' ? localStream.getVideoTracks()[0] : localStream.getAudioTracks()[0];
                if (oldTrack) oldTrack.stop();

                // Update Peer Connections
                Object.values(peersRef.current).forEach(({ pc }) => {
                    if (pc) {
                        const senders = pc.getSenders();
                        const sender = senders.find(s => s.track?.kind === (type === 'videoInput' ? 'video' : 'audio'));
                        if (sender) {
                            sender.replaceTrack(newTrack);
                        } else {
                            // If no sender found (e.g. they joined without webcam?), add it?
                            // For MVP, we assume they have a sender if they have a track.
                        }
                    }
                });

                // Update Local Stream State
                const tracks = type === 'videoInput'
                    ? [newTrack, ...localStream.getAudioTracks()]
                    : [...localStream.getVideoTracks(), newTrack];

                const combinedStream = new MediaStream(tracks);
                setLocalStream(combinedStream);
                localStreamRef.current = combinedStream; // ensure ref is updated for cleanup
            }
        } catch (err) {
            console.error(`Failed to switch ${type}:`, err);
        }
    };

    const handleScreenShare = async () => {
        if (isScreenSharing) {
            // BUG-011 FIX: Restore original camera stream instead of re-requesting
            const prevStream = preSSOStreamRef.current;
            if (prevStream) {
                const videoTrack = prevStream.getVideoTracks()[0];
                setLocalStream(prevStream);
                if (localVideoRef.current) localVideoRef.current.srcObject = prevStream;
                Object.values(peersRef.current).forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && videoTrack) sender.replaceTrack(videoTrack);
                });
                preSSOStreamRef.current = null;
            } else {
                // Fallback: request new camera if original was lost
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const videoTrack = stream.getVideoTracks()[0];
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                Object.values(peersRef.current).forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(videoTrack);
                });
            }
            setIsScreenSharing(false);
        } else {
            // Start Screen Share
            try {
                preSSOStreamRef.current = localStreamRef.current; // BUG-011: save camera stream
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = stream.getVideoTracks()[0];
                screenTrack.onended = () => handleScreenShare(); // auto-restore when user stops via browser
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                Object.values(peersRef.current).forEach(({ pc }) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Screen share failed", err);
            }
        }
    };

    const toggleRecording = async () => {
        // FEAT-004: Implement actual MediaRecorder logic BUG-003
        if (!isRecording) {
            try {
                // Get screen and audio
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                const tracks = [...displayStream.getVideoTracks(), ...displayStream.getAudioTracks(), ...audioStream.getAudioTracks()];
                const combinedStream = new MediaStream(tracks);

                const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
                
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                
                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `Meeting_Recording_${roomId}_${new Date().toISOString()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    chunksRef.current = [];
                    // stop the tracks we created
                    combinedStream.getTracks().forEach(t => t.stop());
                    displayStream.getTracks().forEach(t => t.stop());
                    audioStream.getTracks().forEach(t => t.stop());
                };
                
                // Stop recording natively if user stops sharing screen
                displayStream.getVideoTracks()[0].onended = () => {
                    if (recorderRef.current && recorderRef.current.state === 'recording') {
                        recorderRef.current.stop();
                        setIsRecording(false);
                    }
                };

                recorderRef.current = recorder;
                recorder.start(1000);
                addToast({ 
                    type: 'success', 
                    title: 'Recording Started', 
                    message: 'Meeting recording active. (For best results, share "This Tab" with audio)' 
                });
            } catch (err) {
                console.error("Recording error:", err);
                setIsRecording(false);
                addToast({ type: 'error', title: 'Recording Failed', message: 'Could not start recording. Did you cancel the screen share?' });
            }
        } else {
            if (recorderRef.current && recorderRef.current.state === 'recording') {
                recorderRef.current.stop();
                setIsRecording(false);
                addToast({ type: 'info', title: 'Recording Stopped', message: 'Your recording is being saved.' });
            }
        }
    };

    // --- RENDER ---

    if (isLobbyOpen) {
        return (
            <>
            <div className="h-screen bg-[#0f111a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Inter',sans-serif]">
                {/* BUG-024 FIX: Removed external noise.svg URL - using CSS grain effect instead */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10"
                >
                    <div className="space-y-10">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="h-6 w-6 text-blue-400" />
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Auralis Workspace</span>
                            </div>
                            <h1 className="text-6xl font-black mb-6 tracking-tighter leading-[1.1]">
                                Ready to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">connect?</span>
                            </h1>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-md">
                                You are about to join room <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded-lg">{roomId}</span>.
                                Adjust your audio and video before entering.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setIsLobbyOpen(false); startMeeting(); }}
                                disabled={isConnecting}
                                className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                            >
                                {isConnecting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <span>Join Now</span>
                                )}
                            </button>
                            <button onClick={() => navigate('/')} className="px-8 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-lg text-slate-300 transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="relative group perspective-1000">
                        <motion.div
                            className="relative bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video transform-gpu transition-transform duration-500 group-hover:rotate-y-2 group-hover:rotate-x-2"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            <video ref={lobbyVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />

                            {!localStream && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
                                    <VideoOff className="h-16 w-16 text-slate-700 mb-6" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Camera Off</p>
                                </div>
                            )}

                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
                                <button onClick={() => { localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled); setIsMuted(!isMuted); }} className={`p-4 rounded-full backdrop-blur-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                </button>
                                <button onClick={() => { localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled); setIsVideoOff(!isVideoOff); }} className={`p-4 rounded-full backdrop-blur-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                    {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                                </button>
                            </div>
                        </motion.div>
                        {/* 3D decorative elements */}
                        <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[48px] blur-2xl opacity-20 -z-10 group-hover:opacity-30 transition-opacity" />
                    </div>
                </motion.div>
            </div>
            {/* BUG-017 FIX: Confirm dialog modal - inside outermost div */}
            {confirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <p className="text-white font-semibold text-lg mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-400 transition-all">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            </>
        );
    }

    if (isInWaitingRoom) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-['Inter',sans-serif] relative overflow-hidden text-white">  {/* BUG-027 FIX: replaced font-outfit */}
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl text-center relative z-10"
                >
                    <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 relative group">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <Loader2 className="h-10 w-10 text-blue-500 relative z-10" />
                        </motion.div>
                    </div>

                    <h1 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                        Almost there!
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        The host has been notified. They'll let you in any moment now.
                    </p>

                    <div className="flex flex-col gap-3">
                        <div className="py-3 px-6 bg-white/5 rounded-2xl border border-white/5 text-sm font-medium text-slate-300">
                            Room ID: <span className="text-blue-400 font-mono tracking-widest uppercase">{roomId}</span>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 text-slate-500 hover:text-white transition-colors text-sm font-medium underline underline-offset-4 decoration-slate-700"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const peerCount = Object.keys(peers).length;

    return (
        <div className="h-screen bg-[#101114] text-white flex flex-col overflow-hidden relative font-['Inter',sans-serif]">

            {/* --- Main Stage --- */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Video Grid */}
                <motion.div
                    layout
                    className={`flex-1 p-4 lg:p-6 grid gap-4 lg:gap-6 transition-all duration-500 content-center justify-items-center overflow-y-auto
                    ${peerCount === 0 ? 'grid-cols-1 max-w-5xl mx-auto w-full' :
                            peerCount === 1 ? 'grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto w-full' :
                                peerCount <= 3 ? 'grid-cols-1 sm:grid-cols-2 max-w-7xl mx-auto w-full' :
                                    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                        }`}
                >
                    <AnimatePresence mode="popLayout">
                        {/* Local User Card */}
                        <VideoCard
                            key="local"
                            isLocal={true}
                            videoRef={localVideoRef}
                            name={user?.name || 'You'}
                            isMuted={isMuted}
                            stream={localStream}
                            isHandRaised={isHandRaised}
                        />

                        {/* AI Participant Card */}
                        {isAvatarSpawning && (
                            <VideoCard
                                key="auralis_ai"
                                isAI={true}
                                name="Auralis AI"
                            />
                        )}

                        {/* Remote Users Cards */}
                        {Object.keys(peers)
                            .filter(pid => peers[pid].role !== 'background_ai')
                            .map(pid => (
                                <VideoCard
                                    key={pid}
                                    name={peers[pid].name}
                                    stream={peers[pid].stream}
                                    isMuted={peers[pid].isMuted}
                                    isAI={peers[pid].role === 'proxy'}
                                    isHandRaised={peers[pid].isHandRaised}
                                    reaction={reactions[pid]?.emoji}
                                    quality={networkQuality[pid] || 'good'}
                                />
                            ))}
                    </AnimatePresence>
                </motion.div>

                {/* AI Meeting Agent Panel */}
                <AnimatePresence>
                    {isAIPanelOpen && (
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="absolute top-4 right-4 z-[70] w-[calc(100vw-32px)] sm:w-[320px] max-h-[calc(100vh-140px)] overflow-hidden"
                        >
                            <MeetingAgentPanel
                                socket={socket}
                                roomId={roomId?.trim()}
                                userId={user?.id || user?._id}
                                isProxyEnabled={isProxyEnabled}
                                onToggleProxy={handleToggleProxy}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Side Panel (Right) --- */}
                <AnimatePresence>
                    {(isChatOpen || isParticipantsOpen) && (
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed md:relative inset-y-0 right-0 w-full md:w-[360px] bg-white rounded-l-[0px] md:rounded-l-[24px] shadow-2xl z-[60] md:z-20 flex flex-col md:m-4 md:mr-0 md:mb-24 overflow-hidden"
                            style={{ backgroundColor: '#1e2029' }}
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-lg ml-2">
                                    {isParticipantsOpen ? 'People' : 'In-call messages'}
                                </h3>
                                <button onClick={() => { setIsChatOpen(false); setIsParticipantsOpen(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                {isParticipantsOpen && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">In Meeting ({peerCount + 1})</div>

                                        {role === 'host' && (
                                            <button
                                                onClick={handleMuteAll}
                                                className="w-full mb-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <MicOff className="h-3 w-3 group-hover:text-red-400 transition-colors" /> Mute All
                                            </button>
                                        )}

                                        {/* Local User */}
                                        <div className="flex items-center gap-3 p-3 mb-2 bg-white/5 border border-white/5 rounded-2xl">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">
                                                {(user?.name || 'Y')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold flex items-center gap-2 truncate">
                                                    {user?.name || 'You'} <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold">You</span>
                                                </div>
                                                <div className="text-xs text-slate-500">{role === 'host' ? 'Meeting Host' : 'Participant'}</div>
                                                {isProxyEnabled && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Bot className="h-3 w-3 text-blue-400" />
                                                        <span className="text-[10px] text-blue-400 font-bold uppercase">Proxy Enabled</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2">
                                                {isMuted ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4 text-slate-400" />}
                                            </div>
                                        </div>

                                        {/* Remote Users */}
                                        {Object.keys(peers)
                                            .filter(pid => peers[pid].role !== 'background_ai')
                                            .map(pid => (
                                                <div key={pid} className="flex items-center gap-3 p-3 mb-2 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-2xl transition-all group">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${peers[pid].role === 'host' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20' : peers[pid].role === 'proxy' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20' : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20'}`}>
                                                        {(peers[pid].name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold flex items-center gap-2 truncate">
                                                            {peers[pid].name || `User ${pid.substring(0, 4)}`}
                                                            {peers[pid].role === 'host' && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20">Host</span>
                                                            )}
                                                            {peers[pid].role === 'proxy' && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider border border-indigo-500/20 flex items-center gap-1">
                                                                    <Bot className="h-2.5 w-2.5" /> AI Proxy
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 text-[10px] uppercase tracking-wider font-medium opacity-60">
                                                            {peers[pid].role === 'host' ? 'Meeting Host' : peers[pid].role === 'proxy' ? 'AI Assistant' : 'Participant'}
                                                        </div>
                                                        {proxySids.has(pid) && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Bot className="h-3 w-3 text-purple-400" />
                                                                <span className="text-[10px] text-purple-400 font-bold uppercase">Proxy Active</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {role === 'host' && peers[pid].role !== 'host' && (
                                                            <button
                                                                onClick={() => handleKick(pid)}
                                                                className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                                title="Remove User"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <div className="p-2">
                                                            {peers[pid].isMuted ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4 text-slate-600" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Pending Users */}
                                        {pendingJoiners.length > 0 && role === 'host' && (
                                            <div className="mt-8">
                                                <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2">Waiting ({pendingJoiners.length})</div>
                                                {pendingJoiners.map(({ sid, name }) => (
                                                    <div key={sid} className="bg-white/5 p-3 rounded-xl mb-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-bold">{name}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleApprove(sid)} className="flex-1 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30">Admit</button>
                                                            <button onClick={() => handleDeny(sid)} className="flex-1 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30">Deny</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isChatOpen && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 scrollbar-custom">
                                            {messages.length === 0 && (
                                                <div className="text-center text-slate-500 mt-10">
                                                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm">No messages yet.</p>
                                                </div>
                                            )}
                                            {messages.map((m, i) => (
                                                <div key={i} className={`flex flex-col ${m.sender === socket.id ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-xs font-bold text-slate-400">{m.sender === socket.id ? 'You' : 'Participant'}</span>
                                                        <span className="text-[10px] text-slate-600">{format(new Date(), 'HH:mm')}</span>
                                                    </div>
                                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm leading-relaxed ${m.sender === socket.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                                                        {m.message}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <form onSubmit={handleSendMessage} className="relative mt-auto">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder="Send a message..."
                                                className="w-full bg-slate-950/40 border border-white/10 py-3.5 px-5 rounded-2xl text-sm outline-none text-white placeholder-slate-500 focus:border-blue-500/50 transition-all pr-12"
                                            />
                                            <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl disabled:opacity-0 disabled:scale-75 transition-all">
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {isPollsOpen && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-custom">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xl font-black">Live Polls</h3>
                                                {role === 'host' && (
                                                    <button
                                                        onClick={() => {
                                                            const q = prompt("Enter question:");
                                                            const ops = prompt("Enter options (comma separated):")?.split(',');
                                                            if (q && ops) createPoll(q, ops.map(o => o.trim()));
                                                        }}
                                                        className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {polls.length === 0 && (
                                                <div className="text-center text-slate-500 mt-10">
                                                    <LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm font-medium">No polls active.</p>
                                                </div>
                                            )}
                                            {polls.map(poll => (
                                                <div key={poll.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4">
                                                    <div className="font-bold text-lg leading-tight">{poll.question}</div>
                                                    <div className="space-y-3">
                                                        {poll.options.map(opt => {
                                                            const optVotes = poll.votes[opt] || [];
                                                            const voteCount = optVotes.length;
                                                            const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b.length, 0);
                                                            const pct = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                                                            const hasVoted = optVotes.includes(socket.id);

                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    onClick={() => castVote(poll.id, opt)}
                                                                    className={`w-full text-left relative overflow-hidden rounded-2xl border transition-all ${hasVoted ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-white/20 bg-white/5'}`}
                                                                >
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${pct}%` }}
                                                                        className="absolute inset-y-0 left-0 bg-blue-500/10 transition-all duration-1000"
                                                                    />
                                                                    <div className="relative p-4 flex justify-between items-center text-sm font-bold">
                                                                        <span className="flex items-center gap-2">
                                                                            {opt}
                                                                            {hasVoted && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                                        </span>
                                                                        <span className="opacity-40">{voteCount}</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Emoji Feedback Layer (Global) */}
            <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
                <AnimatePresence>
                    {reactions.local && (
                        <motion.div
                            initial={{ scale: 0, y: 50, opacity: 0 }}
                            animate={{ scale: 1.5, y: -100, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="text-8xl"
                        >
                            {reactions.local.emoji}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- Bottom Dock Control Bar --- */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full sm:w-auto px-2 sm:px-0 max-w-[98vw] flex flex-col items-center justify-center gap-4">
                
                <AnimatePresence>
                    {isReactionsOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="bg-[#1e2029]/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-2 flex gap-1"
                        >
                            {['👏', '❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                                <button 
                                    key={emoji} 
                                    onClick={() => { sendReaction(emoji); setIsReactionsOpen(false); }} 
                                    className="text-3xl hover:scale-125 transition-transform p-2"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center bg-[#1a1c24]/90 backdrop-blur-xl border border-white/5 rounded-[20px] sm:rounded-[24px] shadow-2xl ring-1 ring-white/5 overflow-visible">
                    
                    {/* SCROLLABLE AREA: MAIN CONTROLS */}
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 overflow-x-auto scrollbar-none flex-nowrap min-w-0">
                        <div className="hidden sm:block text-slate-400 text-xs font-bold px-3 border-r border-white/10 flex-shrink-0">
                            {formatTime(elapsedTime)}
                            <span className="mx-2">•</span>
                            {roomId}
                        </div>

                        <ControlButton onClick={() => { localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled); setIsMuted(!isMuted); }} active={!isMuted} icon={isMuted ? MicOff : Mic} danger={isMuted} />
                        <ControlButton onClick={() => { localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled); setIsVideoOff(!isVideoOff); }} active={!isVideoOff} icon={isVideoOff ? VideoOff : Video} danger={isVideoOff} />

                        <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />

                        <ControlButton onClick={() => setIsReactionsOpen(!isReactionsOpen)} active={isReactionsOpen} icon={Smile} />

                        <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />

                        <ControlButton onClick={toggleHand} active={isHandRaised} icon={Hand} />
                        <ControlButton onClick={handleScreenShare} active={isScreenSharing} icon={isScreenSharing ? MonitorOff : Monitor} />
                        <ControlButton onClick={() => setIsAIPanelOpen(!isAIPanelOpen)} active={isAIPanelOpen} icon={Bot} />

                        <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />

                        <ControlButton onClick={() => { setIsChatOpen(!isChatOpen); setIsParticipantsOpen(false); }} active={isChatOpen} icon={MessageSquare} />
                        <ControlButton onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); setIsPollsOpen(false); }} active={isParticipantsOpen} icon={Users} badge={peerCount + 1 + pendingJoiners.length} />
                        <ControlButton onClick={() => { setIsPollsOpen(!isPollsOpen); setIsChatOpen(false); setIsParticipantsOpen(false); }} active={isPollsOpen} icon={LayoutGrid} />
                        <ControlButton onClick={() => setIsSettingsOpen(true)} icon={Settings} />
                    </div>

                    {/* FIXED AREA: SEPARATOR + HANG UP (Outside Scroll) */}
                    <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0" />
                    
                    <div className="px-3 sm:px-4 py-2 sm:py-3 overflow-visible">
                        {role === 'host' ? (
                            <div className="relative group">
                                <button
                                    onClick={() => setIsLeaveMenuOpen(!isLeaveMenuOpen)}
                                    className="w-14 h-12 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 flex-shrink-0"
                                >
                                    <PhoneOff className="h-5 w-5 fill-current" />
                                </button>
                                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ${isLeaveMenuOpen ? 'flex' : 'hidden'} flex-col gap-1 bg-[#1e2029] p-2 rounded-xl border border-white/10 shadow-xl min-w-[140px]`}>
                                    <button onClick={handleJustLeave} className="px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg text-white">
                                        Just Leave
                                    </button>
                                    <button onClick={handleEndMeetingForAll} className="px-3 py-2 text-sm text-left hover:bg-red-500/20 rounded-lg text-red-500 font-bold">
                                        End for All
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={handleJustLeave} className="w-14 h-12 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 flex-shrink-0">
                                <PhoneOff className="h-5 w-5 fill-current" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications / Toast */}
            {
                pendingJoiners.length > 0 && role === 'host' && !isParticipantsOpen && (
                    <div className="absolute top-6 right-6 z-50">
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-slate-900 border border-yellow-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm">{pendingJoiners.length} Waiting</div>
                                <div className="text-xs text-slate-400">Click People to admit</div>
                            </div>
                            <button onClick={() => { setIsParticipantsOpen(true); setIsChatOpen(false); }} className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors">
                                View
                            </button>
                        </motion.div>
                    </div>
                )
            }

            {confirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <p className="text-white font-semibold text-lg mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-400 transition-all">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <SettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                devices={devices}
                selectedDevices={selectedDevices}
                onDeviceChange={handleDeviceChange}
            />
        </div >
    );
};

const ControlButton = ({ onClick, active, icon: Icon, danger, badge }) => (
    <div className="relative">
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0
                ${danger ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' :
                    active ? (Icon === Mic || Icon === Video ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20') :
                        'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
        >
            <Icon className="h-5 w-5" />
        </button>
        {badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#1a1c24]">
                {badge}
            </span>
        )}
    </div>
);

const VideoCard = ({ stream, isLocal, isAI, videoRef: externalRef, name, isMuted, isHandRaised, reaction, quality }) => {
    const internalRef = useRef(null);
    const videoRef = externalRef || internalRef;

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, videoRef]);

    if (isAI) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative w-full h-full rounded-[24px] overflow-hidden bg-gradient-to-br from-[#1e2029] to-[#0f111a] ring-2 ring-blue-500/30 shadow-2xl flex flex-col items-center justify-center border border-white/5"
            >
                <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                    <Sparkles className="h-16 w-16 text-blue-400 relative z-10" />
                </div>
                <h3 className="text-xl font-black text-white tracking-widest uppercase">{name}</h3>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-2">{name === 'Auralis AI' ? 'Neural Participant Active' : 'AI Proxy Active'}</p>

                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-black tracking-wide text-blue-400">AI LISTENING</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className={`group relative w-full h-full rounded-[24px] overflow-hidden bg-[#1e2029] ring-1 ring-white/5 shadow-2xl ${isAI ? 'ring-2 ring-indigo-500/30' : ''}`}
            style={{
                transformStyle: 'preserve-3d',
                transform: 'perspective(1000px)'
            }}
            whileHover={{ scale: 1.01 }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

            {/* Label */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg flex items-center gap-2">
                    {isLocal && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    <span className="text-xs font-bold tracking-wide text-white/90">{name}</span>
                </div>
            </div>

            {/* Mute Status Icon (Top Right) */}
            {isMuted && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                    <MicOff className="h-4 w-4 text-red-500" />
                </div>
            )}

            {/* Hand Raised & Reaction */}
            <div className="absolute top-4 left-4 flex gap-2">
                <AnimatePresence>
                    {isHandRaised && (
                        <motion.div
                            initial={{ scale: 0, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            exit={{ scale: 0, x: -20 }}
                            className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40"
                        >
                            <Hand className="h-6 w-6 text-black fill-current" />
                        </motion.div>
                    )}
                    {reaction && (
                        <motion.div
                            initial={{ scale: 0, x: -20 }}
                            animate={{ scale: 1, x: 0 }}
                            exit={{ scale: 0, x: -20 }}
                            className="bg-black/40 backdrop-blur-md rounded-2xl px-3 py-1 text-2xl border border-white/10 shadow-xl"
                        >
                            {reaction}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Network Quality Indicator (Top Left, after hand/reaction) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 flex gap-0.5 items-end h-5">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`w-1 rounded-full transition-all ${quality === 'poor' ? (i === 1 ? 'bg-red-500 h-2' : 'bg-white/10 h-2') :
                        quality === 'fair' ? (i <= 2 ? 'bg-yellow-500 h-' + (i * 1.5 + 2) : 'bg-white/10 h-2') :
                            'bg-green-500 h-' + (i * 1.5 + 2)
                        }`} />
                ))}
            </div>

            {/* Speaking Indicator (Border Glow) */}
            {/* This would need audio analysis, placeholders for now */}
        </motion.div>
    );
};

export default MeetingRoom;
