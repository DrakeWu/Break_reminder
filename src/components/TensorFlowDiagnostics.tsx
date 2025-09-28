import React, { useState, useEffect } from 'react';

interface TensorFlowDiagnosticsProps {
  onClose: () => void;
}

const TensorFlowDiagnostics: React.FC<TensorFlowDiagnosticsProps> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: string[] = [];

      // 1. Check HTTPS
      if (location.protocol === 'https:' || location.hostname === 'localhost') {
        results.push('✅ HTTPS/Localhost: OK');
      } else {
        results.push('❌ HTTPS/Localhost: Not secure (TensorFlow.js works best on HTTPS in production)');
      }

      // 2. Check Camera Permission
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        if (permissionStatus.state === 'granted') {
          results.push('✅ Camera Permission: Granted');
        } else if (permissionStatus.state === 'prompt') {
          results.push('⚠️ Camera Permission: Prompting (please allow access)');
        } else {
          results.push('❌ Camera Permission: Denied');
        }
      } catch (error) {
        results.push(`❌ Camera Permission: Error (${error})`);
      }

      // 3. Check WebGL Support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        results.push('✅ WebGL: Supported');
      } else {
        results.push('❌ WebGL: Not supported (required for TensorFlow.js)');
      }

      // 4. Check TensorFlow.js availability
      try {
        // Try to import TensorFlow.js
        const tf = await import('@tensorflow/tfjs');
        results.push('✅ TensorFlow.js: Available');
        
        // Check backend
        await tf.ready();
        results.push('✅ TensorFlow.js Backend: Ready');
      } catch (error) {
        results.push(`❌ TensorFlow.js: Not available (${error})`);
      }

      // 5. Check MoveNet model availability
      try {
        const poseDetection = await import('@tensorflow-models/pose-detection');
        results.push('✅ MoveNet Model: Available');
      } catch (error) {
        results.push(`❌ MoveNet Model: Not available (${error})`);
      }

      // 6. Check memory and performance
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        results.push(`📊 Memory Usage: ${usedMB}MB / ${totalMB}MB`);
        
        if (usedMB > 100) {
          results.push('⚠️ High memory usage detected');
        }
      }

      setDiagnostics(results);
      setIsLoading(false);
    };
    
    runDiagnostics();
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">TensorFlow.js Diagnostics</h2>
        
        {isLoading ? (
          <p className="text-gray-600">Running diagnostics...</p>
        ) : (
          <div className="space-y-2">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className={`p-2 rounded-md ${
                diagnostic.startsWith('✅') ? 'bg-green-50 text-green-800' :
                diagnostic.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                diagnostic.startsWith('📊') ? 'bg-blue-50 text-blue-800' :
                'bg-red-50 text-red-800'
              }`}>
                {diagnostic}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">TensorFlow.js Benefits:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• More reliable than MediaPipe CDN</li>
            <li>• Better browser compatibility</li>
            <li>• Faster initialization</li>
            <li>• More accurate pose detection</li>
            <li>• Better performance on modern browsers</li>
            <li>• No external CDN dependencies</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Common Solutions:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Use HTTPS or localhost for best performance</li>
            <li>• Grant camera permissions when prompted</li>
            <li>• Ensure WebGL is enabled in your browser</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• Try refreshing the page if TensorFlow fails to load</li>
            <li>• Clear browser cache and cookies</li>
            <li>• Try a different browser (Chrome recommended)</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Performance Tips:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Close other tabs to free up memory</li>
            <li>• Use a modern browser with hardware acceleration</li>
            <li>• Ensure stable internet connection for model loading</li>
            <li>• Restart browser if memory usage is high</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TensorFlowDiagnostics;
