import React from 'react';
import { User } from '../types';
import { DeductionPointsView } from '../components/DeductionPointsView';

interface DeductionsPageProps {
  currentUser: User;
}

export const DeductionsPage: React.FC<DeductionsPageProps> = ({ currentUser }) => {
  return <DeductionPointsView currentUser={currentUser} />;
};
