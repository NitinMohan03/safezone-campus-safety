// src/setupTests.js
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import the jest-dom matchers

// This ensures that after each test,
// the simulated DOM is cleaned up.
afterEach(() => {
  cleanup();
});
