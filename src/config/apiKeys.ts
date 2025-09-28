// API Keys Configuration
// This file should be kept secure and not committed to version control

export const API_KEYS = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDZUNHi24TAbgqGYZWFXmF_S34_Y62dok4'
} as const;

// Validate API key
export const validateApiKey = (key: string): boolean => {
  return key && key.length > 10 && key.startsWith('AIza');
};

// Get Gemini API key with validation
export const getGeminiApiKey = (): string => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const fallbackKey = 'AIzaSyDZUNHi24TAbgqGYZWFXmF_S34_Y62dok4';
  const key = envKey || fallbackKey;
  
  console.log('API Key Debug:', {
    envKey: envKey ? `${envKey.substring(0, 10)}...` : 'undefined',
    fallbackKey: `${fallbackKey.substring(0, 10)}...`,
    usingKey: key === envKey ? 'environment' : 'fallback'
  });
  
  if (!validateApiKey(key)) {
    throw new Error('Invalid Gemini API key. Please check your environment configuration.');
  }
  return key;
};
