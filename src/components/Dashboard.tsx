import React from 'react';
import { TrackingData } from '../services/trackingService';
import { PostureAnalysis } from '../services/poseDetectionService';

interface DashboardProps {
  trackingData: TrackingData | null;
  postureAnalysis: PostureAnalysis | null;
  isMonitoring: boolean;
  onGenerateSuggestions: () => void;
  onTakeBreak: () => void;
  isGeneratingSuggestions: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  trackingData,
  postureAnalysis,
  isMonitoring,
  onGenerateSuggestions,
  onTakeBreak,
  isGeneratingSuggestions
}) => {
  const getPostureColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPostureStatus = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PostureGuard</h1>
        <p className="text-gray-600">AI-Powered Posture & Break Monitoring</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Screen Time</p>
              <p className="text-2xl font-bold text-blue-600">{trackingData?.screenTime || 0}m</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Posture Score</p>
              <p className={`text-2xl font-bold ${getPostureColor(trackingData?.postureScore || 0)}`}>
                {trackingData?.postureScore || 0}/10
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">🧍</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Work Session</p>
              <p className="text-2xl font-bold text-purple-600">{trackingData?.workSessionDuration || 0}m</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">💼</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Breaks Taken</p>
              <p className="text-2xl font-bold text-orange-600">{trackingData?.breakCount || 0}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm">☕</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posture Analysis */}
      {postureAnalysis && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Posture Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Posture Score</span>
                <span className={`text-lg font-bold ${getPostureColor(postureAnalysis.score)}`}>
                  {postureAnalysis.score}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    postureAnalysis.score >= 8 ? 'bg-green-500' : 
                    postureAnalysis.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(postureAnalysis.score / 10) * 100}%` }}
                />
              </div>
              <p className={`text-sm mt-1 ${getPostureColor(postureAnalysis.score)}`}>
                {getPostureStatus(postureAnalysis.score)}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
              </div>
              <div className="text-sm text-gray-600">
                <p>Average: {Math.round(trackingData?.averagePostureScore || 0)}/10</p>
                <p>History: {trackingData?.postureHistory.length || 0} readings</p>
              </div>
            </div>
          </div>

          {postureAnalysis.issues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Issues</h4>
              <div className="flex flex-wrap gap-2">
                {postureAnalysis.issues.map((issue, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isMonitoring && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onGenerateSuggestions}
            disabled={isGeneratingSuggestions}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isGeneratingSuggestions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <span className="mr-2">🤖</span>
                Get AI Stretch Suggestions
              </>
            )}
          </button>

          <button
            onClick={onTakeBreak}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="mr-2">☕</span>
            Take a Break
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {isMonitoring && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm rounded-full transition-colors">
              Report Neck Pain
            </button>
            <button className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm rounded-full transition-colors">
              Report Back Stiffness
            </button>
            <button className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm rounded-full transition-colors">
              Report Eye Strain
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
