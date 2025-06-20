// Check if we're in development by looking at the hostname
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.includes(".local");

export const config = {
  // URLs
  baseUrl: isDev ? "http://127.0.0.1:5500" : "https://tellthedev.vercel.app",
  functionsUrl: isDev
    ? "http://127.0.0.1:54321/functions/v1"
    : "https://tellthedev.functions.supabase.co",

  // Branding
  colors: {
    primary: "#0000ff",
    primaryHover: "#0000cc", // Slightly darker blue for hover states
    white: "#ffffff",
  },

  // Assets
  assets: {
    logoIcon: `${
      isDev ? "" : "https://tellthedev.vercel.app"
    }/assets/images/logo-icon-white.svg`,
    logo: `${
      isDev ? "" : "https://tellthedev.vercel.app"
    }/assets/images/logo.svg`,
  },
};
