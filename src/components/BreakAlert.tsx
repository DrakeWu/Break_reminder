import React, { useEffect } from 'react';

interface BreakAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeBreak: () => void;
  screenTime: number;
}

const BreakAlert: React.FC<BreakAlertProps> = ({ isOpen, onClose, onTakeBreak, screenTime }) => {
  // Auto-close after 10 seconds if not addressed
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTakeBreak = () => {
    onTakeBreak();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-800">
                Break Time!
              </h3>
              <p className="text-sm text-orange-600">
                You've been working for {screenTime} minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-orange-400 hover:text-orange-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Main Message */}
        <div className="mb-6">
          <p className="text-orange-700 text-base font-medium mb-3">
            It's time to take a break! Your body needs rest to maintain good posture and prevent strain.
          </p>
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2 text-sm">Benefits of taking breaks:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Reduces eye strain and fatigue</li>
              <li>• Improves circulation and posture</li>
              <li>• Boosts productivity and focus</li>
              <li>• Prevents repetitive strain injuries</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
          >
            Dismiss
          </button>
          <button
            onClick={handleTakeBreak}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
          >
            Take Break
          </button>
        </div>

        {/* Auto-close indicator */}
        <div className="mt-4 text-xs text-orange-500 text-center">
          This alert will auto-close in 10 seconds
        </div>
      </div>
    </div>
  );
};

export default BreakAlert;
