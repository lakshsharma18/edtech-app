import { render, screen, fireEvent} from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import cartReducer from '../redux/cartSlice'; // Maps directly onto your cart reducer slice file
import Courses from '../pages/Courses';       // Maps onto your main catalog view component
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// 📡 1. INTERCEPT AND MOCK THE AXIOS BASE CONFIGURATION CLIENT
// This completely stops your tests from hitting your real live Uvicorn backend port.
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/courses') {
        return Promise.resolve({
          data: [
            { id: 45, title: "React & Redux Masterclass", description: "Learn State Control", price: 499, thumbnail_url: "" }
          ]
        });
      }
      if (url === '/api/v1/my-courses') {
        return Promise.resolve({ data: [] }); // Simulates that the logged-in user owns zero courses initially
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockResolvedValue({ data: { message: "Course added to cart successfully" } })
  }
}));

describe('Ed-Tech Frontend Redux E-Commerce Integration Suite', () => {
  let testStore: any;

  beforeEach(() => {
    // 2. Instantiate a clean, isolated instance of your real Redux store structure for this test case run
    testStore = configureStore({
      reducer: { cart: cartReducer }
    });
    
    // Fake an active session passport token string inside browser storage frames
    localStorage.setItem('token', 'mock_jwt_access_token');
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('🎯 BUTTON TOGGLE SEQUENCE: Clicking Add to Cart must update the Redux Store and shift view states to Pay to Enroll', async () => {
    // 3. Virtually mount your custom catalog view wrapped inside your state and router contexts
    render(
      <Provider store={testStore}>
        <BrowserRouter>
          <Courses />
        </BrowserRouter>
      </Provider>
    );

    // 4. STEP 1 ASSERT: Confirm the mock course loads on screen and displays the "Add to Cart" button layout
    const initialButton = await screen.findByRole('button', { name: /add to cart/i });
    expect(initialButton).toBeInTheDocument();

    // 5. ACTION: Replicate a student clicking the blue button layout
    fireEvent.click(initialButton);

    // 6. STEP 2 ASSERT: Verify Redux catches the action, pushes the item, and toggles the layout text!
    // The conditional block on line 185 of your Courses.tsx will trigger `isInCart === true`,
    // instantly transforming the button variant into your custom orange Stripe "Pay to Enroll" trigger box!
    const updatedButton = await screen.findByRole('button', { name: /pay to enroll/i });
    expect(updatedButton).toBeInTheDocument();
    expect(updatedButton).toHaveClass('btn-warning'); // Confirms style matches your exact spec parameters
  });
});
