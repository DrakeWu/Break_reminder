import React, { useState, useEffect, useCallback } from 'react'
import GeminiService, { StretchSuggestion } from './services/geminiService'
import TrackingService, { TrackingData, Settings } from './services/trackingService'
import StretchSuggestionComponent from './components/StretchSuggestion'
import StretchTimer from './components/StretchTimer'
import SimpleWebcam from './components/SimpleWebcam'
import ModernDashboard from './components/ModernDashboard'
import SettingsModal from './components/SettingsModal'
import PostureAlert from './components/PostureAlert'
import BreakAlert from './components/BreakAlert'
import { PostureAnalysis } from './services/tensorflowPoseService'

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [stretchSuggestions, setStretchSuggestions] = useState<StretchSuggestion[]>([])
  const [allStretchSessions, setAllStretchSessions] = useState<StretchSuggestion[][]>([])
  const [currentStretch, setCurrentStretch] = useState<StretchSuggestion | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [trackingService, setTrackingService] = useState<TrackingService | null>(null)
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null)
  const [currentPostureAnalysis, setCurrentPostureAnalysis] = useState<PostureAnalysis | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [currentSettings, setCurrentSettings] = useState<Settings>({
    reminderInterval: 30,
    postureCheckInterval: 15,
    enableNotifications: true,
    enableBreakAlerts: true
  })
  const [showPostureAlert, setShowPostureAlert] = useState(false)
  const [postureAlertData, setPostureAlertData] = useState<{issues: string[], score: number} | null>(null)
  const [showBreakAlert, setShowBreakAlert] = useState(false)

  // Initialize services on component mount
  useEffect(() => {
    console.log('App: Initializing Gemini service...')
    try {
      const gemini = new GeminiService()
      console.log('App: Gemini service created successfully:', !!gemini)
      setGeminiService(gemini)
    } catch (error) {
      console.error('App: Failed to initialize Gemini service:', error)
    }
  }, [])

  const handlePostureChange = useCallback((score: number) => {
    setTrackingData(prev => prev ? { ...prev, postureScore: score } : null)
  }, [])

  const handleScreenTimeUpdate = useCallback((screenTime: number) => {
    setTrackingData(prev => prev ? { ...prev, screenTime } : null)
  }, [])

  const handlePostureAnalysis = useCallback((analysis: PostureAnalysis) => {
    setCurrentPostureAnalysis(analysis)
    if (trackingService) {
      trackingService.updatePostureScore(analysis.score, analysis.issues)
      setTrackingData(trackingService.getCurrentData())
    }
  }, [trackingService])

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error)
  }, [])

  const handleBreakAlert = useCallback(() => {
    setShowBreakAlert(true)
  }, [])

  const handlePostureAlert = useCallback((issues: string[], score: number) => {
    setPostureAlertData({ issues, score })
    setShowPostureAlert(true)
  }, [])

  const startMonitoring = () => {
    if (!geminiService) {
      alert('Gemini service not initialized!')
      return
    }

        const tracking = new TrackingService(handlePostureChange, handleScreenTimeUpdate, handleBreakAlert, handlePostureAlert, currentSettings)
    setTrackingService(tracking)
    tracking.startTracking()
    setTrackingData(tracking.getCurrentData())
    setIsMonitoring(true)
    setCameraError(null) // Clear any previous camera errors
  }
  
  const pauseMonitoring = () => {
    if (trackingService) {
      trackingService.stopTracking()
    }
    setIsMonitoring(false)
    setCurrentPostureAnalysis(null)
  }

  const takeBreak = () => {
    if (trackingService) {
      trackingService.takeBreak()
      setTrackingData(trackingService.getCurrentData())
    }
  }

  const generateStretchSuggestions = async () => {
    console.log('=== GENERATE STRETCH SUGGESTIONS CALLED ===')
    console.log('Generating stretch suggestions...', { geminiService: !!geminiService, trackingData: !!trackingData })
    console.log('Current posture analysis:', currentPostureAnalysis)
    console.log('Gemini service details:', geminiService)
    
    if (!geminiService) {
      console.log('Missing Gemini service')
      alert('Gemini service not available. Please refresh the page.')
      return
    }
    
    console.log('Gemini service is available, proceeding with generation...')

    // Use default data if tracking data is not available
    const userData = trackingData || {
      screenTime: 0,
      postureScore: 7.5, // Default neutral score
      lastBreakTime: Date.now(),
      commonIssues: ['General posture improvement']
    }

    setIsGeneratingSuggestions(true)
    try {
      console.log('Calling Gemini service...')
      const suggestions = await geminiService.generateStretchSuggestions({
        screenTime: userData.screenTime,
        postureScore: userData.postureScore,
        lastBreakTime: userData.lastBreakTime,
        commonIssues: userData.commonIssues,
        poseLandmarks: currentPostureAnalysis ? {
          neckAngle: currentPostureAnalysis.neckAngle,
          shoulderAlignment: currentPostureAnalysis.shoulderAlignment,
          spineAlignment: currentPostureAnalysis.spineAlignment,
          headPosition: currentPostureAnalysis.headPosition,
          shoulderHeight: currentPostureAnalysis.shoulderHeight,
          slouching: currentPostureAnalysis.issues.some(issue => 
            issue.toLowerCase().includes('slouching') || 
            issue.toLowerCase().includes('forward')
          )
        } : undefined
      })
      console.log('Got suggestions:', suggestions)
      // Add new suggestions to the current session
      setStretchSuggestions(prev => [...prev, ...suggestions])
      // Also add to all sessions for history
      setAllStretchSessions(prev => [...prev, suggestions])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      alert('Failed to generate stretch suggestions. Please try again.')
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const handleGetStretchFromAlert = useCallback(() => {
    // Close the posture alert and generate stretch suggestions
    setShowPostureAlert(false)
    generateStretchSuggestions()
  }, [generateStretchSuggestions])

  const handleDismissBreakAlert = useCallback(() => {
    setShowBreakAlert(false)
    if (trackingService) {
      trackingService.dismissBreakAlert()
    }
  }, [trackingService])

  const handleTakeBreakFromAlert = useCallback(() => {
    setShowBreakAlert(false)
    takeBreak()
  }, [takeBreak])

  const startStretch = (suggestion: StretchSuggestion) => {
    setCurrentStretch(suggestion)
    setShowSuggestions(false)
  }

  const completeStretch = () => {
    console.log('Stretch completed, returning to dashboard')
    setCurrentStretch(null)
    takeBreak()
  }

  const skipStretch = () => {
    console.log('Stretch skipped, returning to dashboard')
    setCurrentStretch(null)
  }

  const addCommonIssue = (issue: string) => {
    if (trackingService) {
      trackingService.addCommonIssue(issue)
      setTrackingData(trackingService.getCurrentData())
    }
  }

  const simulatePoorPosture = () => {
    if (trackingService) {
      trackingService.simulatePoorPosture()
      setTrackingData(trackingService.getCurrentData())
    }
  }

  const simulateGoodPosture = () => {
    if (trackingService) {
      trackingService.simulateGoodPosture()
      setTrackingData(trackingService.getCurrentData())
    }
  }

  const handleSaveSettings = (newSettings: Settings) => {
    setCurrentSettings(newSettings)
    if (trackingService) {
      trackingService.updateSettings(newSettings)
    }
  }

  const handleOpenSettings = () => {
    if (trackingService) {
      setCurrentSettings(trackingService.getCurrentSettings())
    }
    setShowSettings(true)
  }

  if (currentStretch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full">
          <StretchTimer
            duration={currentStretch.duration}
            instructions={currentStretch.instructions}
            name={currentStretch.name}
            description={currentStretch.description}
            onComplete={completeStretch}
            onCancel={skipStretch}
          />
        </div>
      </div>
    )
  }

  if (showSuggestions) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI-Generated Stretch Suggestions</h2>
            <p className="text-gray-600 mb-4">
              Based on your current posture score ({trackingData?.postureScore}/10) and screen time ({trackingData?.screenTime} minutes)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuggestions(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Back to Dashboard
              </button>
              
              <button
                onClick={generateStretchSuggestions}
                disabled={isGeneratingSuggestions}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
              >
                {isGeneratingSuggestions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gemini 2.5 Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate New Stretches
                  </>
                )}
              </button>
            </div>
          </div>
          
          {stretchSuggestions.map((suggestion, index) => (
            <StretchSuggestionComponent
              key={`${suggestion.name}-${index}`}
              suggestion={suggestion}
              onStart={() => startStretch(suggestion)}
              onSkip={() => setShowSuggestions(false)}
              onDelete={() => {
                setStretchSuggestions(prev => prev.filter((_, i) => i !== index))
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Simple Webcam */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <SimpleWebcam
                  onPostureUpdate={handlePostureAnalysis}
                  onError={handleCameraError}
                  isActive={isMonitoring}
                />
                
                {/* Control Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={startMonitoring}
                    disabled={isMonitoring}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {isMonitoring ? 'Monitoring Active' : 'Start Monitoring'}
                  </button>
                  <button
                    onClick={pauseMonitoring}
                    disabled={!isMonitoring}
                    className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Pause Monitoring
                  </button>
                </div>

                {/* Status Card */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-center">
                    <div className={`w-3 h-3 mx-auto mb-3 rounded-full ${
                      isMonitoring ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <p className="text-sm text-gray-600 mb-1">System Status</p>
                    <p className={`text-lg font-semibold ${isMonitoring ? 'text-green-600' : 'text-gray-500'}`}>
                      {isMonitoring ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isMonitoring ? 'Posture monitoring enabled' : 'Click start to begin monitoring'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <ModernDashboard
                trackingData={trackingData}
                postureAnalysis={currentPostureAnalysis}
                isMonitoring={isMonitoring}
                onGenerateSuggestions={generateStretchSuggestions}
                onTakeBreak={takeBreak}
                isGeneratingSuggestions={isGeneratingSuggestions}
                onOpenSettings={handleOpenSettings}
              />

              {/* Camera Error Display */}
              {cameraError && (
                <div className="mt-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-lg">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Camera Error</h3>
                      <p className="text-red-600">{cameraError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Information Section */}
              <div className="mt-12 bg-gray-50 rounded-lg p-8 border border-gray-200">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Health Impact of Desk Work</h2>
                    <p className="text-gray-600">
                      Understanding the health effects of prolonged sitting and screen time
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Poor Posture Effects */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                          <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Posture-Related Health Issues</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border-l-4 border-red-400 pl-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Musculoskeletal Issues</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Chronic neck and shoulder pain</li>
                            <li>• Lower back problems and disc degeneration</li>
                            <li>• Forward head posture leading to "tech neck"</li>
                            <li>• Rounded shoulders and upper back pain</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-orange-400 pl-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Long-term Consequences</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Permanent spinal misalignment</li>
                            <li>• Reduced lung capacity and breathing issues</li>
                            <li>• Increased risk of arthritis and joint problems</li>
                            <li>• Chronic headaches and migraines</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Screen Time Effects */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Screen Time Health Effects</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-400 pl-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Eye Strain & Vision</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Digital eye strain and dry eyes</li>
                            <li>• Blurred vision and difficulty focusing</li>
                            <li>• Increased risk of myopia (nearsightedness)</li>
                            <li>• Computer vision syndrome</li>
                          </ul>
                        </div>

                        <div className="border-l-4 border-purple-400 pl-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Mental & Physical Health</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Sleep disruption and circadian rhythm issues</li>
                            <li>• Increased stress and anxiety levels</li>
                            <li>• Reduced physical activity and fitness</li>
                            <li>• Social isolation and decreased well-being</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prevention & Solutions */}
                  <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Prevention Strategies</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <div className="w-6 h-6 bg-gray-600 rounded"></div>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">Regular Breaks</h4>
                        <p className="text-sm text-gray-600">
                          Take breaks every 45-60 minutes to stretch, walk, and rest your eyes
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <div className="w-6 h-6 bg-gray-600 rounded"></div>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">Posture Awareness</h4>
                        <p className="text-sm text-gray-600">
                          Maintain neutral spine, keep shoulders relaxed, and head aligned
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <div className="w-6 h-6 bg-gray-600 rounded"></div>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">Strengthening</h4>
                        <p className="text-sm text-gray-600">
                          Regular exercise and stretching to counteract desk work effects
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">
                      <strong>PostureGuard</strong> helps you maintain healthy habits and prevent these long-term health issues.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Real-time posture monitoring</span>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Smart break reminders</span>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Personalized stretch suggestions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentSettings={currentSettings}
      />

      {/* Posture Alert */}
      <PostureAlert
        isOpen={showPostureAlert}
        onClose={() => {
          setShowPostureAlert(false)
          if (trackingService) {
            trackingService.dismissPostureAlert()
          }
        }}
        issues={postureAlertData?.issues || []}
        score={postureAlertData?.score || 0}
        onGetStretch={handleGetStretchFromAlert}
      />

      {/* Break Alert */}
      <BreakAlert
        isOpen={showBreakAlert}
        onClose={handleDismissBreakAlert}
        onTakeBreak={handleTakeBreakFromAlert}
        screenTime={trackingData?.screenTime || 0}
      />
    </>
  )
}

export default App