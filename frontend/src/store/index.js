import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Importing slices jo store/slice mein banayi thi
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import chatReducer from './slices/chatSlice';
import gamificationReducer from './slices/gamificationSlice';
import srsReducer from './slices/srsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  chat: chatReducer,
  gamification: gamificationReducer,
  srs: srsReducer,
});


const persistConfig = {
  key: 'socraticdev',
  version: 1,
  storage,
  whitelist: ['auth', 'ui', 'gamification', 'chat'], // srs ko intentionally exclude kiya h — always fetched fresh from backend
};


const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.DEV,
});

// Created persistor
export const persistor = persistStore(store);

export default store;
