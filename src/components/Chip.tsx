import React from 'react';
import { Quote } from '../types';
import { getStatusInfo } from '../utils/date';

interface ChipProps {
  quote: Quote;
}

export const Chip: React.FC<ChipProps> = ({ quote }) => {
  const [statusKey, statusLabel] = getStatusInfo(quote);
  return (
    <span className={`chip chip-${statusKey}`}>
      {statusLabel}
    </span>
  );
};
