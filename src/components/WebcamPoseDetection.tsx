import React, { useRef, useEffect, useState } from 'react';
import TensorFlowPoseService, { PostureAnalysis } from '../services/tensorflowPoseService';

interface WebcamPoseDetectionProps {
  onPostureUpdate: (analysis: PostureAnalysis) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const WebcamPoseDetection: React.FC<WebcamPoseDetectionProps> = ({
  onPostureUpdate,
  onError,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseService, setPoseService] = useState<TensorFlowPoseService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    const initializePoseDetection = async () => {
      if (!videoRef.current) return;

      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' // Front camera
          } 
        });
        
        setCameraPermission('granted');
        
        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize pose detection service
        const service = new TensorFlowPoseService(onPostureUpdate, onError);
        await service.initialize(videoRef.current);
        setPoseService(service);
        setIsInitialized(true);

      } catch (error) {
        console.error('Error initializing camera:', error);
        setCameraPermission('denied');
        onError('Failed to access camera. Please check permissions.');
      }
    };

    if (isActive && !isInitialized) {
      initializePoseDetection();
    }
  }, [isActive, isInitialized, onPostureUpdate, onError]);

  useEffect(() => {
    if (poseService && isActive && isInitialized) {
      // Detection starts automatically after initialize() is called
      // No need to call a separate start method
    } else if (poseService && !isActive) {
      poseService.stop();
    }
  }, [poseService, isActive, isInitialized]);

  const getPostureColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPostureStatus = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  if (cameraPermission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Denied</h3>
        <p className="text-red-600 mb-4">
          Please allow camera access to enable posture detection. You can:
        </p>
        <ul className="text-red-600 text-sm space-y-1 mb-4">
          <li>• Click the camera icon in your browser's address bar</li>
          <li>• Go to browser settings and allow camera access</li>
          <li>• Refresh the page and try again</li>
        </ul>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (cameraPermission === 'pending') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Requesting Camera Access</h3>
        <p className="text-blue-600">
          Please allow camera access to enable real-time posture monitoring.
        </p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Real-time Posture Detection</h3>
      
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
          style={{ transform: 'scaleX(-1)' }} // Mirror the video
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }} // Mirror the canvas
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Your posture is being analyzed in real-time using AI pose detection.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Make sure you're sitting upright and facing the camera for best results.
        </p>
      </div>

      {!isActive && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            ⚠️ Posture detection is paused. Start monitoring to begin analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebcamPoseDetection;
