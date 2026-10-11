import React from 'react';
import { User } from '../types';
import { AppealsView } from '../components/AppealsView';

interface AppealsPageProps {
  currentUser: User;
}

export const AppealsPage: React.FC<AppealsPageProps> = ({ currentUser }) => {
  return <AppealsView currentUser={currentUser} />;
};
