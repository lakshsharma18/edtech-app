import { createSlice, createAsyncThunk, isAnyOf } from '@reduxjs/toolkit';
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

const initialState: CartState = { items: [], loading: false, error: null };

// 📡 ASYNC THUNKS
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    return (await API.get('/api/v1/cart')).data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to sync cart data.');
  }
});

export const addCourseToCart = createAsyncThunk('cart/addCourseToCart', async (course: any, { rejectWithValue }) => {
  try {
    await API.post('/api/v1/cart/add', { course_id: course.id });
    return course;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Could not add item.');
  }
});

export const removeCourseFromCart = createAsyncThunk('cart/removeCourseFromCart', async (courseId: number, { rejectWithValue }) => {
  try {
    await API.delete(`/api/v1/cart/remove/${courseId}`);
    return courseId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Could not remove item.');
  }
});

// 🍰 SLICE
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartLocal: (state) => { state.items = []; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addCourseToCart.fulfilled, (state, action) => {
        const course = action.payload;
        if (!state.items.some(item => item.course_id === course.id)) {
          state.items.push({ id: course.id, course_id: course.id, title: course.title, price: course.price });
        }
      })
      .addCase(removeCourseFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.course_id !== action.payload);
      })
      // Combine identical pending and rejected states into clean matcher functions
      .addMatcher(isAnyOf(fetchCart.pending, addCourseToCart.pending, removeCourseFromCart.pending), (state) => {
        state.loading = true;
      })
      .addMatcher(isAnyOf(fetchCart.fulfilled, addCourseToCart.fulfilled, removeCourseFromCart.fulfilled), (state) => {
        state.loading = false;
        state.error = null;
      })
      .addMatcher(isAnyOf(fetchCart.rejected, addCourseToCart.rejected, removeCourseFromCart.rejected), (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
