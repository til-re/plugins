# til.re Plugins

Official themes and shortcuts for [til.re](https://til.re).

## Usage

### Official Plugins

Official plugins are loaded automatically when you use them:

```
# Use a theme
https://til.re/25m?theme=ring

# Use a shortcut
https://til.re/pomodoro
```

### User Plugins

You can create your own plugins and host them on GitHub:

```
# Use a theme from your repository
https://til.re/25m?theme=@username/my-plugins:mytheme

# Use a shortcut from your repository
https://til.re/@username/my-plugins:myshortcut
```

## Structure

```
plugins/
├── registry.json           # Plugin index
├── themes/
│   ├── index.json          # Theme catalog
│   └── [theme-id]/
│       ├── manifest.json   # Theme metadata
│       ├── [theme].js      # Theme renderer
│       └── [theme].css     # Theme styles
└── shortcuts/
    ├── index.json          # Shortcut catalog
    └── [pack].json         # Shortcut pack
```

## Creating a Theme

1. Create a directory for your theme
2. Add `manifest.json`:

```json
{
  "id": "mytheme",
  "version": "1.0.0",
  "tilre": ">=1.0.0",
  "name": "My Theme",
  "description": "A custom theme",
  "files": {
    "js": "mytheme.js",
    "css": "mytheme.css"
  },
  "defaults": {}
}
```

3. Implement the theme renderer in JS:

```javascript
;(function(global) {
  const MyThemeRenderer = {
    id: 'mytheme',
    handlesControls: true,  // Set true if theme handles click/keyboard interactions
    defaults: {},           // Default config values for this theme

    /**
     * Initialize the theme
     * @param {HTMLElement} container - DOM container to render into
     * @param {Object} config - Merged config (defaults + URL params + shortcut config)
     * @param {Object} actions - App actions: { togglePause, reset, fullscreen }
     */
    init(container, config, actions) {
      this._container = container;
      this._config = config;
      this._actions = actions;
      // Create your DOM structure here
    },

    /**
     * Render the countdown display (called every tick, ~60fps)
     * @param {number} remainingMs - Remaining time in milliseconds
     * @param {Object} context - Current state context
     * @param {string} context.state - 'active' | 'rest' | 'finished' | 'paused'
     * @param {number} context.totalMs - Total duration in milliseconds
     * @param {number} context.cycle - Current cycle number (if looping)
     */
    render(remainingMs, context) {
      // Use global TimeFormatter to format time
      // TimeFormatter.format() returns: { total, hours, minutes, seconds }
      const formatted = global.TimeFormatter.format(remainingMs);

      // formatted.total = "25:00" or "1:30:00" (auto includes hours if needed)
      // formatted.hours = "01"
      // formatted.minutes = "30"
      // formatted.seconds = "00"

      this._timeElement.textContent = formatted.total;
    },

    setTitle(text) { /* Update title display */ },
    setMessage(text) { /* Update message display */ },
    setState(state) { /* Handle state changes: 'active', 'rest', 'finished', 'paused' */ },

    /**
     * Cleanup when theme is destroyed
     */
    destroy() {
      // Remove event listeners, cancel animations, etc.
    }
  };

  // Auto-register with ThemeManager
  if (global.ThemeManager) {
    global.ThemeManager.register(MyThemeRenderer);
  }

  // Export for external loading
  global.TilrePlugin_mytheme = MyThemeRenderer;
})(window);
```

### Global Utilities

These utilities are available globally for themes to use:

| Utility | Description |
|---------|-------------|
| `TimeFormatter.format(ms)` | Returns `{ total, hours, minutes, seconds }` |
| `TimeFormatter.parseDuration(str)` | Parses "25m", "1.5h" etc. to seconds |
| `Audio.play(type)` | Play sound: 'tick', 'complete', 'rest' |
| `Audio.toggle()` | Toggle mute |

## Creating Shortcuts

Create a JSON file with your shortcuts:

```json
{
  "id": "my-shortcuts",
  "version": "1.0.0",
  "shortcuts": {
    "myshortcut": {
      "time": "25m",
      "config": {
        "title": "My Timer",
        "loop": true,
        "rest": "5m"
      }
    }
  }
}
```

## Contributing

1. Fork this repository
2. Add your theme/shortcut
3. Submit a pull request

## License

MIT
