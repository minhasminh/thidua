import { useState, useCallback } from 'react';
import { storageService } from '../services/storageService';

export function useData() {
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return {
    version,
    refresh,
    teachers: storageService.getUsers(),
    departments: storageService.getDepartments(),
    evidences: storageService.getEvidences(),
    evaluations: storageService.getEvaluations(),
    settings: storageService.getSettings(),
    bonusList: storageService.getBonusList(),
    deductionList: storageService.getDeductions(),
    appeals: storageService.getAppeals(),
    notifications: storageService.getNotifications()
  };
}
