import Phaser from 'phaser';

export enum WeatherType {
    CLEAR = 'clear',
    RAIN = 'rain',
    SNOW = 'snow',
    FOG = 'fog'
}

export interface WeatherEffect {
    type: WeatherType;
    intensity: number; // 0.0 to 1.0
    visibility: number; // 0.0 to 1.0 (1.0 = full visibility)
    movementModifier: number; // 0.5 to 1.0 (1.0 = normal speed)
    damageMultiplier: number; // 1.0 to 2.0 (1.0 = normal damage)
}

export class WeatherSystem {
    private scene: Phaser.Scene;
    private currentWeather: WeatherEffect;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private fogOverlay?: Phaser.GameObjects.Rectangle;
    private weatherChangeTimer?: Phaser.Time.TimerEvent;
    private rng: () => number;

    constructor(scene: Phaser.Scene, seedRng: () => number) {
        this.scene = scene;
        this.rng = seedRng;
        this.currentWeather = {
            type: WeatherType.CLEAR,
            intensity: 0,
            visibility: 1.0,
            movementModifier: 1.0,
            damageMultiplier: 1.0
        };
        
        this.setupWeatherCycle();
    }

    private setupWeatherCycle(): void {
        // Change weather every 15-30 seconds
        const nextWeatherTime = 15000 + this.rng() * 15000;
        
        this.weatherChangeTimer = this.scene.time.delayedCall(nextWeatherTime, () => {
            this.changeWeather();
            this.setupWeatherCycle();
        });
    }

    private changeWeather(): void {
        const weatherTypes = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.SNOW, WeatherType.FOG];
        const currentIndex = weatherTypes.indexOf(this.currentWeather.type);
        
        // Slightly favor clear weather
        let newWeatherType: WeatherType;
        const rand = this.rng();
        
        if (rand < 0.4) {
            newWeatherType = WeatherType.CLEAR;
        } else if (rand < 0.6) {
            newWeatherType = WeatherType.RAIN;
        } else if (rand < 0.8) {
            newWeatherType = WeatherType.FOG;
        } else {
            newWeatherType = WeatherType.SNOW;
        }
        
        // Don't repeat the same weather
        if (newWeatherType === this.currentWeather.type && weatherTypes.length > 1) {
            const availableTypes = weatherTypes.filter(t => t !== this.currentWeather.type);
            newWeatherType = availableTypes[Math.floor(this.rng() * availableTypes.length)];
        }
        
