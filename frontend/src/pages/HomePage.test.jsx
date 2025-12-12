// src/pages/HomePage.test.jsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';
import React from 'react';

// 'describe' creates a test suite (a group of related tests)
describe('HomePage Component', () => {
  // 'test' (or 'it') defines an individual test case
  test('should render the main welcome heading', () => {
    // 1. Arrange: Render the component
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // 2. Act: Find the element on the screen.
    // We are looking for an element (role: 'heading') with the specific name.
    const headingElement = screen.getByRole('heading', {
      name: /Welcome to SafeZone/i, // 'i' makes it case-insensitive
    });

    // 3. Assert: Check if the element exists in the document
    expect(headingElement).toBeInTheDocument();
  });
});
