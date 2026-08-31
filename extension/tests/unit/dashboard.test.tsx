import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../src/dashboard/App.tsx';
import { storage } from '../../src/storage/storage.ts';

describe('Verdict Security Dashboard UI', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  it('should render the dashboard layout with Overview by default', async () => {
    render(<App />);

    expect(await screen.findByText('VERDICT')).toBeDefined();
    expect(screen.getByText('Protection Overview')).toBeDefined();
    expect(screen.getByText('Sites Checked')).toBeDefined();
    expect(screen.getByText('Warnings Issued')).toBeDefined();
    expect(screen.getByText('Threats Prevented')).toBeDefined();
  });

  it('should navigate through all tabs: History, Devices, Settings, Overview', async () => {
    render(<App />);

    // Click Protection History
    const historyNavBtn = screen.getByRole('button', { name: /Protection History/i });
    fireEvent.click(historyNavBtn);
    expect(await screen.findByPlaceholderText('Search website...')).toBeDefined();

    // Click Devices
    const devicesNavBtn = screen.getByRole('button', { name: /Devices/i });
    fireEvent.click(devicesNavBtn);
    expect(await screen.findByText('Enrolled Devices')).toBeDefined();
    expect(screen.getByText('Primary Chrome Browser')).toBeDefined();

    // Click Settings
    const settingsNavBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsNavBtn);
    expect(await screen.findByText('Autonomous Safety Shield')).toBeDefined();
    expect(screen.getByText('Privacy & Zero-Knowledge Safeguards')).toBeDefined();

    // Return to Overview
    const overviewNavBtn = screen.getByRole('button', { name: /Overview/i });
    fireEvent.click(overviewNavBtn);
    expect(await screen.findByText('Protection Overview')).toBeDefined();
  });

  it('should open Detail Modal when clicking an event row and allow closing it', async () => {
    render(<App />);

    // Wait for events to be present
    const dangerEvent = await screen.findByText('suspicious-luxury-outlet.shop');
    expect(dangerEvent).toBeDefined();

    fireEvent.click(dangerEvent);

    // Verify Detail Modal contents
    expect(await screen.findByText('What Happened')).toBeDefined();
    expect(screen.getByText('What Verdict Noticed')).toBeDefined();
    expect(screen.getByText('What You Should Do')).toBeDefined();

    // Toggle Technical Details
    const techToggle = screen.getByText(/Technical Details/i);
    fireEvent.click(techToggle);
    expect(await screen.findByText(/Decision Engine:/i)).toBeDefined();

    // Close Modal
    const closeBtn = screen.getByLabelText('Close detail modal');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('What Happened')).toBeNull();
    });
  });

  it('should filter events in Protection History tab', async () => {
    render(<App />);

    // Go to History
    fireEvent.click(screen.getByRole('button', { name: /Protection History/i }));

    // Wait for events in history tab
    expect(await screen.findByText('suspicious-luxury-outlet.shop')).toBeDefined();

    // Filter by DANGER
    const dangerFilterBtn = screen.getByRole('button', { name: /^danger$/i });
    fireEvent.click(dangerFilterBtn);

    expect(await screen.findByText('suspicious-luxury-outlet.shop')).toBeDefined();
    expect(screen.queryByText('store.apple.com')).toBeNull();

    // Search query
    const searchInput = screen.getByPlaceholderText('Search website...');
    fireEvent.change(searchInput, { target: { value: 'luxury' } });
    expect(screen.getByText('suspicious-luxury-outlet.shop')).toBeDefined();

    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz' } });
    expect(await screen.findByText(/No protection events found/i)).toBeDefined();
  });
});
