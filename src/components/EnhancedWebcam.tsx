import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import TensorFlowPoseService, { PostureAnalysis } from '../services/tensorflowPoseService';

interface EnhancedWebcamProps {
  onPostureUpdate: (analysis: PostureAnalysis) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const EnhancedWebcam: React.FC<EnhancedWebcamProps> = ({
  onPostureUpdate,
  onError,
  isActive
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseService, setPoseService] = useState<TensorFlowPoseService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [currentPosture, setCurrentPosture] = useState<PostureAnalysis | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  const initializePoseDetection = useCallback(async () => {
    if (!webcamRef.current?.video) {
      console.log('Webcam video not ready yet');
      return;
    }

    try {
      const video = webcamRef.current.video;
      
      // Wait for video to be ready
      if (video.readyState < 2) {
        video.addEventListener('loadedmetadata', async () => {
          try {
            const service = new TensorFlowPoseService(
              (analysis) => {
                setCurrentPosture(analysis);
                onPostureUpdate(analysis);
              }, 
              onError
            );
            
            await service.initialize(video);
            setPoseService(service);
            setIsInitialized(true);
            setCameraPermission('granted');
          } catch (error) {
            console.error('Error initializing pose detection:', error);
            setCameraPermission('denied');
            onError('Failed to initialize pose detection. Please check camera permissions.');
          }
        });
      } else {
        // Video is already ready
        const service = new TensorFlowPoseService(
          (analysis) => {
            setCurrentPosture(analysis);
            onPostureUpdate(analysis);
          }, 
          onError
        );
        
        await service.initialize(video);
        setPoseService(service);
        setIsInitialized(true);
        setCameraPermission('granted');
      }

    } catch (error) {
      console.error('Error initializing pose detection:', error);
      setCameraPermission('denied');
      onError('Failed to initialize pose detection. Please check camera permissions.');
    }
  }, [onPostureUpdate, onError]);

  useEffect(() => {
    if (isActive && !isInitialized) {
      // Small delay to ensure webcam is ready
      const timer = setTimeout(initializePoseDetection, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isInitialized, initializePoseDetection]);

  useEffect(() => {
    if (poseService && isActive && isInitialized) {
      // Detection starts automatically after initialize() is called
      // No need to call a separate start method
    } else if (poseService && !isActive) {
      poseService.stop();
    }
  }, [poseService, isActive, isInitialized]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      // You can process the captured image here
      console.log('Captured image:', imageSrc);
      setTimeout(() => setIsCapturing(false), 1000);
    }
  }, []);

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

  const getPostureIcon = (score: number) => {
    if (score >= 8) return '😊';
    if (score >= 6) return '😐';
    if (score >= 4) return '😕';
    return '😞';
  };

  if (cameraPermission === 'denied') {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">📷</span>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
          <p className="text-red-600 text-sm mb-4">
            Please allow camera access to enable posture monitoring.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Retry Camera Access
          </button>
        </div>
      </div>
    );
  }

  if (cameraPermission === 'pending') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Initializing Camera</h3>
          <p className="text-blue-600 text-sm">
            Setting up posture detection...
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
          {currentPosture && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${getPostureColor(currentPosture.score)}`}>
                {currentPosture.score}/10
              </div>
              <div className="text-blue-100 text-sm">
                {getPostureStatus(currentPosture.score)}
              </div>
            </div>
          )}
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
        />
        
        {/* Overlay Canvas for pose landmarks */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }} // Mirror the canvas
        />

        {/* Capture Button */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={capture}
            disabled={isCapturing}
            className="bg-white/90 hover:bg-white disabled:bg-gray-300 text-gray-800 font-medium py-2 px-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            {isCapturing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Capturing...
              </>
            ) : (
              <>
                <span>📸</span>
                Capture
              </>
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {isActive ? '● Monitoring' : '○ Paused'}
          </div>
        </div>
      </div>

      {/* Posture Analysis */}
      {currentPosture && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl mb-1">{getPostureIcon(currentPosture.score)}</div>
              <div className="text-sm font-medium text-gray-700">Posture</div>
              <div className={`text-lg font-bold ${getPostureColor(currentPosture.score)}`}>
                {getPostureStatus(currentPosture.score)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm font-medium text-gray-700">Score</div>
              <div className={`text-lg font-bold ${getPostureColor(currentPosture.score)}`}>
                {currentPosture.score}/10
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Posture Quality</span>
              <span>{currentPosture.score}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentPosture.score >= 8 ? 'bg-green-500' : 
                  currentPosture.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(currentPosture.score / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Detected Issues */}
          {currentPosture.issues.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Detected Issues:</div>
              <div className="flex flex-wrap gap-1">
                {currentPosture.issues.map((issue, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentPosture.issues.length === 0 && (
            <div className="text-center py-2">
              <div className="text-green-600 font-medium text-sm">
                🎉 No posture issues detected!
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">💡 Tips for better detection:</div>
          <ul className="text-xs space-y-1">
            <li>• Sit upright with good lighting</li>
            <li>• Keep your upper body visible</li>
            <li>• Maintain a consistent position</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWebcam;
