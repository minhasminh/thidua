import React, { useState } from 'react';
import { EvidenceItem, User, normalizeRole } from './types';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useData } from './hooks/useData';
import { authService } from './services/authService';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonalProfilePage } from './pages/PersonalProfilePage';
import { EvaluationPage } from './pages/EvaluationPage';
import { MyEvidencePage } from './pages/MyEvidencePage';
import { TeamEvidencePage } from './pages/TeamEvidencePage';
import { BonusPage } from './pages/BonusPage';
import { DeductionsPage } from './pages/DeductionsPage';
import { AppealsPage } from './pages/AppealsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RegulationsPage } from './pages/RegulationsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { DepartmentManagementPage } from './pages/DepartmentManagementPage';
import { CriteriaManagementPage } from './pages/CriteriaManagementPage';
import { BghReviewPage } from './pages/BghReviewPage';
import { EvidenceModalViewer } from './components/EvidenceModalViewer';
import { UploadEvidenceModal } from './components/UploadEvidenceModal';
import { AccessDeniedGuard } from './components/AccessDeniedGuard';

const PAGE_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  profile: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  evaluation: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  'criteria-management': ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  'my-evidence': ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN'],
  'team-evidence': ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'HOI_DONG_TDKT'],
  'bgh-review': ['ADMIN', 'BGH'],
  'bonus-points': ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  'deduction-points': ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  appeals: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  reports: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'HOI_DONG_TDKT', 'GIAO_VIEN'],
  notifications: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  regulations: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'],
  'user-management': ['ADMIN', 'BGH'],
  departments: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO'],
  settings: ['ADMIN', 'BGH']
};

export default function App() {
  const { currentUser, switchUser } = useCurrentUser();
  const { version, refresh } = useData();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeEvidenceForView, setActiveEvidenceForView] = useState<EvidenceItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadCriteriaId, setUploadCriteriaId] = useState<string | undefined>(undefined);

  const handleLoginSuccess = (user: User) => {
    switchUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    authService.signOut();
    setIsAuthenticated(false);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUpload = (criteriaId?: string) => {
    setUploadCriteriaId(criteriaId);
    setIsUploadOpen(true);
  };

  const handleViewEvidence = (evidence: EvidenceItem) => {
    setActiveEvidenceForView(evidence);
  };

  const handleRefreshAll = () => {
    refresh();
  };

  // If not authenticated, render LoginPage (Section 8)
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const userRole = normalizeRole(currentUser.role);
  const allowedRoles = PAGE_PERMISSIONS[activeTab] || [];
  const isPageAllowed = allowedRoles.includes(userRole);

  return (
    <MainLayout
      currentUser={currentUser}
      onUserChange={switchUser}
      activeTab={activeTab}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {/* Route-level RBAC & RLS Protection (Mục 6, 7 & 10) */}
      {!isPageAllowed ? (
        <AccessDeniedGuard
          currentRole={currentUser.role}
          requiredRoles={allowedRoles}
          tabName={activeTab}
          onGoBack={() => handleNavigate('dashboard')}
        />
      ) : (
        <>
          {/* Route matching */}
          {activeTab === 'dashboard' && (
            <DashboardPage
              key={`dashboard-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onOpenUpload={() => handleOpenUpload()}
              onViewEvidence={handleViewEvidence}
            />
          )}

          {activeTab === 'profile' && (
            <PersonalProfilePage
              key={`profile-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onViewEvidence={handleViewEvidence}
              onNavigateToEvaluation={() => handleNavigate('evaluation')}
            />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationPage
              key={`eval-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onOpenUpload={(critId) => handleOpenUpload(critId)}
              onViewEvidence={handleViewEvidence}
            />
          )}

          {activeTab === 'criteria-management' && (
            <CriteriaManagementPage
              key={`criteria-mgmt-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'my-evidence' && (
            <MyEvidencePage
              key={`my-ev-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onOpenUpload={(critId) => handleOpenUpload(critId)}
              onViewEvidence={handleViewEvidence}
            />
          )}

          {activeTab === 'team-evidence' && (
            <TeamEvidencePage
              key={`team-ev-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onViewEvidence={handleViewEvidence}
            />
          )}

          {activeTab === 'bgh-review' && (
            <BghReviewPage
              key={`bgh-review-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onNavigateToEvaluation={() => handleNavigate('evaluation')}
            />
          )}

          {activeTab === 'bonus-points' && (
            <BonusPage
              key={`bonus-${version}-${currentUser.id}`}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'deduction-points' && (
            <DeductionsPage
              key={`deduct-${version}-${currentUser.id}`}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'appeals' && (
            <AppealsPage
              key={`appeals-${version}-${currentUser.id}`}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage
              key={`reports-${version}-${currentUser.id}`}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage
              key={`notifs-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'regulations' && (
            <RegulationsPage
              key={`regs-${version}-${currentUser.id}`}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'user-management' && (
            <UserManagementPage
              key={`users-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onRefreshAll={handleRefreshAll}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentManagementPage
              key={`departments-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onRefreshAll={handleRefreshAll}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsPage
              key={`settings-${version}-${currentUser.id}`}
              currentUser={currentUser}
              onRefreshAll={handleRefreshAll}
            />
          )}
        </>
      )}

      {/* Global Modals */}
      {activeEvidenceForView && (
        <EvidenceModalViewer
          evidence={activeEvidenceForView}
          currentUser={currentUser}
          onClose={() => setActiveEvidenceForView(null)}
          onUpdate={handleRefreshAll}
        />
      )}

      {isUploadOpen && (
        <UploadEvidenceModal
          currentUser={currentUser}
          initialCriteriaId={uploadCriteriaId}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleRefreshAll}
        />
      )}
    </MainLayout>
  );
}
