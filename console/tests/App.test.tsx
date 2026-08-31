import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../src/App.tsx';
import { redactSensitiveText, redactHeaders } from '../src/utils/redact.ts';

describe('Verdict Master Operator Console - Live Feed & Autonomous Execution', () => {
  it('should render the console sidebar brand, live stream status, and ingest controls', () => {
    render(<App />);
    expect(screen.getByText('VERDICT')).toBeInTheDocument();
    expect(screen.getByText('OPERATOR CONSOLE')).toBeInTheDocument();
    expect(screen.getByText('TRAFFIC FEED')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ingest target URL/i)).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should start with a clean zero-state without stale mock data inserted', () => {
    render(<App />);
    expect(screen.getByText('Security Operations Dashboard')).toBeInTheDocument();
    expect(screen.getByText('No Active Investigations Recorded')).toBeInTheDocument();
  });

  it('should dispatch an investigation from left stream and execute live 10-stage pipeline', async () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText(/Ingest target URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://cheap-nike-outlet.xyz' } });

    // Submit form
    const form = urlInput.closest('form')!;
    fireEvent.submit(form);

    // Should navigate to Live Pipeline Detail and show stages
    await waitFor(() => {
      expect(screen.getByText('Pipeline Execution Stages')).toBeInTheDocument();
    }, { timeout: 4000 });

    expect(screen.getByText('URL Received')).toBeInTheDocument();
    expect(screen.getByText('Fast Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Sandbox Dispatch')).toBeInTheDocument();
    expect(screen.getByText('Behavioral Analysis')).toBeInTheDocument();
    expect(screen.getByText(/Sandbox Monitor/i)).toBeInTheDocument();
  });

  it('should allow clicking an incoming target from the left list to inspect its autonomous process', async () => {
    render(<App />);
    const presetBtn = screen.getByRole('button', { name: /Fake Shop/i });
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Execution Stages')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Verify forensic tabs are present
    expect(screen.getAllByText(/Payment Forensics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Domain & Infrastructure/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brand & Content/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI Investigator/i).length).toBeGreaterThan(0);
  });

  it('should navigate to System Health page and display cluster worker metrics', async () => {
    render(<App />);
    const systemNavBtn = screen.getByRole('button', { name: /System/i });
    fireEvent.click(systemNavBtn);

    await waitFor(() => {
      expect(screen.getByText('System Infrastructure & Worker Cluster Health')).toBeInTheDocument();
      expect(screen.getByText('Sandbox & Inference Worker Nodes Pool')).toBeInTheDocument();
    });
  });
});

describe('Security & Privacy Redaction Utility', () => {
  it('should mask 16-digit credit card numbers', () => {
    const raw = 'Customer attempted checkout with 4532 0156 8921 4242 on counterfeit form.';
    const redacted = redactSensitiveText(raw);
    expect(redacted).toContain('•••• •••• •••• 4242');
    expect(redacted).not.toContain('4532 0156 8921');
  });

  it('should redact authorization headers and cookies', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123',
      'Cookie': 'session_token=xyz9984; auth=true',
    };
    const cleaned = redactHeaders(headers);
    expect(cleaned['Authorization']).toBe('[REDACTED_SECURITY_HEADER]');
    expect(cleaned['Cookie']).toBe('[REDACTED_SECURITY_HEADER]');
    expect(cleaned['Content-Type']).toBe('application/json');
  });
});
