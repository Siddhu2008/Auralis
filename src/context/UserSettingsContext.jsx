import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api';

const defaultSettings = {
  profile: {
    phone: '',
    timezone: 'UTC',
    language: 'English',
  },
  security: {
    twoFactorEnabled: false,
    activeSessions: 1,
    sessionDevices: [],
    loginHistory: [],
  },
  assistant: {
    tone: 'Professional',
    responseLength: 'Medium',
    language: 'English',
    autoFollowUp: true,
    dailyBriefing: true,
  },
  meeting: {
    defaultDuration: 30,
    platform: 'Google Meet',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    bufferMinutes: 10,
    preventPastDate: true,
    preventOutsideHours: true,
    requireConfirmation: true,
    detectConflicts: true,
  },
  emailIntegration: {
    connectedAccounts: ['Primary'],
    autoCategorize: true,
    aiDraftSuggestions: true,
    requireApprovalBeforeSending: true,
    signature: 'Sent from Auralis',
    replyTone: 'Professional',
  },
  notifications: {
    inApp: {
      meetingReminders: true,
      taskReminders: true,
      emailAlerts: true,
      aiSuggestions: true,
    },
    email: {
      dailySummary: true,
      urgentAlerts: true,
      weeklyPerformanceSummary: true,
    },
  },
  appearance: {
    theme: 'Dark',
    accentColor: '#2563eb',
    compactMode: false,
    reduceMotion: false,
    fontSize: 100,
  },
  privacy: {
    chatHistoryClearedAt: null,
    aiMemoryResetAt: null,
  },
  integrations: {
    googleCalendar: false,
    outlook: false,
    slack: false,
    notion: false,
    zoom: false,
    crm: false,
  },
};

const UserSettingsContext = createContext({
  settings: defaultSettings,
  updateSettings: () => {},
  saveNow: async () => false,
  resetSettings: async () => false,
  refreshSettings: async () => false,
  loading: true,
  saving: false,
  lastSavedAt: null,
  error: '',
});

function deepMerge(base, override) {
  if (!override) return base;
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (typeof base !== 'object' || base === null) return override ?? base;
  const merged = { ...base };
  Object.keys(override).forEach((key) => {
    merged[key] = deepMerge(base[key], override[key]);
  });
  return merged;
}

function normalizeLanguage(language) {
  if (!language) return 'English';
  return String(language).charAt(0).toUpperCase() + String(language).slice(1).toLowerCase();
}

function fromApiToUi(apiSettings = {}, meta = {}) {
  return {
    ...defaultSettings,
    profile: {
      phone: meta.phone_number || '',
      timezone: apiSettings.timezone || 'UTC',
      language: normalizeLanguage(apiSettings.language || 'english'),
    },
    security: {
      twoFactorEnabled: Boolean(meta.two_factor_enabled),
      activeSessions: (meta.session_devices || []).length || 1,
      sessionDevices: meta.session_devices || [],
      loginHistory: meta.login_history || [],
    },
    assistant: {
      tone: normalizeLanguage(apiSettings.assistant_tone || 'professional'),
      responseLength: normalizeLanguage(apiSettings.assistant_response_length || 'medium'),
      language: normalizeLanguage(apiSettings.language || 'english'),
      autoFollowUp: Boolean(apiSettings.auto_followups_enabled),
      dailyBriefing: Boolean(apiSettings.daily_briefing_enabled),
    },
    meeting: {
      defaultDuration: apiSettings.default_meeting_duration || 30,
      platform: normalizeLanguage(apiSettings.default_meeting_platform || 'google meet'),
      workingHoursStart: apiSettings.working_hours_start || '09:00',
      workingHoursEnd: apiSettings.working_hours_end || '18:00',
      workingDays: apiSettings.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      bufferMinutes: apiSettings.buffer_time_minutes ?? 10,
      preventPastDate: Boolean(apiSettings.prevent_past_dates),
      preventOutsideHours: Boolean(apiSettings.prevent_outside_working_hours),
      requireConfirmation: Boolean(apiSettings.require_schedule_confirmation),
      detectConflicts: meta.detect_conflicts !== false,
    },
    emailIntegration: {
      connectedAccounts: meta.connected_email_accounts || ['Primary'],
      autoCategorize: Boolean(apiSettings.email_auto_categorize),
      aiDraftSuggestions: Boolean(apiSettings.email_draft_suggestions),
      requireApprovalBeforeSending: Boolean(apiSettings.require_email_approval),
      signature: 'Sent from Auralis',
      replyTone: normalizeLanguage(apiSettings.assistant_tone || 'professional'),
    },
    notifications: {
      inApp: {
        meetingReminders: Boolean(apiSettings.notifications_enabled),
        taskReminders: Boolean(apiSettings.notifications_enabled),
        emailAlerts: Boolean(apiSettings.notifications_enabled),
        aiSuggestions: Boolean(apiSettings.notifications_enabled),
      },
      email: {
        dailySummary: Boolean(apiSettings.email_notifications_enabled),
        urgentAlerts: Boolean(apiSettings.email_notifications_enabled),
        weeklyPerformanceSummary: Boolean(apiSettings.email_notifications_enabled),
      },
    },
    appearance: {
      theme: (apiSettings.theme_mode || 'dark') === 'light' ? 'Light' : 'Dark',
      accentColor: apiSettings.accent_color || '#2563eb',
      compactMode: false,
      reduceMotion: false,
      fontSize: apiSettings.font_size || 100,
    },
    privacy: {
      chatHistoryClearedAt: null,
      aiMemoryResetAt: null,
    },
    integrations: {
      ...defaultSettings.integrations,
      ...(meta.integrations || {}),
    },
  };
}

