/**
 * Portrait Registry & Assignment System
 * 
 * Manages the six transparent PNG portraits for AI-advisor gallery
 * Ensures consistent assignment across boards with gender balance
 * Prevents duplicate portraits in visible grids
 */

export type GenderTag = 'feminine' | 'masculine';
export type GenderPreference = 'fem' | 'masc' | 'any';

export interface PortraitEntry {
  key: string;
  url: string;
  genderTag: GenderTag;
  alt: string;
}

export interface PortraitAssignment {
  portraitKey: string;
  url: string;
  alt: string;
  genderTag: GenderTag;
}

// Portrait Registry - Six transparent PNG portraits (using existing assets)
export const PORTRAIT_REGISTRY: PortraitEntry[] = [
  {
    key: 'a1_strategy-pm',
    url: '/Portraits/a1_strategy-pm.png',
    genderTag: 'masculine',
    alt: 'Illustrated portrait of AI advisor (simulated persona)'
  },
  {
    key: 'a2_safety-md',
    url: '/Portraits/a2_safety-md.png',
    genderTag: 'feminine',
    alt: 'Illustrated portrait of AI advisor (simulated persona)'
  },
  {
    key: 'a3_reg-reviewer',
    url: '/Portraits/a3_reg-reviewer.png',
    genderTag: 'masculine',
    alt: 'Illustrated portrait of AI advisor (simulated persona)'
  },
  {
    key: 'a4_data-scientist',
    url: '/Portraits/a4_data-scientist.png',
    genderTag: 'masculine',
    alt: 'Illustrated portrait of AI advisor (simulated persona)'
  },
  {
    key: 'a5_pedagogy-mentor',
    url: '/Portraits/a5_pedagogy-mentor.png',
    genderTag: 'feminine',
    alt: 'Illustrated portrait of AI advisor (simulated persona)'
  },
  {
    key: 'a6_diet-lifestyle',
    url: '/Portraits/a6_diet-lifestyle.png',
    genderTag: 'masculine',
    alt: 'Illustrated portrait of AI advisor (simulated persona)'
  }
];

// Gender pools for assignment
export const GENDER_POOLS = {
  feminine: PORTRAIT_REGISTRY.filter(p => p.genderTag === 'feminine'),
  masculine: PORTRAIT_REGISTRY.filter(p => p.genderTag === 'masculine')
};

/**
 * Portrait Assignment Engine
 * Assigns portraits based on gender preference with no duplicates in visible grid
 */
export class PortraitAssignmentEngine {
  private usedPortraits: Set<string> = new Set();
  private femIndex = 0;
  private mascIndex = 0;

  /**
   * Assign portrait based on gender preference
   * @param genderPref - Gender preference for the advisor
   * @param advisorId - Unique advisor ID for deterministic assignment
   * @param firstName - First name for personalized alt text
   * @param lastName - Last name for personalized alt text
   */
  assignPortrait(
    genderPref: GenderPreference,
    advisorId: string,
    firstName: string,
    lastName: string
  ): PortraitAssignment {
    let selectedPortrait: PortraitEntry;

    if (genderPref === 'fem') {
      selectedPortrait = this.getFromPool(GENDER_POOLS.feminine, 'feminine');
    } else if (genderPref === 'masc') {
      selectedPortrait = this.getFromPool(GENDER_POOLS.masculine, 'masculine');
    } else {
      // 'any' - alternate between pools for balance
      const usefeminine = this.usedPortraits.size % 2 === 0;
      selectedPortrait = usefeminine 
        ? this.getFromPool(GENDER_POOLS.feminine, 'feminine')
        : this.getFromPool(GENDER_POOLS.masculine, 'masculine');
    }

    // Mark as used
    this.usedPortraits.add(selectedPortrait.key);

    // Generate personalized alt text
    const personalizedAlt = `Illustrated portrait of AI ${firstName} ${lastName} (simulated persona)`;

    return {
      portraitKey: selectedPortrait.key,
      url: selectedPortrait.url,
      alt: personalizedAlt,
      genderTag: selectedPortrait.genderTag
    };
  }

  /**
   * Get portrait from specific gender pool with round-robin
   */
  private getFromPool(pool: PortraitEntry[], genderTag: GenderTag): PortraitEntry {
    // Find unused portraits in pool
    const availableInPool = pool.filter(p => !this.usedPortraits.has(p.key));
    
    if (availableInPool.length > 0) {
      // Use round-robin within available portraits
      const index = genderTag === 'feminine' ? this.femIndex : this.mascIndex;
      const selected = availableInPool[index % availableInPool.length];
      
      // Increment index for next assignment
      if (genderTag === 'feminine') {
        this.femIndex++;
      } else {
        this.mascIndex++;
      }
      
      return selected;
    } else {
      // All portraits in pool are used, reset and round-robin
      const index = genderTag === 'feminine' ? this.femIndex : this.mascIndex;
      const selected = pool[index % pool.length];
      
      // Increment index for next assignment
      if (genderTag === 'feminine') {
        this.femIndex++;
      } else {
        this.mascIndex++;
      }
      
      return selected;
    }
  }

  /**
   * Reset assignment state (for new grid)
   */
  reset(): void {
    this.usedPortraits.clear();
    this.femIndex = 0;
    this.mascIndex = 0;
  }

  /**
   * Get assignment statistics
   */
  getStats(): {
    totalUsed: number;
    feminineUsed: number;
    masculineUsed: number;
    availableFeminine: number;
    availableMasculine: number;
  } {
    const usedFeminine = Array.from(this.usedPortraits).filter(key => 
      PORTRAIT_REGISTRY.find(p => p.key === key)?.genderTag === 'feminine'
    ).length;
    
    const usedMasculine = Array.from(this.usedPortraits).filter(key => 
      PORTRAIT_REGISTRY.find(p => p.key === key)?.genderTag === 'masculine'
    ).length;

    return {
      totalUsed: this.usedPortraits.size,
      feminineUsed: usedFeminine,
      masculineUsed: usedMasculine,
      availableFeminine: GENDER_POOLS.feminine.length - usedFeminine,
      availableMasculine: GENDER_POOLS.masculine.length - usedMasculine
    };
  }
}

/**
 * Utility functions
 */

// Get portrait by key
export const getPortraitByKey = (key: string): PortraitEntry | undefined => {
  return PORTRAIT_REGISTRY.find(p => p.key === key);
};

// Get all portraits by gender
export const getPortraitsByGender = (genderTag: GenderTag): PortraitEntry[] => {
  return PORTRAIT_REGISTRY.filter(p => p.genderTag === genderTag);
};

// Validate portrait exists
export const validatePortraitKey = (key: string): boolean => {
  return PORTRAIT_REGISTRY.some(p => p.key === key);
};

// Get portrait statistics
export const getPortraitStats = () => {
  return {
    total: PORTRAIT_REGISTRY.length,
    feminine: GENDER_POOLS.feminine.length,
    masculine: GENDER_POOLS.masculine.length,
    ratio: `${GENDER_POOLS.feminine.length}:${GENDER_POOLS.masculine.length}`
  };
};

// Analytics integration
export const trackPortraitAssignment = (
  advisorId: string,
  genderPref: GenderPreference,
  portraitKey: string
) => {
  console.log(`🖼️ Portrait Assignment: ${advisorId} (${genderPref}) → ${portraitKey}`);
  // In production, integrate with analytics service
};
