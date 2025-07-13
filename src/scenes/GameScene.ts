import Phaser from 'phaser';
import { MapGenerator, TerrainType, MapData, Checkpoint, CollectibleItem } from '../utils/MapGenerator';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { AutoTileSystem } from '../graphics/AutoTileSystem';
import { MenuScene, GameSettings } from './MenuScene';
import { AudioManager } from '../audio/AudioManager';
import { WeatherSystem, WeatherType } from '../effects/WeatherSystem';
import { GameConfigManager } from '../config/GameConfig';

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
    private gameSettings!: GameSettings;
    private startTime!: number;
    private timeText!: Phaser.GameObjects.Text;
    private bestTimeText!: Phaser.GameObjects.Text;
    private backToMenuButton!: Phaser.GameObjects.Text;
    private audioManager!: AudioManager;
    private checkpointSprites: Phaser.GameObjects.Sprite[] = [];
    private collectibleSprites: Phaser.GameObjects.Sprite[] = [];
    private scoreText!: Phaser.GameObjects.Text;
    private collectedItems = 0;
    private weatherSystem!: WeatherSystem;
    private weatherText!: Phaser.GameObjects.Text;
    private maxHP = 100;
    private currentHP = 100;
    private hpText!: Phaser.GameObjects.Text;
    private hpBar!: Phaser.GameObjects.Graphics;
    private hpBarBg!: Phaser.GameObjects.Graphics;
    private showDetailedInfo = false;
    private toggleInfoButton!: Phaser.GameObjects.Text;
    private configManager!: GameConfigManager;
    private useViewport = false;
    private viewportWidth = 0;
    private viewportHeight = 0;
    private renderDistance = 100;
    private cameraContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: GameSettings): void {
        this.gameSettings = data || { mapSize: 'medium', difficulty: 'normal' };
        
        this.configManager = new GameConfigManager();
        const dimensions = MenuScene.getMapDimensions(this.gameSettings.mapSize);
        this.mapWidth = dimensions.width;
        this.mapHeight = dimensions.height;
        
        // Check if we should use viewport system
        this.useViewport = this.configManager.shouldUseViewport(this.gameSettings.mapSize);
        if (this.useViewport) {
            const viewportSize = this.configManager.getViewportSize();
            this.viewportWidth = viewportSize.width;
            this.viewportHeight = viewportSize.height;
            this.renderDistance = this.configManager.getTileRenderDistance();
        }
        
        this.mapGenerator = new MapGenerator(this.mapWidth, this.mapHeight);
        this.startTime = this.time.now;
        
        // Initialize HP based on difficulty
        this.initializeHP();
    }

    create(): void {
        this.audioManager = new AudioManager(this);
        this.audioManager.startAmbientBGM();
        
        this.textureGenerator = new TextureGenerator(this, this.gridSize);
        this.textureGenerator.generateAllTextures();
        
        this.autoTileSystem = new AutoTileSystem(this, this.gridSize);
        this.autoTileSystem.generateTransitionTextures();
        
        this.generateNewMap();
        
        if (this.useViewport) {
            this.setupViewportSystem();
        } else {
            this.createGrid();
            this.createTerrain();
        }
        
        this.createCheckpoints();
        this.createCollectibles();
        this.createPlayer();
        this.createGoal();
        this.createUI();
        this.setupControls();
        this.updatePlayerPosition();
        
        if (this.useViewport) {
            this.updateViewport();
        }"
        
        // Initialize weather system with the same RNG as map generator
        this.weatherSystem = new WeatherSystem(this, this.mapGenerator['rng']);
        this.weatherSystem.setWeather(WeatherType.CLEAR);
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
        this.positionText.setVisible(this.showDetailedInfo);

        this.distanceText = this.add.text(570, 80, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });
        this.distanceText.setVisible(this.showDetailedInfo);

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
        this.seedText.setVisible(this.showDetailedInfo);

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
        this.routeText.setVisible(this.showDetailedInfo);

        this.toggleInfoButton = this.add.text(570, 280, 'Show Info (I)', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#34495e',
            padding: { x: 8, y: 4 }
        });
        
        this.toggleInfoButton.setInteractive({ useHandCursor: true });
        this.toggleInfoButton.on('pointerdown', () => {
            this.toggleDetailedInfo();
        });

        this.timeText = this.add.text(570, 320, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.bestTimeText = this.add.text(570, 360, '', {
            fontSize: '14px',
            color: '#f39c12',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.backToMenuButton = this.add.text(570, 400, 'Menu (M)', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#8e44ad',
            padding: { x: 8, y: 4 }
        });
        
        this.backToMenuButton.setInteractive({ useHandCursor: true });
        this.backToMenuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        this.scoreText = this.add.text(570, 440, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.weatherText = this.add.text(570, 480, '', {
            fontSize: '14px',
            color: '#85c1e9',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        // Create HP UI
        this.createHPUI();
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

        this.input.keyboard!.on('keydown-M', () => {
            this.scene.start('MenuScene');
        });

        this.input.keyboard!.on('keydown-I', () => {
            this.toggleDetailedInfo();
        });
    }

    private updatePlayerPosition(): void {
        const worldX = this.playerX * this.gridSize + 50 + this.gridSize / 2;
        const worldY = this.playerY * this.gridSize + 50 + this.gridSize / 2;
        this.player.setPosition(worldX, worldY);
        this.updateUI();
    }

    private generateNewMap(): void {
        const seed = this.gameSettings.customSeed;
        this.currentMap = this.mapGenerator.generateMap(seed);
        this.playerX = this.currentMap.startX;
        this.playerY = this.currentMap.startY;
        this.goalX = this.currentMap.goalX;
        this.goalY = this.currentMap.goalY;
        this.startTime = this.time.now;
        this.collectedItems = 0;
        
        // Reset checkpoints and collectibles
        this.currentMap.checkpoints.forEach(cp => cp.visited = false);
        this.currentMap.collectibles.forEach(item => item.collected = false);
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

    private createCheckpoints(): void {
        this.checkpointSprites = [];
        
        this.currentMap.checkpoints.forEach((checkpoint, index) => {
            const sprite = this.add.sprite(
                checkpoint.x * this.gridSize + 50 + this.gridSize / 2,
                checkpoint.y * this.gridSize + 50 + this.gridSize / 2,
                'checkpoint'
            );
            sprite.setDisplaySize(this.gridSize - 8, this.gridSize - 8);
            sprite.setDepth(5);
            
            // Add pulsing animation
            this.tweens.add({
                targets: sprite,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            this.checkpointSprites.push(sprite);
        });
    }

    private createCollectibles(): void {
        this.collectibleSprites = [];
        
        this.currentMap.collectibles.forEach(item => {
            const sprite = this.add.sprite(
                item.x * this.gridSize + 50 + this.gridSize / 2,
                item.y * this.gridSize + 50 + this.gridSize / 2,
                item.type
            );
            sprite.setDisplaySize(this.gridSize - 12, this.gridSize - 12);
            sprite.setDepth(5);
            
            // Add floating animation
            this.tweens.add({
                targets: sprite,
                y: sprite.y - 3,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Add rotation for stars
            if (item.type === 'star') {
                this.tweens.add({
                    targets: sprite,
                    rotation: Math.PI * 2,
                    duration: 2000,
                    repeat: -1,
                    ease: 'Linear'
                });
            }
            
            this.collectibleSprites.push(sprite);
        });
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
        
        const currentTime = (this.time.now - this.startTime) / 1000;
        this.timeText.setText(`Time: ${currentTime.toFixed(1)}s`);
        
        const bestTime = this.getBestTime();
        if (bestTime) {
            this.bestTimeText.setText(`Best: ${bestTime.toFixed(1)}s`);
        } else {
            this.bestTimeText.setText('Best: --');
        }
        
        const totalCollectibles = this.currentMap.collectibles.length;
        const checkpointsVisited = this.currentMap.checkpoints.filter(cp => cp.visited).length;
        this.scoreText.setText(`Items: ${this.collectedItems}/${totalCollectibles}\nCheckpoints: ${checkpointsVisited}/${this.currentMap.checkpoints.length}`);
        
        if (this.weatherSystem) {
            this.weatherText.setText(`Weather: ${this.weatherSystem.getWeatherInfo()}`);
        }
        
        this.updateHPUI();
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

    private checkCollectibles(): void {
        this.currentMap.collectibles.forEach((item, index) => {
            if (!item.collected && item.x === this.playerX && item.y === this.playerY) {
                item.collected = true;
                this.collectedItems++;
                
                // Hide the sprite
                const sprite = this.collectibleSprites[index];
                if (sprite) {
                    // Play collection animation
                    this.tweens.add({
                        targets: sprite,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            sprite.destroy();
                        }
                    });
                }
                
                // Play collection sound based on item type
                this.audioManager.playMenuSelect();
            }
        });
    }

    private checkCheckpoints(): void {
        this.currentMap.checkpoints.forEach((checkpoint, index) => {
            if (!checkpoint.visited && checkpoint.x === this.playerX && checkpoint.y === this.playerY) {
                checkpoint.visited = true;
                
                // Change checkpoint appearance
                const sprite = this.checkpointSprites[index];
                if (sprite) {
                    sprite.setTint(0x2ecc71); // Green tint for visited
                    
                    // Play checkpoint activation animation
                    this.tweens.add({
                        targets: sprite,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 200,
                        yoyo: true,
                        ease: 'Back.easeOut'
                    });
                }
                
                this.audioManager.playMenuConfirm();
            }
        });
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
                this.audioManager.playStep();
                this.checkCollectibles();
                this.checkCheckpoints();
                this.applyTerrainDamage(terrainType);
                
                // Update viewport for large maps
                if (this.useViewport) {
                    this.updateViewport();
                }
                
                // Apply weather movement modifier
                if (this.weatherSystem) {
                    const weather = this.weatherSystem.getCurrentWeather();
                    if (weather.movementModifier < 1.0) {
                        // Add a slight delay for movement in bad weather
                        this.time.delayedCall(100 * (1.0 - weather.movementModifier), () => {
                            // Movement is already completed, this just adds a delay feel
                        });
                    }
                }
            }
        }
    }

    private checkGoalReached(): void {
        if (this.playerX === this.goalX && this.playerY === this.goalY) {
            const completionTime = (this.time.now - this.startTime) / 1000;
            this.saveBestTime(completionTime);
            this.audioManager.playGoal();
            this.showClearMessage(completionTime);
        }
    }

    private showClearMessage(completionTime: number): void {
        const text = this.add.text(400, 280, 'CLEAR!', {
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        text.setOrigin(0.5);

        const timeText = this.add.text(400, 330, `Time: ${completionTime.toFixed(1)}s`, {
            fontSize: '24px',
            color: '#f39c12',
            stroke: '#000000',
            strokeThickness: 2
        });
        timeText.setOrigin(0.5);

        const bestTime = this.getBestTime();
        if (bestTime && completionTime <= bestTime) {
            const newRecordText = this.add.text(400, 360, 'NEW BEST TIME!', {
                fontSize: '20px',
                color: '#e74c3c',
                stroke: '#000000',
                strokeThickness: 2
            });
            newRecordText.setOrigin(0.5);
        }

        const restartText = this.add.text(400, 420, 'Press R to Restart | Press M for Menu', {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        restartText.setOrigin(0.5);
    }

    private getBestTime(): number | null {
        const key = `bestTime_${this.gameSettings.mapSize}_${this.gameSettings.difficulty}`;
        const stored = localStorage.getItem(key);
        return stored ? parseFloat(stored) : null;
    }

    private saveBestTime(time: number): void {
        const key = `bestTime_${this.gameSettings.mapSize}_${this.gameSettings.difficulty}`;
        const current = this.getBestTime();
        
        if (!current || time < current) {
            localStorage.setItem(key, time.toString());
        }
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

    private initializeHP(): void {
        // Set HP based on difficulty
        switch (this.gameSettings.difficulty) {
            case 'easy':
                this.maxHP = 150;
                break;
            case 'normal':
                this.maxHP = 100;
                break;
            case 'hard':
                this.maxHP = 75;
                break;
            default:
                this.maxHP = 100;
        }
        this.currentHP = this.maxHP;
    }

    private createHPUI(): void {
        // HP Text
        this.hpText = this.add.text(570, 490, '', {
            fontSize: '16px',
            color: '#e74c3c',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        // HP Bar Background
        this.hpBarBg = this.add.graphics();
        this.hpBarBg.fillStyle(0x333333);
        this.hpBarBg.fillRect(570, 520, 120, 20);
        this.hpBarBg.lineStyle(2, 0x666666);
        this.hpBarBg.strokeRect(570, 520, 120, 20);

        // HP Bar
        this.hpBar = this.add.graphics();
    }

    private updateHPUI(): void {
        this.hpText.setText(`HP: ${this.currentHP}/${this.maxHP}`);
        
        // Update HP bar
        this.hpBar.clear();
        const hpRatio = this.currentHP / this.maxHP;
        const barWidth = 116 * hpRatio; // 120 - 4 (border)
        
        // Color based on HP percentage
        let barColor = 0x2ecc71; // Green
        if (hpRatio < 0.3) {
            barColor = 0xe74c3c; // Red
        } else if (hpRatio < 0.6) {
            barColor = 0xf39c12; // Orange
        }
        
        this.hpBar.fillStyle(barColor);
        this.hpBar.fillRect(572, 552, barWidth, 16);
    }

    private applyTerrainDamage(terrainType: TerrainType): void {
        let damage = 0;
        
        // Apply damage based on terrain and weather
        const weather = this.weatherSystem?.getCurrentWeather();
        const weatherMultiplier = weather ? weather.damageMultiplier || 1.0 : 1.0;
        
        switch (terrainType) {
            case TerrainType.FOREST:
                damage = 1; // Thorns and obstacles
                break;
            case TerrainType.MOUNTAIN_PASS:
                damage = 2; // Rocky terrain
                break;
            case TerrainType.SAND:
                damage = 1; // Dehydration in desert
                break;
        }
        
        // Apply weather multiplier
        damage = Math.floor(damage * weatherMultiplier);
        
        if (damage > 0) {
            this.takeDamage(damage);
        }
    }

    private takeDamage(amount: number): void {
        this.currentHP = Math.max(0, this.currentHP - amount);
        this.updateHPUI();
        
        // Visual feedback for damage
        this.cameras.main.shake(100, 0.01);
        
        // Flash effect
        this.tweens.add({
            targets: this.player,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
        
        if (this.currentHP <= 0) {
            this.gameOver();
        }
    }

    private gameOver(): void {
        // Stop all sounds
        this.audioManager.stopAllSounds();
        
        // Create game over overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        overlay.setDepth(100);
        
        const gameOverText = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px',
            color: '#e74c3c',
            stroke: '#000000',
            strokeThickness: 4
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(101);
        
        const hpText = this.add.text(400, 320, 'Your health reached zero!', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        hpText.setOrigin(0.5);
        hpText.setDepth(101);
        
        // Continue and Menu buttons
        const continueButton = this.add.text(320, 400, 'Continue (C)', {
            fontSize: '20px',
            color: '#2ecc71',
            backgroundColor: '#27ae60',
            padding: { x: 12, y: 8 }
        });
        continueButton.setOrigin(0.5);
        continueButton.setDepth(101);
        continueButton.setInteractive({ useHandCursor: true });
        continueButton.on('pointerdown', () => {
            this.continueGame();
        });
        
        const menuButton = this.add.text(480, 400, 'Menu (M)', {
            fontSize: '20px',
            color: '#3498db',
            backgroundColor: '#2980b9',
            padding: { x: 12, y: 8 }
        });
        menuButton.setOrigin(0.5);
        menuButton.setDepth(101);
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Keyboard controls
        this.input.keyboard!.on('keydown-C', () => {
            this.continueGame();
        });
        
        this.input.keyboard!.on('keydown-M', () => {
            this.scene.start('MenuScene');
        });
    }

    private continueGame(): void {
        // Restore HP and restart from last checkpoint or start
        this.currentHP = this.maxHP;
        
        // Find last visited checkpoint
        const lastCheckpoint = this.currentMap.checkpoints
            .filter(cp => cp.visited)
            .pop();
        
        if (lastCheckpoint) {
            this.playerX = lastCheckpoint.x;
            this.playerY = lastCheckpoint.y;
        } else {
            // Return to start
            this.playerX = this.currentMap.startX;
            this.playerY = this.currentMap.startY;
        }
        
        this.updatePlayerPosition();
        this.updateHPUI();
        
        // Restart the scene cleanly
        this.scene.restart();
    }

    private toggleDetailedInfo(): void {
        this.showDetailedInfo = !this.showDetailedInfo;
        
        // Toggle visibility of detailed UI elements
        this.positionText.setVisible(this.showDetailedInfo);
        this.distanceText.setVisible(this.showDetailedInfo);
        this.seedText.setVisible(this.showDetailedInfo);
        this.routeText.setVisible(this.showDetailedInfo);
        
        // Update button text
        this.toggleInfoButton.setText(this.showDetailedInfo ? 'Hide Info (I)' : 'Show Info (I)');
    }

    private setupViewportSystem(): void {
        // Create container for all game objects
        this.cameraContainer = this.add.container(0, 0);
        
        // Set camera bounds and enable smooth following
        this.cameras.main.setBounds(0, 0, this.mapWidth * this.gridSize + 100, this.mapHeight * this.gridSize + 100);
        this.cameras.main.setLerp(0.1, 0.1);
        
        // Initially create only viewport-sized terrain
        this.createViewportTerrain();
    }

    private createViewportTerrain(): void {
        this.terrainTiles = [];
        
        // Initialize 2D array for entire map
        for (let y = 0; y < this.mapHeight; y++) {
            this.terrainTiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.terrainTiles[y][x] = null as any; // Will be created when needed
            }
        }
    }

    private updateViewport(): void {
        if (!this.useViewport) return;
        
        // Calculate visible area around player
        const startX = Math.max(0, this.playerX - this.renderDistance);
        const endX = Math.min(this.mapWidth - 1, this.playerX + this.renderDistance);
        const startY = Math.max(0, this.playerY - this.renderDistance);
        const endY = Math.min(this.mapHeight - 1, this.playerY + this.renderDistance);
        
        // Create/update tiles in visible area
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (!this.terrainTiles[y][x]) {
                    this.createTerrainTile(x, y);
                }
            }
        }
        
        // Remove tiles that are too far away to improve performance
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.terrainTiles[y][x];
                if (tile && (x < startX - 50 || x > endX + 50 || y < startY - 50 || y > endY + 50)) {
                    tile.destroy();
                    this.terrainTiles[y][x] = null as any;
                }
            }
        }
        
        // Update camera to follow player
        this.cameras.main.startFollow(this.player);
    }

    private createTerrainTile(x: number, y: number): void {
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

    shutdown(): void {
        if (this.weatherSystem) {
            this.weatherSystem.destroy();
        }
        super.shutdown();
    }
}