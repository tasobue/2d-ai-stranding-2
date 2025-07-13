import Phaser from 'phaser';

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

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        this.createGrid();
        this.createPlayer();
        this.createGoal();
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

    private setupControls(): void {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
    }

    private updatePlayerPosition(): void {
        const worldX = this.playerX * this.gridSize + 50 + this.gridSize / 2;
        const worldY = this.playerY * this.gridSize + 50 + this.gridSize / 2;
        this.player.setPosition(worldX, worldY);
    }

    private movePlayer(dx: number, dy: number): void {
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight) {
            this.playerX = newX;
            this.playerY = newY;
            this.updatePlayerPosition();
            this.checkGoalReached();
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

        this.input.keyboard!.on('keydown-R', () => {
            this.scene.restart();
        });
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