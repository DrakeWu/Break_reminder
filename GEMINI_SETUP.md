# PostureGuard - Gemini AI Integration Setup

## Overview
PostureGuard now integrates with Google's Gemini AI to generate personalized stretch suggestions based on your screen time and posture data.

## Features
- **AI-Powered Stretch Suggestions**: Get personalized stretch recommendations based on your posture score and screen time
- **Real-time Tracking**: Monitor screen time, posture score, and work session duration
- **Interactive Timer**: Built-in timer for guided stretch sessions
- **Fallback System**: Works even without API access using pre-defined stretches

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the API key (you'll need this for the app)

### 2. Install Dependencies

The app uses the following key dependencies:
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for development and building

### 3. Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

2. **Open your browser** and navigate to `http://localhost:8080`

3. **Enter your Gemini API key** when prompted

### 4. Using the Application

1. **Enter API Key**: On first launch, enter your Gemini API key
2. **Start Monitoring**: Click "Start Monitoring" to begin tracking
3. **Get AI Suggestions**: Click "Get AI Stretch Suggestions" to receive personalized recommendations
4. **Follow Stretches**: Use the built-in timer to guide your stretch sessions

## How It Works

### Data Collection
The app tracks:
- **Screen Time**: Minutes spent at the computer
- **Posture Score**: Simulated posture quality (0-100)
- **Work Session**: Total time since starting
- **Common Issues**: User-reported problems (neck pain, back stiffness)

### AI Integration
- Sends user data to Gemini API with a detailed prompt
- Receives structured JSON response with stretch suggestions
- Falls back to pre-defined stretches if API fails

### Stretch Suggestions Include:
- **Name & Description**: Clear identification
- **Duration**: How long to hold each stretch
- **Difficulty**: Easy, medium, or hard
- **Target Areas**: Which body parts are affected
- **Step-by-step Instructions**: Detailed guidance

## API Configuration

The Gemini service is configured with:
- **Model**: `gemini-1.5-flash` (fast and cost-effective)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 2048 (sufficient for detailed responses)

## Fallback System

If the Gemini API is unavailable, the app provides:
- Basic neck and shoulder stretches
- Back and spine stretches
- Wrist and forearm stretches
- All with detailed instructions

## Testing Features

The app includes testing controls to simulate different scenarios:
- **Simulate Poor Posture**: Test AI suggestions with low posture scores
- **Simulate Good Posture**: Test with high posture scores
- **Report Issues**: Add common problems to influence suggestions

## Security Notes

- API keys are stored locally in the browser
- No data is sent to external servers except Google's Gemini API
- All tracking data is stored locally using localStorage

## Troubleshooting

### Common Issues:

1. **"Please enter your Gemini API key first!"**
   - Make sure you've entered a valid API key
   - Check that the key is active in Google AI Studio

2. **"Failed to generate stretch suggestions"**
   - Check your internet connection
   - Verify your API key is correct
   - The app will show fallback suggestions if the API fails

3. **API Key Not Working**
   - Ensure you have enabled the Gemini API in Google Cloud Console
   - Check that your API key has the correct permissions
   - Try generating a new API key

### Development Issues:

1. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that you're using Node.js 16+ or Bun

2. **TypeScript Errors**
   - The app uses strict TypeScript configuration
   - All types are properly defined in the service files

## Customization

You can customize the AI prompts by modifying `src/services/geminiService.ts`:
- Change the prompt template in `createPrompt()`
- Adjust the fallback suggestions in `getFallbackSuggestions()`
- Modify the API parameters in the `generateStretchSuggestions()` method

## Production Deployment

For production deployment:
1. Set up environment variables for API keys
2. Implement proper error handling and logging
3. Add user authentication if needed
4. Consider rate limiting for API calls
5. Add analytics to track usage patterns

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is working with a simple test
3. Ensure all dependencies are properly installed
4. Check the network tab for failed API requests
