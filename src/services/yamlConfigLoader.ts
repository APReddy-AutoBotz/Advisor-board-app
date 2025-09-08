import * as yaml from 'js-yaml';
import type { DomainSpec, Domain, Advisor, DomainId } from '../types';
import { getThemeForDomain } from '../utils/themeUtils';

export class YamlConfigLoader {
  private static instance: YamlConfigLoader;
  private configCache: Map<string, DomainSpec> = new Map();

  static getInstance(): YamlConfigLoader {
    if (!YamlConfigLoader.instance) {
      YamlConfigLoader.instance = new YamlConfigLoader();
    }
    return YamlConfigLoader.instance;
  }

  /**
   * Load YAML configuration file from public/configs directory
   */
  async loadYamlConfig(filename: string): Promise<DomainSpec> {
    // Check cache first
    if (this.configCache.has(filename)) {
      return this.configCache.get(filename)!;
    }

    try {
      const response = await fetch(`/configs/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.statusText}`);
      }

      const yamlText = await response.text();
      const config = yaml.load(yamlText) as DomainSpec;

      // Validate the loaded configuration
      this.validateDomainSpec(config, filename);

      // Cache the configuration
      this.configCache.set(filename, config);

      return config;
    } catch (error) {
      console.error(`Error loading YAML config ${filename}:`, error);
      throw new Error(`Failed to parse YAML configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform YAML DomainSpec into Domain object with proper typing
   */
  transformToDomain(spec: DomainSpec, domainId: DomainId): Domain {
    const theme = getThemeForDomain(domainId);
    
    const advisors: Advisor[] = spec.advisors.map((advisorSpec, index) => ({
      id: `${domainId}-${index}`,
      name: advisorSpec.name,
      expertise: advisorSpec.expertise,
      background: advisorSpec.background,
      domain: {} as Domain, // Will be set after domain creation
      isSelected: false,
    }));

    const domain: Domain = {
      id: domainId,
      name: spec.name,
      description: spec.description,
      theme,
      advisors,
    };

    // Set the domain reference in advisors
    advisors.forEach(advisor => {
      advisor.domain = domain;
    });

    return domain;
  }

  /**
   * Load all domain configurations
   */
  async loadAllDomains(): Promise<Domain[]> {
    const domainConfigs = [
      { filename: 'Cliniboard_Spec.yaml', id: 'cliniboard' as DomainId },
      { filename: 'EduBoard_Spec.yaml', id: 'eduboard' as DomainId },
      { filename: 'RemediBoard_Spec.yaml', id: 'remediboard' as DomainId },
    ];

    try {
      const domains = await Promise.all(
        domainConfigs.map(async ({ filename, id }) => {
          const spec = await this.loadYamlConfig(filename);
          return this.transformToDomain(spec, id);
        })
      );

      return domains;
    } catch (error) {
      console.error('Error loading domain configurations:', error);
      // Return fallback domains if loading fails
      return this.getFallbackDomains();
    }
  }

  /**
   * Get a specific domain by ID
   */
  async getDomain(domainId: DomainId): Promise<Domain> {
    const filenameMap: Record<DomainId, string> = {
      cliniboard: 'Cliniboard_Spec.yaml',
      eduboard: 'EduBoard_Spec.yaml',
      remediboard: 'RemediBoard_Spec.yaml',
    };

    const filename = filenameMap[domainId];
    if (!filename) {
      throw new Error(`Unknown domain ID: ${domainId}`);
    }

    try {
      const spec = await this.loadYamlConfig(filename);
      return this.transformToDomain(spec, domainId);
    } catch (error) {
      console.error(`Error loading domain ${domainId}:`, error);
      return this.getFallbackDomain(domainId);
    }
  }

  /**
   * Validate YAML configuration structure
   */
  private validateDomainSpec(config: any, filename: string): void {
    if (!config || typeof config !== 'object') {
      throw new Error(`Invalid YAML structure in ${filename}`);
    }

    if (!config.name || typeof config.name !== 'string') {
      throw new Error(`Missing or invalid 'name' field in ${filename}`);
    }

    if (!config.description || typeof config.description !== 'string') {
      throw new Error(`Missing or invalid 'description' field in ${filename}`);
    }

    if (!Array.isArray(config.advisors) || config.advisors.length === 0) {
      throw new Error(`Missing or empty 'advisors' array in ${filename}`);
    }

    // Validate each advisor
    config.advisors.forEach((advisor: any, index: number) => {
      if (!advisor.name || typeof advisor.name !== 'string') {
        throw new Error(`Invalid advisor name at index ${index} in ${filename}`);
      }
      if (!advisor.expertise || typeof advisor.expertise !== 'string') {
        throw new Error(`Invalid advisor expertise at index ${index} in ${filename}`);
      }
      if (!advisor.background || typeof advisor.background !== 'string') {
        throw new Error(`Invalid advisor background at index ${index} in ${filename}`);
      }
    });

    // Validate use_cases if present
    if (config.use_cases && !Array.isArray(config.use_cases)) {
      throw new Error(`Invalid 'use_cases' field in ${filename} - must be an array`);
    }
  }

  /**
   * Provide fallback domains when YAML loading fails
   */
  private getFallbackDomains(): Domain[] {
    return [
      this.getFallbackDomain('cliniboard'),
      this.getFallbackDomain('eduboard'),
      this.getFallbackDomain('remediboard'),
    ];
  }

  /**
   * Create a fallback domain with minimal configuration
   */
  private getFallbackDomain(domainId: DomainId): Domain {
    const fallbackConfigs = {
      cliniboard: {
        name: 'Cliniboard',
        description: 'Clinical research and regulatory guidance',
        advisors: [{ name: 'Clinical Expert', expertise: 'General Clinical', background: 'Fallback advisor' }],
      },
      eduboard: {
        name: 'EduBoard',
        description: 'Education systems and curriculum reform',
        advisors: [{ name: 'Education Expert', expertise: 'General Education', background: 'Fallback advisor' }],
      },
      remediboard: {
        name: 'RemediBoard',
        description: 'Natural and traditional medicine',
        advisors: [{ name: 'Remedies Expert', expertise: 'General Remedies', background: 'Fallback advisor' }],
      },
    };

    const config = fallbackConfigs[domainId];
    const theme = getThemeForDomain(domainId);

    const advisors: Advisor[] = config.advisors.map((advisorSpec, index) => ({
      id: `${domainId}-fallback-${index}`,
      name: advisorSpec.name,
      expertise: advisorSpec.expertise,
      background: advisorSpec.background,
      domain: {} as Domain,
      isSelected: false,
    }));

    const domain: Domain = {
      id: domainId,
      name: config.name,
      description: config.description,
      theme,
      advisors,
    };

    advisors.forEach(advisor => {
      advisor.domain = domain;
    });

    return domain;
  }

  /**
   * Clear the configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }
}

// Export singleton instance
export const yamlConfigLoader = YamlConfigLoader.getInstance();