        this.setWeather(newWeatherType);
    }

    setWeather(type: WeatherType, intensity: number = 0.5 + this.rng() * 0.5): void {
        this.clearCurrentWeather();
        
        this.currentWeather = this.createWeatherEffect(type, intensity);
        
        switch (type) {
            case WeatherType.RAIN:
                this.createRainEffect();
                break;
            case WeatherType.SNOW:
                this.createSnowEffect();
                break;
            case WeatherType.FOG:
                this.createFogEffect();
                break;
            case WeatherType.CLEAR:
                // No visual effects for clear weather
                break;
        }
    }

    private createWeatherEffect(type: WeatherType, intensity: number): WeatherEffect {
        switch (type) {
            case WeatherType.RAIN:
                return {
                    type,
                    intensity,
                    visibility: 0.7 + (1.0 - intensity) * 0.3,
                    movementModifier: 0.8 + (1.0 - intensity) * 0.2,
                    damageMultiplier: 1.0 + intensity * 0.3
                };
            case WeatherType.SNOW:
                return {
                    type,
                    intensity,
                    visibility: 0.6 + (1.0 - intensity) * 0.4,
                    movementModifier: 0.7 + (1.0 - intensity) * 0.3,
                    damageMultiplier: 1.0 + intensity * 0.5
                };
            case WeatherType.FOG:
                return {
                    type,
                    intensity,
                    visibility: 0.4 + (1.0 - intensity) * 0.6,
                    movementModifier: 0.9 + (1.0 - intensity) * 0.1,
                    damageMultiplier: 1.0 + intensity * 0.2
                };
            case WeatherType.CLEAR:
            default:
                return {
                    type: WeatherType.CLEAR,
                    intensity: 0,
                    visibility: 1.0,
                    movementModifier: 1.0,
                    damageMultiplier: 1.0
                };
        }
    }

    private createRainEffect(): void {
        // Create rain particles
        const emitter = this.scene.add.particles(0, 0, 'rainDrop', {
            x: { min: 0, max: 800 },
            y: -10,
            speedY: { min: 200, max: 400 },
            speedX: { min: -50, max: -20 },
            scale: { min: 0.2, max: 0.5 },
            alpha: { min: 0.3, max: 0.7 },
            lifespan: 2000,
            frequency: 20 - (this.currentWeather.intensity * 15)
        });
        
        emitter.setDepth(100);
        this.particles.push(emitter);
        
        // Add rain texture if it doesn't exist
        if (!this.scene.textures.exists('rainDrop')) {
            this.createRainTexture();
        }
    }

    private createSnowEffect(): void {
        // Create snow particles
        const emitter = this.scene.add.particles(0, 0, 'snowFlake', {
            x: { min: 0, max: 800 },
            y: -10,
            speedY: { min: 50, max: 150 },
            speedX: { min: -30, max: 30 },
            scale: { min: 0.3, max: 0.8 },
            alpha: { min: 0.4, max: 0.9 },
            lifespan: 4000,
            frequency: 30 - (this.currentWeather.intensity * 20)
        });
        
        emitter.setDepth(100);
        this.particles.push(emitter);
        
        // Add snow texture if it doesn't exist
        if (!this.scene.textures.exists('snowFlake')) {
            this.createSnowTexture();
        }
    }

    private createFogEffect(): void {
        // Create fog overlay
        this.fogOverlay = this.scene.add.rectangle(400, 300, 800, 600, 0xf0f0f0);
        this.fogOverlay.setAlpha(0.1 + this.currentWeather.intensity * 0.4);
        this.fogOverlay.setDepth(90);
        
        // Add subtle fog movement
        this.scene.tweens.add({
            targets: this.fogOverlay,
            alpha: this.fogOverlay.alpha * 0.7,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createRainTexture(): void {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x87ceeb, 0.8);
        graphics.fillRect(0, 0, 2, 8);
        graphics.generateTexture('rainDrop', 2, 8);
        graphics.destroy();
    }

    private createSnowTexture(): void {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('snowFlake', 6, 6);
        graphics.destroy();
    }

    private clearCurrentWeather(): void {
        // Stop all particle effects
        this.particles.forEach(emitter => {
            emitter.destroy();
        });
        this.particles = [];
        
        // Remove fog overlay
        if (this.fogOverlay) {
            this.fogOverlay.destroy();
            this.fogOverlay = undefined;
        }
    }

    getCurrentWeather(): WeatherEffect {
        return { ...this.currentWeather };
    }

    getWeatherInfo(): string {
        const weatherNames = {
            [WeatherType.CLEAR]: 'Clear',
            [WeatherType.RAIN]: 'Rain',
            [WeatherType.SNOW]: 'Snow',
            [WeatherType.FOG]: 'Fog'
        };
        
        const intensityDesc = this.currentWeather.intensity < 0.3 ? 'Light' : 
                             this.currentWeather.intensity < 0.7 ? 'Moderate' : 'Heavy';
        
        if (this.currentWeather.type === WeatherType.CLEAR) {
            return 'Clear';
        }
        
        return `${intensityDesc} ${weatherNames[this.currentWeather.type]}`;
    }

    destroy(): void {
        this.clearCurrentWeather();
        
        if (this.weatherChangeTimer) {
            this.weatherChangeTimer.destroy();
        }
    }
}