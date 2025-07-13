import Phaser from 'phaser';
import { MapGenerator, TerrainType, MapData } from '../utils/MapGenerator';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { AutoTileSystem } from '../graphics/AutoTileSystem';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Sprite;
    private goal!: Phaser.GameObjects.Sprite;
    private playerX = 0;
    private playerY = 0;
    private goalX = 15;
    private goalY = 15;
    private gridSize = 32;
    private mapWidth = 16;
    private mapHeight = 16;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    private positionText!: Phaser.GameObjects.Text;
    private distanceText!: Phaser.GameObjects.Text;
    private restartButton!: Phaser.GameObjects.Text;
    private seedText!: Phaser.GameObjects.Text;
    private routeText!: Phaser.GameObjects.Text;
    private showPathButton!: Phaser.GameObjects.Text;
    private mapGenerator: MapGenerator;
    private currentMap!: MapData;
    private terrainTiles: Phaser.GameObjects.Sprite[][] = [];
    private pathTiles: Phaser.GameObjects.Rectangle[] = [];
    private showingPath = false;
    private textureGenerator!: TextureGenerator;
    private autoTileSystem!: AutoTileSystem;

    constructor() {
        super({ key: 'GameScene' });
        this.mapGenerator = new MapGenerator(this.mapWidth, this.mapHeight);
    }

    create(): void {
        this.textureGenerator = new TextureGenerator(this, this.gridSize);
        this.textureGenerator.generateAllTextures();
        
        this.autoTileSystem = new AutoTileSystem(this, this.gridSize);
        this.autoTileSystem.generateTransitionTextures();
        
        this.generateNewMap();
        this.createGrid();
        this.createTerrain();
        this.createPlayer();
        this.createGoal();
        this.createUI();
        this.setupControls();
        this.updatePlayerPosition();
    }

    private createGrid(): void {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x444444, 0.5);

        for (let x = 0; x <= this.mapWidth; x++) {
            graphics.moveTo(x * this.gridSize + 50, 50);
            graphics.lineTo(x * this.gridSize + 50, this.mapHeight * this.gridSize + 50);
        }

        for (let y = 0; y <= this.mapHeight; y++) {
            graphics.moveTo(50, y * this.gridSize + 50);
            graphics.lineTo(this.mapWidth * this.gridSize + 50, y * this.gridSize + 50);
        }

        graphics.strokePath();
    }

    private createPlayer(): void {
        this.player = this.add.sprite(0, 0, 'player');
        this.player.setDisplaySize(this.gridSize - 4, this.gridSize - 4);
    }

    private createGoal(): void {
        this.goal = this.add.sprite(
            this.goalX * this.gridSize + 50 + this.gridSize / 2,
            this.goalY * this.gridSize + 50 + this.gridSize / 2,
            'goal'
        );
        this.goal.setDisplaySize(this.gridSize - 4, this.gridSize - 4);
        
        // Add pulsing animation to goal
        this.tweens.add({
            targets: this.goal,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createUI(): void {
        this.positionText = this.add.text(570, 50, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.distanceText = this.add.text(570, 80, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.restartButton = this.add.text(570, 120, 'Restart (R)', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        
        this.restartButton.setInteractive({ useHandCursor: true });
        this.restartButton.on('pointerdown', () => {
            this.scene.restart();
        });

        this.seedText = this.add.text(570, 160, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.showPathButton = this.add.text(570, 200, 'Show Path (P)', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#2c3e50',
            padding: { x: 8, y: 4 }
        });
        
        this.showPathButton.setInteractive({ useHandCursor: true });
        this.showPathButton.on('pointerdown', () => {
            this.togglePath();
        });

        this.routeText = this.add.text(570, 240, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
    }

    private setupControls(): void {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
        
        this.input.keyboard!.on('keydown-R', () => {
            this.scene.restart();
        });

        this.input.keyboard!.on('keydown-P', () => {
            this.togglePath();
        });
    }

    private updatePlayerPosition(): void {
        const worldX = this.playerX * this.gridSize + 50 + this.gridSize / 2;
        const worldY = this.playerY * this.gridSize + 50 + this.gridSize / 2;
        this.player.setPosition(worldX, worldY);
        this.updateUI();
    }

    private generateNewMap(): void {
        this.currentMap = this.mapGenerator.generateMap();
        this.playerX = this.currentMap.startX;
        this.playerY = this.currentMap.startY;
        this.goalX = this.currentMap.goalX;
        this.goalY = this.currentMap.goalY;
    }

    private createTerrain(): void {
        this.terrainTiles = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            this.terrainTiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const terrainType = this.currentMap.grid[y][x];
                
                // Use auto-tile system for better texture selection
                const textureKey = this.autoTileSystem.getAutoTileKey(
                    this.currentMap.grid, x, y, this.mapWidth, this.mapHeight
                );
                
                const tile = this.add.sprite(
                    x * this.gridSize + 50 + this.gridSize / 2,
                    y * this.gridSize + 50 + this.gridSize / 2,
                    textureKey
                );
                
                tile.setDisplaySize(this.gridSize, this.gridSize);
                
                // Add animations based on terrain type
                if (terrainType === TerrainType.WATER) {
                    this.tweens.add({
                        targets: tile,
                        alpha: 0.7,
                        duration: 2000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                } else if (terrainType === TerrainType.FOREST) {
                    this.tweens.add({
                        targets: tile,
                        scaleX: 1.02,
                        scaleY: 1.02,
                        duration: 3000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
                
                this.terrainTiles[y][x] = tile;
            }
        }
    }

    private updateUI(): void {
        this.positionText.setText(`Position: (${this.playerX}, ${this.playerY})`);
        
        const distanceToGoal = Math.sqrt(
            Math.pow(this.goalX - this.playerX, 2) + 
            Math.pow(this.goalY - this.playerY, 2)
        );
        this.distanceText.setText(`Distance: ${distanceToGoal.toFixed(1)}`);
        this.seedText.setText(`Seed: ${this.currentMap.seed}`);
        
        const hasMultipleRoutes = this.mapGenerator.hasMultipleRoutes(
            this.currentMap.grid, this.currentMap.startX, this.currentMap.startY,
            this.currentMap.goalX, this.currentMap.goalY
        );
        this.routeText.setText(`Routes: ${hasMultipleRoutes ? 'Multiple' : 'Single'}`);
    }

    private togglePath(): void {
        if (this.showingPath) {
            this.hidePath();
        } else {
            this.showPath();
        }
        this.showingPath = !this.showingPath;
        this.showPathButton.setText(this.showingPath ? 'Hide Path (P)' : 'Show Path (P)');
    }

    private showPath(): void {
        const path = this.mapGenerator.findPath(
            this.currentMap.grid, this.playerX, this.playerY,
            this.currentMap.goalX, this.currentMap.goalY
        );

        this.pathTiles = [];
        for (const [x, y] of path) {
            if (x !== this.playerX || y !== this.playerY) {
                const pathTile = this.add.rectangle(
                    x * this.gridSize + 50 + this.gridSize / 2,
                    y * this.gridSize + 50 + this.gridSize / 2,
                    this.gridSize / 2,
                    this.gridSize / 2,
                    0xffff00,
                    0.7
                );
                pathTile.setDepth(10);
                this.pathTiles.push(pathTile);
            }
        }
    }

    private hidePath(): void {
        this.pathTiles.forEach(tile => tile.destroy());
        this.pathTiles = [];
    }

    private createMovementParticles(): void {
        const worldX = this.playerX * this.gridSize + 50 + this.gridSize / 2;
        const worldY = this.playerY * this.gridSize + 50 + this.gridSize / 2;
        
        const terrainType = this.currentMap.grid[this.playerY][this.playerX];
        
        // Create particles based on terrain type
        for (let i = 0; i < 5; i++) {
            const particle = this.add.rectangle(
                worldX + (Math.random() - 0.5) * this.gridSize,
                worldY + (Math.random() - 0.5) * this.gridSize,
                2,
                2,
                this.getParticleColor(terrainType)
            );
            
            particle.setAlpha(0.8);
            
            this.tweens.add({
                targets: particle,
                y: particle.y - 10 - Math.random() * 10,
                alpha: 0,
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    private getParticleColor(terrainType: TerrainType): number {
        switch (terrainType) {
            case TerrainType.GRASS: return 0x2ecc71;
            case TerrainType.SAND: return 0xf39c12;
            case TerrainType.FOREST: return 0x27ae60;
            case TerrainType.BRIDGE: return 0x8b4513;
            case TerrainType.MOUNTAIN_PASS: return 0x95a5a6;
            default: return 0x2ecc71;
        }
    }

    private movePlayer(dx: number, dy: number): void {
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight) {
            const terrainType = this.currentMap.grid[newY][newX];
            const config = MapGenerator.getTerrainConfig(terrainType);
            
            if (config.walkable) {
                this.playerX = newX;
                this.playerY = newY;
                this.updatePlayerPosition();
                this.checkGoalReached();
                
                if (this.showingPath) {
                    this.hidePath();
                    this.showPath();
                }
                
                this.createMovementParticles();
            }
        }
    }

    private checkGoalReached(): void {
        if (this.playerX === this.goalX && this.playerY === this.goalY) {
            this.showClearMessage();
        }
    }

    private showClearMessage(): void {
        const text = this.add.text(400, 300, 'CLEAR!', {
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        text.setOrigin(0.5);

        const restartText = this.add.text(400, 350, 'Press R to Restart', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        restartText.setOrigin(0.5);
    }

    update(): void {
        const justDown = Phaser.Input.Keyboard.JustDown;

        if (justDown(this.cursors.left!) || justDown(this.wasd.A)) {
            this.movePlayer(-1, 0);
        } else if (justDown(this.cursors.right!) || justDown(this.wasd.D)) {
            this.movePlayer(1, 0);
        } else if (justDown(this.cursors.up!) || justDown(this.wasd.W)) {
            this.movePlayer(0, -1);
        } else if (justDown(this.cursors.down!) || justDown(this.wasd.S)) {
            this.movePlayer(0, 1);
        }

        // 8方向移動（斜め移動）
        if (justDown(this.cursors.up!) && justDown(this.cursors.left!)) {
            this.movePlayer(-1, -1);
        } else if (justDown(this.cursors.up!) && justDown(this.cursors.right!)) {
            this.movePlayer(1, -1);
        } else if (justDown(this.cursors.down!) && justDown(this.cursors.left!)) {
            this.movePlayer(-1, 1);
        } else if (justDown(this.cursors.down!) && justDown(this.cursors.right!)) {
            this.movePlayer(1, 1);
        }
    }
}