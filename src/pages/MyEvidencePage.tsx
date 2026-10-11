import React from 'react';
import { User, EvidenceItem } from '../types';
import { MyEvidenceView } from '../components/MyEvidenceView';

interface MyEvidencePageProps {
  currentUser: User;
  onOpenUpload: (criteriaId?: string) => void;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const MyEvidencePage: React.FC<MyEvidencePageProps> = ({
  currentUser,
  onOpenUpload,
  onViewEvidence
}) => {
  return (
    <MyEvidenceView
      currentUser={currentUser}
      onOpenUpload={onOpenUpload}
      onViewEvidence={onViewEvidence}
    />
  );
};
