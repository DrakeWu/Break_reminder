# PostureGuard - Camera Troubleshooting Guide

## 🎥 Common Camera Issues & Solutions

### **Issue 1: Camera Not Loading**

**Symptoms:**
- Black screen where camera should be
- "Camera Access Denied" error
- Loading spinner that never stops

**Solutions:**

#### **1. Browser Permissions**
```bash
# Check browser console for errors
F12 → Console tab → Look for camera errors
```

**Chrome/Edge:**
- Click the camera icon in address bar
- Select "Allow" for camera access
- Refresh the page

**Firefox:**
- Go to Settings → Privacy & Security → Permissions
- Allow camera access for localhost:8081

#### **2. HTTPS Requirement**
Some browsers require HTTPS for camera access:
```bash
# If using localhost, try:
https://localhost:8081
```

#### **3. Camera Already in Use**
```bash
# Check if another app is using camera:
# - Zoom, Teams, Skype
# - Other browser tabs
# - Screen recording software
```

### **Issue 2: Camera Permission Denied**

**Error Message:** "Camera access denied"

**Solutions:**

#### **1. Browser Settings**
**Chrome:**
1. Go to `chrome://settings/content/camera`
2. Add `http://localhost:8081` to allowed sites
3. Refresh the page

**Edge:**
1. Go to `edge://settings/content/camera`
2. Add `http://localhost:8081` to allowed sites
3. Refresh the page

#### **2. System Permissions**
**Windows:**
1. Settings → Privacy → Camera
2. Allow apps to access camera
3. Allow desktop apps to access camera

**Mac:**
1. System Preferences → Security & Privacy → Camera
2. Check the box for your browser

### **Issue 3: Camera Not Detected**

**Error Message:** "No camera found"

**Solutions:**

#### **1. Check Camera Hardware**
```bash
# Test camera in another app:
# - Zoom, Teams, or Skype
# - Camera app (Windows/Mac)
# - Photo Booth (Mac)
```

#### **2. Update Drivers**
**Windows:**
1. Device Manager → Cameras
2. Right-click camera → Update driver
3. Restart browser

**Mac:**
1. System Preferences → Software Update
2. Install any camera-related updates

#### **3. Browser Compatibility**
**Recommended Browsers:**
- ✅ Chrome (best support)
- ✅ Edge (excellent support)
- ⚠️ Firefox (limited MediaPipe support)
- ❌ Safari (no MediaPipe support)

### **Issue 4: Poor Camera Quality**

**Symptoms:**
- Blurry or dark video
- Slow frame rate
- Poor pose detection

**Solutions:**

#### **1. Lighting**
- Ensure good lighting on your face
- Avoid backlighting (window behind you)
- Use a desk lamp if needed

#### **2. Camera Position**
- Position camera at eye level
- Sit 2-3 feet from camera
- Keep upper body visible

#### **3. Browser Performance**
- Close other tabs/apps
- Restart browser
- Check system resources

### **Issue 5: Pose Detection Not Working**

**Symptoms:**
- Camera loads but no pose analysis
- No posture score updates
- AI suggestions not working

**Solutions:**

#### **1. Check Console Errors**
```bash
# Open browser console (F12)
# Look for MediaPipe errors
# Check for API key errors
```

#### **2. Internet Connection**
- MediaPipe requires internet for model loading
- Check if you can access other websites
- Try refreshing the page

#### **3. API Key Issues**
```bash
# Check if .env file exists:
cat .env

# Should contain:
VITE_GEMINI_API_KEY=AIzaSyDZUNHi24TAbgqGYZWFXmF_S34_Y62dok4
```

## 🔧 Debug Steps

### **Step 1: Check Browser Console**
```bash
# Open browser console (F12)
# Look for these errors:
- "Camera access denied"
- "MediaPipe not found"
- "API key invalid"
- "Network error"
```

### **Step 2: Test Camera Access**
```bash
# Test in browser console:
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera works!', stream))
  .catch(err => console.error('Camera error:', err))
```

### **Step 3: Check Environment Variables**
```bash
# In browser console:
console.log('API Key:', import.meta.env.VITE_GEMINI_API_KEY)
```

### **Step 4: Test MediaPipe**
```bash
# Check if MediaPipe loads:
console.log('MediaPipe:', typeof window.Pose)
```

## 🚀 Quick Fixes

### **Fix 1: Restart Everything**
```bash
# Stop development server (Ctrl+C)
# Restart:
npm run dev

# Clear browser cache:
Ctrl+Shift+R (hard refresh)
```

### **Fix 2: Check URL**
```bash
# Make sure you're using the correct URL:
http://localhost:8081/
# NOT: http://localhost:8080/
```

### **Fix 3: Browser Permissions**
```bash
# Reset camera permissions:
# Chrome: chrome://settings/content/camera
# Edge: edge://settings/content/camera
# Remove localhost, then re-add
```

### **Fix 4: System Restart**
```bash
# If nothing else works:
# 1. Close all browser tabs
# 2. Restart browser
# 3. Restart computer
# 4. Try again
```

## 📱 Mobile Issues

### **Mobile Camera Access**
- Mobile browsers have different camera APIs
- Some features may not work on mobile
- Use desktop browser for best experience

### **Mobile Permissions**
- Mobile browsers may require HTTPS
- Try using Chrome on mobile
- Check mobile browser settings

## 🔍 Advanced Debugging

### **Check Network Requests**
```bash
# Open Network tab in browser console
# Look for failed requests to:
# - MediaPipe CDN
# - Gemini API
# - Camera stream
```

### **Check MediaPipe Loading**
```bash
# In browser console:
console.log('MediaPipe loaded:', !!window.Pose)
console.log('Camera stream:', !!document.querySelector('video'))
```

### **Test API Connection**
```bash
# Test Gemini API:
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'test' }] }] })
})
```

## 📞 Still Having Issues?

### **Common Solutions:**
1. **Try different browser** (Chrome recommended)
2. **Check camera in other apps** (Zoom, Teams)
3. **Restart everything** (browser, computer)
4. **Check internet connection**
5. **Verify API key in .env file**

### **System Requirements:**
- Modern browser (Chrome 80+, Edge 80+)
- Working camera
- Internet connection
- JavaScript enabled

### **Browser Compatibility:**
- ✅ Chrome: Full support
- ✅ Edge: Full support  
- ⚠️ Firefox: Limited MediaPipe
- ❌ Safari: No MediaPipe support

---

**🎥 If camera still doesn't work, try the SimpleWebcam component which has better error handling and debugging!**