function toApiPayload(settings) {
  return {
    theme_mode: settings.appearance.theme.toLowerCase(),
    accent_color: settings.appearance.accentColor,
    font_size: Number(settings.appearance.fontSize),
    assistant_tone: settings.assistant.tone.toLowerCase(),
    assistant_response_length: settings.assistant.responseLength.toLowerCase(),
    daily_briefing_enabled: Boolean(settings.assistant.dailyBriefing),
    auto_followups_enabled: Boolean(settings.assistant.autoFollowUp),
    default_meeting_duration: Number(settings.meeting.defaultDuration),
    default_meeting_platform: settings.meeting.platform.toLowerCase(),
    working_hours_start: settings.meeting.workingHoursStart,
    working_hours_end: settings.meeting.workingHoursEnd,
    working_days: settings.meeting.workingDays,
    buffer_time_minutes: Number(settings.meeting.bufferMinutes),
    prevent_past_dates: Boolean(settings.meeting.preventPastDate),
    prevent_outside_working_hours: Boolean(settings.meeting.preventOutsideHours),
    require_schedule_confirmation: Boolean(settings.meeting.requireConfirmation),
    email_auto_categorize: Boolean(settings.emailIntegration.autoCategorize),
    email_draft_suggestions: Boolean(settings.emailIntegration.aiDraftSuggestions),
    require_email_approval: Boolean(settings.emailIntegration.requireApprovalBeforeSending),
    notifications_enabled: Boolean(settings.notifications.inApp.meetingReminders),
    email_notifications_enabled: Boolean(settings.notifications.email.dailySummary),
    timezone: settings.profile.timezone,
    language: settings.profile.language.toLowerCase(),
    two_factor_enabled: Boolean(settings.security.twoFactorEnabled),
    session_devices: settings.security.sessionDevices,
    login_history: settings.security.loginHistory,
    connected_email_accounts: settings.emailIntegration.connectedAccounts,
    integrations: settings.integrations,
    phone_number: settings.profile.phone,
    detect_conflicts: Boolean(settings.meeting.detectConflicts),
  };
}

async function fetchSettingsApi() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Unauthorized');

  const res = await apiFetch('/api/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');
  return data;
}

export function UserSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const pendingRef = useRef(false);
  const loadingRef = useRef(true);

  const refreshSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSettingsApi();
      setSettings(fromApiToUi(data.settings, data.meta));
      loadingRef.current = false;
      return true;
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const saveWithPayload = async (payloadSettings) => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toApiPayload(payloadSettings)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setSettings(fromApiToUi(data.settings, data.meta));
      setLastSavedAt(new Date().toISOString());
      return true;
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      return false;
    } finally {
      setSaving(false);
      pendingRef.current = false;
    }
  };

  const saveNow = async () => saveWithPayload(settings);

  const updateSettings = (patch) => {
    setSettings((current) => {
      const next = deepMerge(current, patch);
      pendingRef.current = true;
      return next;
    });
  };

  useEffect(() => {
    if (loadingRef.current || !pendingRef.current) return undefined;

    const timer = window.setTimeout(() => {
      saveWithPayload(settings);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [settings]);

  const resetSettings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/settings/reset', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset settings');
      setSettings(fromApiToUi(data.settings, data.meta));
      setLastSavedAt(new Date().toISOString());
      pendingRef.current = false;
      return true;
    } catch (err) {
      setError(err.message || 'Failed to reset settings');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      saveNow,
      resetSettings,
      refreshSettings,
      loading,
      saving,
      lastSavedAt,
      error,
    }),
    [settings, loading, saving, lastSavedAt, error],
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  return useContext(UserSettingsContext);
}
