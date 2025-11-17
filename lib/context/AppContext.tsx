/**
 * React Context for global app state management
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

// ===================================
// TYPES
// ===================================

/**
 * Notification message type
 */
export interface NotificationMessage {
  /** Type of notification */
  type: 'success' | 'error' | 'info';
  /** Notification message text */
  message: string;
  /** Unique ID for the notification */
  id: string;
  /** Whether notification should auto-dismiss */
  autoDismiss?: boolean;
  /** Duration in milliseconds before auto-dismissal */
  duration?: number;
}

/**
 * API status types
 */
export type ApiStatus = 'healthy' | 'unhealthy' | 'checking';

/**
 * App context state
 */
export interface AppState {
  /** Currently selected video ID */
  selectedVideoId: string | null;

  /** Current notification message */
  notificationMessage: NotificationMessage | null;

  /** Current API health status */
  apiStatus: ApiStatus;

  /** Last API health check timestamp */
  lastHealthCheck: number | null;

  /** Current user information */
  user: {
    id: string | null;
    email: string | null;
    displayName: string | null;
    tier: 'free' | 'pro' | 'enterprise' | null;
    storageQuota: number | null;
    storageUsed: number | null;
  } | null;

  /** App-wide loading state */
  isAppLoading: boolean;

  /** Dark mode preference */
  darkMode: boolean;

  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;

  /** Network connection status */
  isOnline: boolean;

  /** Error boundary state */
  hasError: boolean;
  errorBoundaryMessage: string | null;
}

/**
 * App context actions
 */
export interface AppActions {
  /** Set the selected video ID */
  setSelectedVideoId: (id: string | null) => void;

  /** Show a notification message */
  showNotification: (type: 'success' | 'error' | 'info', message: string, options?: Partial<NotificationMessage>) => void;

  /** Clear current notification */
  clearNotification: () => void;

  /** Check API health status */
  checkApiStatus: () => Promise<void>;

  /** Set API status manually */
  setApiStatus: (status: ApiStatus) => void;

  /** Update user information */
  updateUser: (user: Partial<AppState['user']>) => void;

  /** Set app loading state */
  setAppLoading: (loading: boolean) => void;

  /** Toggle dark mode */
  toggleDarkMode: () => void;

  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;

  /** Set network status */
  setOnlineStatus: (online: boolean) => void;

  /** Handle app-wide error */
  setAppError: (error: string, hasError?: boolean) => void;

  /** Clear app error */
  clearAppError: () => void;

  /** Reset entire app state */
  resetAppState: () => void;
}

/**
 * Combined app context value
 */
export interface AppContextValue extends AppState, AppActions {}

// ===================================
// ACTION TYPES
// ===================================

type AppAction =
  | { type: 'SET_SELECTED_VIDEO_ID'; payload: string | null }
  | { type: 'SHOW_NOTIFICATION'; payload: NotificationMessage }
  | { type: 'CLEAR_NOTIFICATION' }
  | { type: 'SET_API_STATUS'; payload: ApiStatus }
  | { type: 'SET_LAST_HEALTH_CHECK'; payload: number }
  | { type: 'UPDATE_USER'; payload: Partial<AppState['user']> }
  | { type: 'SET_APP_LOADING'; payload: boolean }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_APP_ERROR'; payload: { message: string; hasError: boolean } }
  | { type: 'CLEAR_APP_ERROR' }
  | { type: 'RESET_APP_STATE' };

// ===================================
// REDUCER
// ===================================

const initialState: AppState = {
  selectedVideoId: null,
  notificationMessage: null,
  apiStatus: 'checking',
  lastHealthCheck: null,
  user: null,
  isAppLoading: false,
  darkMode: false,
  sidebarCollapsed: false,
  isOnline: true,
  hasError: false,
  errorBoundaryMessage: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_VIDEO_ID':
      return { ...state, selectedVideoId: action.payload };

    case 'SHOW_NOTIFICATION':
      return { ...state, notificationMessage: action.payload };

    case 'CLEAR_NOTIFICATION':
      return { ...state, notificationMessage: null };

    case 'SET_API_STATUS':
      return { ...state, apiStatus: action.payload };

    case 'SET_LAST_HEALTH_CHECK':
      return { ...state, lastHealthCheck: action.payload };

    case 'UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };

    case 'SET_APP_LOADING':
      return { ...state, isAppLoading: action.payload };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };

    case 'SET_APP_ERROR':
      return {
        ...state,
        hasError: action.payload.hasError,
        errorBoundaryMessage: action.payload.message,
      };

    case 'CLEAR_APP_ERROR':
      return {
        ...state,
        hasError: false,
        errorBoundaryMessage: null,
      };

    case 'RESET_APP_STATE':
      return initialState;

    default:
      return state;
  }
}

// ===================================
// CONTEXT
// ===================================

