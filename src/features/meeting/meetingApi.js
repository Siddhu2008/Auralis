import { apiFetch } from '../../api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function scheduleMeeting(payload) {
  const res = await apiFetch('/api/v2/meetings/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function requestJoin(meetingCodeOrId) {
  const res = await apiFetch(`/api/v2/meetings/${meetingCodeOrId}/join-request`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function issueMeetingToken(meetingCodeOrId) {
  const res = await apiFetch(`/api/v2/meetings/${meetingCodeOrId}/token`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function fetchPastMeetings() {
  const res = await apiFetch('/api/v2/meetings/past', {
    headers: { ...authHeaders() },
  });
  return res.json();
}

export async function fetchMeetingBundle(meetingCodeOrId) {
  const res = await apiFetch(`/api/v2/meetings/${meetingCodeOrId}`, {
    headers: { ...authHeaders() },
  });
  return res.json();
}
