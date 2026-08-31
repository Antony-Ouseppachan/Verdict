import React, { useEffect, useState } from 'react';
import {
  getOverlayState,
  setOverlayState,
  onOverlayStateChanged,
} from '../../storage/overlayState.ts';

export const OverlayToggle: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const state = await getOverlayState();
      if (mounted) {
        setEnabled(state);
      }
    }

    load();

    const unsubscribe = onOverlayStateChanged((newState) => {
      if (mounted) {
        setEnabled(newState);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleToggle = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    await setOverlayState(nextState);

    // Notify background
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'SET_OVERLAY_STATE',
        payload: { enabled: nextState },
      });
    }
  };

  return (
    <div className="verdict-setting-row">
      <span className="verdict-setting-title">Enable overlay</span>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Enable overlay"
        className={`verdict-mini-toggle ${enabled ? 'is-active' : ''}`}
        onClick={handleToggle}
      >
        <span className="verdict-mini-toggle-knob" />
      </button>
    </div>
  );
};
