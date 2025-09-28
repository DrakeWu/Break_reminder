import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Define a more detailed PostureAnalysis interface
export interface PostureAnalysis {
  score: number; // Overall posture score (0-10)
  issues: string[]; // List of detected posture issues
  neckAngle: number; // Angle indicating forward head posture
  shoulderAlignment: number; // Difference in shoulder height/alignment
  spineAlignment: number; // Deviation from ideal spine alignment
  headPosition: number; // Head tilt or rotation
  shoulderHeight: number; // Difference in shoulder height
}

interface PoseLandmarks {
  nose: { x: number; y: number; z: number; visibility: number };
  leftEye: { x: number; y: number; z: number; visibility: number };
  rightEye: { x: number; y: number; z: number; visibility: number };
  leftEar: { x: number; y: number; z: number; visibility: number };
  rightEar: { x: number; y: number; z: number; visibility: number };
  leftShoulder: { x: number; y: number; z: number; visibility: number };
  rightShoulder: { x: number; y: number; z: number; visibility: number };
  leftElbow: { x: number; y: number; z: number; visibility: number };
  rightElbow: { x: number; y: number; z: number; visibility: number };
  leftWrist: { x: number; y: number; z: number; visibility: number };
  rightWrist: { x: number; y: number; z: number; visibility: number };
  leftHip: { x: number; y: number; z: number; visibility: number };
  rightHip: { x: number; y: number; z: number; visibility: number };
  leftKnee: { x: number; y: number; z: number; visibility: number };
  rightKnee: { x: number; y: number; z: number; visibility: number };
  leftAnkle: { x: number; y: number; z: number; visibility: number };
  rightAnkle: { x: number; y: number; z: number; visibility: number };
}

class TensorFlowPoseService {
  private detector: poseDetection.PoseDetector | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized = false;
  private onPostureUpdate: (analysis: PostureAnalysis) => void;
  private onError: (error: string) => void;
  private currentAnalysis: PostureAnalysis | null = null;
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;
  private isPageVisible: boolean = true;
  private postureHistory: PostureAnalysis[] = [];
  private landmarkHistory: PoseLandmarks[] = []; // Store raw landmark data for smoothing
  private readonly UPDATE_INTERVAL = 2000; // Update every 2 seconds for better responsiveness
  private readonly SMOOTHING_WINDOW = 12; // Use last 12 readings for balanced smoothing
  private readonly LANDMARK_SMOOTHING_WINDOW = 6; // Smooth landmarks over 6 readings
  private readonly CONSISTENCY_THRESHOLD = 3; // Need 3 out of 12 readings to show an issue (more responsive)
  private issueConsistency: { [key: string]: number } = {}; // Track how often each issue appears

  constructor(
    onPostureUpdate: (analysis: PostureAnalysis) => void,
    onError: (error: string) => void
  ) {
    this.onPostureUpdate = onPostureUpdate;
    this.onError = onError;
    this.setupVisibilityListener();
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      
      console.log('Initializing TensorFlow.js with MoveNet...');
      
      // Check if we're on HTTPS or localhost
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      if (!isSecure) {
        console.warn('TensorFlow.js works best on HTTPS. Current protocol:', location.protocol);
      }
      
      // Initialize TensorFlow.js backend
      await tf.ready();
      console.log('TensorFlow.js backend ready');
      
      // Create MoveNet detector with more lenient settings
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.1, // Much lower confidence threshold
      };
      
      this.detector = await poseDetection.createDetector(model, detectorConfig);
      console.log('MoveNet detector created successfully');
      
      this.isInitialized = true;
      console.log('TensorFlow.js MoveNet initialized successfully');
      
