// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Load env variables from repository root
  envDir: "..",
  plugins: [react()],

  // --- Add this 'test' configuration block ---
  test: {
    globals: true, // Enable global variables (describe, test, expect)
    environment: "jsdom", // Use jsdom to simulate a browser environment
    setupFiles: "./src/setupTests.js", // Path to the setup file we will create next
    css: true, // Enable CSS processing (if your tests need it)
  },
  // --- End of test configuration ---
});
