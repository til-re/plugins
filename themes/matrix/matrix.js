/**
 * Matrix Digital Rain Theme
 * Canvas background, The Matrix style
 */
;(function(global) {
  'use strict';

  const MatrixRenderer = {
    id: 'matrix',

    // Takes over controls
    handlesControls: true,

    // Default configuration
    defaults: {
      matrixSpeed: 1,      // Fall speed multiplier
      matrixDensity: 1,    // Character density multiplier
      matrixColor: '00ff00' // Color
    },

    // Internal state
    _container: null,
    _config: null,
    _actions: null,
    _elements: null,
    _canvas: null,
    _ctx: null,
    _columns: [],
    _rafId: null,
    _fontSize: 14,
    _totalMs: 0,
    _isMuted: false,
    _boundKeydown: null,

    // Matrix character set (Japanese Katakana + Chinese + Korean + Numbers + Symbols)
    _chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
            '的一是不了在人有我他这个们中来上大为和国地到以说时要就出会可也你对生能而子那得于着下自之年过发后作里用道行所然家种事成方多经么去法学如都同现当没动面起看定天分还进好小部其些主样理心她本前开但因只从想实日军者意无力它与长把机十民第公此已工使情明性知全三又关点正业外将两高间由问很最重并物手应战向头文体政美相见被利什二等产或新己制身果加西斯月话合回特代内信表化老给世位次度门任常先海通教儿原东声提立及比员解水名真论处走义各入几口认条平系气题活尔更别打女变四神总何电数安少报才结反受目太量再感建务做接必场件计管期市直德资命山金指克许统区保至队形社便空决治展马科司五基眼书非则听白却界达光放强即像难且权思王象完设式色路记南品住告类求据程北边死张该交规万取拉格望觉术领共确传师观清今切院让识候带导争运笑飞风步改收根干造言联持组每济车亲极林服快办议往元英士证近失转夫令准布始怎呢存未远叫台单影具罗字爱击流备兵连调深商算质团集百需价花党华城石级整府离况亚请技际约示复病息究线似官火断精满支视消越器容照须九增研写称企八功吗包片史委乎查轻易早曾除农找装广显吧阿李标谈吃图念六引历首医局突专费号尽另周较注语仅考落青随选列武红响虽推势参希古众构房半节土投某案黑维革划敌致陈律足态护七兴派孩验责营星够章音跟志底站严巴例防族供效续施留讲型料终答紧黄绝奇察母京段依批群项故按河米围江织害斗双境客纪采举杀攻父苏密低朝友诉止细愿千值仍男钱破网热助倒育属坐帝限船脸职速刻乐否刚威毛状率甚独球般普怕弹校苦创假久错承印晚兰试股拿脑预谁益阳若哪微尼继送急血惊伤素药适波夜省初喜卫源食险' +
            'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜㅡㅣ' +
            '0123456789' +
            '∀∂∃∅∇∈∉∋∏∑−∗√∝∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊥',

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
        container: container.querySelector('.matrix-theme'),
        time: container.querySelector('.matrix-time'),
        title: container.querySelector('.matrix-title'),
        message: container.querySelector('.matrix-message')
      };

      // Initialize Canvas
      this._initCanvas();

      // Bind events
      this._bindEvents();

      // Start animation
      this._startAnimation();
    },

    /**
     * Create DOM
     */
    _createDOM() {
      this._container.innerHTML = `
        <div class="matrix-theme">
          <canvas class="matrix-canvas"></canvas>
          <div class="matrix-time">00:00:00</div>
          <div class="matrix-title"></div>
          <div class="matrix-message"></div>
        </div>
      `;
    },

    /**
     * Initialize Canvas
     */
    _initCanvas() {
      this._canvas = this._container.querySelector('.matrix-canvas');
      this._ctx = this._canvas.getContext('2d');

      // Set dimensions
      this._resizeCanvas();

      // Listen for window resize
      this._resizeHandler = () => this._resizeCanvas();
      window.addEventListener('resize', this._resizeHandler);
    },

    /**
     * Resize Canvas
     */
    _resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      this._canvas.width = width * dpr;
      this._canvas.height = height * dpr;
      this._canvas.style.width = width + 'px';
      this._canvas.style.height = height + 'px';

      this._ctx.scale(dpr, dpr);

      // Recalculate columns
      const density = this._config.matrixDensity;
      const columnCount = Math.floor(width / this._fontSize * density);
      this._columns = new Array(columnCount).fill(0).map(() => Math.random() * height);
    },

    /**
     * Bind events
     */
    _bindEvents() {
      const container = this._elements.container;

      // Click to pause
      container.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

        if (this._actions && this._actions.togglePause) {
          this._actions.togglePause();
        }
      });

      // Double click for fullscreen
      container.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (this._actions && this._actions.fullscreen) {
          this._actions.fullscreen();
        }
      });

      // Keyboard
      this._boundKeydown = this._handleKeydown.bind(this);
      document.addEventListener('keydown', this._boundKeydown);
    },

    /**
     * Handle keyboard events
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
     * Start animation
     */
    _startAnimation() {
      const animate = () => {
        this._drawRain();
        this._rafId = requestAnimationFrame(animate);
      };
      this._rafId = requestAnimationFrame(animate);
    },

    /**
     * Draw digital rain
     */
    _drawRain() {
      const ctx = this._ctx;
      const width = this._canvas.width / (window.devicePixelRatio || 1);
      const height = this._canvas.height / (window.devicePixelRatio || 1);

      // Semi-transparent black overlay for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // Set font and color
      const color = this._config.matrixColor;
      ctx.fillStyle = `#${color}`;
      ctx.font = `${this._fontSize}px monospace`;

      // Calculate speed
      const speed = this._config.matrixSpeed * (1 + (1 - this._getProgress()) * 0.5);

      // Draw each column
      const columnWidth = width / this._columns.length;
      for (let i = 0; i < this._columns.length; i++) {
        // Random character
        const char = this._chars[Math.floor(Math.random() * this._chars.length)];
        const x = i * columnWidth;
        const y = this._columns[i];

        // Draw character
        ctx.fillText(char, x, y);

        // Update position
        this._columns[i] += this._fontSize * speed;

        // Random reset
        if (this._columns[i] > height && Math.random() > 0.975) {
          this._columns[i] = 0;
        }
      }
    },

    /**
     * Get progress
     */
    _getProgress() {
      if (this._totalMs <= 0) return 1;
      return 1; // Default return 1, will be updated in render
    },

    /**
     * Play completion sound effect
     */
    _playWakeUp() {
      if (global.Audio && global.Audio.beep) {
        // "Wake up" style synthesized sound
        const notes = [200, 250, 300, 350, 400, 500, 600, 800];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            global.Audio.beep({
              frequency: freq,
              duration: 100,
              volume: 0.15,
              type: 'sawtooth'
            });
          }, i * 60);
        });
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
      if (context.totalMs) {
        this._totalMs = context.totalMs;
      }

      const formatted = TimeFormatter.format(remainingMs);

      // Update time
      this._elements.time.textContent = formatted.total;

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

      // Play sound effect on completion
      if (state === 'finished') {
        this._playWakeUp();
      }
    },

    /**
     * Destroy
     */
    destroy() {
      // Stop animation
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }

      // Remove event listeners
      if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler);
      }

      if (this._boundKeydown) {
        document.removeEventListener('keydown', this._boundKeydown);
        this._boundKeydown = null;
      }

      // Cleanup
      this._canvas = null;
      this._ctx = null;
      this._columns = [];
      this._elements = null;
      this._config = null;
      this._actions = null;
      this._isMuted = false;
    }
  };

  // Register theme
  if (global.ThemeManager) {
    global.ThemeManager.register(MatrixRenderer);
  }

  // Export
  global.MatrixRenderer = MatrixRenderer;

})(typeof window !== 'undefined' ? window : this);
