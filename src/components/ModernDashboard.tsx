import React from 'react';
import { TrackingData } from '../services/trackingService';
import { PostureAnalysis } from '../services/tensorflowPoseService';

interface ModernDashboardProps {
  trackingData: TrackingData | null;
  postureAnalysis: PostureAnalysis | null;
  isMonitoring: boolean;
  onGenerateSuggestions: () => void;
  onTakeBreak: () => void;
  isGeneratingSuggestions: boolean;
  onOpenSettings: () => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({
  trackingData,
  postureAnalysis,
  isMonitoring,
  onGenerateSuggestions,
  onTakeBreak,
  isGeneratingSuggestions,
  onOpenSettings
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
      <div className="text-center relative">
        <button
          onClick={onOpenSettings}
          className="absolute top-0 right-0 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 p-2 rounded-lg transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              PostureGuard
            </h1>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Screen Time</p>
              <p className="text-3xl font-bold text-gray-800">{trackingData?.screenTime || 0}m</p>
              <p className="text-xs text-gray-500 mt-1">Total today</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Posture Score</p>
              <p className={`text-3xl font-bold ${getPostureColor(trackingData?.postureScore || 0)}`}>
                {trackingData?.postureScore || 0}/10
              </p>
              <p className="text-xs text-gray-500 mt-1">Current status</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

 

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Breaks Taken</p>
              <p className="text-3xl font-bold text-gray-800">{trackingData?.breakCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Today</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Session Time</p>
              <p className="text-3xl font-bold text-gray-800">{trackingData?.sessionTime || 0}m</p>
              <p className="text-xs text-gray-500 mt-1">Total session</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Posture Analysis */}
      {postureAnalysis && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Real-time Posture Analysis</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                postureAnalysis.score >= 80 ? 'bg-green-500' : 
                postureAnalysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">Live monitoring</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Posture Quality</span>
                  <span className={`text-2xl font-bold ${getPostureColor(postureAnalysis.score)}`}>
                    {postureAnalysis.score}/10
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      postureAnalysis.score >= 8 ? 'bg-green-500' : 
                      postureAnalysis.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(postureAnalysis.score / 10) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Poor</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`font-medium ${getPostureColor(postureAnalysis.score)}`}>
                    {getPostureStatus(postureAnalysis.score)}
                  </span>
                </div>
                
                {trackingData && (
                  <div className="flex items-center justify-between">
                  </div>
                )}

                {trackingData && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(trackingData.averagePostureScore)}/10
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Detected Issues</h4>
              {postureAnalysis.issues.length > 0 ? (
                <div className="space-y-2">
                  {postureAnalysis.issues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-green-600 font-medium">No issues detected!</p>
                  <p className="text-sm text-gray-500">Keep up the good posture!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={onGenerateSuggestions}
          disabled={isGeneratingSuggestions}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isGeneratingSuggestions ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generating Suggestions...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Get Stretch Suggestions
            </>
          )}
        </button>

        <button
          onClick={onTakeBreak}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Take a Break
        </button>
      </div>

      {/* Button Descriptions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">AI Suggestions</p>
          <p>Get personalized stretch recommendations</p>
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">Take Break</p>
          <p>Start a break timer to rest your eyes and body</p>
        </div>
      </div>

    </div>
  );
};

export default ModernDashboard;
