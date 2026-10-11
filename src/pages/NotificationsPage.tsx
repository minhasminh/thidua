import React from 'react';
import { User } from '../types';
import { NotificationsView } from '../components/NotificationsView';

interface NotificationsPageProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  currentUser,
  onNavigate
}) => {
  return <NotificationsView currentUser={currentUser} onNavigate={onNavigate} />;
};
