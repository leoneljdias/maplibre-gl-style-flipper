// Define the StyleFlipperControl class
class StyleFlipperControl {
  constructor(styles, onStyleChange) {
    this.styles = styles;
    this.onStyleChange = onStyleChange;
    this.buttons = {};
    this.currentStyleCode = null;
    this.customSourcesAndLayers = {};
  }

  onAdd(map) {
    this.map = map;

    // Create the control container
    this.container = document.createElement("div");
    this.container.className =
      "maplibregl-ctrl maplibregl-ctrl-group style-flipper-control";

    // Add a button for each style
    for (const [styleClass, styleData] of Object.entries(this.styles)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `map-style ${styleClass}`;
      button.title = `Switch to ${styleClass}`;

      // Add an image to the button
      const img = document.createElement("img");
      img.src = styleData.image;
      img.alt = styleClass;
      img.style.width = "100%";
      button.appendChild(img);

      // Add a click event listener
      button.addEventListener("click", () => {
        this.saveCustomSourcesAndLayers();
        this.map.setStyle(styleData.url);
        this.currentStyleCode = styleData.code;
        this.highlightActiveStyle(styleClass);
        this.map.once("styledata", () => {
          this.restoreCustomSourcesAndLayers();
        });
        if (this.onStyleChange) {
          this.onStyleChange(styleClass, styleData.code);
        }
      });

      this.container.appendChild(button);
      this.buttons[styleClass] = button;
    }

    // Highlight the current style
    this.highlightActiveStyle(this.getCurrentStyleClass());

    return this.container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }

  highlightActiveStyle(activeStyleClass) {
    Object.values(this.buttons).forEach((button) => {
      button.classList.remove("active");
    });
    if (activeStyleClass && this.buttons[activeStyleClass]) {
      this.buttons[activeStyleClass].classList.add("active");
    }
  }

  getCurrentStyleClass() {
    if (!this.currentStyleCode) {
      return null;
    }
    for (const [styleClass, styleData] of Object.entries(this.styles)) {
      if (styleData.code === this.currentStyleCode) {
        return styleClass;
      }
    }
    return null;
  }

  setCurrentStyleCode(code) {
    this.currentStyleCode = code;
    this.highlightActiveStyle(this.getCurrentStyleClass());
  }

  saveCustomSourcesAndLayers() {
    this.customSourcesAndLayers = {
      sources: {},
      layers: [],
    };
    const sources = this.map.getStyle().sources;
    for (const [sourceId, source] of Object.entries(sources)) {
      if (!source.url) {
        this.customSourcesAndLayers.sources[sourceId] = source;
      }
    }
    const layers = this.map.getStyle().layers;
    for (const layer of layers) {
      if (this.customSourcesAndLayers.sources[layer.source]) {
        this.customSourcesAndLayers.layers.push(layer);
      }
    }
  }

  restoreCustomSourcesAndLayers() {
    for (const [sourceId, source] of Object.entries(
      this.customSourcesAndLayers.sources
    )) {
      this.map.addSource(sourceId, source);
    }
    for (const layer of this.customSourcesAndLayers.layers) {
      this.map.addLayer(layer);
    }
  }
}

// Add CSS for the control
const style = document.createElement("style");
style.textContent = `
    .style-flipper-control {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 2px;
      padding: 4px;
      background: white;
      border-radius: 2px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }
  
    .style-flipper-control .map-style {
      width: 36px;
      height: 36px;
      background: transparent;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  
    .style-flipper-control .map-style:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  
    .style-flipper-control .map-style.active {
      border: 3px solid rgb(209, 62, 86);
    }
  
    .style-flipper-control .map-style img {
      width: 100%;
      height: 100%;
    }
  `;
document.head.appendChild(style);

export default StyleFlipperControl;
