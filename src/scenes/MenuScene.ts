import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';

export interface GameSettings {
    mapSize: 'small' | 'medium' | 'large';
    difficulty: 'easy' | 'normal' | 'hard';
    customSeed?: string;
}

export class MenuScene extends Phaser.Scene {
    private gameSettings: GameSettings = {
        mapSize: 'medium',
        difficulty: 'normal'
    };
    
    private mapSizeText!: Phaser.GameObjects.Text;
    private difficultyText!: Phaser.GameObjects.Text;
    private seedInput!: Phaser.GameObjects.Text;
    private customSeed: string = '';
    private audioManager!: AudioManager;

    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        this.audioManager = new AudioManager(this);
        
        this.createTitle();
        this.createMapSizeSelector();
        this.createDifficultySelector();
        this.createSeedInput();
        this.createStartButton();
        this.createInstructions();
    }

    private createTitle(): void {
        const title = this.add.text(400, 100, 'AI Map Generation Game', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
    }

    private createMapSizeSelector(): void {
        const label = this.add.text(200, 200, 'Map Size:', {
            fontSize: '20px',
            color: '#ffffff'
        });

        this.mapSizeText = this.add.text(350, 200, this.getMapSizeDisplay(), {
            fontSize: '20px',
            color: '#3498db',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 5 }
        });

        const leftButton = this.add.text(300, 200, '<', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        });

        const rightButton = this.add.text(500, 200, '>', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        });

        leftButton.setInteractive({ useHandCursor: true });
        rightButton.setInteractive({ useHandCursor: true });

        leftButton.on('pointerdown', () => {
            this.audioManager.playMenuSelect();
            this.changeMapSize(-1);
        });
        rightButton.on('pointerdown', () => {
            this.audioManager.playMenuSelect();
            this.changeMapSize(1);
        });
    }

    private createDifficultySelector(): void {
        const label = this.add.text(200, 250, 'Difficulty:', {
            fontSize: '20px',
            color: '#ffffff'
        });

        this.difficultyText = this.add.text(350, 250, this.getDifficultyDisplay(), {
            fontSize: '20px',
            color: '#e74c3c',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 5 }
        });

        const leftButton = this.add.text(300, 250, '<', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        });

        const rightButton = this.add.text(500, 250, '>', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#34495e',
            padding: { x: 10, y: 5 }
        });

        leftButton.setInteractive({ useHandCursor: true });
        rightButton.setInteractive({ useHandCursor: true });

        leftButton.on('pointerdown', () => {
            this.audioManager.playMenuSelect();
            this.changeDifficulty(-1);
        });
        rightButton.on('pointerdown', () => {
            this.audioManager.playMenuSelect();
            this.changeDifficulty(1);
        });
    }

    private createSeedInput(): void {
        const label = this.add.text(200, 300, 'Custom Seed:', {
            fontSize: '20px',
            color: '#ffffff'
        });

        this.seedInput = this.add.text(350, 300, 'Random', {
            fontSize: '18px',
            color: '#95a5a6',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 5 }
        });

        this.seedInput.setInteractive({ useHandCursor: true });
        this.seedInput.on('pointerdown', () => this.openSeedInput());
    }

    private createStartButton(): void {
        const startButton = this.add.text(400, 380, 'START GAME', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        });

        startButton.setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.audioManager.playMenuConfirm();
            this.startGame();
        });

        // Hover effect
        startButton.on('pointerover', () => {
            startButton.setStyle({ backgroundColor: '#2ecc71' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ backgroundColor: '#27ae60' });
        });
    }

    private createInstructions(): void {
        const instructions = this.add.text(400, 480, 
            'Use WASD or Arrow Keys to move\nPress P to show/hide path\nPress R to restart\nReach the red goal to win!', {
            fontSize: '16px',
            color: '#bdc3c7',
            align: 'center'
        });
        instructions.setOrigin(0.5);
    }

    private changeMapSize(direction: number): void {
        const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(this.gameSettings.mapSize);
        const newIndex = (currentIndex + direction + sizes.length) % sizes.length;
        
        this.gameSettings.mapSize = sizes[newIndex];
        this.mapSizeText.setText(this.getMapSizeDisplay());
    }

    private changeDifficulty(direction: number): void {
        const difficulties: Array<'easy' | 'normal' | 'hard'> = ['easy', 'normal', 'hard'];
        const currentIndex = difficulties.indexOf(this.gameSettings.difficulty);
        const newIndex = (currentIndex + direction + difficulties.length) % difficulties.length;
        
        this.gameSettings.difficulty = difficulties[newIndex];
        this.difficultyText.setText(this.getDifficultyDisplay());
    }

    private getMapSizeDisplay(): string {
        switch (this.gameSettings.mapSize) {
            case 'small': return 'Small (12x12)';
            case 'medium': return 'Medium (16x16)';
            case 'large': return 'Large (20x20)';
        }
    }

    private getDifficultyDisplay(): string {
        switch (this.gameSettings.difficulty) {
            case 'easy': return 'Easy';
            case 'normal': return 'Normal';
            case 'hard': return 'Hard';
        }
    }

    private openSeedInput(): void {
        const inputText = prompt('Enter custom seed (leave empty for random):');
        if (inputText !== null) {
            this.customSeed = inputText.trim();
            this.gameSettings.customSeed = this.customSeed || undefined;
            this.seedInput.setText(this.customSeed || 'Random');
        }
    }

    private startGame(): void {
        this.scene.start('GameScene', this.gameSettings);
    }

    static getMapDimensions(size: 'small' | 'medium' | 'large'): { width: number; height: number } {
        switch (size) {
            case 'small': return { width: 12, height: 12 };
            case 'medium': return { width: 16, height: 16 };
            case 'large': return { width: 20, height: 20 };
        }
    }

    static getDifficultySettings(difficulty: 'easy' | 'normal' | 'hard') {
        switch (difficulty) {
            case 'easy':
                return {
                    forestDensity: 0.6,
                    mountainDensity: 0.7,
                    riverFrequency: 0.8,
                    bridgeFrequency: 0.25
                };
            case 'normal':
                return {
                    forestDensity: 0.75,
                    mountainDensity: 0.85,
                    riverFrequency: 1.0,
                    bridgeFrequency: 0.15
                };
            case 'hard':
                return {
                    forestDensity: 0.85,
                    mountainDensity: 0.9,
                    riverFrequency: 1.2,
                    bridgeFrequency: 0.1
                };
        }
    }
}