import React, { useEffect, useState } from 'react';
import { useSessionState } from '../../hooks/useSessionState';
import type { ConsultationSession, SessionMetadata } from '../../types/session';
import Button from '../common/Button';
import Card from '../common/Card';
import { ExportOptions } from './ExportOptions';

interface SessionManagerProps {
  onSessionSelect?: (session: ConsultationSession) => void;
  onNewSession?: () => void;
  className?: string;
  showExportOptions?: boolean;
}

const SessionManager: React.FC<SessionManagerProps> = ({
  onSessionSelect,
  onNewSession,
  className = '',
  showExportOptions = false,
}) => {
  const {
    sessionHistory,
    currentSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    getSessionMetadata,
  } = useSessionState();

  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedSessionForExport, setSelectedSessionForExport] = useState<ConsultationSession | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSessionMetadata(getSessionMetadata());
  }, [sessionHistory, getSessionMetadata]);

  const handleSessionSelect = (sessionId: string) => {
    const session = loadSession(sessionId);
    if (session && onSessionSelect) {
      onSessionSelect(session);
    }
  };

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteSession(sessionId);
  };

  const handleExportSession = (session: ConsultationSession, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedSessionForExport(session);
    setExportError(null);
    setExportSuccess(null);
  };

  const handleExportComplete = () => {
    setExportSuccess('Session exported successfully!');
    setTimeout(() => {
      setExportSuccess(null);
      setSelectedSessionForExport(null);
    }, 2000);
  };

  const handleExportError = (error: string) => {
    setExportError(error);
  };

  const handleClearAllSessions = () => {
    clearAllSessions();
    setShowConfirmClear(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDomainDisplayName = (domain: string) => {
    const domainNames = {
      cliniboard: 'CliniBoard',
      eduboard: 'EduBoard',
      remediboard: 'RemediBoard',
    };
    return domainNames[domain as keyof typeof domainNames] || domain;
  };

  const getDomainColor = (domain: string) => {
    const domainColors = {
      cliniboard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      eduboard: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      remediboard: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return domainColors[domain as keyof typeof domainColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (sessionHistory.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6-4h6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Sessions Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Start your first consultation session to see it appear here.
        </p>
        {onNewSession && (
          <Button onClick={onNewSession} variant="primary">
            Start New Session
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Session History
        </h2>
        <div className="flex space-x-2">
          {onNewSession && (
            <Button onClick={onNewSession} variant="primary" size="sm">
              New Session
            </Button>
          )}
          {sessionHistory.length > 0 && (
            <Button
              onClick={() => setShowConfirmClear(true)}
              variant="secondary"
              size="sm"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {showConfirmClear && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <div className="p-4">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Clear All Sessions?
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              This action cannot be undone. All session history will be permanently deleted.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleClearAllSessions}
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Clear All
              </Button>
              <Button
                onClick={() => setShowConfirmClear(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {sessionMetadata.map((metadata) => {
          const session = sessionHistory.find(s => s.id === metadata.sessionId);
          if (!session) return null;

          const isCurrentSession = currentSession?.id === session.id;

          return (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isCurrentSession
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleSessionSelect(session.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDomainColor(
                          metadata.domain
                        )}`}
                      >
                        {getDomainDisplayName(metadata.domain)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(metadata.createdAt)}
                      </span>
                      {isCurrentSession && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 truncate">
                      {session.prompt || 'No prompt yet'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{metadata.advisorCount} advisor{metadata.advisorCount !== 1 ? 's' : ''}</span>
                      <span>{metadata.responseCount} response{metadata.responseCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {showExportOptions && session.responses.length > 0 && (
                      <button
                        onClick={(e) => handleExportSession(session, e)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Export session"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete session"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Export Modal */}
      {selectedSessionForExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Export Session
              </h3>
              <button
                onClick={() => setSelectedSessionForExport(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ExportOptions
                session={selectedSessionForExport}
                onExportComplete={handleExportComplete}
                onError={handleExportError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {exportSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {exportSuccess}
        </div>
      )}

      {/* Error Message */}
      {exportError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{exportError}</span>
            <button
              onClick={() => setExportError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;