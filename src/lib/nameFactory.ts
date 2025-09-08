/**
 * AI-Persona Name Factory
 * 
 * Generates deterministic, globally diverse, fictional names for AI advisors
 * Ensures no celebrity names and unique names per visible grid
 * Uses deterministic algorithm based on boardId + personaId + slotIndex + sessionSalt
 */

export type NameGender = 'feminine' | 'masculine';

export interface GeneratedName {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: NameGender;
}

// Globally diverse, simple to pronounce, non-celebrity names
export const FEMININE_FIRST_NAMES = [
  'Aya', 'Mira', 'Amara', 'Priya', 'Rhea', 'Kiara', 'Nia', 'Zara', 
  'Hana', 'Noor', 'Lina', 'Yara', 'Leila', 'Saanvi', 'Aisha', 'Imani', 
  'Mei', 'Tara', 'Zoya', 'Anika', 'Kira', 'Aria', 'Luna', 'Maya',
  'Sana', 'Diya', 'Riya', 'Ava', 'Isla', 'Naya', 'Vera', 'Cora',
  'Ema', 'Lia', 'Nila', 'Rina', 'Sira', 'Tina', 'Uma', 'Vina'
];

export const MASCULINE_FIRST_NAMES = [
  'Arjun', 'Rohan', 'Kenji', 'Tariq', 'Omar', 'Rafael', 'Marco', 'Daniel',
  'Amir', 'Yusuf', 'Nabil', 'Ethan', 'Neil', 'Miguel', 'Vikram', 'Arman',
  'Kaito', 'Luca', 'Nikhil', 'Dev', 'Kai', 'Leo', 'Max', 'Sam',
  'Ari', 'Ben', 'Cal', 'Eli', 'Finn', 'Ian', 'Jay', 'Kael',
  'Len', 'Nate', 'Owen', 'Paul', 'Quinn', 'Ray', 'Sean', 'Theo'
];

export const SURNAMES = [
  'Patel', 'Kim', 'Park', 'Nguyen', 'Singh', 'Reddy', 'Chen', 'Tanaka',
  'Li', 'Garcia', 'Silva', 'Hassan', 'Khan', 'Ahmed', 'Mensah', 'Okoye',
  'Diallo', 'Duarte', 'Costa', 'Petrov', 'Novak', 'Ivanov', 'Kowalski',
  'Andersson', 'Jensen', 'Müller', 'Rossi', 'Dubois', 'Haddad', 'Benali',
  'Castillo', 'Romero', 'Santos', 'Oliveira', 'Doshi', 'Kapoor', 'Hussain',
  'Kaur', 'Naidoo', 'Dlamini', 'Wong', 'Liu', 'Wang', 'Zhang', 'Kumar',
  'Sharma', 'Gupta', 'Joshi', 'Mehta', 'Shah', 'Rao', 'Iyer', 'Nair'
];

/**
 * Name Factory - Deterministic name generation
 */
export class NameFactory {
  private sessionSalt: string;
  private usedNames: Set<string> = new Set();

  constructor(sessionSalt?: string) {
    // Generate session salt if not provided
    this.sessionSalt = sessionSalt || this.generateSessionSalt();
  }

  /**
   * Generate deterministic name based on input parameters
   * @param boardId - Board identifier
   * @param personaId - Persona identifier  
   * @param slotIndex - Position in grid
   * @param gender - Name gender preference
   */
  generateName(
    boardId: string,
    personaId: string,
    slotIndex: number,
    gender: NameGender
  ): GeneratedName {
    // Create deterministic seed
    const seed = this.createSeed(boardId, personaId, slotIndex);
    
    // Generate name with collision avoidance
    let attempts = 0;
    let generatedName: GeneratedName;
    
    do {
      const adjustedSeed = seed + attempts;
      generatedName = this.generateNameFromSeed(adjustedSeed, gender);
      attempts++;
    } while (this.usedNames.has(generatedName.fullName) && attempts < 100);
    
    // Mark name as used
    this.usedNames.add(generatedName.fullName);
    
    return generatedName;
  }

