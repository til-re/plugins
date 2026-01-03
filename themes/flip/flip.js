/**
 * Flip Clock Theme
 * CSS 3D flip effect with mechanical flip sound
 */
;(function(global) {
  'use strict';

  const FlipRenderer = {
    id: 'flip',

    // Takes over controls
    handlesControls: true,

    // Default configuration
    defaults: {
      flipSpeed: 300  // Flip speed (ms)
    },

    // Internal state
    _container: null,
    _config: null,
    _actions: null,
    _elements: null,
    _lastDigits: { h1: '', h2: '', m1: '', m2: '', s1: '', s2: '' },
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

      // Create DOM
      this._createDOM();

      // Cache elements
      this._cacheElements();

      // Bind events
      this._bindEvents();

      // Initialize button state
      this._updateMuteButton();
    },

    /**
     * Create DOM
     */
    _createDOM() {
      this._container.innerHTML = `
        <div class="flip-theme">
          <div class="flip-clock">
            <div class="flip-unit-group flip-hours">
              ${this._createCard('h1')}
              ${this._createCard('h2')}
            </div>
            <span class="flip-separator">:</span>
            <div class="flip-unit-group flip-minutes">
              ${this._createCard('m1')}
              ${this._createCard('m2')}
            </div>
            <span class="flip-separator">:</span>
            <div class="flip-unit-group flip-seconds">
              ${this._createCard('s1')}
              ${this._createCard('s2')}
            </div>
          </div>
          <div class="flip-title"></div>
          <div class="flip-message"></div>

          <!-- Flip style button bar -->
          <div class="flip-controls">
            <button class="flip-btn" data-action="pause" title="Pause [Space]">
              <span class="flip-btn-face">⏸</span>
            </button>
            <button class="flip-btn" data-action="mute" title="Mute [M]">
              <span class="flip-btn-face">♪</span>
            </button>
            <button class="flip-btn" data-action="fullscreen" title="Fullscreen [F]">
              <span class="flip-fullscreen-icon">
                <span></span><span></span><span></span><span></span>
              </span>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * Create a single flip card
     */
    _createCard(id) {
      return `
        <div class="flip-card" data-id="${id}">
          <div class="flip-card-top" data-value="0"></div>
          <div class="flip-card-bottom" data-value="0"></div>
          <div class="flip-card-flip flip-card-flip-top" data-value="0"></div>
          <div class="flip-card-flip flip-card-flip-bottom" data-value="0"></div>
        </div>
      `;
    },

    /**
     * Cache elements
     */
    _cacheElements() {
      this._elements = {
        container: this._container.querySelector('.flip-theme'),
        title: this._container.querySelector('.flip-title'),
        message: this._container.querySelector('.flip-message'),
        cards: {},
        // Button elements
        controls: this._container.querySelector('.flip-controls'),
        btnPause: this._container.querySelector('.flip-btn[data-action="pause"]'),
        btnMute: this._container.querySelector('.flip-btn[data-action="mute"]'),
        btnFullscreen: this._container.querySelector('.flip-btn[data-action="fullscreen"]')
      };

      // Cache each card
      ['h1', 'h2', 'm1', 'm2', 's1', 's2'].forEach(id => {
        const card = this._container.querySelector(`.flip-card[data-id="${id}"]`);
        this._elements.cards[id] = {
          card,
          top: card.querySelector('.flip-card-top'),
          bottom: card.querySelector('.flip-card-bottom'),
          flipTop: card.querySelector('.flip-card-flip-top'),
          flipBottom: card.querySelector('.flip-card-flip-bottom')
        };
      });
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
          this._playClick();
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
     * Play click sound
     */
    _playClick() {
      if (global.Audio && global.Audio.beep) {
        global.Audio.beep({
          frequency: 600,
          duration: 50,
          volume: 0.1,
          type: 'sine'
        });
      }
    },

    /**
     * Play flip sound effect
     */
    _playFlip() {
      if (global.Audio && global.Audio.beep) {
        // Simulate mechanical flip sound
        global.Audio.beep({
          frequency: 200,
          duration: 30,
          volume: 0.08,
          type: 'square'
        });
        setTimeout(() => {
          global.Audio.beep({
            frequency: 150,
            duration: 40,
            volume: 0.06,
            type: 'square'
          });
        }, 150);
      }
    },

    /**
     * Play alarm bell sound
     */
    _playAlarm() {
      if (global.Audio && global.Audio.beep) {
        const ring = () => {
          global.Audio.beep({
            frequency: 800,
            duration: 100,
            volume: 0.25,
            type: 'square'
          });
        };

        // Continuous ringing
        for (let i = 0; i < 6; i++) {
          setTimeout(ring, i * 200);
        }
      }
    },

    /**
     * Show controls (auto-hide after 3 seconds)
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

      const icon = this._elements.btnMute.querySelector('.flip-btn-face');

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

      const icon = this._elements.btnPause.querySelector('.flip-btn-face');
      icon.textContent = isPaused ? '▶' : '⏸';
    },

    /**
     * Update fullscreen button state
     */
    _updateFullscreenButton() {
      if (!this._elements || !this._elements.btnFullscreen) return;
      const icon = this._elements.btnFullscreen.querySelector('.flip-fullscreen-icon');
      const isFullscreen = !!document.fullscreenElement;

      icon.classList.toggle('shrink', isFullscreen);
    },

    /**
     * Flip card
     */
    _flipCard(id, oldValue, newValue) {
      const els = this._elements.cards[id];
      if (!els) return;

      const { card, top, bottom, flipTop, flipBottom } = els;

      // Setup before flip:
      // - flipTop shows old value (covers top)
      // - top can be set to new value early (hidden by flipTop)
      // - flipBottom shows new value, ready to flip in
      // - bottom keeps old value
      flipTop.dataset.value = oldValue;
      top.dataset.value = newValue;  // Update early, hidden by flipTop
      flipBottom.dataset.value = newValue;

      // Trigger flip animation
      card.classList.add('flipping');

      // Play flip sound
      this._playFlip();

      // Clean up state after animation ends
      setTimeout(() => {
        card.classList.remove('flipping');
        bottom.dataset.value = newValue;
        flipTop.dataset.value = newValue;
        flipBottom.dataset.value = newValue;
      }, this._config.flipSpeed * 2);
    },

    /**
     * Render
     */
    render(remainingMs, context = {}) {
      const formatted = TimeFormatter.format(remainingMs);

      // Decompose digits
      const digits = {
        h1: formatted.hours[0],
        h2: formatted.hours[1],
        m1: formatted.minutes[0],
        m2: formatted.minutes[1],
        s1: formatted.seconds[0],
        s2: formatted.seconds[1]
      };

      // Check for changes and flip
      Object.keys(digits).forEach(id => {
        const newVal = digits[id];
        const oldVal = this._lastDigits[id];

        if (oldVal !== '' && oldVal !== newVal) {
          this._flipCard(id, oldVal, newVal);
        } else if (oldVal === '') {
          // Initialize
          const els = this._elements.cards[id];
          if (els) {
            els.top.dataset.value = newVal;
            els.bottom.dataset.value = newVal;
            els.flipTop.dataset.value = newVal;
            els.flipBottom.dataset.value = newVal;
          }
        }

        this._lastDigits[id] = newVal;
      });

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

      // Play alarm bell on finish
      if (state === 'finished') {
        this._playAlarm();
      }
    },

    /**
     * Destroy
     */
    destroy() {
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
      this._lastDigits = { h1: '', h2: '', m1: '', m2: '', s1: '', s2: '' };
      this._isMuted = false;
    }
  };

  // Register theme
  if (global.ThemeManager) {
    global.ThemeManager.register(FlipRenderer);
  }

  // Export
  global.FlipRenderer = FlipRenderer;

})(typeof window !== 'undefined' ? window : this);
