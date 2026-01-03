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
    handlesControls: true,
    defaults: {},

    init(container, config, actions) {
      // Initialize theme
    },

    render(remainingMs, context) {
      // Render countdown
    },

    setTitle(text) {},
    setMessage(text) {},
    setState(state) {},

    destroy() {
      // Cleanup
    }
  };

  if (global.ThemeManager) {
    global.ThemeManager.register(MyThemeRenderer);
  }
})(window);
```

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
