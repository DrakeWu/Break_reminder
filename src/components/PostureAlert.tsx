import React, { useEffect, useState } from 'react';

interface PostureAlertProps {
  isOpen: boolean;
  onClose: () => void;
  issues: string[];
  score: number;
  onGetStretch?: () => void;
}

const PostureAlert: React.FC<PostureAlertProps> = ({ isOpen, onClose, issues, score, onGetStretch }) => {

  // Play alarm sound when alert opens
  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a quick alarm sound (two short beeps)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play alarm sound:', error);
    }
  };

  // Play alarm sound when alert opens
  useEffect(() => {
    if (isOpen) {
      playAlarmSound(); // Play alarm sound when alert appears
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${getScoreBgColor(score)} border-2 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className={`text-2xl ${score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {score >= 60 ? '⚠️' : '🚨'}
              </span>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${getScoreColor(score)}`}>
                Posture Alert
              </h3>
              <p className="text-sm text-gray-600">
                Score: <span className={`font-semibold ${getScoreColor(score)}`}>{score}/10</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Main Issue */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Main Issue:</h4>
          <p className={`text-sm ${getScoreColor(score)} font-medium bg-white rounded-lg p-3 border`}>
            {issues[0]}
          </p>
        </div>

        {/* Quick Fix Suggestion */}
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Quick Fix:</h4>
          <p className="text-sm text-gray-600">
            {score < 5 ? 
              'Sit up straight, pull your shoulders back, and align your head over your shoulders.' :
              'Make small adjustments to improve your posture - you\'re on the right track!'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Got it
          </button>
          <button
            onClick={() => {
              if (onGetStretch) {
                onGetStretch();
              }
              onClose();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Get Stretch
          </button>
        </div>

      </div>
    </div>
  );
};

export default PostureAlert;
