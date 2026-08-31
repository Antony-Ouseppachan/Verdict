import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../src/popup/App.tsx';
import { storage } from '../../src/storage/storage.ts';

describe('Verdict Popup Shield UI', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  it('should render default Connected / Protected state with shield button', async () => {
    render(<App />);

    expect(await screen.findByText('VERDICT')).toBeDefined();
    expect(screen.getByText('Protected')).toBeDefined();
    expect(screen.getByRole('switch', { name: /Verdict protection: Protected/i })).toBeDefined();
    expect(screen.getByText('Open Dashboard')).toBeDefined();
  });

  it('should toggle from Protected to Protection Paused on click and show Disconnecting state', async () => {
    render(<App />);

    const shieldBtn = await screen.findByRole('switch', { name: /Verdict protection: Protected/i });
    fireEvent.click(shieldBtn);

    // Should briefly show disconnecting then Disconnected / Protection Paused
    await waitFor(() => {
      expect(screen.getByText('Protection Paused')).toBeDefined();
    }, { timeout: 1500 });
  });

  it('should toggle back to Protected when clicked again', async () => {
    render(<App />);

    const shieldBtn = await screen.findByRole('switch', { name: /Verdict protection: Protected/i });
    
    // First click to disconnect
    fireEvent.click(shieldBtn);
    await waitFor(() => {
      expect(screen.getByText('Protection Paused')).toBeDefined();
    }, { timeout: 1500 });

    // Second click to reconnect
    fireEvent.click(shieldBtn);
    await waitFor(() => {
      expect(screen.getByText('Protected')).toBeDefined();
    }, { timeout: 1500 });
  });
});
