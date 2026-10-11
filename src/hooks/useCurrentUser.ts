import { useState, useCallback } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());

  const switchUser = useCallback((newUser: User) => {
    storageService.setCurrentUser(newUser.id);
    setCurrentUser(newUser);
  }, []);

  const isTeacher = currentUser.role === 'TEACHER';
  const isTeamLeader = currentUser.role === 'TEAM_LEADER';
  const isPrincipal = currentUser.role === 'PRINCIPAL';
  const isCouncil = currentUser.role === 'COUNCIL';
  const isAdmin = currentUser.role === 'ADMIN';

  return {
    currentUser,
    switchUser,
    isTeacher,
    isTeamLeader,
    isPrincipal,
    isCouncil,
    isAdmin
  };
}
