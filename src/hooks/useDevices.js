import { useState, useEffect, useCallback } from 'react';

export const useDevices = () => {
    const [devices, setDevices] = useState({
        videoInput: [],
        audioInput: [],
        audioOutput: []
    });
    const [selectedDevices, setSelectedDevices] = useState({
        videoInput: localStorage.getItem('selectedVideoInput') || '',
        audioInput: localStorage.getItem('selectedAudioInput') || '',
        audioOutput: localStorage.getItem('selectedAudioOutput') || ''
    });

    const enumerateDevices = useCallback(async () => {
        try {
            // Try to get permissions first to get labels, but don't crash if it fails
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            } catch (permErr) {
                console.warn("Permissions denied or devices not found during enumeration:", permErr);
            }

            const allDevices = await navigator.mediaDevices.enumerateDevices();

            const categorized = {
                videoInput: allDevices.filter(d => d.kind === 'videoinput'),
                audioInput: allDevices.filter(d => d.kind === 'audioinput'),
                audioOutput: allDevices.filter(d => d.kind === 'audiooutput')
            };

            setDevices(categorized);

            // Set defaults if not already set or not in list
            const newSelected = { ...selectedDevices };
            let changed = false;

            ['videoInput', 'audioInput', 'audioOutput'].forEach(type => {
                const currentId = selectedDevices[type];
                const exists = categorized[type].some(d => d.deviceId === currentId);
                if (!currentId || !exists) {
                    if (categorized[type].length > 0) {
                        // Avoid choosing an empty string deviceId if possible
                        const validDevice = categorized[type].find(d => d.deviceId) || categorized[type][0];
                        newSelected[type] = validDevice.deviceId;
                        localStorage.setItem(`selected${type.charAt(0).toUpperCase() + type.slice(1)}`, newSelected[type]);
                        changed = true;
                    }
                }
            });

            if (changed) {
                setSelectedDevices(newSelected);
            }
        } catch (err) {
            console.error("Critical error in enumerateDevices:", err);
        }
    }, [selectedDevices]);

    useEffect(() => {
        enumerateDevices();
        navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
        };
    }, [enumerateDevices]);

    const setDevice = (type, deviceId) => {
        setSelectedDevices(prev => ({ ...prev, [type]: deviceId }));
        localStorage.setItem(`selected${type.charAt(0).toUpperCase() + type.slice(1)}`, deviceId);
    };

    return { devices, selectedDevices, setDevice, refreshDevices: enumerateDevices };
};
