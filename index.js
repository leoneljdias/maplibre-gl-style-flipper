// Define the StyleFlipperControl class
class StyleFlipperControl {
  constructor(styles, onStyleChange) {
    this.styles = styles;
    this.onStyleChange = onStyleChange;
    this.buttons = {};
    this.currentStyleCode = null;
    this.customSourcesAndLayers = {};
    this.hasImages = this.checkForImages();
    this.isExpanded = false;
  }

  checkForImages() {
    return Object.values(this.styles).some((styleData) => styleData.image);
  }

  onAdd(map) {
    this.map = map;

    // Create the control container
    this.container = document.createElement("div");
    this.container.className = this.hasImages
      ? "maplibregl-ctrl maplibregl-ctrl-group style-flipper-control"
      : "maplibregl-ctrl maplibregl-ctrl-group style-flipper-control compact";

    if (this.hasImages) {
      this.createImageButtons();
    } else {
      this.createDefaultButton();
    }

    // Highlight the current style
    this.highlightActiveStyle(this.getCurrentStyleClass());

    return this.container;
  }

  createImageButtons() {
    // Add a button for each style with image
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
        this.switchStyle(styleClass, styleData);
      });

      this.container.appendChild(button);
      this.buttons[styleClass] = button;
    }
  }

  createDefaultButton() {
    // Create main toggle button
    this.mainButton = document.createElement("button");
    this.mainButton.type = "button";
    this.mainButton.className = "style-toggle-btn";
    this.mainButton.title = "Switch map style";
    this.mainButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12v12H2V2zm1 1v10h10V3H3z"/>
        <path d="M4 4h2v2H4V4zm3 0h2v2H7V4zm3 0h2v2h-2V4z"/>
      </svg>
    `;

    // Create dropdown container
    this.dropdown = document.createElement("div");
    this.dropdown.className = "style-dropdown";
    this.dropdown.style.display = "none";

    // Create radio buttons for each style
    for (const [styleClass, styleData] of Object.entries(this.styles)) {
      const label = document.createElement("label");
      label.className = "style-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "mapStyle";
      radio.value = styleClass;
      radio.addEventListener("change", () => {
        if (radio.checked) {
          this.switchStyle(styleClass, styleData);
          this.hideDropdown();
        }
      });

      const span = document.createElement("span");
      span.textContent = styleData.name || styleClass;

      label.appendChild(radio);
      label.appendChild(span);
      this.dropdown.appendChild(label);

      this.buttons[styleClass] = radio;
    }

    // Add event listeners for showing/hiding dropdown
    this.mainButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    this.mainButton.addEventListener("mouseenter", () => {
      this.showDropdown();
    });

    this.container.addEventListener("mouseleave", () => {
      this.hideDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.hideDropdown();
      }
    });

    this.container.appendChild(this.mainButton);
    this.container.appendChild(this.dropdown);
  }

  switchStyle(styleClass, styleData) {
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
  }

  showDropdown() {
    if (!this.hasImages) {
      this.dropdown.style.display = "block";
      this.isExpanded = true;
      this.mainButton.classList.add("expanded");
    }
  }

  hideDropdown() {
    if (!this.hasImages) {
      this.dropdown.style.display = "none";
      this.isExpanded = false;
      this.mainButton.classList.remove("expanded");
    }
  }

  toggleDropdown() {
    if (this.isExpanded) {
      this.hideDropdown();
    } else {
      this.showDropdown();
    }
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }

  highlightActiveStyle(activeStyleClass) {
    if (this.hasImages) {
      Object.values(this.buttons).forEach((button) => {
        button.classList.remove("active");
      });
      if (activeStyleClass && this.buttons[activeStyleClass]) {
        this.buttons[activeStyleClass].classList.add("active");
      }
    } else {
      // For radio buttons, check the active one
      Object.entries(this.buttons).forEach(([styleClass, radio]) => {
        radio.checked = styleClass === activeStyleClass;
      });
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
      image: {},
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

    const allImageIDs = this.map.listImages();
    const customIDs = allImageIDs.filter((id) => id.startsWith("customImg-"));
    if (customIDs.length != 0) {
      customIDs.forEach((Id) => {
        this.customSourcesAndLayers.image[Id] = this.map.getImage(Id);
      });
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

    for (const [IdImage, Image] of Object.entries(
      this.customSourcesAndLayers.image
    )) {
      this.map.addImage(IdImage, Image.data);
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
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .style-flipper-control.compact {
      padding: 0;
      flex-direction: column;
      align-items: stretch;
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
      border: 1px solid transparent;
      border-radius: 2px;
    }
  
    .style-flipper-control .map-style:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  
    .style-flipper-control .map-style.active {
      border: 2px solid #d13e56;
    }
  
    .style-flipper-control .map-style img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 1px;
    }

    /* Default button styles */
    .style-toggle-btn {
      width: 36px;
      height: 36px;
      background: white;
      border: none;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      color: #333;
      transition: all 0.2s ease;
    }

    .style-toggle-btn:hover,
    .style-toggle-btn.expanded {
      background: rgba(0, 0, 0, 0.1);
    }

    .style-toggle-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Dropdown styles */
    .style-dropdown {
      position: absolute;
      top: 40px;
      left: 0;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      min-width: 150px;
      z-index: 1000;
      padding: 4px;
    }

    .style-option {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 2px;
      transition: background-color 0.2s ease;
      white-space: nowrap;
    }

    .style-option:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .style-option input[type="radio"] {
      margin: 0 8px 0 0;
      cursor: pointer;
    }

    .style-option span {
      font-size: 14px;
      color: #333;
      text-transform: capitalize;
    }

    .style-option input[type="radio"]:checked + span {
      font-weight: 600;
      color: #d13e56;
    }
`;
document.head.appendChild(style);

export default StyleFlipperControl;
