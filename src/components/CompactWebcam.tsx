import React, { useRef, useEffect, useState } from 'react';
import TensorFlowPoseService, { PostureAnalysis } from '../services/tensorflowPoseService';

interface CompactWebcamProps {
  onPostureUpdate: (analysis: PostureAnalysis) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const CompactWebcam: React.FC<CompactWebcamProps> = ({
  onPostureUpdate,
  onError,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseService, setPoseService] = useState<TensorFlowPoseService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [currentPosture, setCurrentPosture] = useState<PostureAnalysis | null>(null);

  useEffect(() => {
    const initializePoseDetection = async () => {
      if (!videoRef.current) return;

      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, 
            height: 240,
            facingMode: 'user' // Front camera
          } 
        });
        
        setCameraPermission('granted');
        
        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize pose detection service
        const service = new TensorFlowPoseService(
          (analysis) => {
            setCurrentPosture(analysis);
            onPostureUpdate(analysis);
          }, 
          onError
        );
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
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPostureStatus = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  if (cameraPermission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-sm">📷</span>
          </div>
          <p className="text-xs text-red-600 font-medium">Camera Access Denied</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (cameraPermission === 'pending') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-xs text-blue-600">Requesting Camera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Live Posture</h3>
        {currentPosture && (
          <span className={`text-xs font-medium ${getPostureColor(currentPosture.score)}`}>
            {currentPosture.score}/10
          </span>
        )}
      </div>
      
      <div className="relative mb-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-32 object-cover rounded border border-gray-200"
          style={{ transform: 'scaleX(-1)' }} // Mirror the video
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none rounded"
          style={{ transform: 'scaleX(-1)' }} // Mirror the canvas
        />
      </div>

      {currentPosture && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${getPostureColor(currentPosture.score)}`}>
              {getPostureStatus(currentPosture.score)}
            </span>
          </div>
          
          {currentPosture.issues.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-600">Issues:</span>
              <div className="mt-1 space-y-0.5">
                {currentPosture.issues.slice(0, 2).map((issue, index) => (
                  <div key={index} className="text-red-600 truncate">
                    • {issue}
                  </div>
                ))}
                {currentPosture.issues.length > 2 && (
                  <div className="text-gray-500">
                    +{currentPosture.issues.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isActive && (
        <div className="mt-2 text-center">
          <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            ⚠️ Monitoring paused
          </p>
        </div>
      )}
    </div>
  );
};

export default CompactWebcam;
