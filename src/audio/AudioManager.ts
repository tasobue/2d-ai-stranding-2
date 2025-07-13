import Phaser from 'phaser';

export class AudioManager {
    private scene: Phaser.Scene;
    private bgmTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.generateSoundEffects();
    }

    private generateSoundEffects(): void {
        // Generate simple beep sounds for game events
        this.generateBeep('step', 220, 100);
        this.generateBeep('goal', 440, 500);
        this.generateBeep('menu_select', 330, 150);
        this.generateBeep('menu_confirm', 523, 300);
    }

    private generateBeep(key: string, frequency: number, duration: number): void {
        // Create simple sine wave beep
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        // Store the sound generation function for later use
        (this.scene.sound as any)[key] = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + duration / 1000);
        };
    }

    playStep(): void {
        try {
            (this.scene.sound as any).step?.();
        } catch (e) {
            // Silently fail if audio context is not available
        }
    }

    playGoal(): void {
        try {
            (this.scene.sound as any).goal?.();
        } catch (e) {
            // Silently fail if audio context is not available
        }
    }

    playMenuSelect(): void {
        try {
            (this.scene.sound as any).menu_select?.();
        } catch (e) {
            // Silently fail if audio context is not available
        }
    }

    playMenuConfirm(): void {
        try {
            (this.scene.sound as any).menu_confirm?.();
        } catch (e) {
            // Silently fail if audio context is not available
        }
    }

    startAmbientBGM(): void {
        // Create a simple ambient background tone using tweens
        const baseFreq = 110; // Low A note
        
        this.bgmTween = this.scene.tweens.addCounter({
            from: 0,
            to: 360,
            duration: 8000,
            repeat: -1,
            onUpdate: (tween) => {
                const angle = tween.getValue();
                // Create subtle ambient sound variations
                // This is a placeholder - in a real implementation you'd use Web Audio API
            }
        });
    }

    stopBGM(): void {
        if (this.bgmTween) {
            this.bgmTween.destroy();
            this.bgmTween = undefined;
        }
    }

    setVolume(volume: number): void {
        // Placeholder for volume control
        // In a real implementation, this would control the Web Audio API gain
    }
}