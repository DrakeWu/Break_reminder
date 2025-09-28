import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import TensorFlowPoseService, { PostureAnalysis } from '../services/tensorflowPoseService';
import TensorFlowDiagnostics from './TensorFlowDiagnostics';

interface SimpleWebcamProps {
  onPostureUpdate: (analysis: PostureAnalysis) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const SimpleWebcam: React.FC<SimpleWebcamProps> = ({
  onPostureUpdate,
  onError,
  isActive
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseService, setPoseService] = useState<TensorFlowPoseService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPosture, setCurrentPosture] = useState<PostureAnalysis | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  // Test camera access
  const testCameraAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Test if we can get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      // If we get here, camera access is working
      setCameraPermission('granted');
      setIsLoading(false);
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      setError(`Camera access denied: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      testCameraAccess();
    }
  }, [isActive, testCameraAccess]);

  // Cleanup pose service when component unmounts or becomes inactive
  useEffect(() => {
    return () => {
      if (poseService && typeof poseService.stop === 'function') {
        try {
          poseService.stop();
        } catch (error) {
          console.error('Error stopping pose service on unmount:', error);
        }
      }
    };
  }, [poseService]);

  useEffect(() => {
    if (!isActive && poseService && typeof poseService.stop === 'function') {
      try {
        poseService.stop();
      } catch (error) {
        console.error('Error stopping pose service:', error);
      } finally {
        setPoseService(null);
        setIsInitialized(false);
        setCurrentPosture(null);
      }
    }
  }, [isActive, poseService]);

  const handleUserMedia = useCallback(async (stream: MediaStream) => {
    console.log('Camera stream received:', stream);
    setCameraPermission('granted');
    setError(null);
    
    // Initialize pose detection after camera is ready
    if (webcamRef.current?.video && isActive) {
      try {
        const video = webcamRef.current.video;
        
        // Wait for video to be ready
        if (video.readyState < 2) {
          console.log('Waiting for video to be ready...');
          await new Promise((resolve) => {
            video.addEventListener('loadeddata', resolve, { once: true });
          });
        }
        
            console.log('Video ready, initializing TensorFlow pose detection...');
            const service = new TensorFlowPoseService(
              (analysis) => {
                setCurrentPosture(analysis);
                onPostureUpdate(analysis);
              }, 
              (error) => {
                console.error('TensorFlow pose detection error:', error);
                onError(error);
              }
            );
            
            await service.initialize(video);
            setPoseService(service);
            setIsInitialized(true);
            console.log('TensorFlow pose detection service initialized successfully');
      } catch (error) {
        console.error('Error initializing TensorFlow pose detection:', error);
        onError(`TensorFlow.js is required for this app to function. Failed to initialize: ${error}`);
        setPoseService(null);
        setIsInitialized(false);
      }
    }
  }, [isActive, onPostureUpdate, onError]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera error:', error);
    setCameraPermission('denied');
    setError(`Camera error: ${error}`);
  }, []);

  if (cameraPermission === 'denied' || error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">📷</span>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
          <p className="text-red-600 text-sm mb-4">
            {error || 'Please allow camera access to enable posture monitoring.'}
          </p>
          <div className="space-y-2 text-sm text-red-600">
            <p>• Click the camera icon in your browser's address bar</p>
            <p>• Go to browser settings and allow camera access</p>
            <p>• Make sure no other app is using the camera</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setCameraPermission('pending');
              testCameraAccess();
            }}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Retry Camera Access
          </button>
        </div>
      </div>
    );
  }

  if (cameraPermission === 'pending' || isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Initializing Camera</h3>
          <p className="text-blue-600 text-sm">
            Requesting camera access and setting up posture detection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Live Posture Monitor</h3>
            <p className="text-blue-100 text-sm">AI-Powered Analysis</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-300">
              {isActive ? '🟢' : '⚪'}
            </div>
            <div className="text-blue-100 text-sm">
              {isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Webcam Feed */}
      <div className="relative bg-gray-900">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-auto"
          style={{ transform: 'scaleX(-1)' }} // Mirror the video
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />

        {/* Status Overlay */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive && isInitialized ? 'bg-green-500 text-white' : 
            isActive ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {isActive && isInitialized ? '● AI Active' : 
             isActive ? '● Initializing' : '○ Paused'}
          </div>
        </div>

        {/* Posture Score Overlay */}
        {currentPosture && (
          <div className="absolute top-4 right-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentPosture.score >= 8 ? 'bg-green-500 text-white' :
              currentPosture.score >= 6 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {currentPosture.score}/10
            </div>
          </div>
        )}

      </div>

          
          {/* Diagnostics Modal */}
          {showDiagnostics && (
            <TensorFlowDiagnostics onClose={() => setShowDiagnostics(false)} />
          )}
        </div>
      );
    };

export default SimpleWebcam;
