import React, { useState } from 'react';
import Button from '../common/Button';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  placeholder = "Enter your question for the advisory board...",
  isLoading = false,
  className = '',
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-2">
            Press Ctrl+Enter to submit, or use the button below
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {prompt.length} characters
          </div>
          <Button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            isLoading={isLoading}
            rightIcon={
              !isLoading ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              ) : undefined
            }
          >
            {isLoading ? 'Submitting...' : 'Submit Question'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;