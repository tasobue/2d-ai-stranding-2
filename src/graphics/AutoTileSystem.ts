import Phaser from 'phaser';
import { TerrainType } from '../utils/MapGenerator';

export class AutoTileSystem {
    private scene: Phaser.Scene;
    private tileSize: number;

    constructor(scene: Phaser.Scene, tileSize: number = 32) {
        this.scene = scene;
        this.tileSize = tileSize;
    }

    generateTransitionTextures(): void {
        this.generateWaterTransitions();
        this.generateMountainTransitions();
        this.generateForestTransitions();
    }

    private generateWaterTransitions(): void {
        // Water to grass transitions
        this.generateTransitionTexture('water_grass_n', 0x3498db, 0x2ecc71, 'north');
        this.generateTransitionTexture('water_grass_s', 0x3498db, 0x2ecc71, 'south');
        this.generateTransitionTexture('water_grass_e', 0x3498db, 0x2ecc71, 'east');
        this.generateTransitionTexture('water_grass_w', 0x3498db, 0x2ecc71, 'west');
        
        // Water corners
        this.generateCornerTexture('water_grass_ne', 0x3498db, 0x2ecc71, 'northeast');
        this.generateCornerTexture('water_grass_nw', 0x3498db, 0x2ecc71, 'northwest');
        this.generateCornerTexture('water_grass_se', 0x3498db, 0x2ecc71, 'southeast');
        this.generateCornerTexture('water_grass_sw', 0x3498db, 0x2ecc71, 'southwest');
    }

    private generateMountainTransitions(): void {
        // Mountain to grass transitions
        this.generateTransitionTexture('mountain_grass_n', 0x95a5a6, 0x2ecc71, 'north');
        this.generateTransitionTexture('mountain_grass_s', 0x95a5a6, 0x2ecc71, 'south');
        this.generateTransitionTexture('mountain_grass_e', 0x95a5a6, 0x2ecc71, 'east');
        this.generateTransitionTexture('mountain_grass_w', 0x95a5a6, 0x2ecc71, 'west');
    }

    private generateForestTransitions(): void {
        // Forest to grass transitions
        this.generateTransitionTexture('forest_grass_n', 0x27ae60, 0x2ecc71, 'north');
        this.generateTransitionTexture('forest_grass_s', 0x27ae60, 0x2ecc71, 'south');
        this.generateTransitionTexture('forest_grass_e', 0x27ae60, 0x2ecc71, 'east');
        this.generateTransitionTexture('forest_grass_w', 0x27ae60, 0x2ecc71, 'west');
    }

