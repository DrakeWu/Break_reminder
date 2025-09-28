# PostureGuard - AI-Powered Posture Monitoring

A comprehensive web application that monitors your posture in real-time using TensorFlow.js and provides personalized stretch suggestions powered by Google's Gemini AI.

## Features

- **Real-time Posture Detection**: Uses TensorFlow.js with MoveNet for accurate pose estimation
- **AI-Powered Stretch Suggestions**: Gemini AI generates personalized exercises based on your posture issues
- **Background Monitoring**: Continues to work even when you switch browser tabs
- **Smart Alerts**: Posture and break reminders with customizable intervals
- **Professional UI**: Modern, clean interface built with React and Tailwind CSS
- **Comprehensive Tracking**: Monitor screen time, posture scores, and break patterns

## Live Demo

🌐 **View the application**: [https://drakewu.github.io/Break_reminder/](https://drakewu.github.io/Break_reminder/)

## Quick Start

### Prerequisites

- Node.js 18+ 
- Modern web browser with camera access
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DrakeWu/Break_reminder.git
cd Break_reminder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env
```

4. Start development server:
```bash
npm run dev
```

## Deployment

### Automatic Deployment (GitHub Pages)

The application is automatically deployed to GitHub Pages when you push to the main branch. The workflow is configured in `.github/workflows/deploy.yml`.

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy using the provided script:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Configuration

### API Keys

1. **Gemini API Key**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

### Camera Permissions

The application requires camera access for posture detection. Make sure to:
- Allow camera permissions when prompted
- Use a well-lit environment
- Position yourself 2-3 feet from the camera

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **AI/ML**: TensorFlow.js, Google Gemini AI
- **Pose Detection**: MoveNet model
- **Deployment**: GitHub Pages, GitHub Actions

## Project Structure

```
src/
├── components/          # React components
│   ├── ModernDashboard.tsx
│   ├── PostureAlert.tsx
│   ├── BreakAlert.tsx
│   └── ...
├── services/           # Core services
│   ├── tensorflowPoseService.ts
│   ├── geminiService.ts
│   └── trackingService.ts
├── config/            # Configuration
│   └── apiKeys.ts
└── App.tsx           # Main application
```

## Features in Detail

### Posture Detection
- Real-time analysis using TensorFlow.js
- Detects forward head posture, shoulder alignment, head tilt
- Smoothing algorithms for stable readings
- Background monitoring support

### AI Stretch Suggestions
- Personalized exercises based on posture issues
- Creative and varied suggestions using Gemini AI
- Unlimited stretch generation
- Deletable exercise history

### Smart Alerts
- Posture alerts for poor posture (score < 3/10)
- Break reminders (configurable intervals)
- Alarm sounds for immediate attention
- Cooldown periods to prevent spam

### Professional UI
- Clean, modern design
- Responsive layout
- Professional icons and styling
- Intuitive user experience

## Troubleshooting

### Camera Issues
- Ensure camera permissions are granted
- Check if another application is using the camera
- Try refreshing the page
- Use a different browser if issues persist

### AI Features Not Working
- Verify your Gemini API key is correct
- Check browser console for error messages
- Ensure you have an active internet connection

### Performance Issues
- Close other applications using the camera
- Ensure good lighting for better pose detection
- Use a modern browser with WebGL support

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Create an issue on GitHub with detailed information

---

**PostureGuard** - Keep your posture healthy with AI-powered monitoring! 🧘‍♀️💻