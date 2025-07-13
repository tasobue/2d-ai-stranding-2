export interface MapSizeConfig {
    name: string;
    width: number;
    height: number;
    displayName: string;
    maxDimension: number;
}

export interface GameConfig {
    mapSizes: { [key: string]: MapSizeConfig };
    viewport: {
        width: number;
        height: number;
    };
    performance: {
        maxMapSize: number;
        tileRenderDistance: number;
    };
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
    mapSizes: {
        tiny: {
            name: 'tiny',
            width: 8,
            height: 8,
            displayName: 'Tiny (8x8)',
            maxDimension: 8
        },
        small: {
            name: 'small',
            width: 12,
            height: 12,
            displayName: 'Small (12x12)',
            maxDimension: 12
        },
        medium: {
            name: 'medium',
            width: 16,
            height: 16,
            displayName: 'Medium (16x16)',
            maxDimension: 16
        },
        large: {
            name: 'large',
            width: 20,
            height: 20,
            displayName: 'Large (20x20)',
            maxDimension: 20
        },
        huge: {
            name: 'huge',
            width: 50,
            height: 50,
            displayName: 'Huge (50x50)',
            maxDimension: 50
        },
        massive: {
            name: 'massive',
            width: 100,
            height: 100,
            displayName: 'Massive (100x100)',
            maxDimension: 100
        },
        gigantic: {
            name: 'gigantic',
            width: 200,
            height: 200,
            displayName: 'Gigantic (200x200)',
            maxDimension: 200
        },
        custom_1000: {
            name: 'custom_1000',
            width: 1000,
            height: 1000,
            displayName: 'Custom 1000x1000',
            maxDimension: 1000
        },
        custom_5000: {
            name: 'custom_5000',
            width: 5000,
            height: 5000,
            displayName: 'Custom 5000x5000',
            maxDimension: 5000
        },
        custom_10000: {
            name: 'custom_10000',
            width: 10000,
            height: 10000,
            displayName: 'Custom 10000x10000',
            maxDimension: 10000
        }
    },
    viewport: {
        width: 200,
        height: 200
    },
    performance: {
        maxMapSize: 10000,
        tileRenderDistance: 100
    }
};

export class GameConfigManager {
    private config: GameConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): GameConfig {
        // Try to load from localStorage first
        const stored = localStorage.getItem('gameConfig');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_GAME_CONFIG, ...parsed };
            } catch (e) {
                console.warn('Failed to parse stored config, using default');
            }
        }
        return DEFAULT_GAME_CONFIG;
    }

    saveConfig(): void {
        localStorage.setItem('gameConfig', JSON.stringify(this.config));
    }

    getMapSizeConfig(sizeKey: string): MapSizeConfig | null {
        return this.config.mapSizes[sizeKey] || null;
    }

    getAvailableMapSizes(): MapSizeConfig[] {
        return Object.values(this.config.mapSizes);
    }

    getViewportSize(): { width: number; height: number } {
        return this.config.viewport;
    }

    setCustomMapSize(width: number, height: number): string {
        // Clamp to maximum allowed size
        const maxSize = this.config.performance.maxMapSize;
        width = Math.min(width, maxSize);
        height = Math.min(height, maxSize);
        
        const key = `custom_${width}x${height}`;
        this.config.mapSizes[key] = {
            name: key,
            width,
            height,
            displayName: `Custom ${width}x${height}`,
            maxDimension: Math.max(width, height)
        };
        
        this.saveConfig();
        return key;
    }

    isLargeMap(sizeKey: string): boolean {
        const config = this.getMapSizeConfig(sizeKey);
        return config ? config.maxDimension > 50 : false;
    }

    shouldUseViewport(sizeKey: string): boolean {
        const config = this.getMapSizeConfig(sizeKey);
        return config ? config.maxDimension > 25 : false;
    }

    getTileRenderDistance(): number {
        return this.config.performance.tileRenderDistance;
    }
}