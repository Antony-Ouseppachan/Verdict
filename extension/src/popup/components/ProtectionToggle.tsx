import React from 'react';
import { ShieldControl } from './ShieldControl.tsx';

interface ProtectionToggleProps {
  enabled: boolean;
  onToggle: (newState: boolean) => void;
  disabled?: boolean;
}

export const ProtectionToggle: React.FC<ProtectionToggleProps> = (props) => {
  return <ShieldControl {...props} />;
};
