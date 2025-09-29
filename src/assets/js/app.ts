import confetti from 'canvas-confetti';
import Slot from '@js/Slot';
import SoundEffects from '@js/SoundEffects';
import { raffleAPI, type Winner as APIWinner, type CreateWinnerRequest } from '@js/api';

// Initialize slot machine
(() => {
  const drawButton = document.getElementById('draw-button') as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById('fullscreen-button') as HTMLButtonElement | null;
  const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
  const settingsWrapper = document.getElementById('settings') as HTMLDivElement | null;
  const settingsContent = document.getElementById('settings-panel') as HTMLDivElement | null;
  const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement | null;
  const settingsCloseButton = document.getElementById('settings-close') as HTMLButtonElement | null;
  const sunburstSvg = document.getElementById('sunburst') as HTMLImageElement | null;
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  const nameListTextArea = document.getElementById('name-list') as HTMLTextAreaElement | null;
  const removeNameFromListCheckbox = document.getElementById('remove-from-list') as HTMLInputElement | null;
  const enableSoundCheckbox = document.getElementById('enable-sound') as HTMLInputElement | null;
  const enableBackgroundMusicCheckbox = document.getElementById('enable-background-music') as HTMLInputElement | null;
  const importCsvButton = document.getElementById('import-csv-button') as HTMLButtonElement | null;
  const csvFileInput = document.getElementById('csv-file-input') as HTMLInputElement | null;
  const winnerModal = document.getElementById('winner-modal') as HTMLDivElement | null;
  const winnerNameDisplay = document.getElementById('winner-name') as HTMLDivElement | null;
  const closeWinnerModalButton = document.getElementById('close-winner-modal') as HTMLButtonElement | null;
  const successModal = document.getElementById('success-modal') as HTMLDivElement | null;
  const successMessage = document.getElementById('success-message') as HTMLDivElement | null;
  const closeSuccessModalButton = document.getElementById('close-success-modal') as HTMLButtonElement | null;
  const winnersButton = document.getElementById('winners-button') as HTMLButtonElement | null;
  const winnersWrapper = document.getElementById('winners') as HTMLDivElement | null;
  const winnersPanel = document.getElementById('winners-panel') as HTMLDivElement | null;
  const winnersList = document.getElementById('winners-list') as HTMLDivElement | null;
  const emptyWinners = document.getElementById('empty-winners') as HTMLDivElement | null;
  const clearWinnersButton = document.getElementById('clear-winners') as HTMLButtonElement | null;
  const winnersCloseButton = document.getElementById('winners-close') as HTMLButtonElement | null;
  const sadakoEffect = document.getElementById('sadako-effect') as HTMLDivElement | null;

  // Graceful exit if necessary elements are not found
  if (!(
    drawButton
    && fullscreenButton
    && settingsButton
    && settingsWrapper
    && settingsContent
    && settingsSaveButton
    && settingsCloseButton
    && sunburstSvg
    && confettiCanvas
    && nameListTextArea
    && removeNameFromListCheckbox
    && enableSoundCheckbox
    && enableBackgroundMusicCheckbox
    && importCsvButton
    && csvFileInput
    && winnerModal
    && winnerNameDisplay
    && closeWinnerModalButton
    && successModal
    && successMessage
    && closeSuccessModalButton
    && winnersButton
    && winnersWrapper
    && winnersPanel
    && winnersList
    && emptyWinners
    && clearWinnersButton
    && winnersCloseButton
    && sadakoEffect
  )) {
    console.error('One or more Element ID is invalid. This is possibly a bug.');
    return;
  }

  if (!(confettiCanvas instanceof HTMLCanvasElement)) {
    console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
    return;
  }

  const soundEffects = new SoundEffects();
  const MAX_REEL_ITEMS = 40;
  const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  let confettiAnimationId;

  // Halloween background music using Web Audio API
  let backgroundAudioContext: AudioContext | null = null;
  let backgroundAudioBuffer: AudioBuffer | null = null;
  let backgroundSource: AudioBufferSourceNode | null = null;
  let backgroundGainNode: GainNode | null = null;
  let isBackgroundMusicPlaying = false;

  // Jumpscare sound effect
  let jumpscareAudioBuffer: AudioBuffer | null = null;

  // Check if test mode is enabled
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('test') === 'true';

  /** Confeetti animation instance */
  const customConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  /** Triggers cconfeetti animation until animation is canceled */
  const confettiAnimation = () => {
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
    const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

    customConfetti({
      particleCount: 1,
      gravity: 0.8,
      spread: 90,
      origin: { y: 0.6 },
      colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
      scalar: confettiScale
    });

    confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
  };

  /** Function to stop the winning animation */
  const stopWinningAnimation = () => {
    if (confettiAnimationId) {
      window.cancelAnimationFrame(confettiAnimationId);
    }
    sunburstSvg.style.display = 'none';
  };

  /**  Function to be trigger before spinning */
  const onSpinStart = () => {
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    // Lower background music volume during spin
    if (isBackgroundMusicPlaying && backgroundGainNode) {
      backgroundGainNode.gain.value = 0.2;
    }
    soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
  };

  /**  Functions to be trigger after spinning */
  const onSpinEnd = async (winner: string) => {
    confettiAnimation();
    sunburstSvg.style.display = 'block';
    await soundEffects.win();
    // Restore background music volume after spin
    if (isBackgroundMusicPlaying && backgroundGainNode) {
      backgroundGainNode.gain.value = 0.3;
    }
    
    // Show winner modal
    showWinnerModal(winner);
    
    drawButton.disabled = false;
    settingsButton.disabled = false;
  };

  /** Show winner modal with Halloween theme or Sadako effect in test mode */
  const showWinnerModal = (winner: string) => {
    // Add winner to the list (for both test mode and normal mode)
    addWinner(winner);
    
    if (isTestMode) {
      showSadakoEffect();
    } else {
      winnerNameDisplay.textContent = winner;
      winnerModal.style.display = 'flex';
      
      // Add a slight delay for dramatic effect
      setTimeout(() => {
        winnerModal.classList.add('show');
      }, 100);
    }
  };

  /** Show shocking Sadako effect */
  const showSadakoEffect = () => {
    sadakoEffect.style.display = 'flex';
    
    // Play jumpscare sound immediately
    playJumpscareSound();
    
    // Add shocking effect immediately
    setTimeout(() => {
      sadakoEffect.classList.add('show');
    }, 50);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      hideSadakoEffect();
    }, 4000);
  };

  /** Hide Sadako effect */
  const hideSadakoEffect = () => {
    sadakoEffect.classList.remove('show');
    setTimeout(() => {
      sadakoEffect.style.display = 'none';
    }, 500);
  };

  /** Hide winner modal */
  const hideWinnerModal = () => {
    winnerModal.classList.remove('show');
    setTimeout(() => {
      winnerModal.style.display = 'none';
    }, 300);
  };

  /** Show success modal */
  const showSuccessModal = (message: string) => {
    successMessage.textContent = message;
    successModal.style.display = 'flex';
    
    setTimeout(() => {
      successModal.classList.add('show');
    }, 100);
  };

  /** Hide success modal */
  const hideSuccessModal = () => {
    successModal.classList.remove('show');
    setTimeout(() => {
      successModal.style.display = 'none';
    }, 300);
  };

  /** Winners data management */
  interface LocalWinner {
    name: string;
    timestamp: number;
    date: string;
    id?: number;
    raffleId?: string;
    notified?: boolean;
  }

  let winners: LocalWinner[] = [];
  let isLoadingWinners = false;

  // Generate the BLUCKY raffle ID format
  const generateBluckyRaffleId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `BLUCKY${year}${month}${day}`;
  };

  // Generate a unique raffle ID for this session
  const getCurrentRaffleId = (): string => {
    return generateBluckyRaffleId();
  };

  const loadWinners = async () => {
    if (isLoadingWinners) return;
    
    isLoadingWinners = true;
    try {
      // Try to load from API first with today's raffle ID
      const raffleId = generateBluckyRaffleId();
      const response = await raffleAPI.getAll({ limit: 100, raffleId });
      
      if (response.success && response.data) {
        // Convert API winners to local format
        winners = response.data.winners.map((apiWinner: APIWinner) => ({
          name: apiWinner.playerUsername,
          timestamp: new Date(apiWinner.timestamp).getTime(),
          date: new Date(apiWinner.timestamp).toLocaleString(),
          id: apiWinner.id,
          raffleId: apiWinner.raffleId,
          notified: apiWinner.notified
        }));
        updateWinnersDisplay();
      } else {
        console.warn('Failed to load winners from API, falling back to localStorage:', response.message);
        loadWinnersFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading winners from API:', error);
      loadWinnersFromLocalStorage();
    } finally {
      isLoadingWinners = false;
    }
  };

  const loadWinnersFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('random-picker-winners');
      if (stored) {
        winners = JSON.parse(stored);
        updateWinnersDisplay();
      }
    } catch (error) {
      console.error('Error loading winners from localStorage:', error);
      winners = [];
    }
  };

  const saveWinnersToLocalStorage = () => {
    try {
      localStorage.setItem('random-picker-winners', JSON.stringify(winners));
    } catch (error) {
      console.error('Error saving winners to localStorage:', error);
    }
  };

  const addWinner = async (name: string) => {
    const now = new Date();
    const localWinner: LocalWinner = {
      name,
      timestamp: now.getTime(),
      date: now.toLocaleString()
    };

    try {
      // Try to save to API first
      const winnerData: CreateWinnerRequest = {
        playerUsername: name,
        raffleId: getCurrentRaffleId(),
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0]
      };

      const response = await raffleAPI.create(winnerData);
      
      if (response.success && response.data) {
        // Add API response data to local winner
        localWinner.id = response.data.id;
        localWinner.raffleId = response.data.raffleId;
        localWinner.notified = response.data.notified;
        console.log('Winner saved to API successfully:', response.data);
      } else {
        console.warn('Failed to save winner to API:', response.message);
      }
    } catch (error) {
      console.error('Error saving winner to API:', error);
    }

    // Always save locally as backup
    winners.unshift(localWinner);
    saveWinnersToLocalStorage();
    updateWinnersDisplay();
  };

  const clearAllWinners = async () => {
    try {
      // If we have API winners with IDs, try to delete them
      const apiWinners = winners.filter(w => w.id);
      
      if (apiWinners.length > 0) {
        // Note: This would require a bulk delete endpoint in the API
        // For now, we'll just clear locally and let the next load refresh from API
        console.log('Note: Bulk delete not implemented in API yet');
      }
    } catch (error) {
      console.error('Error clearing winners from API:', error);
    }

    // Clear locally
    winners = [];
    saveWinnersToLocalStorage();
    updateWinnersDisplay();
  };

  const updateWinnersDisplay = () => {
    if (winners.length === 0) {
      emptyWinners.style.display = 'block';
      winnersList.querySelectorAll('.winner-item').forEach(item => item.remove());
    } else {
      emptyWinners.style.display = 'none';
      winnersList.querySelectorAll('.winner-item').forEach(item => item.remove());
      
      winners.forEach((winner, index) => {
        const winnerItem = document.createElement('div');
        winnerItem.className = 'winner-item';
        
        winnerItem.innerHTML = `
          <div class="winner-info">
            <div class="winner-name">${winner.name}</div>
            <div class="winner-date">${winner.date}</div>
          </div>
          <div class="winner-actions">
            <div class="winner-rank">#${index + 1}</div>
          </div>
        `;
        
        winnersList.appendChild(winnerItem);
      });
    }
  };

  // Add notification function (disabled - notification UI removed)
  // const notifyWinner = async (winnerId: number) => {
  //   try {
  //     const response = await raffleAPI.notifyWinner(winnerId);
  //     
  //     if (response.success) {
  //       console.log('Winner notified successfully:', response.data);
  //       
  //       // Update local winner status
  //       const winnerIndex = winners.findIndex(w => w.id === winnerId);
  //       if (winnerIndex !== -1) {
  //         winners[winnerIndex].notified = true;
  //         saveWinnersToLocalStorage();
  //         updateWinnersDisplay();
  //       }
  //       
  //       // Show success message
  //       showSuccessModal('Winner has been notified successfully!');
  //     } else {
  //       console.error('Failed to notify winner:', response.message);
  //       alert(`Failed to notify winner: ${response.message}`);
  //     }
  //   } catch (error) {
  //     console.error('Error notifying winner:', error);
  //     alert('An error occurred while notifying the winner. Please try again.');
  //   }
  // };

  /** Show winners sidebar */
  const showWinnersPanel = () => {
    winnersWrapper.style.display = 'block';
  };

  /** Hide winners sidebar */
  const hideWinnersPanel = () => {
    winnersWrapper.style.display = 'none';
  };

  /** Slot instance */
  const slot = new Slot({
    reelContainerSelector: '#reel',
    maxReelItems: MAX_REEL_ITEMS,
    onSpinStart,
    onSpinEnd,
    onNameListChanged: stopWinningAnimation
  });

  /** To open the setting page */
  const onSettingsOpen = () => {
    nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
    removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
    enableSoundCheckbox.checked = !soundEffects.mute;
    enableBackgroundMusicCheckbox.checked = isBackgroundMusicPlaying || enableBackgroundMusicCheckbox.checked;
    settingsWrapper.style.display = 'block';
  };

  /** To close the setting page */
  const onSettingsClose = () => {
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
  };

  // Click handler for "Draw" button
  drawButton.addEventListener('click', () => {
    if (!slot.names.length) {
      onSettingsOpen();
      return;
    }

    slot.spin();
  });

  // Hide fullscreen button when it is not supported
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - for older browsers support
  if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
    fullscreenButton.remove();
  }

  // Click handler for "Fullscreen" button
  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  // Click handler for "Settings" button
  settingsButton.addEventListener('click', onSettingsOpen);

  // Click handler for "Save" button for setting page
  settingsSaveButton.addEventListener('click', () => {
    slot.names = nameListTextArea.value
      ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
    soundEffects.mute = !enableSoundCheckbox.checked;
    
    // Handle background music enable/disable
    if (enableBackgroundMusicCheckbox.checked && !isBackgroundMusicPlaying) {
      startBackgroundMusic();
    } else if (!enableBackgroundMusicCheckbox.checked && isBackgroundMusicPlaying) {
      stopBackgroundMusic();
    }
    
    onSettingsClose();
  });

  // Click handler for "Discard and close" button for setting page
  settingsCloseButton.addEventListener('click', onSettingsClose);

  // Initialize Web Audio API for background music and jumpscare sound
  const initBackgroundMusic = async () => {
    try {
      // Create AudioContext
      backgroundAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load and decode background music
      const backgroundResponse = await fetch('/assets/sound/halloween/spooky.mp3');
      const backgroundArrayBuffer = await backgroundResponse.arrayBuffer();
      backgroundAudioBuffer = await backgroundAudioContext.decodeAudioData(backgroundArrayBuffer);
      
      // Load and decode jumpscare sound
      const jumpscareResponse = await fetch('/assets/sound/halloween/jumpscare.mp3');
      const jumpscareArrayBuffer = await jumpscareResponse.arrayBuffer();
      jumpscareAudioBuffer = await backgroundAudioContext.decodeAudioData(jumpscareArrayBuffer);
      
      // Create gain node for volume control
      backgroundGainNode = backgroundAudioContext.createGain();
      backgroundGainNode.connect(backgroundAudioContext.destination);
      backgroundGainNode.gain.value = 0.3;
      
      console.log('Background music and jumpscare sound loaded successfully');
    } catch (error) {
      console.error('Failed to load audio files:', error);
    }
  };

  // Background music functions
  const startBackgroundMusic = async () => {
    if (!soundEffects.mute && enableBackgroundMusicCheckbox.checked && !isBackgroundMusicPlaying && backgroundAudioContext && backgroundAudioBuffer && backgroundGainNode) {
      try {
        // Resume audio context if suspended
        if (backgroundAudioContext.state === 'suspended') {
          await backgroundAudioContext.resume();
        }
        
        // Create new source (required for each play)
        backgroundSource = backgroundAudioContext.createBufferSource();
        backgroundSource.buffer = backgroundAudioBuffer;
        backgroundSource.loop = true;
        backgroundSource.connect(backgroundGainNode);
        
        backgroundSource.start();
        isBackgroundMusicPlaying = true;
        console.log('Background music started');
      } catch (error) {
        console.log('Background music start failed:', error);
      }
    }
  };

  const stopBackgroundMusic = () => {
    if (isBackgroundMusicPlaying && backgroundSource) {
      backgroundSource.stop();
      backgroundSource = null;
      isBackgroundMusicPlaying = false;
      console.log('Background music stopped');
    }
  };

  // Play jumpscare sound effect
  const playJumpscareSound = async () => {
    if (!soundEffects.mute && backgroundAudioContext && jumpscareAudioBuffer) {
      try {
        // Resume audio context if suspended
        if (backgroundAudioContext.state === 'suspended') {
          await backgroundAudioContext.resume();
        }
        
        // Create new source for jumpscare sound
        const jumpscareSource = backgroundAudioContext.createBufferSource();
        const jumpscareGain = backgroundAudioContext.createGain();
        
        jumpscareSource.buffer = jumpscareAudioBuffer;
        jumpscareGain.gain.value = 0.8; // Louder volume for jumpscare effect
        
        jumpscareSource.connect(jumpscareGain);
        jumpscareGain.connect(backgroundAudioContext.destination);
        
        jumpscareSource.start();
        console.log('Jumpscare sound played');
      } catch (error) {
        console.log('Jumpscare sound play failed:', error);
      }
    }
  };

  // Initialize background music on page load
  initBackgroundMusic();

  // Start music on first user interaction
  const startMusicOnInteraction = async () => {
    await startBackgroundMusic();
    document.removeEventListener('click', startMusicOnInteraction);
    document.removeEventListener('keydown', startMusicOnInteraction);
  };
  document.addEventListener('click', startMusicOnInteraction);
  document.addEventListener('keydown', startMusicOnInteraction);

  // CSV Import functionality
  const parseCsvContent = (csvContent: string): string[] => {
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const names: string[] = [];
    
    lines.forEach((line, index) => {
      // Always skip the first row (header)
      if (index === 0) {
        return;
      }
      
      // Handle different CSV formats
      const columns = line.split(/[,;]/).map(col => col.trim().replace(/^["']|["']$/g, ''));
      
      // Take the first column as the name
      if (columns[0] && columns[0].length > 0) {
        names.push(columns[0]);
      }
    });
    
    return names;
  };

  const handleCsvImport = (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }
    
    // Validate file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      alert('File size is too large. Please select a file smaller than 1MB.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const names = parseCsvContent(csvContent);
        
        if (names.length === 0) {
          alert('No valid names found in the CSV file.');
          return;
        }
        
        // Filter out existing winners to prevent them from being drawn again
        const existingWinnerNames = winners.map(w => w.name.toLowerCase());
        const filteredNames = names.filter(name => 
          !existingWinnerNames.includes(name.toLowerCase())
        );
        const excludedCount = names.length - filteredNames.length;
        
        if (filteredNames.length === 0) {
          alert('All names in the CSV file are already winners. No new names to import.');
          return;
        }
        
        // Update the textarea - always replace existing names
        nameListTextArea.value = filteredNames.join('\n');
        
        // Show success message with exclusion info
        let successMessage = `Successfully imported ${filteredNames.length} names from CSV file.`;
        if (excludedCount > 0) {
          successMessage += ` ${excludedCount} previous winner(s) were excluded.`;
        }
        showSuccessModal(successMessage);
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error reading CSV file. Please check the file format.');
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
  };

  // CSV Import event listeners
  importCsvButton.addEventListener('click', () => {
    csvFileInput.click();
  });

  csvFileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      handleCsvImport(file);
      // Reset file input for next use
      csvFileInput.value = '';
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Don't trigger shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Don't trigger shortcuts when settings panel is open (except F12 to close)
    const isSettingsOpen = settingsWrapper.style.display === 'block';

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (!drawButton.disabled && !isSettingsOpen) {
          if (!slot.names.length) {
            onSettingsOpen();
            return;
          }
          slot.spin();
        }
        break;

      case 'F11':
        event.preventDefault();
        if (!isSettingsOpen) {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            return;
          }
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
        break;

      case 'F12':
        event.preventDefault();
        if (isSettingsOpen) {
          onSettingsClose();
        } else {
          onSettingsOpen();
        }
        break;
    }
  });

  // Winner modal event listeners
  closeWinnerModalButton.addEventListener('click', hideWinnerModal);
  
  // Close modal when clicking outside the circle
  winnerModal.addEventListener('click', (e) => {
    if (e.target === winnerModal || e.target === winnerModal.querySelector('.winner-modal__overlay')) {
      hideWinnerModal();
    }
  });

  // Success modal event listeners
  closeSuccessModalButton.addEventListener('click', hideSuccessModal);
  
  // Close success modal when clicking outside
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal || e.target === successModal.querySelector('.winner-modal__overlay')) {
      hideSuccessModal();
    }
  });

  // Winners sidebar event listeners
  winnersButton.addEventListener('click', showWinnersPanel);
  winnersCloseButton.addEventListener('click', hideWinnersPanel);
  
  clearWinnersButton.addEventListener('click', () => {
    if (winners.length > 0 && confirm('Are you sure you want to clear all winners? This action cannot be undone.')) {
      clearAllWinners();
    }
  });
  
  // Close winners panel when clicking outside
  winnersWrapper.addEventListener('click', (e) => {
    if (e.target === winnersWrapper) {
      hideWinnersPanel();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (winnerModal.style.display === 'flex') {
        hideWinnerModal();
      } else if (successModal.style.display === 'flex') {
        hideSuccessModal();
      } else if (winnersWrapper.style.display === 'block') {
        hideWinnersPanel();
      } else if (sadakoEffect.style.display === 'flex') {
        hideSadakoEffect();
      }
    }
  });

  // Sadako effect event listeners
  sadakoEffect.addEventListener('click', (e) => {
    if (e.target === sadakoEffect || e.target === sadakoEffect.querySelector('.sadako-effect__overlay')) {
      hideSadakoEffect();
    }
  });

  // Initialize winners on page load
  loadWinners();

  // Generate and display the text in left corner
  const generateText = () => {
    return generateBluckyRaffleId();
  };

  // Update generated text
  const generatedTextElement = document.getElementById('generated-text') as HTMLDivElement | null;
  if (generatedTextElement) {
    generatedTextElement.textContent = generateText();
  }
})();