      // Start pose detection loop
      this.startDetectionLoop();
      
    } catch (error) {
      console.error('TensorFlow.js initialization error:', error);
      this.onError(`TensorFlow.js initialization failed: ${error}. This app requires TensorFlow.js to function. Please check your network connection and try again.`);
      this.isInitialized = false;
      throw error;
    }
  }

  private async startDetectionLoop(): Promise<void> {
    if (!this.detector || !this.videoElement || !this.isInitialized) {
      return;
    }

    const detectPose = async () => {
      try {
        if (!this.detector || !this.videoElement) return;

        const poses = await this.detector.estimatePoses(this.videoElement);
        
        if (poses && poses.length > 0) {
          const pose = poses[0];
          const rawLandmarks = this.extractLandmarks(pose.keypoints);
          
          // Add to landmark history for smoothing
          this.landmarkHistory.push(rawLandmarks);
          if (this.landmarkHistory.length > this.LANDMARK_SMOOTHING_WINDOW) {
            this.landmarkHistory.shift();
          }
          
          // Get smoothed landmarks
          const landmarks = this.smoothLandmarks();
          
          // Debug: Log key landmark visibility
          console.log('Pose detection debug:', {
            nose: landmarks.nose.visibility,
            leftShoulder: landmarks.leftShoulder.visibility,
            rightShoulder: landmarks.rightShoulder.visibility,
            leftEar: landmarks.leftEar.visibility,
            rightEar: landmarks.rightEar.visibility
          });
          
          const analysis = this.analyzePosture(landmarks);
          
          // Add to history for smoothing
          this.postureHistory.push(analysis);
          if (this.postureHistory.length > this.SMOOTHING_WINDOW) {
            this.postureHistory.shift();
          }
          
          // Only update if enough time has passed
          const now = Date.now();
          if (now - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
            const smoothedAnalysis = this.smoothPostureAnalysis();
            this.currentAnalysis = smoothedAnalysis;
            this.onPostureUpdate(smoothedAnalysis);
            this.lastUpdateTime = now;
          }
        } else {
          console.log('No poses detected');
        }
      } catch (error) {
        console.error('Error during pose detection:', error);
      }
      
      // Continue the detection loop - use setTimeout for background monitoring
      if (!this.isPageVisible) {
        // Use setTimeout when tab is hidden to continue monitoring
        this.animationFrame = setTimeout(detectPose, 100) as any;
      } else {
        // Use requestAnimationFrame when tab is visible for better performance
        this.animationFrame = requestAnimationFrame(detectPose);
      }
    };

    // Start the detection loop
    detectPose();
  }

  // Method to get current posture analysis
  getCurrentPostureAnalysis(): PostureAnalysis | null {
    return this.currentAnalysis;
  }

  private smoothLandmarks(): PoseLandmarks {
    if (this.landmarkHistory.length === 0) {
      return this.landmarkHistory[0] || this.extractLandmarks([]);
    }

    // If we don't have enough history, return the most recent
    if (this.landmarkHistory.length < 2) {
      return this.landmarkHistory[this.landmarkHistory.length - 1];
    }

    // Calculate average positions for each landmark
    const avgLandmarks: PoseLandmarks = {
      nose: this.averageLandmark(this.landmarkHistory.map(l => l.nose)),
      leftEye: this.averageLandmark(this.landmarkHistory.map(l => l.leftEye)),
      rightEye: this.averageLandmark(this.landmarkHistory.map(l => l.rightEye)),
      leftEar: this.averageLandmark(this.landmarkHistory.map(l => l.leftEar)),
      rightEar: this.averageLandmark(this.landmarkHistory.map(l => l.rightEar)),
      leftShoulder: this.averageLandmark(this.landmarkHistory.map(l => l.leftShoulder)),
      rightShoulder: this.averageLandmark(this.landmarkHistory.map(l => l.rightShoulder)),
      leftElbow: this.averageLandmark(this.landmarkHistory.map(l => l.leftElbow)),
      rightElbow: this.averageLandmark(this.landmarkHistory.map(l => l.rightElbow)),
      leftWrist: this.averageLandmark(this.landmarkHistory.map(l => l.leftWrist)),
      rightWrist: this.averageLandmark(this.landmarkHistory.map(l => l.rightWrist)),
      leftHip: this.averageLandmark(this.landmarkHistory.map(l => l.leftHip)),
      rightHip: this.averageLandmark(this.landmarkHistory.map(l => l.rightHip)),
      leftKnee: this.averageLandmark(this.landmarkHistory.map(l => l.leftKnee)),
      rightKnee: this.averageLandmark(this.landmarkHistory.map(l => l.rightKnee)),
      leftAnkle: this.averageLandmark(this.landmarkHistory.map(l => l.leftAnkle)),
      rightAnkle: this.averageLandmark(this.landmarkHistory.map(l => l.rightAnkle))
    };

    return avgLandmarks;
  }

  private averageLandmark(landmarks: Array<{ x: number; y: number; z: number; visibility: number }>): { x: number; y: number; z: number; visibility: number } {
    const validLandmarks = landmarks.filter(l => l.visibility > 0.1);
    
    if (validLandmarks.length === 0) {
      return landmarks[0] || { x: 0, y: 0, z: 0, visibility: 0 };
    }

    const avgX = validLandmarks.reduce((sum, l) => sum + l.x, 0) / validLandmarks.length;
    const avgY = validLandmarks.reduce((sum, l) => sum + l.y, 0) / validLandmarks.length;
    const avgZ = validLandmarks.reduce((sum, l) => sum + l.z, 0) / validLandmarks.length;
    const avgVisibility = validLandmarks.reduce((sum, l) => sum + l.visibility, 0) / validLandmarks.length;

    return {
      x: avgX,
      y: avgY,
      z: avgZ,
      visibility: avgVisibility
    };
  }

  private smoothPostureAnalysis(): PostureAnalysis {
    if (this.postureHistory.length === 0) {
      return this.currentAnalysis || {
        score: 85,
        issues: ['Initializing posture analysis...'],
        neckAngle: 0,
        shoulderAlignment: 0,
        spineAlignment: 0,
        headPosition: 0,
        shoulderHeight: 0
      };
    }

    // Calculate average values
    const avgScore = this.postureHistory.reduce((sum, analysis) => sum + analysis.score, 0) / this.postureHistory.length;
    const avgNeckAngle = this.postureHistory.reduce((sum, analysis) => sum + analysis.neckAngle, 0) / this.postureHistory.length;
    const avgShoulderAlignment = this.postureHistory.reduce((sum, analysis) => sum + analysis.shoulderAlignment, 0) / this.postureHistory.length;
    const avgSpineAlignment = this.postureHistory.reduce((sum, analysis) => sum + analysis.spineAlignment, 0) / this.postureHistory.length;
    const avgHeadPosition = this.postureHistory.reduce((sum, analysis) => sum + analysis.headPosition, 0) / this.postureHistory.length;
    const avgShoulderHeight = this.postureHistory.reduce((sum, analysis) => sum + analysis.shoulderHeight, 0) / this.postureHistory.length;

    // Get the most recent issues (don't average these)
    const latestAnalysis = this.postureHistory[this.postureHistory.length - 1];
    const issues = latestAnalysis.issues;

    // Reset consistency tracking if posture has improved significantly
    if (avgScore > 8.0) {
      this.issueConsistency = {};
    }
    
    // Also reset individual issue counters if they haven't been detected recently
    for (const [issue, count] of Object.entries(this.issueConsistency)) {
      if (count === 0) {
        delete this.issueConsistency[issue];
      }
    }

    return {
      score: Math.round(avgScore),
      issues,
      neckAngle: Math.round(avgNeckAngle * 10) / 10,
      shoulderAlignment: Math.round(avgShoulderAlignment * 10) / 10,
      spineAlignment: Math.round(avgSpineAlignment * 10) / 10,
      headPosition: Math.round(avgHeadPosition * 10) / 10,
      shoulderHeight: Math.round(avgShoulderHeight * 10) / 10
    };
  }

  stop(): void {
    try {
      if (this.animationFrame) {
        // Handle both requestAnimationFrame and setTimeout
        if (!this.isPageVisible) {
          clearTimeout(this.animationFrame as any);
        } else {
          cancelAnimationFrame(this.animationFrame);
        }
        this.animationFrame = null;
      }
      this.currentAnalysis = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error stopping TensorFlow pose detection:', error);
    }
  }

  private setupVisibilityListener(): void {
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      console.log('TensorFlow: Page visibility changed:', this.isPageVisible ? 'visible' : 'hidden');
      
      if (!this.isPageVisible) {
        console.log('TensorFlow: Continuing pose detection in background');
      }
    });
  }

  private extractLandmarks(keypoints: poseDetection.Keypoint[]): PoseLandmarks {
    // MoveNet keypoint indices
    const keypointMap = {
      nose: 0,
      leftEye: 1,
      rightEye: 2,
      leftEar: 3,
      rightEar: 4,
      leftShoulder: 5,
      rightShoulder: 6,
      leftElbow: 7,
      rightElbow: 8,
      leftWrist: 9,
      rightWrist: 10,
      leftHip: 11,
      rightHip: 12,
      leftKnee: 13,
      rightKnee: 14,
      leftAnkle: 15,
      rightAnkle: 16,
    };

    const getKeypoint = (index: number) => {
      const kp = keypoints[index];
      return {
        x: kp.x,
        y: kp.y,
        z: 0, // MoveNet doesn't provide z coordinates
        visibility: kp.score
      };
    };

    return {
      nose: getKeypoint(keypointMap.nose),
      leftEye: getKeypoint(keypointMap.leftEye),
      rightEye: getKeypoint(keypointMap.rightEye),
      leftEar: getKeypoint(keypointMap.leftEar),
      rightEar: getKeypoint(keypointMap.rightEar),
      leftShoulder: getKeypoint(keypointMap.leftShoulder),
      rightShoulder: getKeypoint(keypointMap.rightShoulder),
      leftElbow: getKeypoint(keypointMap.leftElbow),
      rightElbow: getKeypoint(keypointMap.rightElbow),
      leftWrist: getKeypoint(keypointMap.leftWrist),
      rightWrist: getKeypoint(keypointMap.rightWrist),
      leftHip: getKeypoint(keypointMap.leftHip),
      rightHip: getKeypoint(keypointMap.rightHip),
      leftKnee: getKeypoint(keypointMap.leftKnee),
      rightKnee: getKeypoint(keypointMap.rightKnee),
      leftAnkle: getKeypoint(keypointMap.leftAnkle),
      rightAnkle: getKeypoint(keypointMap.rightAnkle),
    };
  }

  private analyzePosture(landmarks: PoseLandmarks): PostureAnalysis {
    const issues: string[] = [];
    let totalScore = 10;

    // Check if landmarks are visible - MUCH MORE LENIENT
    const noseVisible = landmarks.nose.visibility > 0.2; // Reduced from 0.5 to 0.2
    const leftShoulderVisible = landmarks.leftShoulder.visibility > 0.2; // Reduced from 0.5 to 0.2
    const rightShoulderVisible = landmarks.rightShoulder.visibility > 0.2; // Reduced from 0.5 to 0.2
    
    // Only require 2 out of 3 key landmarks to be visible
    const visibleLandmarks = [noseVisible, leftShoulderVisible, rightShoulderVisible].filter(Boolean).length;
    
    if (visibleLandmarks < 2) {
      console.log('Person detection debug:', {
        nose: landmarks.nose.visibility,
        leftShoulder: landmarks.leftShoulder.visibility,
        rightShoulder: landmarks.rightShoulder.visibility,
        visibleCount: visibleLandmarks
      });
      
      // Check if user is too far away by looking at shoulder distance
      const leftShoulder = landmarks.leftShoulder;
      const rightShoulder = landmarks.rightShoulder;
      
      if (leftShoulder.visibility > 0.1 && rightShoulder.visibility > 0.1) {
        const shoulderDistance = Math.sqrt(
          Math.pow(leftShoulder.x - rightShoulder.x, 2) + 
          Math.pow(leftShoulder.y - rightShoulder.y, 2)
        );
        
        // If shoulders are very small, user is too far away
        if (shoulderDistance < 0.1) {
          return {
            score: 5, // Lower score for being too far
            issues: ['Too far from camera - Move closer for better posture detection'],
            neckAngle: 0,
            shoulderAlignment: 0,
            spineAlignment: 0,
            headPosition: 0,
            shoulderHeight: 0
          };
        }
      }
      
      // Provide a neutral posture score for other detection issues
      return {
        score: 7.5, // Neutral score instead of 0 (7.5/10)
        issues: ['Position yourself more clearly in front of the camera for better detection'],
        neckAngle: 0,
        shoulderAlignment: 0,
        spineAlignment: 0,
        headPosition: 0,
        shoulderHeight: 0
      };
    }

    // Calculate all posture metrics
    const neckAngle = this.calculateNeckAngle(landmarks);
    const shoulderAlignment = this.calculateShoulderAlignment(landmarks);
    const headPosition = this.calculateHeadPosition(landmarks);
    const shoulderHeight = this.calculateShoulderHeight(landmarks);
    const spineAlignment = this.calculateSpineAlignment(landmarks);
    const slouching = this.detectSlouching(landmarks);
    const headNeckScore = this.calculateHeadNeckScore(landmarks);
    const tooCloseToCamera = this.detectTooCloseToCamera(landmarks);
    const tooFarFromCamera = this.detectTooFarFromCamera(landmarks);

    // Track potential issues (but don't immediately report them)
    const potentialIssues: { [key: string]: boolean } = {};

    // Check for forward head posture - Balanced detection
    if (neckAngle > 30) { // Moderate threshold for severe forward head
      potentialIssues['forward_head'] = true;
      totalScore -= Math.min(2.0, neckAngle * 0.08); // Moderate penalty
    } else if (neckAngle > 20) {
      potentialIssues['slight_forward_head'] = true;
      totalScore -= Math.min(0.8, neckAngle * 0.04);
    }

    // Check shoulder alignment - Balanced detection
    if (shoulderAlignment > 20) { // Moderate threshold for severe shoulder imbalance
      potentialIssues['uneven_shoulders'] = true;
      totalScore -= Math.min(1.5, shoulderAlignment * 0.08); // Moderate penalty
    } else if (shoulderAlignment > 12) {
      potentialIssues['slight_shoulder_imbalance'] = true;
      totalScore -= Math.min(0.6, shoulderAlignment * 0.04);
    }

    // Check head tilt - Balanced detection
    if (headPosition > 25) { // Moderate threshold for severe head tilt
      potentialIssues['head_tilt'] = true;
      totalScore -= Math.min(1.8, headPosition * 0.08); // Moderate penalty
    } else if (headPosition > 15) {
      potentialIssues['slight_head_tilt'] = true;
      totalScore -= Math.min(0.7, headPosition * 0.04);
    }

    // Check shoulder height - MUCH MORE LENIENT
    if (shoulderHeight > 30) { // Much higher threshold
      potentialIssues['shoulder_height_imbalance'] = true;
      totalScore -= Math.min(1.2, shoulderHeight * 0.05); // Much reduced penalty (0-10 scale)
    } else if (shoulderHeight > 22) {
      potentialIssues['slight_shoulder_height'] = true;
      totalScore -= Math.min(0.4, shoulderHeight * 0.015);
    }

    // Check spine alignment - MUCH MORE LENIENT
    if (spineAlignment > 40) { // Much higher threshold
      potentialIssues['spine_alignment'] = true;
      totalScore -= Math.min(1, spineAlignment * 0.04); // Much reduced penalty (0-10 scale)
    } else if (spineAlignment > 32) {
      potentialIssues['slight_spine_deviation'] = true;
      totalScore -= Math.min(0.4, spineAlignment * 0.015);
    }

    // Check for slouching - Balanced detection
    if (slouching) {
      potentialIssues['slouching'] = true;
      totalScore -= 1.3; // Moderate penalty for poor posture
    }

    // Check head/neck alignment - More lenient detection
    if (headNeckScore < 60) { // More lenient threshold
      potentialIssues['head_neck_alignment'] = true;
      totalScore -= 1; // Reduced penalty for poor posture
    } else if (headNeckScore < 70) {
      potentialIssues['slight_head_neck'] = true;
      totalScore -= 0.5;
    }

    // Check if too close to camera
    if (tooCloseToCamera) {
      potentialIssues['too_close_to_camera'] = true;
      totalScore -= 2; // Significant penalty for being too close
    }

    // Check if too far from camera
    if (tooFarFromCamera) {
      potentialIssues['too_far_from_camera'] = true;
      totalScore -= 2; // Significant penalty for being too far
    }

    // Update consistency tracking - reset counters for issues not currently detected
    for (const [issue, count] of Object.entries(this.issueConsistency)) {
      if (!potentialIssues[issue]) {
        // Decrease counter more aggressively for issues not currently detected
        this.issueConsistency[issue] = Math.max(0, count - 3);
      }
    }
    
    // Increase counters for currently detected issues
    for (const [issue, detected] of Object.entries(potentialIssues)) {
      if (detected) {
        this.issueConsistency[issue] = (this.issueConsistency[issue] || 0) + 1;
      }
    }

    // Only report issues that are consistent over time AND currently detected
    const consistentIssues: string[] = [];
    for (const [issue, count] of Object.entries(this.issueConsistency)) {
      if (count >= this.CONSISTENCY_THRESHOLD && potentialIssues[issue]) {
        switch (issue) {
          case 'forward_head':
            consistentIssues.push('Forward head posture - Try pulling your chin back and aligning your ears over your shoulders');
            break;
          case 'slight_forward_head':
            consistentIssues.push('Slight forward head - Gently tuck your chin and lengthen the back of your neck');
            break;
          case 'uneven_shoulders':
            consistentIssues.push('Uneven shoulders - Try to level your shoulders by relaxing the higher one');
            break;
          case 'slight_shoulder_imbalance':
            consistentIssues.push('Slight shoulder imbalance - Focus on keeping both shoulders at the same height');
            break;
          case 'head_tilt':
            consistentIssues.push('Head tilted - Try to keep your head level and centered');
            break;
          case 'slight_head_tilt':
            consistentIssues.push('Slight head tilt - Gently straighten your head to center');
            break;
          case 'shoulder_height_imbalance':
            consistentIssues.push('Shoulder height imbalance - Relax your shoulders and let them hang naturally');
            break;
          case 'slight_shoulder_height':
            consistentIssues.push('Slight shoulder height difference - Focus on keeping shoulders level');
            break;
          case 'spine_alignment':
            consistentIssues.push('Poor spine alignment - Sit up straight, imagine a string pulling you up from the top of your head');
            break;
          case 'slight_spine_deviation':
            consistentIssues.push('Slight spine deviation - Gently straighten your back and engage your core');
            break;
          case 'slouching':
            consistentIssues.push('Slouching detected - Roll your shoulders back and down, open your chest');
            break;
          case 'head_neck_alignment':
            consistentIssues.push('Poor head and neck alignment - Try to align your head directly over your shoulders');
            break;
          case 'slight_head_neck':
            consistentIssues.push('Slight head/neck misalignment - Gently adjust your head position');
            break;
          case 'too_close_to_camera':
            consistentIssues.push('Too close to camera - Move back to get better posture detection');
            break;
          case 'too_far_from_camera':
            consistentIssues.push('Too far from camera - Move closer for better posture detection');
            break;
        }
      }
    }

    // Add positive feedback for good posture
    if (totalScore >= 8.0) {
      consistentIssues.push('Excellent posture! Keep it up!');
    } else if (totalScore >= 7.0) {
      consistentIssues.push('Good posture overall, minor adjustments needed');
    } else if (totalScore >= 6.0) {
      consistentIssues.push('Posture is improving, keep working on it');
    }

    // Apply minimum score floor to allow natural variation
    const finalScore = Math.max(2, Math.min(10, totalScore)); // Minimum score of 2 to allow more variation
    
    return {
      score: finalScore,
      issues: consistentIssues,
      neckAngle,
      shoulderAlignment,
      spineAlignment,
      headPosition,
      shoulderHeight
    };
  }

  private calculateNeckAngle(landmarks: PoseLandmarks): number {
    const nose = landmarks.nose;
    const leftEar = landmarks.leftEar;
    const leftShoulder = landmarks.leftShoulder;

    if (nose.visibility < 0.5 || leftEar.visibility < 0.5 || leftShoulder.visibility < 0.5) {
      return 0;
    }

    // Vector from shoulder to ear
    const vec1X = leftEar.x - leftShoulder.x;
    const vec1Y = leftEar.y - leftShoulder.y;

    // Vector from ear to nose
    const vec2X = nose.x - leftEar.x;
    const vec2Y = nose.y - leftEar.y;

    // Dot product
    const dotProduct = vec1X * vec2X + vec1Y * vec2Y;

    // Magnitudes
    const mag1 = Math.sqrt(vec1X * vec1X + vec1Y * vec1Y);
    const mag2 = Math.sqrt(vec2X * vec2X + vec2Y * vec2Y);

    if (mag1 === 0 || mag2 === 0) return 0;

    // Angle in radians
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));

    // Convert to degrees
    const angleDeg = angleRad * 180 / Math.PI;

    // A perfectly straight neck might be around 180 degrees.
    // A smaller angle indicates forward head posture.
    return Math.max(0, 180 - angleDeg);
  }

  private calculateShoulderAlignment(landmarks: PoseLandmarks): number {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;

    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
      return 0;
    }

    // Calculate the angle of the line connecting the two shoulders relative to the horizontal
    const angleRad = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    const angleDeg = Math.abs(angleRad * 180 / Math.PI);

    // We want deviation from 0 degrees (perfectly horizontal)
    return angleDeg;
  }

  private calculateSpineAlignment(landmarks: PoseLandmarks): number {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    const leftHip = landmarks.leftHip;
    const rightHip = landmarks.rightHip;

    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
        leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
      return 0;
    }

    // Midpoint of shoulders
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // Midpoint of hips
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;

    // Angle of the torso line (shoulder midpoint to hip midpoint) relative to vertical
    const angleRad = Math.atan2(hipMidX - shoulderMidX, hipMidY - shoulderMidY);
    const angleDeg = Math.abs(angleRad * 180 / Math.PI);

    // Deviation from 0 degrees (perfectly vertical)
    return angleDeg;
  }

  private calculateHeadPosition(landmarks: PoseLandmarks): number {
    const leftEar = landmarks.leftEar;
    const rightEar = landmarks.rightEar;
    const nose = landmarks.nose;

    if (leftEar.visibility < 0.5 || rightEar.visibility < 0.5 || nose.visibility < 0.5) {
      return 0;
    }

    // Angle of the line connecting ears relative to horizontal (for head tilt)
    const earAngleRad = Math.atan2(rightEar.y - leftEar.y, rightEar.x - leftEar.x);
    const earAngleDeg = Math.abs(earAngleRad * 180 / Math.PI);

    return earAngleDeg;
  }

  private calculateShoulderHeight(landmarks: PoseLandmarks): number {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;

    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
      return 0;
    }

    return Math.abs(leftShoulder.y - rightShoulder.y) * 10;
  }

  private detectSlouching(landmarks: PoseLandmarks): boolean {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    const leftHip = landmarks.leftHip;
    const rightHip = landmarks.rightHip;

    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 || 
        leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
      return false;
    }

    // Check if shoulders are significantly forward of hips
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipCenterX = (leftHip.x + rightHip.x) / 2;

    return shoulderCenterX > hipCenterX + 0.10; // Balanced threshold for slouching
  }

  private calculateHeadNeckScore(landmarks: PoseLandmarks): number {
    const nose = landmarks.nose;
    const leftEar = landmarks.leftEar;
    const rightEar = landmarks.rightEar;
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;

    if (nose.visibility < 0.5 || leftEar.visibility < 0.5 || rightEar.visibility < 0.5 || 
        leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) {
      return 0;
    }

    let score = 10;

    // Check head alignment with shoulders
    const earCenterY = (leftEar.y + rightEar.y) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const headShoulderAlignment = Math.abs(earCenterY - shoulderCenterY);
    
    if (headShoulderAlignment > 0.15) {
      score -= Math.min(2, headShoulderAlignment * 15);
    }

    // Check head tilt
    const headTilt = Math.abs(leftEar.y - rightEar.y);
    if (headTilt > 0.08) {
      score -= Math.min(1.8, headTilt * 20);
    }

    // Check forward head posture
    const noseShoulderDistance = Math.abs(nose.x - (leftShoulder.x + rightShoulder.x) / 2);
    if (noseShoulderDistance > 0.2) {
      score -= Math.min(2.5, noseShoulderDistance * 10);
    }

    return Math.max(0, score);
  }

  private detectTooCloseToCamera(landmarks: PoseLandmarks): boolean {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    const nose = landmarks.nose;

    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 || nose.visibility < 0.5) {
      return false;
    }

    // Calculate the distance between shoulders (shoulder width)
    const shoulderDistance = Math.sqrt(
      Math.pow(leftShoulder.x - rightShoulder.x, 2) + 
      Math.pow(leftShoulder.y - rightShoulder.y, 2)
    );

    // Calculate the distance from nose to shoulder center
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const noseToShoulderDistance = Math.sqrt(
      Math.pow(nose.x - shoulderCenterX, 2) + 
      Math.pow(nose.y - shoulderCenterY, 2)
    );

    // If the person is too close, the shoulder distance will be very large relative to the image
    // and the nose-to-shoulder distance will be small relative to shoulder width
    const distanceRatio = noseToShoulderDistance / shoulderDistance;
    
    // If shoulders take up more than 80% of the image width or nose is very close to shoulders
    return shoulderDistance > 0.8 || distanceRatio < 0.3;
  }

  private detectTooFarFromCamera(landmarks: PoseLandmarks): boolean {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    const nose = landmarks.nose;

    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 || nose.visibility < 0.5) {
      return false;
    }

    // Calculate the distance between shoulders (shoulder width)
    const shoulderDistance = Math.sqrt(
      Math.pow(leftShoulder.x - rightShoulder.x, 2) + 
      Math.pow(leftShoulder.y - rightShoulder.y, 2)
    );

    // Calculate the distance from nose to shoulder center
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const noseToShoulderDistance = Math.sqrt(
      Math.pow(nose.x - shoulderCenterX, 2) + 
      Math.pow(nose.y - shoulderCenterY, 2)
    );

    // If the person is too far, the shoulder distance will be very small relative to the image
    // and the nose-to-shoulder distance will be large relative to shoulder width
    const distanceRatio = noseToShoulderDistance / shoulderDistance;
    
    // If shoulders take up less than 15% of the image width or nose is very far from shoulders
    return shoulderDistance < 0.15 || distanceRatio > 0.8;
  }
}

export default TensorFlowPoseService;
