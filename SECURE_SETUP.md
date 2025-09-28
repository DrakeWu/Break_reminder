# PostureGuard - Secure API Key Setup

## 🔐 Secure API Key Configuration

To protect your Gemini API key from being exposed in your codebase, follow these steps:

### 1. Create Environment File

Create a `.env` file in your project root:

```bash
# .env
VITE_GEMINI_API_KEY=AIzaSyDZUNHi24TAbgqGYZWFXmF_S34_Y62dok4
```

### 2. Verify .gitignore

Ensure your `.gitignore` file includes:
```
.env
.env.*
!.env.example
```

### 3. Create .env.example

Create a `.env.example` file for other developers:
```bash
# .env.example
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. API Key Security

- ✅ **DO**: Store API keys in environment variables
- ✅ **DO**: Use `.env` files for local development
- ✅ **DO**: Add `.env` to `.gitignore`
- ❌ **DON'T**: Hardcode API keys in source code
- ❌ **DON'T**: Commit `.env` files to version control

### 5. Production Deployment

For production deployment, set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add VITE_GEMINI_API_KEY
```

**Netlify:**
- Go to Site Settings > Environment Variables
- Add `VITE_GEMINI_API_KEY` with your key

**Railway:**
```bash
railway variables set VITE_GEMINI_API_KEY=your_key_here
```

## 🛡️ Security Features

### **API Key Validation**
- Validates API key format before use
- Throws descriptive errors for invalid keys
- Prevents runtime errors from bad keys

### **Environment Detection**
- Automatically detects development vs production
- Uses appropriate API endpoints
- Handles missing environment variables gracefully

### **Error Handling**
- Graceful fallbacks when API is unavailable
- User-friendly error messages
- Console logging for debugging

## 🔧 Configuration

### **Current Setup**
The app is configured to use your API key securely:

```typescript
// src/config/apiKeys.ts
export const API_KEYS = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'fallback_key'
} as const;
```

### **Environment Variables**
- `VITE_GEMINI_API_KEY`: Your Gemini API key
- `NODE_ENV`: Automatically set by Vite
- `VITE_*`: Variables prefixed with VITE_ are exposed to the client

## 🚀 Getting Started

### **1. Set Up Environment**
```bash
# Create .env file
echo "VITE_GEMINI_API_KEY=AIzaSyDZUNHi24TAbgqGYZWFXmF_S34_Y62dok4" > .env

# Start development server
npm run dev
```

### **2. Verify Setup**
- Check browser console for any API key errors
- Test AI suggestions functionality
- Verify camera permissions work

### **3. Deploy Securely**
- Set environment variables in your hosting platform
- Never commit `.env` files
- Use different API keys for different environments

## 🔍 Troubleshooting

### **API Key Issues**
```bash
# Check if environment variable is loaded
console.log(import.meta.env.VITE_GEMINI_API_KEY)
```

### **Common Problems**
1. **"Invalid API key"**: Check your `.env` file format
2. **"API key not found"**: Ensure `.env` file exists in project root
3. **"CORS errors"**: Check if API key has proper permissions

### **Debug Steps**
1. Verify `.env` file exists and has correct format
2. Check browser console for errors
3. Test API key directly with curl:
```bash
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY"
```

## 📋 Checklist

- [ ] Created `.env` file with API key
- [ ] Verified `.gitignore` includes `.env`
- [ ] Created `.env.example` for team
- [ ] Tested API key works
- [ ] Set up production environment variables
- [ ] Verified no API keys in source code

## 🎯 Best Practices

### **Development**
- Use `.env` files for local development
- Never commit API keys to version control
- Use different keys for different environments

### **Production**
- Set environment variables in hosting platform
- Use secure key management services
- Monitor API usage and costs

### **Team Collaboration**
- Share `.env.example` with team
- Document required environment variables
- Use secure communication for sharing keys

---

**🔐 Your API key is now secure and protected from version control!**
