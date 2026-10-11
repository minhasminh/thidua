import React from 'react';
import { User } from '../types';
import { BghReviewView } from '../components/BghReviewView';

interface BghReviewPageProps {
  currentUser: User;
  onNavigateToEvaluation?: (teacherId: string) => void;
}

export const BghReviewPage: React.FC<BghReviewPageProps> = ({
  currentUser,
  onNavigateToEvaluation
}) => {
  return (
    <BghReviewView
      currentUser={currentUser}
      onNavigateToEvaluation={onNavigateToEvaluation}
    />
  );
};
