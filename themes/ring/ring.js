/**
 * Ring Progress Theme
 * SVG circular progress bar with dynamic color and click interaction
 */
;(function(global) {
  'use strict';

  const RingRenderer = {
    id: 'ring',

    // Theme takes over controls
    handlesControls: true,

    // Default config
    defaults: {
      ringWidth: 8,        // Ring width
      ringColor: null,     // Progress ring color
      dynamicColor: false, // Enable dynamic color
      tick: false          // Enable tick sound
    },

    // Internal state
    _container: null,
    _config: null,
    _actions: null,
    _elements: null,
    _lastSeconds: -1,
    _totalMs: 0,
    _isMuted: false,
    _hideTimer: null,
    _boundKeydown: null,

    // Ring parameters
    _circumference: 283, // 2 * PI * 45

    /**
     * Initialize
     */
    init(container, config = {}, actions = null) {
      this._config = { ...this.defaults, ...config };
      this._actions = actions;
      this._container = container;

      // Initialize mute state
      this._isMuted = global.Audio ? !global.Audio.isEnabled() : false;

      // Create DOM structure
      this._createDOM();

      // Cache elements
      this._elements = {
        container: container.querySelector('.ring-theme'),
        svg: container.querySelector('.ring-svg'),
        progress: container.querySelector('.ring-progress-circle'),
        time: container.querySelector('.ring-time'),
        title: container.querySelector('.ring-title'),
        message: container.querySelector('.ring-message'),
        // Button elements
        controls: container.querySelector('.ring-controls'),
        btnPause: container.querySelector('.ring-btn[data-action="pause"]'),
        btnMute: container.querySelector('.ring-btn[data-action="mute"]'),
        btnFullscreen: container.querySelector('.ring-btn[data-action="fullscreen"]')
      };

      // Apply custom styles
      this._applyStyles();

      // Bind interaction events
      this._bindEvents();

      // Initialize button state
      this._updateMuteButton();
    },

    /**
     * Create DOM
     */
    _createDOM() {
      this._container.innerHTML = `
        <div class="ring-theme">
          <div class="ring-container">
            <svg class="ring-svg" viewBox="0 0 100 100">
              <circle class="ring-bg-circle" cx="50" cy="50" r="45" />
              <circle class="ring-progress-circle" cx="50" cy="50" r="45" />
            </svg>
            <div class="ring-time">00:00</div>
          </div>
          <div class="ring-title"></div>
          <div class="ring-message"></div>

          <!-- Control button bar -->
          <div class="ring-controls">
            <button class="ring-btn" data-action="pause" title="Pause [Space]">
              <span class="ring-btn-icon">⏸</span>
            </button>
            <button class="ring-btn" data-action="mute" title="Mute [M]">
              <span class="ring-btn-icon">♪</span>
            </button>
            <button class="ring-btn" data-action="fullscreen" title="Fullscreen [F]">
              <span class="ring-fullscreen-icon">
                <span></span><span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * Apply custom styles
     */
    _applyStyles() {
      const { ringWidth, ringColor, color, bg } = this._config;
      const root = this._elements.container;

      if (ringWidth) {
        root.style.setProperty('--ring-width', ringWidth);
      }

      if (ringColor) {
        root.style.setProperty('--ring-progress-color', `#${ringColor}`);
      }

      if (color) {
        root.style.setProperty('--ring-color', `#${color}`);
      }

      if (bg) {
        root.style.setProperty('--ring-bg', `#${bg}`);
      }
    },

    /**
     * Bind interaction events
     */
    _bindEvents() {
      const container = this._elements.container;

      // Show controls on mouse move
      container.addEventListener('mousemove', () => this._showControls());
      container.addEventListener('touchstart', () => this._showControls(), { passive: true });

      // Button click events
      this._elements.btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
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
        if (this._actions && this._actions.fullscreen) {
          this._actions.fullscreen();
        }
      });

      // Fullscreen state change listener
      document.addEventListener('fullscreenchange', () => this._updateFullscreenButton());

      // Keyboard control
      this._boundKeydown = this._handleKeydown.bind(this);
      document.addEventListener('keydown', this._boundKeydown);
    },

    /**
     * Keyboard event handler
     */
    _handleKeydown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
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
     * Render
     */
    render(remainingMs, context = {}) {
      // Save total time
      if (context.totalMs) {
        this._totalMs = context.totalMs;
      }

      // Calculate progress
      const progress = this._totalMs > 0 ? remainingMs / this._totalMs : 0;
      const offset = this._circumference * (1 - progress);

      // Update progress ring
      this._elements.progress.style.strokeDashoffset = offset;

      // Dynamic color
      if (this._config.dynamicColor) {
        const hue = progress * 120; // 120 (green) -> 0 (red)
        this._elements.progress.style.stroke = `hsl(${hue}, 70%, 55%)`;
      }

      // Format time
      const formatted = TimeFormatter.format(remainingMs);
      this._elements.time.textContent = formatted.total;

      // Update document title
      document.title = `${formatted.total} - til.re`;

      // Tick sound
      const currentSeconds = Math.ceil(remainingMs / 1000);
      if (this._config.tick && currentSeconds !== this._lastSeconds && currentSeconds > 0) {
        this._playTick();
      }
      this._lastSeconds = currentSeconds;
    },

    /**
     * Play tick sound
     */
    _playTick() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 1000,
          duration: 20,
          volume: 0.05,
          type: 'sine'
        });
      }
    },

    /**
     * Play finish sound
     */
    _playFinish() {
      if (global.Audio && global.Audio.beepFinish) {
        global.Audio.beepFinish();
      }
    },

    /**
     * Show controls (auto-hide after 3s)
     */
    _showControls() {
      if (!this._elements || !this._elements.controls) return;

      this._elements.controls.classList.add('visible');

      // Clear previous timer
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
      }

      // Hide after 3s
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

      const icon = this._elements.btnMute.querySelector('.ring-btn-icon');

      if (this._isMuted) {
        icon.textContent = '✕';
        this._elements.container.classList.add('state-muted');
      } else {
        icon.textContent = '♪';
        this._elements.container.classList.remove('state-muted');
      }
    },

    /**
     * Update pause button state
     */
    _updatePauseButton(isPaused) {
      if (!this._elements || !this._elements.btnPause) return;

      const icon = this._elements.btnPause.querySelector('.ring-btn-icon');
      icon.textContent = isPaused ? '▶' : '⏸';
    },

    /**
     * Update fullscreen button state
     */
    _updateFullscreenButton() {
      if (!this._elements || !this._elements.btnFullscreen) return;

      const icon = this._elements.btnFullscreen.querySelector('.ring-fullscreen-icon');
      const isFullscreen = !!document.fullscreenElement;

      icon.classList.toggle('shrink', isFullscreen);
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

      // Play sound on finish
      if (state === 'finished') {
        this._playFinish();
      }
    },

    /**
     * Destroy
     */
    destroy() {
      // Clean up timer
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }

      // Remove keyboard events
      if (this._boundKeydown) {
        document.removeEventListener('keydown', this._boundKeydown);
        this._boundKeydown = null;
      }

      // Clean up state
      this._elements = null;
      this._config = null;
      this._actions = null;
      this._lastSeconds = -1;
      this._isMuted = false;
    }
  };

  // Register theme
  if (global.ThemeManager) {
    global.ThemeManager.register(RingRenderer);
  }

  // Export
  global.RingRenderer = RingRenderer;

})(typeof window !== 'undefined' ? window : this);