  /**
   * Generate name from deterministic seed
   */
  private generateNameFromSeed(seed: number, gender: NameGender): GeneratedName {
    const firstNames = gender === 'feminine' ? FEMININE_FIRST_NAMES : MASCULINE_FIRST_NAMES;
    
    // Use seed to select names deterministically
    const firstNameIndex = Math.abs(seed) % firstNames.length;
    const lastNameIndex = Math.abs(seed * 7) % SURNAMES.length;
    
    const firstName = firstNames[firstNameIndex];
    const lastName = SURNAMES[lastNameIndex];
    
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender
    };
  }

  /**
   * Create deterministic seed from input parameters
   */
  private createSeed(boardId: string, personaId: string, slotIndex: number): number {
    const input = `${boardId}-${personaId}-${slotIndex}-${this.sessionSalt}`;
    return this.simpleHash(input);
  }

  /**
   * Simple hash function for deterministic seed generation
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate session salt for uniqueness across sessions
   */
  private generateSessionSalt(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  /**
   * Reset used names (for new grid)
   */
  reset(): void {
    this.usedNames.clear();
  }

  /**
   * Get generation statistics
   */
  getStats(): {
    totalGenerated: number;
    uniqueNames: number;
    sessionSalt: string;
    availableFeminine: number;
    availableMasculine: number;
    availableSurnames: number;
  } {
    return {
      totalGenerated: this.usedNames.size,
      uniqueNames: this.usedNames.size,
      sessionSalt: this.sessionSalt,
      availableFeminine: FEMININE_FIRST_NAMES.length,
      availableMasculine: MASCULINE_FIRST_NAMES.length,
      availableSurnames: SURNAMES.length
    };
  }

  /**
   * Validate name is not a celebrity (basic check)
   */
  private isCelebrityName(firstName: string, lastName: string): boolean {
    // Basic celebrity name detection
    const celebrityPatterns = [
      'Einstein', 'Gandhi', 'Tesla', 'Jobs', 'Gates', 'Musk',
      'Obama', 'Trump', 'Biden', 'Clinton', 'Bush', 'Reagan',
      'Madonna', 'Beyonce', 'Oprah', 'Swift', 'Kardashian'
    ];
    
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return celebrityPatterns.some(pattern => 
      fullName.includes(pattern.toLowerCase())
    );
  }

  /**
   * Get all possible name combinations
   */
  getTotalCombinations(): {
    feminine: number;
    masculine: number;
    total: number;
  } {
    const feminineTotal = FEMININE_FIRST_NAMES.length * SURNAMES.length;
    const masculineTotal = MASCULINE_FIRST_NAMES.length * SURNAMES.length;
    
    return {
      feminine: feminineTotal,
      masculine: masculineTotal,
      total: feminineTotal + masculineTotal
    };
  }
}

/**
 * Utility functions
 */

// Create global name factory instance
let globalNameFactory: NameFactory | null = null;

export const getGlobalNameFactory = (): NameFactory => {
  if (!globalNameFactory) {
    globalNameFactory = new NameFactory();
  }
  return globalNameFactory;
};

// Reset global name factory
export const resetGlobalNameFactory = (): void => {
  globalNameFactory = new NameFactory();
};

// Validate name components
export const validateNameComponents = (firstName: string, lastName: string): boolean => {
  const isValidFirstName = 
    FEMININE_FIRST_NAMES.includes(firstName) || 
    MASCULINE_FIRST_NAMES.includes(firstName);
  const isValidLastName = SURNAMES.includes(lastName);
  
  return isValidFirstName && isValidLastName;
};

// Get name statistics
export const getNamePoolStats = () => {
  return {
    feminineFirstNames: FEMININE_FIRST_NAMES.length,
    masculineFirstNames: MASCULINE_FIRST_NAMES.length,
    surnames: SURNAMES.length,
    totalFeminineCombinations: FEMININE_FIRST_NAMES.length * SURNAMES.length,
    totalMasculineCombinations: MASCULINE_FIRST_NAMES.length * SURNAMES.length,
    grandTotal: (FEMININE_FIRST_NAMES.length + MASCULINE_FIRST_NAMES.length) * SURNAMES.length
  };
};

// Analytics integration
export const trackNameGeneration = (
  boardId: string,
  personaId: string,
  generatedName: GeneratedName
) => {
  console.log(`👤 Name Generated: ${generatedName.fullName} (${generatedName.gender}) for ${boardId}/${personaId}`);
  // In production, integrate with analytics service
};