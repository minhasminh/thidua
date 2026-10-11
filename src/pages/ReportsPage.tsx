import React from 'react';
import { User } from '../types';
import { ReportsView } from '../components/ReportsView';

interface ReportsPageProps {
  currentUser: User;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentUser }) => {
  return <ReportsView currentUser={currentUser} />;
};
