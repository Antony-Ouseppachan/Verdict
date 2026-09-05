import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

describe('Verdict Security Operations Center (SOC) Console', () => {
  it('should render the SOC top command bar and model capsules', () => {
    render(<App />);
    expect(screen.getByText('VERDICT')).toBeInTheDocument();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getAllByText('URL SVM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('HTML XGB v2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PAYMENT XGB').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('RISK FUSION').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText(/Ingest target URL/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan/i })).toBeInTheDocument();
  });

  it('should render the Live Activity Feed with filter tabs and search', () => {
    render(<App />);
    expect(screen.getByText('LIVE ACTIVITY')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search URLs, domains, paths\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HIGH RISK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SUSPICIOUS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SAFE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PAYMENT' })).toBeInTheDocument();
  });

  it('should render the Center Operations Monitoring overview when no event is selected', () => {
    render(<App />);
    expect(screen.getByText('SOC WORKSTATION')).toBeInTheDocument();
    expect(screen.getByText(/Operations Monitoring/i)).toBeInTheDocument();
    expect(screen.getByText('Observed Events')).toBeInTheDocument();
    expect(screen.getByText('Clean / Safe')).toBeInTheDocument();
    expect(screen.getAllByText(/Suspicious/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/High Risk/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Risk Score Distribution Histogram/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Model Detection Concordance/i)).toBeInTheDocument();
    expect(screen.getByText(/Threat Surface Vector Indicators/i)).toBeInTheDocument();
  });

  it('should render the Right Security Intelligence sidebar and 4-model health status', () => {
    render(<App />);
    expect(screen.getByText('SECURITY INTELLIGENCE')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE TARGET RISK')).toBeInTheDocument();
    expect(screen.getByText('SESSION SUMMARY')).toBeInTheDocument();
    expect(screen.getByText('PAYMENT ACTIVITY')).toBeInTheDocument();
    expect(screen.getByText('AI PIPELINE HEALTH')).toBeInTheDocument();
    expect(screen.getAllByText('URL SVM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PAYMENT XGB').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('RISK FUSION').length).toBeGreaterThanOrEqual(1);
  });
});
