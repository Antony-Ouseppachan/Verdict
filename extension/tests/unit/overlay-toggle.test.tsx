import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OverlayToggle } from '../../src/popup/components/OverlayToggle.tsx';
import { storage } from '../../src/storage/storage.ts';
import { getOverlayState } from '../../src/storage/overlayState.ts';

describe('OverlayToggle Component', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  it('should render default Enabled state', async () => {
    render(<OverlayToggle />);

    expect(await screen.findByText('Enable overlay')).toBeDefined();
    const switchBtn = screen.getByRole('switch', { name: /Enable overlay/i });
    expect(switchBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('should toggle from Enabled to Disabled on click', async () => {
    render(<OverlayToggle />);

    const switchBtn = await screen.findByRole('switch', { name: /Enable overlay/i });
    fireEvent.click(switchBtn);

    await waitFor(async () => {
      const state = await getOverlayState();
      expect(state).toBe(false);
      expect(switchBtn.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('should toggle back from Disabled to Enabled on second click', async () => {
    render(<OverlayToggle />);

    const switchBtn = await screen.findByRole('switch', { name: /Enable overlay/i });
    fireEvent.click(switchBtn);

    await waitFor(async () => {
      expect(await getOverlayState()).toBe(false);
    });

    fireEvent.click(switchBtn);

    await waitFor(async () => {
      expect(await getOverlayState()).toBe(true);
      expect(switchBtn.getAttribute('aria-checked')).toBe('true');
    });
  });
});
