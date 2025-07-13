import Phaser from 'phaser';
import { MapGenerator, TerrainType, MapData } from '../utils/MapGenerator';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private goal!: Phaser.GameObjects.Rectangle;
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
    private mapGenerator: MapGenerator;
    private currentMap!: MapData;
    private terrainTiles: Phaser.GameObjects.Rectangle[][] = [];

    constructor() {
        super({ key: 'GameScene' });
        this.mapGenerator = new MapGenerator(this.mapWidth, this.mapHeight);
    }

    create(): void {
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
        this.player = this.add.rectangle(0, 0, this.gridSize - 4, this.gridSize - 4, 0x3498db);
        this.player.setStrokeStyle(2, 0x2980b9);
    }

    private createGoal(): void {
        this.goal = this.add.rectangle(
            this.goalX * this.gridSize + 50 + this.gridSize / 2,
            this.goalY * this.gridSize + 50 + this.gridSize / 2,
            this.gridSize - 4,
            this.gridSize - 4,
            0xe74c3c
        );
        this.goal.setStrokeStyle(2, 0xc0392b);
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
    }

    private setupControls(): void {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
        
        this.input.keyboard!.on('keydown-R', () => {
            this.scene.restart();
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
                const config = MapGenerator.getTerrainConfig(terrainType);
                
                const tile = this.add.rectangle(
                    x * this.gridSize + 50 + this.gridSize / 2,
                    y * this.gridSize + 50 + this.gridSize / 2,
                    this.gridSize,
                    this.gridSize,
                    config.color
                );
                
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