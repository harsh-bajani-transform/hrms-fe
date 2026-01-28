import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="flex items-center gap-3 text-red-600">
        <AlertCircle size={24} />
        <p className="text-lg font-semibold">Error</p>
      </div>
      <p className="text-gray-600 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-semibold"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
