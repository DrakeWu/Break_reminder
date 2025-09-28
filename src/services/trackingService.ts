interface TrackingData {
  screenTime: number;
  postureScore: number;
  lastBreakTime: number;
  commonIssues: string[];
  startTime: number;
  breakCount: number;
  postureHistory: number[]; // Track posture scores over time
  averagePostureScore: number;
  sessionTime: number; // Total session time in minutes
}

export interface Settings {
  reminderInterval: number; // minutes
  postureCheckInterval: number; // seconds
  enableNotifications: boolean;
  enableBreakAlerts: boolean;
}

class TrackingService {
  private data: TrackingData;
  private postureCheckInterval: NodeJS.Timeout | null = null;
  private screenTimeInterval: NodeJS.Timeout | null = null;
  private sessionTimeInterval: NodeJS.Timeout | null = null;
  private breakAlertInterval: NodeJS.Timeout | null = null;
  private onPostureChange: (score: number) => void;
  private onScreenTimeUpdate: (screenTime: number) => void;
  private onBreakAlert: (() => void) | null = null;
  private onPostureAlert: ((issues: string[], score: number) => void) | null = null;
  private settings: Settings;
  private lastPostureAlertTime: number = 0;
  private postureAlertActive: boolean = false;
  private breakAlertActive: boolean = false;
  private lastBreakAlertTime: number = 0;
  private isPageVisible: boolean = true;

  constructor(
    onPostureChange: (score: number) => void,
    onScreenTimeUpdate: (screenTime: number) => void,
    onBreakAlert?: () => void,
    onPostureAlert?: (issues: string[], score: number) => void,
    settings?: Settings
  ) {
    this.onPostureChange = onPostureChange;
    this.onScreenTimeUpdate = onScreenTimeUpdate;
    this.onBreakAlert = onBreakAlert || null;
    this.onPostureAlert = onPostureAlert || null;
    
        // Default settings
        this.settings = settings || {
          reminderInterval: 45, // 45 minutes (less frequent breaks)
          postureCheckInterval: 60, // 60 seconds (much slower checking)
          enableNotifications: true,
          enableBreakAlerts: true
        };
    
    this.data = {
      screenTime: 0,
      postureScore: 85, // Start with a reasonable default
      lastBreakTime: Date.now(),
      commonIssues: [],
      startTime: Date.now(),
      breakCount: 0,
      postureHistory: [],
      averagePostureScore: 85,
      sessionTime: 0
    };

    this.loadStoredData();
    this.setupVisibilityListener();
  }

  startTracking(): void {
    this.postureAlertActive = false; // Reset alert state for new session
    this.startPostureMonitoring();
    this.startScreenTimeTracking();
    this.startSessionTimeTracking();
    this.startBreakAlerts();
    this.saveData();
  }

  stopTracking(): void {
    if (this.postureCheckInterval) {
      clearInterval(this.postureCheckInterval);
      this.postureCheckInterval = null;
    }
    if (this.screenTimeInterval) {
      clearInterval(this.screenTimeInterval);
      this.screenTimeInterval = null;
    }
    if (this.sessionTimeInterval) {
      clearInterval(this.sessionTimeInterval);
      this.sessionTimeInterval = null;
    }
    if (this.breakAlertInterval) {
      clearInterval(this.breakAlertInterval);
      this.breakAlertInterval = null;
    }
    this.saveData();
  }

  takeBreak(): void {
    this.data.lastBreakTime = Date.now();
    this.data.breakCount++;
    this.data.screenTime = 0; // Reset screen time after break
    this.breakAlertActive = false; // Clear the break alert state
    this.saveData();
  }

  getCurrentData(): TrackingData {
    return { ...this.data };
  }

  dismissBreakAlert(): void {
    this.breakAlertActive = false;
  }

  dismissPostureAlert(): void {
    console.log('Dismissing posture alert - resetting postureAlertActive to false');
    this.postureAlertActive = false;
  }


  updateSettings(newSettings: Settings): void {
    this.settings = { ...newSettings };
    this.saveSettings();
    
    // Restart intervals with new settings
    this.stopTracking();
    this.startTracking();
  }

