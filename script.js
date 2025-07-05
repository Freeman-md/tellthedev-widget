import { config } from "./config.js";

const bootstrapWidget = async (apiKey) => {
  try {
    const response = await fetch(`${config.apiUrl}/bootstrap`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.valid) return null;

    return {
      apiKey: apiKey,
      environment: result.environment,
      settings: result.settings,
    };
  } catch (err) {
    console.error("[TellTheDev] Bootstrap failed:", err);
    return null;
  }
};

// Initialize widget on load
const initializeWidget = async () => {
  const currentScript =
    document.currentScript || document.querySelector("script[data-api-key]");
  const apiKey = currentScript?.getAttribute("data-api-key");

  if (!apiKey) {
    console.warn("[TellTheDev] No API key provided");
    return;
  }

  const project = await bootstrapWidget(apiKey);

  if (!project) {
    console.warn("[TellTheDev] Invalid API key. Widget not initialized.");
    window.TellTheDev = {
      valid: false,
    };
  } else {
    window.TellTheDev = {
      apiKey,
      environment: project.environment,
      settings: project.settings,
      valid: true,
    };
  }

  renderWidget(apiKey);
};

// Mount widget and toggle button
const renderWidget = (apiKey) => {
  const host = document.createElement("div");
  host.id = "tellthedev-shadow-root";
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });

  // CSS styles
  const styleTag = document.createElement("style");
  styleTag.textContent = `
        .tellthedev-widget-container {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 400px;
            height: auto;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
            background: white;
            display: none;
            padding: 0;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(20px);
            opacity: 0;
        }

        .tellthedev-widget-container.show {
            display: block;
            transform: translateY(0);
            opacity: 1;
        }

        .tellthedev-widget-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            margin: 0;
            padding: 0;
        }

        .tellthedev-toggle-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: ${config.colors.primary};
            border: none;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 255, 0.3);
            transition: all 0.2s ease;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tellthedev-toggle-button:hover {
            background-color: ${config.colors.primaryHover};
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0, 0, 255, 0.4);
        }

        .tellthedev-toggle-button:active {
            transform: translateY(0);
        }

        .tellthedev-toggle-button img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .tellthedev-error-container {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 400px;
            height: auto;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
            background: white;
            display: none;
            padding: 16px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(20px);
            opacity: 0;
        }

        .tellthedev-error-container.show {
            display: block;
            transform: translateY(0);
            opacity: 1;
        }

        .tellthedev-error-message {
            color: #dc2626;
            font-size: 14px;
            line-height: 1.5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
        }
    `;
  shadowRoot.appendChild(styleTag);

  // Toggle button
  const toggleButton = document.createElement("button");
  toggleButton.className = "tellthedev-toggle-button";
  const logoIcon = document.createElement("img");
  logoIcon.src = config.assets.logoIcon;
  logoIcon.alt = "TellTheDev";
  toggleButton.appendChild(logoIcon);

  // Widget container + iframe
  const container = document.createElement("div");
  container.className = "tellthedev-widget-container";
  const iframe = document.createElement("iframe");
  iframe.src = `/iframe.html`;

  // Iframe resizing
  window.addEventListener("message", (event) => {
    if (event.data?.type === "tellthedev:resize") {
      container.style.height = `${event.data.height}px`;
    }
    if (event.data?.type === "tellthedev:init" && event.data?.apiKey) {
      apiKey = event.data.apiKey;
      console.log(
        "[TellTheDev] Widget initialized with API Key:",
        apiKey
      );
    }
  });

  iframe.onload = () => {
    iframe.contentWindow?.postMessage(
      { type: "tellthedev:init", apiKey },
      "*"
    );
  };

  toggleButton.addEventListener("click", () => {
    if (window.TellTheDev.valid) {
      const isVisible = container.classList.contains("show");
      if (isVisible) {
        container.classList.remove("show");
      } else {
        container.classList.add("show");
      }
    } else {
      console.log(
        "[TellTheDev] Invalid or missing API Key. Widget not rendered."
      );

      let errorContainer = shadowRoot.querySelector(
        ".tellthedev-error-container"
      );
      if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.className = "tellthedev-error-container";

        const errorMessage = document.createElement("p");
        errorMessage.className = "tellthedev-error-message";
        errorMessage.textContent =
          "❌ Oops! This feedback widget wasn't set up properly. Invalid project ID. Please contact the site owner.";

        errorContainer.appendChild(errorMessage);
        shadowRoot.appendChild(errorContainer);
      }

      const isVisible = errorContainer.classList.contains("show");
      if (isVisible) {
        errorContainer.classList.remove("show");
      } else {
        errorContainer.classList.add("show");
      }
    }
  });

  container.appendChild(iframe);

  shadowRoot.appendChild(styleTag);
  shadowRoot.appendChild(toggleButton);
  shadowRoot.appendChild(container);
};

initializeWidget();
