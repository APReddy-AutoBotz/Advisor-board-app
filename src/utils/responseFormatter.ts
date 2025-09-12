import type { AdvisorResponse } from '../types/domain';

export function formatResponse(response: AdvisorResponse): string {
  // Placeholder for response formatting logic
  return response.content;
}

export function formatTimestamp(timestamp: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