const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * App Provider component that wraps the application and provides global state
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Refs for managing timers and cleanup
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Set the selected video ID
   */
  const setSelectedVideoId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_VIDEO_ID', payload: id });
  }, []);

  /**
   * Show a notification message
   */
  const showNotification = useCallback((
    type: 'success' | 'error' | 'info',
    message: string,
    options: Partial<NotificationMessage> = {}
  ) => {
    // Clear any existing notification timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    const notification: NotificationMessage = {
      id: `notification_${Date.now()}_${Math.random()}`,
      type,
      message,
      autoDismiss: options.autoDismiss !== false, // Auto-dismiss by default
      duration: options.duration || (type === 'error' ? 8000 : 4000), // Longer duration for errors
      ...options,
    };

    dispatch({ type: 'SHOW_NOTIFICATION', payload: notification });

    // Auto-dismiss if enabled
    if (notification.autoDismiss) {
      notificationTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'CLEAR_NOTIFICATION' });
      }, notification.duration);
    }
  }, []);

  /**
   * Clear current notification
   */
  const clearNotification = useCallback(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    dispatch({ type: 'CLEAR_NOTIFICATION' });
  }, []);

  /**
   * Check API health status (disabled - no health endpoint)
   */
  const checkApiStatus = useCallback(async () => {
    // Health check disabled - always set status to healthy
    dispatch({ type: 'SET_API_STATUS', payload: 'healthy' });
    dispatch({ type: 'SET_LAST_HEALTH_CHECK', payload: Date.now() });
  }, []);

  /**
   * Set API status manually
   */
  const setApiStatus = useCallback((status: ApiStatus) => {
    dispatch({ type: 'SET_API_STATUS', payload: status });
  }, []);

  /**
   * Update user information
   */
  const updateUser = useCallback((userUpdate: Partial<AppState['user']>) => {
    dispatch({ type: 'UPDATE_USER', payload: userUpdate });
  }, []);

  /**
   * Set app loading state
   */
  const setAppLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_APP_LOADING', payload: loading });
  }, []);

  /**
   * Toggle dark mode
   */
  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  /**
   * Toggle sidebar collapsed state
   */
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  /**
   * Set network status
   */
  const setOnlineStatus = useCallback((online: boolean) => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: online });
  }, []);

  /**
   * Handle app-wide error
   */
  const setAppError = useCallback((error: string, hasError: boolean = true) => {
    dispatch({ type: 'SET_APP_ERROR', payload: { message: error, hasError } });
  }, []);

  /**
   * Clear app error
   */
  const clearAppError = useCallback(() => {
    dispatch({ type: 'CLEAR_APP_ERROR' });
  }, []);

  /**
   * Reset entire app state
   */
  const resetAppState = useCallback(() => {
    dispatch({ type: 'RESET_APP_STATE' });
  }, []);

  /**
   * Monitor network status
   */
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  /**
   * Set initial API status to healthy (health checks disabled)
   */
  useEffect(() => {
    dispatch({ type: 'SET_API_STATUS', payload: 'healthy' });
    dispatch({ type: 'SET_LAST_HEALTH_CHECK', payload: Date.now() });
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Sync dark mode with document
   */
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  /**
   * Store preferences in localStorage
   */
  useEffect(() => {
    try {
      const preferences = {
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        selectedVideoId: state.selectedVideoId,
      };
      localStorage.setItem('appPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }, [state.darkMode, state.sidebarCollapsed, state.selectedVideoId]);

  /**
   * Load preferences from localStorage
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('appPreferences');
      if (stored) {
        const preferences = JSON.parse(stored);

        if (preferences.darkMode !== undefined && preferences.darkMode !== state.darkMode) {
          dispatch({ type: 'TOGGLE_DARK_MODE' });
        }

        if (preferences.sidebarCollapsed !== undefined && preferences.sidebarCollapsed !== state.sidebarCollapsed) {
          dispatch({ type: 'TOGGLE_SIDEBAR' });
        }

        if (preferences.selectedVideoId) {
          dispatch({ type: 'SET_SELECTED_VIDEO_ID', payload: preferences.selectedVideoId });
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    }
  }, []);

  const contextValue: AppContextValue = {
    ...state,
    setSelectedVideoId,
    showNotification,
    clearNotification,
    checkApiStatus,
    setApiStatus,
    updateUser,
    setAppLoading,
    toggleDarkMode,
    toggleSidebar,
    setOnlineStatus,
    setAppError,
    clearAppError,
    resetAppState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use the app context
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
}

/**
 * Hook to get notification state and functions
 */
export function useNotification() {
  const { notificationMessage, showNotification, clearNotification } = useAppContext();

  return {
    notification: notificationMessage,
    showNotification,
    clearNotification,
  };
}

/**
 * Hook to get API status and health checking functions
 */
export function useApiHealth() {
  const { apiStatus, lastHealthCheck, checkApiStatus, setApiStatus } = useAppContext();

  return {
    status: apiStatus,
    lastCheck: lastHealthCheck,
    isHealthy: apiStatus === 'healthy',
    isChecking: apiStatus === 'checking',
    isUnhealthy: apiStatus === 'unhealthy',
    checkApiStatus,
    setApiStatus,
  };
}

export default AppContext;