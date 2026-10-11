import React from 'react';
import { User, EvidenceItem } from '../types';
import { TeacherProfileView } from '../components/TeacherProfileView';

interface PersonalProfilePageProps {
  currentUser: User;
  onViewEvidence: (evidence: EvidenceItem) => void;
  onNavigateToEvaluation: () => void;
}

export const PersonalProfilePage: React.FC<PersonalProfilePageProps> = ({
  currentUser,
  onViewEvidence,
  onNavigateToEvaluation
}) => {
  return (
    <TeacherProfileView
      currentUser={currentUser}
      onViewEvidence={onViewEvidence}
      onNavigateToEvaluation={onNavigateToEvaluation}
    />
  );
};
