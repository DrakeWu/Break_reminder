import React, { useState, useEffect } from 'react';

interface StretchTimerProps {
  duration: string;
  instructions: string[];
  name: string;
  description: string;
  onComplete: () => void;
  onCancel: () => void;
}

const StretchTimer: React.FC<StretchTimerProps> = ({ duration, instructions, name, description, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Parse duration string (e.g., "30 seconds", "2 minutes")
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)\s*(second|minute|min|sec)s?/i);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('min')) {
      return value * 60;
    } else {
      return value;
    }
  };

  useEffect(() => {
    const totalSeconds = parseDuration(duration);
    setTimeLeft(totalSeconds);
  }, [duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            console.log('Timer completed, calling onComplete');
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(parseDuration(duration));
  };

  const progress = timeLeft > 0 ? ((parseDuration(duration) - timeLeft) / parseDuration(duration)) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-w-2xl mx-auto">
      {/* Stretch Instructions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{name}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {instructions.map((instruction, index) => (
              <li key={index} className="leading-relaxed">
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Timer Section */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Timer</h3>
        <div className="text-4xl font-mono text-blue-600 mb-2">
          {formatTime(timeLeft)}
        </div>
        <div className="text-gray-600">
          {duration} stretch
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        {!isRunning && timeLeft > 0 && (
          <button
            onClick={startTimer}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Start Timer
          </button>
        )}
        
        {isRunning && (
          <button
            onClick={pauseTimer}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Pause
          </button>
        )}
        
        {timeLeft > 0 && (
          <button
            onClick={resetTimer}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
        
        <button
          onClick={() => {
            console.log('Done button clicked, calling onComplete');
            onComplete();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Done
        </button>
        
        <button
          onClick={onCancel}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      {timeLeft === 0 && isRunning === false && (
        <div className="text-center mt-4">
          <div className="text-green-600 font-semibold text-lg">
            🎉 Great job! Stretch completed!
          </div>
        </div>
      )}
    </div>
  );
};

export default StretchTimer;
