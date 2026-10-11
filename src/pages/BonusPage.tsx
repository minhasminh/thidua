import React from 'react';
import { User } from '../types';
import { BonusPointsView } from '../components/BonusPointsView';

interface BonusPageProps {
  currentUser: User;
}

export const BonusPage: React.FC<BonusPageProps> = ({ currentUser }) => {
  return <BonusPointsView currentUser={currentUser} />;
};
