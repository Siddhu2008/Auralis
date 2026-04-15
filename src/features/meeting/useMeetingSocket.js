import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export function useMeetingSocket({ meetingId, meetingAccessToken, displayName }) {
  const socket = useSocket();
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [role, setRole] = useState('participant');
  const [selfSid, setSelfSid] = useState(null);

  useEffect(() => {
    if (!socket || !meetingAccessToken) return undefined;

    const onJoined = (payload) => {
      setRole(payload.role || 'participant');
      setSelfSid(payload.self_sid || null);
      setParticipants(payload.participants || []);
      setEvents((prev) => [...prev, { type: 'joined', payload }]);
    };
    const onParticipantJoined = (payload) => {
      setParticipants((prev) => [...prev.filter((p) => p.sid !== payload.sid), payload]);
      setEvents((prev) => [...prev, { type: 'participant_joined', payload }]);
    };
    const onParticipantLeft = (payload) => {
      setParticipants((prev) => prev.filter((p) => p.sid !== payload.sid));
      setEvents((prev) => [...prev, { type: 'participant_left', payload }]);
    };
    const onMessage = (payload) => setEvents((prev) => [...prev, { type: 'chat', payload }]);
    const onError = (payload) => setEvents((prev) => [...prev, { type: 'error', payload }]);

    socket.on('meeting:joined', onJoined);
    socket.on('meeting:participant_joined', onParticipantJoined);
    socket.on('meeting:participant_left', onParticipantLeft);
    socket.on('meeting:chat', onMessage);
    socket.on('meeting:error', onError);

    socket.emit('meeting:join', { meeting_access_token: meetingAccessToken, meeting_id: meetingId, display_name: displayName });

    return () => {
      socket.emit('meeting:leave', { meeting_id: meetingId });
      socket.off('meeting:joined', onJoined);
      socket.off('meeting:participant_joined', onParticipantJoined);
      socket.off('meeting:participant_left', onParticipantLeft);
      socket.off('meeting:chat', onMessage);
      socket.off('meeting:error', onError);
    };
  }, [socket, meetingId, meetingAccessToken, displayName]);

  const controls = useMemo(
    () => ({
      sendSignal(targetSid, payload) {
        socket?.emit('meeting:signal', { meeting_id: meetingId, target_sid: targetSid, payload });
      },
      sendChat(message, messageType = 'text', metadata = {}) {
        socket?.emit('meeting:chat', { meeting_id: meetingId, message, message_type: messageType, metadata });
      },
      sendTranscript(text) {
        socket?.emit('meeting:transcript', { meeting_id: meetingId, text });
      },
      raiseHand(raised) {
        socket?.emit('meeting:raise_hand', { meeting_id: meetingId, raised });
      },
      sendReaction(emoji) {
        socket?.emit('meeting:reaction', { meeting_id: meetingId, emoji });
      },
      hostControl(action, extra = {}) {
        socket?.emit('meeting:host_control', { meeting_id: meetingId, action, ...extra });
      },
    }),
    [socket, meetingId],
  );

  return { role, selfSid, participants, events, controls };
}
