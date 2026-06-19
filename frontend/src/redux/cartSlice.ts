import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api/client';

interface CartItem {
  id?: number;
  course_id: number;
  title: string;
  price: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

// 📡 1. FETCH CART FROM DATABASE (Runs on App Boot / Login)
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await API.get('/api/v1/cart');
    return response.data; // Array of items currently in the user's DB table
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to sync cart data.');
  }
});

// 📡 2. ADD ITEM TO BACKEND DB CART
export const addCourseToCart = createAsyncThunk('cart/addCourseToCart', async (course: any, { rejectWithValue }) => {
  try {
    await API.post('/api/v1/cart/add', { course_id: course.id });
    return course; // Passes the course data forward to append optimistically in UI memory
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Could not add item.');
  }
});

// 📡 3. REMOVE ITEM FROM BACKEND DB CART
export const removeCourseFromCart = createAsyncThunk('cart/removeCourseFromCart', async (courseId: number, { rejectWithValue }) => {
  try {
    await API.delete(`/api/v1/cart/remove/${courseId}`);
    return courseId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Could not remove item.');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartLocal: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.error = null;
      })
      .addCase(addCourseToCart.fulfilled, (state, action) => {
        const itemExists = state.items.some(item => item.course_id === action.payload.id);
        if (!itemExists) {
          state.items.push({
            course_id: action.payload.id,
            title: action.payload.title,
            price: action.payload.price
          });
        }
        state.error = null;
      })
      .addCase(addCourseToCart.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(removeCourseFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.course_id !== action.payload);
      });
  },
});

export const { clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;