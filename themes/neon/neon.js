/**
 * Neon Cyberpunk Theme
 * Glow effects, flicker animation, electronic sound
 */
;(function(global) {
  'use strict';

  const NeonRenderer = {
    id: 'neon',

    // Take over controls
    handlesControls: true,

    // Default config
    defaults: {
      neonColor: 'ff00ff,00ffff',  // Dual colors, comma separated
      flicker: true                 // Enable flicker
    },

    // Internal state
    _container: null,
    _config: null,
    _actions: null,
    _elements: null,
    _flickerTimeout: null,
    _isMuted: false,
    _hideTimer: null,
    _boundKeydown: null,

    /**
     * Initialize
     */
    init(container, config = {}, actions = null) {
      this._config = { ...this.defaults, ...config };
      this._actions = actions;
      this._container = container;

      // Initialize mute state
      this._isMuted = global.Audio ? !global.Audio.isEnabled() : false;

      // Parse colors
      this._parseColors();

      // Create DOM
      this._createDOM();

      // Cache elements
      this._elements = {
        container: container.querySelector('.neon-theme'),
        time: container.querySelector('.neon-time'),
        title: container.querySelector('.neon-title'),
        message: container.querySelector('.neon-message'),
        // Button elements
        controls: container.querySelector('.neon-controls'),
        btnPause: container.querySelector('.neon-btn[data-action="pause"]'),
        btnMute: container.querySelector('.neon-btn[data-action="mute"]'),
        btnFullscreen: container.querySelector('.neon-btn[data-action="fullscreen"]')
      };

      // Apply styles
      this._applyStyles();

      // Bind events
      this._bindEvents();

      // Initialize button state
      this._updateMuteButton();

      // Random flicker
      if (this._config.flicker) {
        this._startRandomFlicker();
      }
    },

    /**
     * Parse color config
     */
    _parseColors() {
      const colorStr = this._config.neonColor || 'ff00ff,00ffff';
      const colors = colorStr.split(',').map(c => c.trim());
      this._colors = {
        color1: colors[0] || 'ff00ff',
        color2: colors[1] || colors[0] || '00ffff'
      };
    },

    /**
     * Create DOM
     */
    _createDOM() {
      this._container.innerHTML = `
        <div class="neon-theme${this._config.flicker ? ' flicker' : ''}">
          <div class="neon-grid"></div>
          <div class="neon-scanline"></div>
          <div class="neon-time">
            <span class="neon-hours">00</span><span class="neon-separator">:</span><span class="neon-minutes">00</span><span class="neon-separator">:</span><span class="neon-seconds">00</span>
          </div>
          <div class="neon-title"></div>
          <div class="neon-message"></div>

          <!-- Neon style control bar -->
          <div class="neon-controls">
            <button class="neon-btn" data-action="pause" title="Pause">⏸</button>
            <button class="neon-btn" data-action="mute" title="Mute">♪</button>
            <button class="neon-btn" data-action="fullscreen" title="Fullscreen">
              <span class="neon-fullscreen-icon">
                <span></span><span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * Apply styles
     */
    _applyStyles() {
      const root = this._elements.container;
      root.style.setProperty('--neon-color-1', `#${this._colors.color1}`);
      root.style.setProperty('--neon-color-2', `#${this._colors.color2}`);
    },

    /**
     * Bind events
     */
    _bindEvents() {
      const container = this._elements.container;

      // Show controls on mouse move
      container.addEventListener('mousemove', () => this._showControls());
      container.addEventListener('touchstart', () => this._showControls(), { passive: true });

      // Button click events
      this._elements.btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
        this._playPulse();
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
        this._playPulse();
        if (this._actions && this._actions.fullscreen) {
          this._actions.fullscreen();
        }
      });

      // Fullscreen state change listener
      document.addEventListener('fullscreenchange', () => this._updateFullscreenButton());

      // Keyboard
      this._boundKeydown = this._handleKeydown.bind(this);
      document.addEventListener('keydown', this._boundKeydown);
    },

    /**
     * Keyboard handler
     */
    _handleKeydown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this._playPulse();
          if (this._actions && this._actions.togglePause) {
            this._actions.togglePause();
          }
          break;
        case 'KeyF':
          e.preventDefault();
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
     * Random flicker effect
     */
    _startRandomFlicker() {
      const flicker = () => {
        const container = this._elements.container;
        if (!container) return;

        // Add random flicker
        container.style.filter = 'brightness(0.7)';
        setTimeout(() => {
          if (container) container.style.filter = '';
        }, 50);

        // Random interval
        this._flickerTimeout = setTimeout(flicker, 2000 + Math.random() * 5000);
      };

      this._flickerTimeout = setTimeout(flicker, 3000);
    },

    /**
     * Play electronic pulse sound
     */
    _playPulse() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 150,
          duration: 80,
          volume: 0.15,
          type: 'square'
        });
        setTimeout(() => {
          global.Audio.beep({
            frequency: 200,
            duration: 60,
            volume: 0.1,
            type: 'square'
          });
        }, 50);
      }
    },

    /**
     * Play finish sound - synth rising tone
     */
    _playSynth() {
      if (global.Audio && global.Audio.beep) {
        const notes = [200, 300, 400, 500, 600];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            global.Audio.beep({
              frequency: freq,
              duration: 150,
              volume: 0.2,
              type: 'sawtooth'
            });
          }, i * 80);
        });
      }
    },

    /**
     * Show controls (auto-hide after 3s)
     */
    _showControls() {
      if (!this._elements || !this._elements.controls) return;

      this._elements.controls.classList.add('visible');

      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
      }

      this._hideTimer = setTimeout(() => {
        if (this._elements && this._elements.controls) {
          this._elements.controls.classList.remove('visible');
        }
      }, 3000);
    },

    /**
     * Toggle mute
     */
    _toggleMute() {
      if (global.Audio) {
        this._isMuted = !global.Audio.toggle();
        this._updateMuteButton();
      }
    },

    /**
     * Update mute button state
     */
    _updateMuteButton() {
      if (!this._elements || !this._elements.btnMute) return;

      if (this._isMuted) {
        this._elements.btnMute.textContent = '✕';
        this._elements.container.classList.add('state-muted');
      } else {
        this._elements.btnMute.textContent = '♪';
        this._elements.container.classList.remove('state-muted');
      }
    },

    /**
     * Update pause button state
     */
    _updatePauseButton(isPaused) {
      if (!this._elements || !this._elements.btnPause) return;
      this._elements.btnPause.textContent = isPaused ? '▶' : '⏸';
    },

    /**
     * Update fullscreen button state
     */
    _updateFullscreenButton() {
      if (!this._elements || !this._elements.btnFullscreen) return;
      const icon = this._elements.btnFullscreen.querySelector('.neon-fullscreen-icon');
      const isFullscreen = !!document.fullscreenElement;

      icon.classList.toggle('shrink', isFullscreen);
    },

    /**
     * Render
     */
    render(remainingMs, context = {}) {
      const formatted = TimeFormatter.format(remainingMs);

      // Update time
      const timeEl = this._elements.time;
      timeEl.querySelector('.neon-hours').textContent = formatted.hours;
      timeEl.querySelector('.neon-minutes').textContent = formatted.minutes;
      timeEl.querySelector('.neon-seconds').textContent = formatted.seconds;

      // Update document title
      document.title = `${formatted.total} - til.re`;
    },

    /**
     * Set title
     */
    setTitle(text) {
      if (this._elements && this._elements.title) {
        this._elements.title.textContent = text || '';
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

      // Play synth sound on finish
      if (state === 'finished') {
        this._playSynth();
      }
    },

    /**
     * Destroy
     */
    destroy() {
      if (this._flickerTimeout) {
        clearTimeout(this._flickerTimeout);
        this._flickerTimeout = null;
      }

      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }

      if (this._boundKeydown) {
        document.removeEventListener('keydown', this._boundKeydown);
        this._boundKeydown = null;
      }

      this._elements = null;
      this._config = null;
      this._actions = null;
      this._isMuted = false;
    }
  };

  // Register theme
  if (global.ThemeManager) {
    global.ThemeManager.register(NeonRenderer);
  }

  // Export
  global.NeonRenderer = NeonRenderer;

})(typeof window !== 'undefined' ? window : this);