    private generateTransitionTexture(
        key: string, 
        primaryColor: number, 
        secondaryColor: number, 
        direction: string
    ): void {
        const graphics = this.scene.add.graphics();
        
        // Fill with secondary color first
        graphics.fillStyle(secondaryColor);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add primary color based on direction
        graphics.fillStyle(primaryColor);
        
        switch (direction) {
            case 'north':
                graphics.fillRect(0, 0, this.tileSize, this.tileSize / 2);
                this.addTransitionPattern(graphics, primaryColor, secondaryColor, 'horizontal');
                break;
            case 'south':
                graphics.fillRect(0, this.tileSize / 2, this.tileSize, this.tileSize / 2);
                this.addTransitionPattern(graphics, primaryColor, secondaryColor, 'horizontal');
                break;
            case 'east':
                graphics.fillRect(this.tileSize / 2, 0, this.tileSize / 2, this.tileSize);
                this.addTransitionPattern(graphics, primaryColor, secondaryColor, 'vertical');
                break;
            case 'west':
                graphics.fillRect(0, 0, this.tileSize / 2, this.tileSize);
                this.addTransitionPattern(graphics, primaryColor, secondaryColor, 'vertical');
                break;
        }
        
        graphics.generateTexture(key, this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateCornerTexture(
        key: string, 
        primaryColor: number, 
        secondaryColor: number, 
        corner: string
    ): void {
        const graphics = this.scene.add.graphics();
        
        // Fill with secondary color first
        graphics.fillStyle(secondaryColor);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add primary color corner
        graphics.fillStyle(primaryColor);
        
        const half = this.tileSize / 2;
        switch (corner) {
            case 'northeast':
                graphics.fillRect(half, 0, half, half);
                break;
            case 'northwest':
                graphics.fillRect(0, 0, half, half);
                break;
            case 'southeast':
                graphics.fillRect(half, half, half, half);
                break;
            case 'southwest':
                graphics.fillRect(0, half, half, half);
                break;
        }
        
        this.addCornerPattern(graphics, primaryColor, secondaryColor, corner);
        
        graphics.generateTexture(key, this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private addTransitionPattern(
        graphics: Phaser.GameObjects.Graphics, 
        primaryColor: number, 
        secondaryColor: number, 
        orientation: string
    ): void {
        // Add dithering pattern for smooth transition
        graphics.fillStyle(primaryColor);
        
        if (orientation === 'horizontal') {
            const midY = this.tileSize / 2;
            for (let x = 0; x < this.tileSize; x += 2) {
                graphics.fillRect(x, midY - 2, 1, 1);
                graphics.fillRect(x + 1, midY + 1, 1, 1);
            }
        } else {
            const midX = this.tileSize / 2;
            for (let y = 0; y < this.tileSize; y += 2) {
                graphics.fillRect(midX - 2, y, 1, 1);
                graphics.fillRect(midX + 1, y + 1, 1, 1);
            }
        }
    }

    private addCornerPattern(
        graphics: Phaser.GameObjects.Graphics, 
        primaryColor: number, 
        secondaryColor: number, 
        corner: string
    ): void {
        // Add small transition details around corners
        graphics.fillStyle(primaryColor);
        
        const quarter = this.tileSize / 4;
        const half = this.tileSize / 2;
        const threeQuarter = (this.tileSize * 3) / 4;
        
        switch (corner) {
            case 'northeast':
                graphics.fillRect(threeQuarter, quarter, 2, 2);
                break;
            case 'northwest':
                graphics.fillRect(quarter, quarter, 2, 2);
                break;
            case 'southeast':
                graphics.fillRect(threeQuarter, threeQuarter, 2, 2);
                break;
            case 'southwest':
                graphics.fillRect(quarter, threeQuarter, 2, 2);
                break;
        }
    }

    getAutoTileKey(
        grid: TerrainType[][], 
        x: number, 
        y: number, 
        width: number, 
        height: number
    ): string {
        const current = grid[y][x];
        
        // Check neighbors
        const north = y > 0 ? grid[y - 1][x] : current;
        const south = y < height - 1 ? grid[y + 1][x] : current;
        const east = x < width - 1 ? grid[y][x + 1] : current;
        const west = x > 0 ? grid[y][x - 1] : current;
        
        // Check diagonals
        const northeast = (y > 0 && x < width - 1) ? grid[y - 1][x + 1] : current;
        const northwest = (y > 0 && x > 0) ? grid[y - 1][x - 1] : current;
        const southeast = (y < height - 1 && x < width - 1) ? grid[y + 1][x + 1] : current;
        const southwest = (y < height - 1 && x > 0) ? grid[y + 1][x - 1] : current;
        
        // Water auto-tiling
        if (current === TerrainType.WATER) {
            if (north !== TerrainType.WATER && this.isLand(north)) return 'water_grass_n';
            if (south !== TerrainType.WATER && this.isLand(south)) return 'water_grass_s';
            if (east !== TerrainType.WATER && this.isLand(east)) return 'water_grass_e';
            if (west !== TerrainType.WATER && this.isLand(west)) return 'water_grass_w';
            
            // Corner transitions
            if (northeast !== TerrainType.WATER && this.isLand(northeast)) return 'water_grass_ne';
            if (northwest !== TerrainType.WATER && this.isLand(northwest)) return 'water_grass_nw';
            if (southeast !== TerrainType.WATER && this.isLand(southeast)) return 'water_grass_se';
            if (southwest !== TerrainType.WATER && this.isLand(southwest)) return 'water_grass_sw';
        }
        
        // Mountain auto-tiling
        if (current === TerrainType.MOUNTAIN) {
            if (north !== TerrainType.MOUNTAIN && this.isLand(north)) return 'mountain_grass_n';
            if (south !== TerrainType.MOUNTAIN && this.isLand(south)) return 'mountain_grass_s';
            if (east !== TerrainType.MOUNTAIN && this.isLand(east)) return 'mountain_grass_e';
            if (west !== TerrainType.MOUNTAIN && this.isLand(west)) return 'mountain_grass_w';
        }
        
        // Forest auto-tiling
        if (current === TerrainType.FOREST) {
            if (north !== TerrainType.FOREST && this.isLand(north)) return 'forest_grass_n';
            if (south !== TerrainType.FOREST && this.isLand(south)) return 'forest_grass_s';
            if (east !== TerrainType.FOREST && this.isLand(east)) return 'forest_grass_e';
            if (west !== TerrainType.FOREST && this.isLand(west)) return 'forest_grass_w';
        }
        
        // Return base texture if no transitions needed
        return this.getBaseTextureKey(current);
    }

    private isLand(terrain: TerrainType): boolean {
        return terrain === TerrainType.GRASS || 
               terrain === TerrainType.SAND || 
               terrain === TerrainType.FOREST ||
               terrain === TerrainType.BRIDGE ||
               terrain === TerrainType.MOUNTAIN_PASS;
    }

    private getBaseTextureKey(terrain: TerrainType): string {
        switch (terrain) {
            case TerrainType.GRASS: return 'grass';
            case TerrainType.SAND: return 'sand';
            case TerrainType.WATER: return 'water';
            case TerrainType.MOUNTAIN: return 'mountain';
            case TerrainType.FOREST: return 'forest';
            case TerrainType.BRIDGE: return 'bridge';
            case TerrainType.MOUNTAIN_PASS: return 'mountain_pass';
            default: return 'grass';
        }
    }
}