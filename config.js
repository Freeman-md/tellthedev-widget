// Detect local dev environment
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.includes(".local");

export const config = {
  baseUrl: isDev ? "http://127.0.0.1:5500/" : "https://tellthedev.vercel.app",

  apiUrl: isDev
    ? "http://localhost:3000/api/widget"
    : "https://tellthedev.vercel.app/api/widget",

  colors: {
    primary: "#0000ff",
    primaryHover: "#0000cc",
    white: "#ffffff",
  },

  assets: {
    logoIcon: `${isDev ? "" : "https://tellthedev.vercel.app"}/widget/assets/images/logo-icon-white.svg`,
    logo: `${isDev ? "" : "https://tellthedev.vercel.app"}/widget/assets/images/logo.svg`,
  },
};
