import React from 'react';
import { User } from '../types';
import { UserManagementView } from '../components/UserManagementView';

interface UserManagementPageProps {
  currentUser: User;
  onRefreshAll?: () => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  currentUser,
  onRefreshAll
}) => {
  return <UserManagementView currentUser={currentUser} onRefreshAll={onRefreshAll} />;
};
