import React from 'react';
import { User, EvidenceItem } from '../types';
import { TeamEvidenceView } from '../components/TeamEvidenceView';

interface TeamEvidencePageProps {
  currentUser: User;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const TeamEvidencePage: React.FC<TeamEvidencePageProps> = ({
  currentUser,
  onViewEvidence
}) => {
  return (
    <TeamEvidenceView
      currentUser={currentUser}
      onViewEvidence={onViewEvidence}
    />
  );
};
