/**
 * Zen Minimalist Theme
 * Breathing animation, ultra-simple design, singing bowl sound
 */
;(function(global) {
  'use strict';

  const ZenRenderer = {
    id: 'zen',

    // Theme takes over controls
    handlesControls: true,

    // Default config
    defaults: {
      breathRate: 4000,    // Breathing rate (ms)
      minimal: false,      // Hide separators
      breathSound: false   // Enable breathing guide sound
    },

    // Internal state
    _container: null,
    _config: null,
    _actions: null,
    _elements: null,
    _breathInterval: null,
    _isMuted: false,
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

      // Create DOM
      this._createDOM();

      // Cache elements
      this._elements = {
        container: container.querySelector('.zen-theme'),
        time: container.querySelector('.zen-time'),
        title: container.querySelector('.zen-title'),
        message: container.querySelector('.zen-message'),
        pauseOverlay: container.querySelector('.zen-pause-overlay'),
        playBtn: container.querySelector('.zen-play-btn')
      };

      // Apply config
      this._applyStyles();

      // Bind events
      this._bindEvents();

      // Breathing guide sound
      if (this._config.breathSound) {
        this._startBreathSound();
      }
    },

    /**
     * Create DOM
     */
    _createDOM() {
      const minimal = this._config.minimal;

      this._container.innerHTML = `
        <div class="zen-theme${minimal ? ' minimal' : ''}">
          <div class="zen-circle zen-circle-1"></div>
          <div class="zen-circle zen-circle-2"></div>
          <div class="zen-circle zen-circle-3"></div>
          <div class="zen-time">
            <span class="zen-hours">00</span><span class="zen-separator">:</span><span class="zen-minutes">00</span><span class="zen-separator">:</span><span class="zen-seconds">00</span>
          </div>
          <div class="zen-title"></div>
          <div class="zen-message"></div>

          <!-- Pause overlay -->
          <div class="zen-pause-overlay">
            <button class="zen-play-btn" aria-label="Resume">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <div class="zen-pause-hints">
              <span>Click anywhere to continue</span>
              <span class="zen-hint-separator">·</span>
              <span>Double-click for fullscreen</span>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Apply styles
     */
    _applyStyles() {
      const { breathRate, color, bg } = this._config;
      const root = this._elements.container;

      // Breathing rate
      root.style.setProperty('--breath-rate', `${breathRate}ms`);

      // Custom color
      if (color) {
        root.style.color = `#${color}`;
      }

      if (bg) {
        root.style.background = `#${bg}`;
      }
    },

    /**
     * Bind events
     */
    _bindEvents() {
      const container = this._elements.container;

      // Click to pause
      container.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

        this._createRipple(e);

        if (this._actions && this._actions.togglePause) {
          this._actions.togglePause();
        }
      });

      // Double-click for fullscreen
      container.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (this._actions && this._actions.fullscreen) {
          this._actions.fullscreen();
        }
      });

      // Play button click
      this._elements.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._actions && this._actions.togglePause) {
          this._actions.togglePause();
        }
      });

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
     * Create ripple
     */
    _createRipple(e) {
      const container = this._elements.container;
      const rect = container.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);

      const ripple = document.createElement('div');
      ripple.className = 'zen-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

      container.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    },

    /**
     * Start breathing guide sound
     */
    _startBreathSound() {
      const rate = this._config.breathRate;

      this._breathInterval = setInterval(() => {
        this._playBreathIn();
        setTimeout(() => this._playBreathOut(), rate / 2);
      }, rate);
    },

    /**
     * Inhale sound
     */
    _playBreathIn() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 300,
          duration: 800,
          volume: 0.03,
          type: 'sine'
        });
      }
    },

    /**
     * Exhale sound
     */
    _playBreathOut() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 200,
          duration: 1000,
          volume: 0.02,
          type: 'sine'
        });
      }
    },

    /**
     * Play singing bowl sound
     */
    _playBowl() {
      if (global.Audio && global.Audio.beep) {
        // Deep bowl sound
        global.Audio.beep({
          frequency: 220,
          duration: 2000,
          volume: 0.3,
          type: 'sine'
        });
        // Overtones
        setTimeout(() => {
          global.Audio.beep({
            frequency: 440,
            duration: 1500,
            volume: 0.15,
            type: 'sine'
          });
        }, 100);
        setTimeout(() => {
          global.Audio.beep({
            frequency: 660,
            duration: 1000,
            volume: 0.08,
            type: 'sine'
          });
        }, 200);
      }
    },

    /**
     * Toggle mute
     */
    _toggleMute() {
      if (global.Audio) {
        this._isMuted = !global.Audio.toggle();
      }
    },

    /**
     * Render
     */
    render(remainingMs, context = {}) {
      const formatted = TimeFormatter.format(remainingMs);

      // Update time display
      const timeEl = this._elements.time;
      timeEl.querySelector('.zen-hours').textContent = formatted.hours;
      timeEl.querySelector('.zen-minutes').textContent = formatted.minutes;
      timeEl.querySelector('.zen-seconds').textContent = formatted.seconds;

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

      // Play singing bowl on finish
      if (state === 'finished') {
        this._playBowl();
      }
    },

    /**
     * Destroy
     */
    destroy() {
      if (this._breathInterval) {
        clearInterval(this._breathInterval);
        this._breathInterval = null;
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
    global.ThemeManager.register(ZenRenderer);
  }

  // Export
  global.ZenRenderer = ZenRenderer;

})(typeof window !== 'undefined' ? window : this);