  private setupVisibilityListener(): void {
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      console.log('Page visibility changed:', this.isPageVisible ? 'visible' : 'hidden');
      
      // Continue monitoring even when tab is not visible
      if (!this.isPageVisible && this.postureCheckInterval) {
        console.log('Tab is hidden but monitoring continues in background');
      }
    });
  }

  getCurrentSettings(): Settings {
    return { ...this.settings };
  }

  addCommonIssue(issue: string): void {
    if (!this.data.commonIssues.includes(issue)) {
      this.data.commonIssues.push(issue);
      this.saveData();
    }
  }

  removeCommonIssue(issue: string): void {
    this.data.commonIssues = this.data.commonIssues.filter(i => i !== issue);
    this.saveData();
  }

  updatePostureScore(score: number, issues?: string[]): void {
    this.data.postureScore = score;
    this.data.postureHistory.push(score);
    
    // Keep only last 20 posture readings
    if (this.data.postureHistory.length > 20) {
      this.data.postureHistory.shift();
    }
    
    // Calculate average posture score
    this.data.averagePostureScore = this.data.postureHistory.reduce((a, b) => a + b, 0) / this.data.postureHistory.length;
    
    
    // Check for very bad posture and trigger alert if notifications are enabled
    const now = Date.now();
    const timeSinceLastAlert = now - this.lastPostureAlertTime;
    const alertCooldown = 60000; // 1 minute buffer after alert is dismissed

    // Check if we can trigger a new alert
    const canTriggerAlert = this.settings.enableNotifications && 
                           score < 3 && 
                           issues && issues.length > 0 && 
                           !this.postureAlertActive && 
                           timeSinceLastAlert > alertCooldown;

    console.log('Posture Alert Debug:', {
      enableNotifications: this.settings.enableNotifications,
      score,
      hasIssues: issues && issues.length > 0,
      postureAlertActive: this.postureAlertActive,
      timeSinceLastAlert,
      alertCooldown,
      canTriggerAlert
    });
    
    if (canTriggerAlert) {
      // Only show the main issue (first one) to avoid overwhelming the user
      const mainIssue = issues[0];
      console.log('Triggering posture alert:', mainIssue);
      if (this.onPostureAlert) {
        this.onPostureAlert([mainIssue], score);
        this.postureAlertActive = true; // Mark as active
        this.lastPostureAlertTime = now; // Update the last alert time
      }
    }
    
    this.onPostureChange(score);
    this.saveData();
  }

  private startPostureMonitoring(): void {
    // Update posture score based on settings
    this.postureCheckInterval = setInterval(() => {
      // This will be called by the pose detection service
      // The actual posture score comes from real-time pose analysis
      this.saveData();
      
      // Log background monitoring status
      if (!this.isPageVisible) {
        console.log('Background monitoring active - tab is hidden but posture detection continues');
      }
    }, this.settings.postureCheckInterval * 1000); // Use settings interval
  }

  private startScreenTimeTracking(): void {
    this.screenTimeInterval = setInterval(() => {
      this.data.screenTime += 1; // Increment by 1 minute
      this.onScreenTimeUpdate(this.data.screenTime);
      this.saveData();
    }, 60000); // Update every minute
  }

  private startSessionTimeTracking(): void {
    this.sessionTimeInterval = setInterval(() => {
      const now = Date.now();
      this.data.sessionTime = Math.floor((now - this.data.startTime) / 60000); // Convert to minutes
      this.saveData();
    }, 60000); // Update every minute
  }

  private startBreakAlerts(): void {
    if (!this.settings.enableBreakAlerts) return;
    
    this.breakAlertInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastBreak = Math.floor((now - this.data.lastBreakTime) / 60000); // Minutes
      const timeSinceLastBreakAlert = now - this.lastBreakAlertTime;
      const breakAlertCooldown = 300000; // 5 minutes cooldown between break alerts
      
      // Alert based on settings, but only if no alert is currently active and enough time has passed
      if (timeSinceLastBreak >= this.settings.reminderInterval && 
          this.onBreakAlert && 
          !this.breakAlertActive && 
          timeSinceLastBreakAlert > breakAlertCooldown) {
        this.breakAlertActive = true;
        this.lastBreakAlertTime = now;
        this.onBreakAlert();
      }
    }, 60000); // Check every minute
  }

  private simulatePostureCheck(): number {
    // Simulate posture degradation over time
    const timeSinceLastBreak = Date.now() - this.data.lastBreakTime;
    const hoursSinceBreak = timeSinceLastBreak / (1000 * 60 * 60);
    
    // Posture gets worse the longer you sit without breaks
    let baseScore = 85;
    if (hoursSinceBreak > 2) baseScore = 60;
    if (hoursSinceBreak > 4) baseScore = 40;
    if (hoursSinceBreak > 6) baseScore = 20;

    // Add some randomness to simulate natural variation
    const variation = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, Math.round(baseScore + variation)));
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('postureTrackingData');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = { ...this.data, ...parsed };
      }
      
      // Load settings
      const storedSettings = localStorage.getItem('postureTrackingSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        this.settings = { ...this.settings, ...parsedSettings };
      }
    } catch (error) {
      console.error('Error loading stored tracking data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('postureTrackingData', JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('postureTrackingSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Method to simulate different posture scenarios for testing
  simulatePoorPosture(): void {
    this.data.postureScore = Math.max(0, this.data.postureScore - 20);
    this.onPostureChange(this.data.postureScore);
    this.saveData();
  }

  simulateGoodPosture(): void {
    this.data.postureScore = Math.min(100, this.data.postureScore + 15);
    this.onPostureChange(this.data.postureScore);
    this.saveData();
  }
}

export default TrackingService;
export type { TrackingData };
