/**
 * Name utility functions for advisor cards
 * Handles extraction of proper names from titles and prefixes
 */

/**
 * Extracts the actual first name from a full name, skipping titles like Dr., Prof., etc.
 * @param fullName - The full name including any titles
 * @returns The actual first name without titles
 */
export const extractFirstName = (fullName: string): string => {
  // Common titles to skip
  const titles = ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.', 'Dr', 'Prof'];
  
  // Split the name into parts
  const nameParts = fullName.trim().split(' ');
  
  // Find the first part that's not a title
  for (const part of nameParts) {
    const cleanPart = part.replace(/[.,]/g, ''); // Remove periods and commas
    if (!titles.includes(cleanPart) && cleanPart.length > 0) {
      return cleanPart;
    }
  }
  
  // Fallback: return the first part if no valid name found
  return nameParts[0] || 'Advisor';
};

/**
 * Extracts the last name from a full name
 * @param fullName - The full name including any titles
 * @returns The last name
 */
export const extractLastName = (fullName: string): string => {
  const nameParts = fullName.trim().split(' ');
  return nameParts[nameParts.length - 1] || 'Advisor';
};

/**
 * Creates a chat CTA text with proper name extraction
 * @param fullName - The full name including any titles
 * @returns Formatted CTA text
 */
export const createChatCTA = (fullName: string): string => {
  const firstName = extractFirstName(fullName);
  return `Chat with AI ${firstName}`;
};

/**
 * Test cases for name extraction
 */
export const testNameExtraction = () => {
  const testCases = [
    'Dr. Sarah Chen',
    'Prof. Michael Rodriguez', 
    'Sarah Kim',
    'Dr. James Wilson',
    'Lisa Thompson',
    'Dr. Maria Garcia'
  ];
  
  console.log('Name extraction tests:');
  testCases.forEach(name => {
    console.log(`${name} -> ${extractFirstName(name)}`);
  });
};
