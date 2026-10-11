import React from 'react';
import { User, EvidenceItem } from '../types';
import { EvaluationSheetView } from '../components/EvaluationSheetView';

interface EvaluationPageProps {
  currentUser: User;
  onOpenUpload: (criteriaId?: string) => void;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const EvaluationPage: React.FC<EvaluationPageProps> = ({
  currentUser,
  onOpenUpload,
  onViewEvidence
}) => {
  return (
    <EvaluationSheetView
      currentUser={currentUser}
      onOpenUpload={onOpenUpload}
      onViewEvidence={onViewEvidence}
    />
  );
};
