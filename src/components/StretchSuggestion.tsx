import React from 'react';
import { StretchSuggestion as StretchSuggestionType } from '../services/geminiService';

interface StretchSuggestionProps {
  suggestion: StretchSuggestionType;
  onStart: () => void;
  onSkip: () => void;
  onDelete?: () => void;
}

const StretchSuggestion: React.FC<StretchSuggestionProps> = ({ 
  suggestion, 
  onStart, 
  onSkip,
  onDelete
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {suggestion.name}
          </h3>
          <p className="text-gray-600 mb-2">{suggestion.description}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
            {suggestion.difficulty}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {suggestion.duration}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Target Areas:</h4>
        <div className="flex flex-wrap gap-2">
          {suggestion.targetAreas.map((area, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          {suggestion.instructions.map((instruction, index) => (
            <li key={index} className="text-sm">
              {instruction}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onStart}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Start Stretch
        </button>
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Skip
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            title="Delete this stretch"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default StretchSuggestion;
