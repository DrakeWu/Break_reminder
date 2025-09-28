# PostureGuard - Webcam Integration Setup

## 🎥 Real-Time Posture Detection with Webcam

PostureGuard now uses your computer's webcam and MediaPipe AI to provide real-time posture analysis and personalized stretch suggestions.

## ✨ New Features

### 🔍 **Real-Time Posture Analysis**
- **Webcam Integration**: Uses your computer's camera for live posture monitoring
- **AI Pose Detection**: MediaPipe analyzes 33 body landmarks in real-time
- **Smart Scoring**: Advanced algorithm calculates posture score (0-100)
- **Issue Detection**: Identifies specific posture problems (forward head, slouching, etc.)

### 🧠 **Enhanced AI Integration**
- **Hardcoded API Key**: No need to enter API keys manually
- **Real-Time Data**: Gemini AI receives live posture and timing data
- **Personalized Suggestions**: AI generates stretches based on actual posture issues
- **Trend Analysis**: Tracks posture improvement/decline over time

## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
npm install
# or
bun install
```

### 2. **Start the Application**
```bash
npm run dev
# or
bun run dev
```

### 3. **Allow Camera Access**
- Click "Allow" when prompted for camera access
- Position yourself in front of the camera
- Start monitoring to begin real-time analysis

## 📊 How It Works

### **Pose Detection Process**
1. **Camera Capture**: Webcam captures your image
2. **Landmark Detection**: MediaPipe identifies 33 body points
3. **Analysis**: Algorithm calculates posture metrics
4. **Scoring**: Generates 0-100 posture score
5. **AI Integration**: Sends data to Gemini for personalized suggestions

### **Posture Metrics Analyzed**
- **Neck Angle**: Forward head posture detection
- **Shoulder Alignment**: Uneven shoulder detection
- **Spine Alignment**: Overall body posture
- **Head Position**: Head tilt detection
- **Slouching**: Forward shoulder position
- **Shoulder Height**: Left/right shoulder balance

### **AI-Powered Suggestions**
The system sends real-time data to Gemini AI:
- Current posture score and issues
- Screen time and work session duration
- Detected posture problems
- User-reported issues

Gemini responds with:
- Targeted stretch recommendations
- Specific instructions for each stretch
- Difficulty levels and durations
- Body areas to focus on

## 🎯 Key Components

### **WebcamPoseDetection Component**
- Handles camera permissions and initialization
- Displays live video feed with pose overlay
- Manages MediaPipe pose detection
- Provides real-time posture analysis

### **PoseDetectionService**
- MediaPipe integration and configuration
- Real-time landmark extraction
- Advanced posture analysis algorithms
- Issue detection and scoring

### **Enhanced TrackingService**
- Real-time posture score updates
- Posture history tracking
- Trend analysis (improving/declining/stable)
- Average posture score calculation

## 🔧 Technical Details

### **MediaPipe Configuration**
```typescript
{
  modelComplexity: 1,        // Balanced accuracy/speed
  smoothLandmarks: true,      // Reduces jitter
  enableSegmentation: false,  // Focus on landmarks only
  minDetectionConfidence: 0.5, // 50% confidence threshold
  minTrackingConfidence: 0.5   // 50% tracking threshold
}
```

### **Posture Scoring Algorithm**
- **Neck Angle**: Detects forward head posture (>15° = issue)
- **Shoulder Alignment**: Uneven shoulders (>10° = issue)
- **Spine Alignment**: Body alignment check (>15° = issue)
- **Head Position**: Head tilt detection (>20° = issue)
- **Slouching**: Forward shoulder position detection
- **Shoulder Height**: Left/right balance check

### **AI Integration**
- **API Key**: Hardcoded for seamless experience
- **Real-Time Data**: Live posture and timing data
- **Smart Prompts**: Detailed context for Gemini AI
- **Fallback System**: Works without API access

## 🛠️ Troubleshooting

### **Camera Issues**
1. **"Camera Access Denied"**
   - Check browser permissions
   - Allow camera access in browser settings
   - Refresh the page and try again

2. **"Person not detected"**
   - Ensure good lighting
   - Position yourself in front of camera
   - Check camera is working in other apps

3. **Poor Detection Quality**
   - Improve lighting conditions
   - Sit closer to camera
   - Ensure clear view of upper body

### **Performance Issues**
1. **Slow Detection**
   - Close other camera-using applications
   - Reduce browser tab count
   - Check system resources

2. **High CPU Usage**
   - MediaPipe is optimized but uses CPU
   - Consider closing other intensive apps
   - Use Chrome/Edge for best performance

## 🔒 Privacy & Security

### **Data Handling**
- **Local Processing**: Pose detection runs in browser
- **No Video Storage**: Camera feed is not recorded or stored
- **API Data**: Only posture metrics sent to Gemini
- **Local Storage**: Tracking data stored locally only

### **Camera Permissions**
- **User Control**: You control camera access
- **Browser Security**: Standard web security applies
- **No Recording**: Video is not saved anywhere
- **Real-Time Only**: Processing happens live

## 📱 Browser Compatibility

### **Recommended Browsers**
- **Chrome**: Best performance and compatibility
- **Edge**: Excellent MediaPipe support
- **Firefox**: Good support, may be slower
- **Safari**: Limited MediaPipe support

### **Required Features**
- **WebRTC**: For camera access
- **WebGL**: For MediaPipe processing
- **ES6+**: Modern JavaScript support

## 🎨 UI Features

### **Live Video Feed**
- **Mirrored Display**: Natural self-view
- **Real-Time Overlay**: Pose landmarks visible
- **Responsive Design**: Works on different screen sizes

### **Posture Dashboard**
- **Live Score**: Real-time posture score display
- **Issue Detection**: Specific problems identified
- **Trend Analysis**: Posture improvement tracking
- **AI Suggestions**: Personalized stretch recommendations

### **Error Handling**
- **Camera Errors**: Clear error messages
- **Permission Issues**: Step-by-step guidance
- **Detection Problems**: Troubleshooting tips

## 🚀 Advanced Features

### **Posture History**
- Tracks last 20 posture readings
- Calculates average posture score
- Identifies improvement/decline trends

### **Smart Suggestions**
- AI analyzes real posture data
- Considers detected issues
- Provides targeted recommendations
- Includes difficulty and duration

### **Real-Time Monitoring**
- Continuous posture analysis
- Automatic issue detection
- Live score updates
- Trend tracking

## 📈 Performance Optimization

### **MediaPipe Settings**
- Optimized for real-time performance
- Balanced accuracy and speed
- Smooth landmark tracking
- Reduced jitter and noise

### **Browser Optimization**
- Efficient video processing
- Minimal memory usage
- Optimized rendering
- Fast pose detection

## 🔮 Future Enhancements

### **Planned Features**
- **Posture Alerts**: Notifications for poor posture
- **Exercise Tracking**: Track stretch completion
- **Progress Reports**: Detailed posture analytics
- **Custom Workouts**: Personalized exercise plans

### **Advanced AI**
- **Predictive Analysis**: Forecast posture issues
- **Custom Recommendations**: User-specific suggestions
- **Health Integration**: Connect with fitness apps
- **Social Features**: Share progress with others

## 📞 Support

### **Common Issues**
1. **Camera not working**: Check permissions and browser compatibility
2. **Poor detection**: Improve lighting and positioning
3. **Slow performance**: Close other apps and use Chrome
4. **API errors**: Check internet connection

### **Getting Help**
- Check browser console for error messages
- Verify camera permissions
- Test with different browsers
- Ensure good lighting conditions

---

**🎉 Enjoy your new AI-powered posture monitoring experience!**
