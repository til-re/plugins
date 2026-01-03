/**
 * Pixel Retro Theme
 * 8-bit style, color palettes, 8-bit sound effects
 */
;(function(global) {
  'use strict';

  const PixelRenderer = {
    id: 'pixel',

    // Takes over controls
    handlesControls: true,

    // Default configuration
    defaults: {
      palette: 'default',   // Palette: default, gameboy, nes, cga, c64
      scanlines: true       // Whether to show scanlines
    },

    // Internal state
    _container: null,
    _config: null,
    _actions: null,
    _elements: null,
    _lastSeconds: -1,
    _isMuted: false,

    /**
     * Initialize
     */
    init(container, config = {}, actions = null) {
      this._config = { ...this.defaults, ...config };
      this._actions = actions;
      this._container = container;

      // Initialize mute state
      this._isMuted = global.Audio ? !global.Audio.isEnabled() : false;

      // Create DOM
      this._createDOM();

      // Cache elements
      this._elements = {
        container: container.querySelector('.pixel-theme'),
        time: container.querySelector('.pixel-time'),
        title: container.querySelector('.pixel-title'),
        message: container.querySelector('.pixel-message'),
        // Button elements
        controls: container.querySelector('.pixel-controls'),
        btnPause: container.querySelector('.pixel-btn[data-action="pause"]'),
        btnMute: container.querySelector('.pixel-btn[data-action="mute"]'),
        btnFullscreen: container.querySelector('.pixel-btn[data-action="fullscreen"]')
      };

      // Apply palette
      this._applyPalette();

      // Bind events
      this._bindEvents();

      // Initialize button states
      this._updateMuteButton();
    },

    /**
     * Create DOM
     */
    _createDOM() {
      const showScanlines = this._config.scanlines;

      this._container.innerHTML = `
        <div class="pixel-theme">
          ${showScanlines ? '<div class="pixel-scanlines"></div>' : ''}
          <div class="pixel-border"></div>
          <div class="pixel-time">00:00:00</div>
          <div class="pixel-title"></div>
          <div class="pixel-message"></div>

          <!-- Pixel style button bar -->
          <div class="pixel-controls">
            <button class="pixel-btn" data-action="pause" title="PAUSE [SPACE]">
              <span class="pixel-btn-icon">▮▮</span>
              <span class="pixel-btn-label">PAUSE</span>
            </button>
            <button class="pixel-btn" data-action="mute" title="MUTE [M]">
              <span class="pixel-btn-icon">♪</span>
              <span class="pixel-btn-label">SOUND</span>
            </button>
            <button class="pixel-btn" data-action="fullscreen" title="FULLSCREEN [F]">
              <span class="pixel-fullscreen-icon">
                <span></span><span></span><span></span><span></span>
              </span>
              <span class="pixel-btn-label">FULL</span>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * Apply color palette
     */
    _applyPalette() {
      const palette = this._config.palette;
      const container = this._elements.container;

      // Remove all palette classes
      container.classList.remove(
        'palette-gameboy', 'palette-nes', 'palette-cga', 'palette-c64'
      );

      // Apply new palette
      if (palette && palette !== 'default') {
        container.classList.add(`palette-${palette}`);
      }

      // Custom color overrides
      if (this._config.color) {
        container.style.setProperty('--pixel-color', `#${this._config.color}`);
      }
      if (this._config.bg) {
        container.style.setProperty('--pixel-bg', `#${this._config.bg}`);
      }
    },

    /**
     * Bind events
     */
    _bindEvents() {
      const container = this._elements.container;

      // Button click events
      this._elements.btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
        this._playClick();
        if (this._actions && this._actions.togglePause) {
          this._actions.togglePause();
        }
      });

      this._elements.btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleMute();
      });

      this._elements.btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        this._playClick();
        if (this._actions && this._actions.fullscreen) {
          this._actions.fullscreen();
        }
      });

      // Fullscreen state change listener
      document.addEventListener('fullscreenchange', () => this._updateFullscreenButton());

      // Keyboard
      document.addEventListener('keydown', this._handleKeydown.bind(this));
    },

    /**
     * Keyboard handler
     */
    _handleKeydown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this._playClick();
          if (this._actions && this._actions.togglePause) {
            this._actions.togglePause();
          }
          break;
        case 'KeyF':
          e.preventDefault();
          this._playClick();
          if (this._actions && this._actions.fullscreen) {
            this._actions.fullscreen();
          }
          break;
        case 'KeyM':
          e.preventDefault();
          this._toggleMute();
          break;
      }
    },

    /**
     * Play 8-bit click sound
     */
    _playClick() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 440,
          duration: 50,
          volume: 0.15,
          type: 'square'
        });
      }
    },

    /**
     * Play 8-bit tick sound
     */
    _playTick() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 880,
          duration: 30,
          volume: 0.08,
          type: 'square'
        });
      }
    },

    /**
     * Play victory sound effect
     */
    _playVictory() {
      if (global.Audio && global.Audio.beep) {
        const melody = [
          { freq: 523, delay: 0 },    // C5
          { freq: 659, delay: 100 },  // E5
          { freq: 784, delay: 200 },  // G5
          { freq: 1047, delay: 300 }, // C6
          { freq: 784, delay: 400 },  // G5
          { freq: 1047, delay: 500 }  // C6
        ];

        melody.forEach(note => {
          setTimeout(() => {
            global.Audio.beep({
              frequency: note.freq,
              duration: 100,
              volume: 0.2,
              type: 'square'
            });
          }, note.delay);
        });
      }
    },

    /**
     * Toggle mute
     */
    _toggleMute() {
      if (global.Audio) {
        this._isMuted = !global.Audio.toggle();
        this._updateMuteButton();

        // Play confirmation sound when unmuted
        if (!this._isMuted) {
          this._playClick();
        }
      }
    },

    /**
     * Update mute button state
     */
    _updateMuteButton() {
      if (!this._elements || !this._elements.btnMute) return;

      const icon = this._elements.btnMute.querySelector('.pixel-btn-icon');
      const label = this._elements.btnMute.querySelector('.pixel-btn-label');

      if (this._isMuted) {
        icon.textContent = '✕';
        label.textContent = 'MUTE';
        this._elements.container.classList.add('state-muted');
      } else {
        icon.textContent = '♪';
        label.textContent = 'SOUND';
        this._elements.container.classList.remove('state-muted');
      }
    },

    /**
     * Update pause button state
     */
    _updatePauseButton(isPaused) {
      if (!this._elements || !this._elements.btnPause) return;

      const icon = this._elements.btnPause.querySelector('.pixel-btn-icon');
      const label = this._elements.btnPause.querySelector('.pixel-btn-label');

      if (isPaused) {
        icon.textContent = '►';
        label.textContent = 'PLAY';
      } else {
        icon.textContent = '▮▮';
        label.textContent = 'PAUSE';
      }
    },

    /**
     * Update fullscreen button state
     */
    _updateFullscreenButton() {
      if (!this._elements || !this._elements.btnFullscreen) return;

      const icon = this._elements.btnFullscreen.querySelector('.pixel-fullscreen-icon');
      const label = this._elements.btnFullscreen.querySelector('.pixel-btn-label');
      const isFullscreen = !!document.fullscreenElement;

      icon.classList.toggle('shrink', isFullscreen);
      label.textContent = isFullscreen ? 'EXIT' : 'FULL';
    },

    /**
     * Render
     */
    render(remainingMs, context = {}) {
      const formatted = TimeFormatter.format(remainingMs);

      // Update time
      this._elements.time.textContent = formatted.total;

      // Update document title
      document.title = `${formatted.total} - til.re`;

      // Tick sound every second
      const currentSeconds = Math.ceil(remainingMs / 1000);
      if (currentSeconds !== this._lastSeconds && currentSeconds > 0 && currentSeconds <= 10) {
        this._playTick();
      }
      this._lastSeconds = currentSeconds;
    },

    /**
     * Set title
     */
    setTitle(text) {
      if (this._elements && this._elements.title) {
        this._elements.title.textContent = text ? `> ${text}` : '';
      }
    },

    /**
     * Set message
     */
    setMessage(text) {
      if (this._elements && this._elements.message) {
        this._elements.message.textContent = text || '';
      }
    },

    /**
     * Set state
     */
    setState(state) {
      if (!this._elements || !this._elements.container) return;

      const container = this._elements.container;
      container.classList.remove('state-active', 'state-rest', 'state-finished', 'state-paused');

      if (state) {
        container.classList.add(`state-${state}`);
      }

      // Update pause button state
      this._updatePauseButton(state === 'paused');

      // Play victory sound on completion
      if (state === 'finished') {
        this._playVictory();
      }
    },

    /**
     * Destroy
     */
    destroy() {
      document.removeEventListener('keydown', this._handleKeydown.bind(this));

      this._elements = null;
      this._config = null;
      this._actions = null;
      this._lastSeconds = -1;
    }
  };

  // Register theme
  if (global.ThemeManager) {
    global.ThemeManager.register(PixelRenderer);
  }

  // Export
  global.PixelRenderer = PixelRenderer;

})(typeof window !== 'undefined' ? window : this);
