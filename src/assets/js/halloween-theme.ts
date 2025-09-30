// Halloween theme module - loaded dynamically for better performance
import type { SoundEffects } from './SoundEffects';

export interface HalloweenAudioContext {
  backgroundAudioContext: AudioContext | null;
  backgroundAudioBuffer: AudioBuffer | null;
  backgroundSource: AudioBufferSourceNode | null;
  backgroundGainNode: GainNode | null;
  jumpscareAudioBuffer: AudioBuffer | null;
  isBackgroundMusicPlaying: boolean;
}

export class HalloweenTheme {
  private audioContext: HalloweenAudioContext;
  private soundEffects: SoundEffects;

  constructor(soundEffects: SoundEffects) {
    this.soundEffects = soundEffects;
    this.audioContext = {
      backgroundAudioContext: null,
      backgroundAudioBuffer: null,
      backgroundSource: null,
      backgroundGainNode: null,
      jumpscareAudioBuffer: null,
      isBackgroundMusicPlaying: false
    };
  }

  // Lazy load audio files only when needed
  private async loadAudioFile(url: string): Promise<AudioBuffer | null> {
    try {
      if (!this.audioContext.backgroundAudioContext) {
        this.audioContext.backgroundAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.backgroundAudioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Failed to load audio file ${url}:`, error);
      return null;
    }
  }

  // Initialize audio context without loading heavy files
  async initializeAudio(): Promise<void> {
    try {
      if (!this.audioContext.backgroundAudioContext) {
        this.audioContext.backgroundAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (!this.audioContext.backgroundGainNode) {
        this.audioContext.backgroundGainNode = this.audioContext.backgroundAudioContext.createGain();
        this.audioContext.backgroundGainNode.connect(this.audioContext.backgroundAudioContext.destination);
        this.audioContext.backgroundGainNode.gain.value = 0.3;
      }
      
      console.log('Halloween audio context initialized - files will load on demand');
    } catch (error) {
      console.error('Failed to initialize Halloween audio context:', error);
    }
  }

  // Background music with lazy loading
  async startBackgroundMusic(): Promise<void> {
    const { backgroundAudioContext, backgroundGainNode } = this.audioContext;
    
    if (!this.soundEffects.mute && !this.audioContext.isBackgroundMusicPlaying && backgroundAudioContext && backgroundGainNode) {
      try {
        // Lazy load background music only when first needed
        if (!this.audioContext.backgroundAudioBuffer) {
          console.log('Loading Halloween background music...');
          this.audioContext.backgroundAudioBuffer = await this.loadAudioFile('/assets/sound/halloween/spooky.mp3');
          if (!this.audioContext.backgroundAudioBuffer) {
            console.error('Failed to load Halloween background music');
            return;
          }
        }
        
        // Resume audio context if suspended
        if (backgroundAudioContext.state === 'suspended') {
          await backgroundAudioContext.resume();
        }
        
        // Create new source (required for each play)
        this.audioContext.backgroundSource = backgroundAudioContext.createBufferSource();
        this.audioContext.backgroundSource.buffer = this.audioContext.backgroundAudioBuffer;
        this.audioContext.backgroundSource.loop = true;
        this.audioContext.backgroundSource.connect(backgroundGainNode);
        
        this.audioContext.backgroundSource.start();
        this.audioContext.isBackgroundMusicPlaying = true;
        console.log('Halloween background music started');
      } catch (error) {
        console.log('Halloween background music start failed:', error);
      }
    }
  }

  stopBackgroundMusic(): void {
    if (this.audioContext.isBackgroundMusicPlaying && this.audioContext.backgroundSource) {
      this.audioContext.backgroundSource.stop();
      this.audioContext.backgroundSource = null;
      this.audioContext.isBackgroundMusicPlaying = false;
      console.log('Halloween background music stopped');
    }
  }

  // Adjust volume during spin
  setBackgroundMusicVolume(volume: number): void {
    if (this.audioContext.backgroundGainNode) {
      this.audioContext.backgroundGainNode.gain.value = volume;
    }
  }

  // Play jumpscare sound with lazy loading
  async playJumpscareSound(): Promise<void> {
    if (!this.soundEffects.mute && this.audioContext.backgroundAudioContext) {
      try {
        // Lazy load jumpscare sound only when needed
        if (!this.audioContext.jumpscareAudioBuffer) {
          console.log('Loading Halloween jumpscare sound...');
          this.audioContext.jumpscareAudioBuffer = await this.loadAudioFile('/assets/sound/halloween/jumpscare.mp3');
          if (!this.audioContext.jumpscareAudioBuffer) {
            console.error('Failed to load Halloween jumpscare sound');
            return;
          }
        }
        
        // Resume audio context if suspended
        if (this.audioContext.backgroundAudioContext.state === 'suspended') {
          await this.audioContext.backgroundAudioContext.resume();
        }
        
        // Create new source for jumpscare sound
        const jumpscareSource = this.audioContext.backgroundAudioContext.createBufferSource();
        const jumpscareGain = this.audioContext.backgroundAudioContext.createGain();
        
        jumpscareSource.buffer = this.audioContext.jumpscareAudioBuffer;
        jumpscareGain.gain.value = 0.8; // Louder volume for jumpscare effect
        
        jumpscareSource.connect(jumpscareGain);
        jumpscareGain.connect(this.audioContext.backgroundAudioContext.destination);
        
        jumpscareSource.start();
        console.log('Halloween jumpscare sound played');
      } catch (error) {
        console.log('Halloween jumpscare sound play failed:', error);
      }
    }
  }

  // Sadako effect management
  showSadakoEffect(sadakoElement: HTMLElement): void {
    sadakoElement.style.display = 'flex';
    
    // Play jumpscare sound immediately
    this.playJumpscareSound();
    
    // Add shocking effect immediately
    setTimeout(() => {
      sadakoElement.classList.add('show');
    }, 50);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideSadakoEffect(sadakoElement);
    }, 4000);
  }

  hideSadakoEffect(sadakoElement: HTMLElement): void {
    sadakoElement.classList.remove('show');
    setTimeout(() => {
      sadakoElement.style.display = 'none';
    }, 500);
  }

  // Get audio context state for external access
  getAudioContext(): HalloweenAudioContext {
    return this.audioContext;
  }

  // Check if background music is playing
  isBackgroundMusicPlaying(): boolean {
    return this.audioContext.isBackgroundMusicPlaying;
  }
}