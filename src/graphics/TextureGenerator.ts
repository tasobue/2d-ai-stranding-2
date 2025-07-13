import Phaser from 'phaser';
import { TerrainType } from '../utils/MapGenerator';

export class TextureGenerator {
    private scene: Phaser.Scene;
    private tileSize: number;

    constructor(scene: Phaser.Scene, tileSize: number = 32) {
        this.scene = scene;
        this.tileSize = tileSize;
    }

    generateAllTextures(): void {
        this.generateGrassTexture();
        this.generateSandTexture();
        this.generateWaterTexture();
        this.generateMountainTexture();
        this.generateForestTexture();
        this.generateBridgeTexture();
        this.generateMountainPassTexture();
        this.generatePlayerTexture();
        this.generateGoalTexture();
        this.generateCheckpointTexture();
        this.generateCollectibleTextures();
    }

    private generateGrassTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base grass color
        graphics.fillStyle(0x2ecc71);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add grass details
        graphics.fillStyle(0x27ae60);
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 2, 4);
        }
        
        // Add lighter spots
        graphics.fillStyle(0x58d68d);
        for (let i = 0; i < 4; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 3, 3);
        }
        
        graphics.generateTexture('grass', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateSandTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base sand color
        graphics.fillStyle(0xf39c12);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add sand grains
        graphics.fillStyle(0xe67e22);
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 1, 1);
        }
        
        // Add lighter sand spots
        graphics.fillStyle(0xf8c471);
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('sand', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateWaterTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base water color
        graphics.fillStyle(0x3498db);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add wave patterns
        graphics.fillStyle(0x5dade2);
        for (let y = 0; y < this.tileSize; y += 4) {
            const waveOffset = Math.sin(y * 0.2) * 2;
            graphics.fillRect(waveOffset, y, this.tileSize, 2);
        }
        
        // Add water sparkles
        graphics.fillStyle(0x85c1e9);
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('water', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateMountainTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base mountain color
        graphics.fillStyle(0x95a5a6);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add rock details
        graphics.fillStyle(0x7f8c8d);
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 3, 2);
        }
        
        // Add highlights
        graphics.fillStyle(0xbdc3c7);
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 2, 1);
        }
        
        graphics.generateTexture('mountain', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateForestTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base forest color (darker green)
        graphics.fillStyle(0x27ae60);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add tree trunks
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(8, 20, 3, 8);
        graphics.fillRect(20, 15, 2, 10);
        
        // Add tree foliage
        graphics.fillStyle(0x2ecc71);
        graphics.fillRect(5, 15, 9, 8);
        graphics.fillRect(18, 10, 8, 8);
        
        // Add darker forest spots
        graphics.fillStyle(0x1e8449);
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('forest', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateBridgeTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base water color
        graphics.fillStyle(0x3498db);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Bridge planks
        graphics.fillStyle(0x8b4513);
        for (let x = 0; x < this.tileSize; x += 4) {
            graphics.fillRect(x, 12, 3, 8);
        }
        
        // Bridge supports
        graphics.fillStyle(0x654321);
        graphics.fillRect(0, 14, this.tileSize, 2);
        graphics.fillRect(0, 18, this.tileSize, 2);
        
        graphics.generateTexture('bridge', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateMountainPassTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Base pass color (lighter gray)
        graphics.fillStyle(0x7f8c8d);
        graphics.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add path stones
        graphics.fillStyle(0x95a5a6);
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 4, 3);
        }
        
        // Add darker cracks
        graphics.fillStyle(0x5d6d7e);
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            graphics.fillRect(x, y, 1, 6);
        }
        
        graphics.generateTexture('mountain_pass', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generatePlayerTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Player body (blue)
        graphics.fillStyle(0x3498db);
        graphics.fillRect(12, 8, 8, 12);
        
        // Player head (light skin)
        graphics.fillStyle(0xfdbcb4);
        graphics.fillRect(14, 4, 4, 4);
        
        // Player eyes
        graphics.fillStyle(0x000000);
        graphics.fillRect(15, 5, 1, 1);
        graphics.fillRect(17, 5, 1, 1);
        
        // Player arms
        graphics.fillStyle(0x3498db);
        graphics.fillRect(10, 10, 3, 6);
        graphics.fillRect(19, 10, 3, 6);
        
        // Player legs
        graphics.fillStyle(0x2c3e50);
        graphics.fillRect(13, 20, 2, 8);
        graphics.fillRect(17, 20, 2, 8);
        
        graphics.generateTexture('player', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateGoalTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Goal flag pole
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(15, 8, 2, 20);
        
        // Goal flag
        graphics.fillStyle(0xe74c3c);
        graphics.fillRect(17, 8, 8, 6);
        
        // Flag pattern
        graphics.fillStyle(0xffffff);
        graphics.fillRect(18, 9, 1, 1);
        graphics.fillRect(20, 9, 1, 1);
        graphics.fillRect(22, 9, 1, 1);
        graphics.fillRect(19, 11, 1, 1);
        graphics.fillRect(21, 11, 1, 1);
        graphics.fillRect(23, 11, 1, 1);
        
        // Goal base
        graphics.fillStyle(0x34495e);
        graphics.fillRect(12, 26, 8, 4);
        
        graphics.generateTexture('goal', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateCheckpointTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Checkpoint base (blue circle)
        graphics.fillStyle(0x3498db);
        graphics.fillCircle(this.tileSize / 2, this.tileSize / 2, 12);
        
        // Inner circle
        graphics.fillStyle(0x2980b9);
        graphics.fillCircle(this.tileSize / 2, this.tileSize / 2, 8);
        
        // Center dot
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(this.tileSize / 2, this.tileSize / 2, 4);
        
        // Checkpoint number placeholder
        graphics.fillStyle(0x2980b9);
        graphics.fillRect(this.tileSize / 2 - 2, this.tileSize / 2 - 2, 4, 4);
        
        graphics.generateTexture('checkpoint', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateCollectibleTextures(): void {
        this.generateCoinTexture();
        this.generateGemTexture();
        this.generateStarTexture();
    }

    private generateCoinTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Coin body (golden)
        graphics.fillStyle(0xf1c40f);
        graphics.fillCircle(this.tileSize / 2, this.tileSize / 2, 10);
        
        // Coin shine
        graphics.fillStyle(0xf39c12);
        graphics.fillCircle(this.tileSize / 2, this.tileSize / 2, 8);
        
        // Inner detail
        graphics.fillStyle(0xf1c40f);
        graphics.fillCircle(this.tileSize / 2, this.tileSize / 2, 6);
        
        // Center symbol
        graphics.fillStyle(0xe67e22);
        graphics.fillRect(this.tileSize / 2 - 2, this.tileSize / 2 - 4, 4, 8);
        graphics.fillRect(this.tileSize / 2 - 4, this.tileSize / 2 - 2, 8, 4);
        
        graphics.generateTexture('coin', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateGemTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Gem body (purple)
        graphics.fillStyle(0x9b59b6);
        const centerX = this.tileSize / 2;
        const centerY = this.tileSize / 2;
        
        // Diamond shape
        graphics.beginPath();
        graphics.moveTo(centerX, centerY - 8);
        graphics.lineTo(centerX + 6, centerY - 2);
        graphics.lineTo(centerX + 4, centerY + 6);
        graphics.lineTo(centerX - 4, centerY + 6);
        graphics.lineTo(centerX - 6, centerY - 2);
        graphics.closePath();
        graphics.fillPath();
        
        // Gem highlights
        graphics.fillStyle(0xad6bad);
        graphics.fillRect(centerX - 1, centerY - 6, 2, 4);
        graphics.fillRect(centerX + 2, centerY - 4, 2, 3);
        
        graphics.generateTexture('gem', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    private generateStarTexture(): void {
        const graphics = this.scene.add.graphics();
        
        // Star body (yellow)
        graphics.fillStyle(0xf1c40f);
        const centerX = this.tileSize / 2;
        const centerY = this.tileSize / 2;
        
        // 5-pointed star
        graphics.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * 8;
            const y = centerY + Math.sin(angle) * 8;
            
            if (i === 0) graphics.moveTo(x, y);
            else graphics.lineTo(x, y);
        }
        graphics.closePath();
        graphics.fillPath();
        
        // Star center
        graphics.fillStyle(0xe67e22);
        graphics.fillCircle(centerX, centerY, 3);
        
        graphics.generateTexture('star', this.tileSize, this.tileSize);
        graphics.destroy();
    }

    static getTextureKey(terrainType: TerrainType): string {
        switch (terrainType) {
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