import React from 'react';
import { User } from '../types';
import { RegulationsView } from '../components/RegulationsView';

interface RegulationsPageProps {
  currentUser: User;
}

export const RegulationsPage: React.FC<RegulationsPageProps> = ({ currentUser }) => {
  return <RegulationsView currentUser={currentUser} />;
};
