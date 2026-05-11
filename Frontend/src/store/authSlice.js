import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Имитация API вызовов
const fakeApi = {
  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      token: 'fake-jwt-token',
      user: {
        id: '1',
        name: userData.name,
        email: userData.email,
        isAdmin: false
      }
    };
  },
  
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      token: 'fake-jwt-token',
      user: {
        id: '1',
        name: 'Алексей Петров',
        email: credentials.email,
        isAdmin: false
      }
    };
  },
  
  getCurrentUser: async (token) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: '1',
      name: 'Алексей Петров',
      email: 'alexey@example.com',
      isAdmin: false
    };
  }
};

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fakeApi.register(userData);
      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Ошибка регистрации');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fakeApi.login(credentials);
      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Ошибка входа');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      if (!token) {
        throw new Error('Нет токена');
      }
      const response = await fakeApi.getCurrentUser(token);
      return response;
    } catch (error) {
      // Удаляем токен при ошибке
      localStorage.removeItem('token');
      return rejectWithValue(error.message || 'Ошибка получения данных пользователя');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      // Удаляем токен из localStorage
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;