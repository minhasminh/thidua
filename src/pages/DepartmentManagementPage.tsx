import React from 'react';
import { User } from '../types';
import { DepartmentManagementView } from '../components/DepartmentManagementView';

interface DepartmentManagementPageProps {
  currentUser: User;
  onRefreshAll?: () => void;
}

export const DepartmentManagementPage: React.FC<DepartmentManagementPageProps> = ({
  currentUser,
  onRefreshAll
}) => {
  return (
    <div className="space-y-6">
      <DepartmentManagementView currentUser={currentUser} onRefreshAll={onRefreshAll} />
    </div>
  );
};
