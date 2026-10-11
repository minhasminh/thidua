import React from 'react';
import { User } from '../types';
import { SystemConfigView } from '../components/SystemConfigView';

interface AdminSettingsPageProps {
  currentUser: User;
  onRefreshAll: () => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  currentUser,
  onRefreshAll
}) => {
  return <SystemConfigView currentUser={currentUser} onRefreshAll={onRefreshAll} />;
};
