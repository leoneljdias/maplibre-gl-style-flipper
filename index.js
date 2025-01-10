/**
 * MapLibre GL Style Flipper Control
 * A custom control to switch between different map styles in MapLibre GL JS.
 * @class
 */
export class StyleFlipperControl {
  /**
   * Creates a custom style flipper control.
   * @param {Object} styles - Object containing map styles (key: style name, value: { code: style code, image: image path, url: style URL }).
   * @param {Function} [onStyleChange] - Callback function triggered when the style is changed.
   */
  constructor(styles, onStyleChange) {
    this.styles = styles;
    this.onStyleChange = onStyleChange;
    this.buttons = {}; // Stores buttons for easy access
    this.currentStyleCode = null; // Stores the current map style code
  }

  /**
   * Called when the control is added to the map.
   * @param {maplibregl.Map} map - Map instance.
   * @returns {HTMLElement} - Control container.
   */
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
      img.src = styleData.image; // Use the image path from the style data
      img.alt = styleClass;
      img.style.width = "100%";
      button.appendChild(img);

      // Add a click event listener
      button.addEventListener("click", () => {
        this.map.setStyle(styleData.url); // Use the style URL from the style data
        this.currentStyleCode = styleData.code; // Update the current style code
        this.highlightActiveStyle(styleClass); // Highlight the active style
        if (this.onStyleChange) {
          this.onStyleChange(styleClass, styleData.code);
        }
      });

      this.container.appendChild(button);
      this.buttons[styleClass] = button; // Store the button for future reference
    }

    // Highlight the current style based on the initial map style
    this.highlightActiveStyle(this.getCurrentStyleClass());

    return this.container;
  }

  /**
   * Called when the control is removed from the map.
   */
  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }

  /**
   * Highlights the button corresponding to the active style.
   * @param {string} activeStyleClass - Class of the active style.
   */
  highlightActiveStyle(activeStyleClass) {
    console.log(activeStyleClass); // Debugging

    // Remove the highlight class from all buttons
    Object.values(this.buttons).forEach((button) => {
      button.classList.remove("active");
    });

    // Add the highlight class to the active button (if activeStyleClass is not null)
    if (activeStyleClass && this.buttons[activeStyleClass]) {
      this.buttons[activeStyleClass].classList.add("active");
    }
  }

  /**
   * Gets the class of the current map style.
   * @returns {string} - Class of the current style.
   */
  getCurrentStyleClass() {
    if (!this.currentStyleCode) {
      return null; // Return null if the current style code is not available
    }

    // Find the style class corresponding to the current style code
    for (const [styleClass, styleData] of Object.entries(this.styles)) {
      if (styleData.code === this.currentStyleCode) {
        return styleClass;
      }
    }

    return null; // Return null if no match is found
  }

  /**
   * Sets the current style code.
   * @param {string} code - Code of the current style.
   */
  setCurrentStyleCode(code) {
    this.currentStyleCode = code;
    this.highlightActiveStyle(this.getCurrentStyleClass());
  }
}

// Optional: Add CSS dynamically
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
