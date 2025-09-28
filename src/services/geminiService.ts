interface StretchSuggestion {
  name: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetAreas: string[];
  instructions: string[];
}

interface UserData {
  screenTime: number; // in minutes
  postureScore: number; // 0-100 (100 = perfect posture)
  lastBreakTime: number; // timestamp
  commonIssues: string[]; // e.g., ['neck pain', 'back stiffness']
  poseLandmarks?: {
    neckAngle: number;
    shoulderAlignment: number;
    spineAlignment: number;
    headPosition: number;
    shoulderHeight: number;
    slouching: boolean;
  };
}

import { getGeminiApiKey } from '../config/apiKeys';

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private previousSuggestions: string[] = [];

  constructor() {
    try {
      this.apiKey = getGeminiApiKey();
      console.log('GeminiService: API key loaded:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'undefined');
      console.log('GeminiService: API key validation:', this.apiKey && this.apiKey.length > 10 && this.apiKey.startsWith('AIza'));
      console.log('GeminiService: Constructor completed successfully');
    } catch (error) {
      console.error('GeminiService: Failed to load API key:', error);
      throw error;
    }
  }

  async testApiConnection(): Promise<boolean> {
    try {
      console.log('GeminiService: Testing API connection...');
      console.log('GeminiService: API key being used:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'undefined');
      console.log('GeminiService: Base URL:', this.baseUrl);
      const testUrl = `${this.baseUrl}/models?key=${this.apiKey}`;
      console.log('GeminiService: Test URL:', testUrl.substring(0, 100) + '...');
      const response = await fetch(testUrl);
      console.log('GeminiService: Test API response status:', response.status);
      console.log('GeminiService: Test API response ok:', response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GeminiService: API test error response:', errorText);
      }
      return response.ok;
    } catch (error) {
      console.error('GeminiService: Test API connection failed:', error);
      return false;
    }
  }

  async generateStretchSuggestions(userData: UserData): Promise<StretchSuggestion[]> {
    console.log('GeminiService: Starting to generate suggestions with data:', userData);
    console.log('GeminiService: API key available:', !!this.apiKey);
    console.log('GeminiService: Base URL:', this.baseUrl);
    console.log('GeminiService: Previous suggestions count:', this.previousSuggestions.length);
    
    // Test API connection first
    console.log('GeminiService: About to test API connection...');
    const isApiWorking = await this.testApiConnection();
    console.log('GeminiService: API connection test result:', isApiWorking);
    if (!isApiWorking) {
      console.error('GeminiService: API connection test failed, throwing error');
      throw new Error('Gemini API connection test failed');
    }
    console.log('GeminiService: API connection test passed, proceeding with generation...');
    
    const prompt = this.createPrompt(userData);
    console.log('GeminiService: Created prompt, making API request...');
    console.log('GeminiService: Prompt length:', prompt.length);
    console.log('GeminiService: Prompt preview:', prompt.substring(0, 200) + '...');
    
    // Try different model names in order of preference
    const models = ['gemini-2.5-pro', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
    
    for (const model of models) {
      try {
        console.log(`GeminiService: Trying model: ${model}`);
        
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
        console.log(`GeminiService: Making request to: ${url.substring(0, 100)}...`);
        
        const response = await fetch(url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.9, // Increased for more creativity
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              }
            })
          }
        );

        console.log(`GeminiService: API response status for ${model}:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`GeminiService: API error response for ${model}:`, errorText);
          
          // If this is the last model, throw the error
          if (model === models[models.length - 1]) {
            throw new Error(`Gemini API error: ${response.status}`);
          }
          // Otherwise, try the next model
          continue;
        }

        const data = await response.json();
        console.log(`GeminiService: API response data for ${model}:`, data);
        
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedText) {
          console.error(`GeminiService: No content generated from API for ${model}`);
          if (model === models[models.length - 1]) {
            throw new Error('No content generated from Gemini API');
          }
          continue;
        }

        console.log(`GeminiService: Generated text from ${model}:`, generatedText);
        const suggestions = this.parseStretchSuggestions(generatedText);
        console.log(`GeminiService: Parsed suggestions from ${model}:`, suggestions);
        return suggestions;
        
      } catch (error) {
        console.error(`GeminiService: Error with model ${model}:`, error);
        
        // If this is the last model, return fallback suggestions
        if (model === models[models.length - 1]) {
          console.error('GeminiService: All models failed, returning fallback suggestions');
          const fallbackSuggestions = this.getFallbackSuggestions(userData);
          console.log('GeminiService: Returning fallback suggestions:', fallbackSuggestions);
          return fallbackSuggestions;
        }
        // Otherwise, try the next model
        continue;
      }
    }
    
    // This should never be reached, but just in case
    console.error('GeminiService: All models failed unexpectedly');
    return this.getFallbackSuggestions(userData);
  }

  private getSpecificPostureIssues(neckAngle: number, shoulderAlignment: number, spineAlignment: number, headPosition: number, shoulderHeight: number, slouching: boolean): string {
    const issues = [];
    
    // Forward Head Posture Analysis
    if (neckAngle > 15) {
      issues.push(`🔴 CRITICAL: Forward Head Posture (${neckAngle.toFixed(1)}°) - Head is significantly forward of shoulders, causing "tech neck"`);
    } else if (neckAngle > 10) {
      issues.push(`🟡 MODERATE: Forward Head Posture (${neckAngle.toFixed(1)}°) - Head is slightly forward, needs correction`);
    } else if (neckAngle > 5) {
      issues.push(`🟢 MILD: Slight Forward Head (${neckAngle.toFixed(1)}°) - Minor forward positioning`);
    }
    
    // Head Tilt Analysis
    if (headPosition > 20) {
      issues.push(`🔴 CRITICAL: Severe Head Tilt (${headPosition.toFixed(1)}°) - Head is significantly tilted to one side`);
    } else if (headPosition > 15) {
      issues.push(`🟡 MODERATE: Head Tilt (${headPosition.toFixed(1)}°) - Head is tilted, may indicate neck muscle imbalance`);
    } else if (headPosition > 8) {
      issues.push(`🟢 MILD: Slight Head Tilt (${headPosition.toFixed(1)}°) - Minor head positioning issue`);
    }
    
    // Shoulder Alignment Analysis
    if (shoulderAlignment > 12) {
      issues.push(`🔴 CRITICAL: Severe Shoulder Misalignment (${shoulderAlignment.toFixed(1)}°) - One shoulder significantly higher than the other`);
    } else if (shoulderAlignment > 8) {
      issues.push(`🟡 MODERATE: Shoulder Misalignment (${shoulderAlignment.toFixed(1)}°) - Shoulders are uneven, may indicate muscle imbalance`);
    } else if (shoulderAlignment > 4) {
      issues.push(`🟢 MILD: Slight Shoulder Imbalance (${shoulderAlignment.toFixed(1)}°) - Minor shoulder height difference`);
    }
    
    // Shoulder Height Analysis
    if (shoulderHeight > 15) {
      issues.push(`🔴 CRITICAL: Severe Shoulder Height Imbalance (${shoulderHeight.toFixed(1)}°) - Significant shoulder height difference`);
    } else if (shoulderHeight > 12) {
      issues.push(`🟡 MODERATE: Shoulder Height Imbalance (${shoulderHeight.toFixed(1)}°) - Noticeable shoulder height difference`);
    } else if (shoulderHeight > 8) {
      issues.push(`🟢 MILD: Slight Shoulder Height Difference (${shoulderHeight.toFixed(1)}°) - Minor shoulder height variation`);
    }
    
    // Spine Alignment Analysis
    if (spineAlignment > 20) {
      issues.push(`🔴 CRITICAL: Severe Spine Misalignment (${spineAlignment.toFixed(1)}°) - Significant spinal deviation`);
    } else if (spineAlignment > 15) {
      issues.push(`🟡 MODERATE: Spine Misalignment (${spineAlignment.toFixed(1)}°) - Noticeable spinal deviation`);
    } else if (spineAlignment > 10) {
      issues.push(`🟢 MILD: Slight Spine Deviation (${spineAlignment.toFixed(1)}°) - Minor spinal alignment issue`);
    }
    
    // Slouching Analysis
    if (slouching) {
      issues.push(`🔴 CRITICAL: Slouching Detected - Rounded shoulders and forward head position`);
    }
    
    // Overall Posture Assessment
    const criticalIssues = issues.filter(issue => issue.includes('🔴 CRITICAL')).length;
    const moderateIssues = issues.filter(issue => issue.includes('🟡 MODERATE')).length;
    const mildIssues = issues.filter(issue => issue.includes('🟢 MILD')).length;
    
    if (criticalIssues > 0) {
      issues.push(`\n⚠️ OVERALL ASSESSMENT: ${criticalIssues} critical issue(s) detected - Immediate attention required`);
    } else if (moderateIssues > 0) {
      issues.push(`\n⚠️ OVERALL ASSESSMENT: ${moderateIssues} moderate issue(s) detected - Regular correction needed`);
    } else if (mildIssues > 0) {
      issues.push(`\n✅ OVERALL ASSESSMENT: ${mildIssues} mild issue(s) detected - Good posture with minor improvements needed`);
    } else {
      issues.push(`\n✅ OVERALL ASSESSMENT: Excellent posture detected - Maintain current positioning`);
    }
    
    return issues.join('\n');
  }

  private getTargetingRequirements(primaryIssues: string[], secondaryIssues: string[]): string {
    const requirements = [];
    
    // Check for specific issues and provide targeted requirements
    const hasForwardHead = primaryIssues.some(issue => issue.includes('forward head')) || 
                          secondaryIssues.some(issue => issue.includes('forward head'));
    const hasHeadTilt = primaryIssues.some(issue => issue.includes('head tilt')) || 
                       secondaryIssues.some(issue => issue.includes('head tilt'));
    const hasShoulderIssues = primaryIssues.some(issue => issue.includes('shoulder')) || 
                             secondaryIssues.some(issue => issue.includes('shoulder'));
    const hasSlouching = primaryIssues.some(issue => issue.includes('slouching'));
    const hasSpineIssues = primaryIssues.some(issue => issue.includes('spine')) || 
                          secondaryIssues.some(issue => issue.includes('spine'));
    
    if (hasForwardHead) {
      requirements.push(`• FORWARD HEAD POSTURE: Include stretches for upper trapezius, levator scapulae, and suboccipital muscles. Focus on chin tucks, neck retraction, and upper back strengthening.`);
    }
    
    if (hasHeadTilt) {
      requirements.push(`• HEAD TILT: Include lateral neck stretches, SCM muscle stretches, and exercises to strengthen the opposite side neck muscles. Focus on side-to-side neck movements and isometric holds.`);
    }
    
    if (hasShoulderIssues) {
      requirements.push(`• SHOULDER ISSUES: Include pectoral stretches, upper trapezius stretches, and exercises to strengthen the middle and lower trapezius. Focus on shoulder blade retraction and depression.`);
    }
    
    if (hasSlouching) {
      requirements.push(`• SLOUCHING: Include chest openers, upper back stretches, and exercises to strengthen the posterior chain. Focus on thoracic extension and shoulder blade retraction.`);
    }
    
    if (hasSpineIssues) {
      requirements.push(`• SPINE ALIGNMENT: Include spinal mobility exercises, core strengthening, and exercises to improve overall spinal alignment. Focus on neutral spine positioning.`);
    }
    
    if (requirements.length === 0) {
      requirements.push(`• GENERAL POSTURE: Include overall posture improvement exercises focusing on spinal alignment, shoulder positioning, and head placement.`);
    }
    
    return requirements.join('\n');
  }

  private createPrompt(userData: UserData): string {
    const timeSinceBreak = Math.floor((Date.now() - userData.lastBreakTime) / 60000);
    
    let poseAnalysis = '';
    let primaryIssues = [];
    let secondaryIssues = [];
    
    if (userData.poseLandmarks) {
      const { neckAngle, shoulderAlignment, spineAlignment, headPosition, shoulderHeight, slouching } = userData.poseLandmarks;
      
      poseAnalysis = `
DETAILED POSE ANALYSIS:
- Neck Angle: ${neckAngle.toFixed(1)}° (forward head posture - ${neckAngle > 15 ? 'SEVERE' : neckAngle > 10 ? 'MODERATE' : 'MILD'})
- Shoulder Alignment: ${shoulderAlignment.toFixed(1)}° (uneven shoulders - ${shoulderAlignment > 12 ? 'SEVERE' : shoulderAlignment > 8 ? 'MODERATE' : 'MILD'})
- Spine Alignment: ${spineAlignment.toFixed(1)}° (body alignment - ${spineAlignment > 20 ? 'SEVERE' : spineAlignment > 15 ? 'MODERATE' : 'MILD'})
- Head Position: ${headPosition.toFixed(1)}° (head tilt - ${headPosition > 20 ? 'SEVERE' : headPosition > 15 ? 'MODERATE' : 'MILD'})
- Shoulder Height Difference: ${shoulderHeight.toFixed(1)}° (shoulder imbalance - ${shoulderHeight > 15 ? 'SEVERE' : shoulderHeight > 12 ? 'MODERATE' : 'MILD'})
- Slouching Detected: ${slouching ? 'YES - CRITICAL' : 'No'}

SPECIFIC POSTURE ISSUES DETECTED:
${this.getSpecificPostureIssues(neckAngle, shoulderAlignment, spineAlignment, headPosition, shoulderHeight, slouching)}

PRIORITY ISSUES TO ADDRESS:
`;

      // Identifying main issues with the head
      if (neckAngle > 15) primaryIssues.push(`SEVERE forward head posture (${neckAngle.toFixed(1)}°)`);
      if (shoulderAlignment > 12) primaryIssues.push(`SEVERE shoulder misalignment (${shoulderAlignment.toFixed(1)}°)`);
      if (slouching) primaryIssues.push('CRITICAL slouching detected');
      if (headPosition > 20) primaryIssues.push(`SEVERE head tilt (${headPosition.toFixed(1)}°)`);
      
      // landmarker angles
      if (neckAngle > 10 && neckAngle <= 15) secondaryIssues.push(`moderate forward head (${neckAngle.toFixed(1)}°)`);
      if (shoulderAlignment > 8 && shoulderAlignment <= 12) secondaryIssues.push(`moderate shoulder misalignment (${shoulderAlignment.toFixed(1)}°)`);
      if (headPosition > 15 && headPosition <= 20) secondaryIssues.push(`moderate head tilt (${headPosition.toFixed(1)}°)`);
      if (shoulderHeight > 12) secondaryIssues.push(`shoulder height imbalance (${shoulderHeight.toFixed(1)}°)`);
      if (spineAlignment > 15) secondaryIssues.push(`spine alignment issues (${spineAlignment.toFixed(1)}°)`);
      
      poseAnalysis += primaryIssues.length > 0 ? `CRITICAL: ${primaryIssues.join(', ')}\n` : '';
      poseAnalysis += secondaryIssues.length > 0 ? `MODERATE: ${secondaryIssues.join(', ')}\n` : '';
    }

    // Add multiple randomization elements to ensure different responses
    const randomSeed = Math.random().toString(36).substring(7);
    const creativeSeed = Math.random().toString(36).substring(2, 15);
    const variationSeed = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString().slice(-6);
    
    // Add creative inspiration elements
    const creativeInspirations = [
      'Think like a yoga instructor', 'Approach like a physical therapist', 'Be creative like a dance instructor',
      'Think like a martial arts master', 'Approach like a sports medicine expert', 'Be innovative like a movement coach',
      'Think like a pilates instructor', 'Approach like a rehabilitation specialist', 'Be creative like a fitness trainer'
    ];
    const randomInspiration = creativeInspirations[Math.floor(Math.random() * creativeInspirations.length)];
    
    // Add random creative constraints
    const creativeConstraints = [
      'Focus on micro-movements', 'Emphasize breath work', 'Include balance elements',
      'Add proprioception challenges', 'Include mindfulness aspects', 'Focus on joint mobility',
      'Emphasize muscle activation', 'Include coordination elements', 'Add relaxation techniques'
    ];
    const randomConstraint = creativeConstraints[Math.floor(Math.random() * creativeConstraints.length)];
    
    // Add random exercise categories to force variety
    const exerciseCategories = [
      'yoga-inspired', 'pilates-based', 'physical therapy', 'sports medicine', 'dance-inspired',
      'martial arts', 'rehabilitation', 'fitness training', 'movement therapy', 'wellness coaching'
    ];
    const randomCategory = exerciseCategories[Math.floor(Math.random() * exerciseCategories.length)];
    
    // Add random timing variations
    const timingVariations = [
      'short bursts (15-30 seconds)', 'medium holds (30-45 seconds)', 'long holds (45-60 seconds)',
      'pulsing movements', 'rhythmic breathing', 'counted repetitions', 'timed intervals'
    ];
    const randomTiming = timingVariations[Math.floor(Math.random() * timingVariations.length)];
    
    // Add random difficulty variations
    const difficultyVariations = [
      'beginner-friendly', 'intermediate level', 'advanced techniques', 'gentle approach',
      'challenging movements', 'progressive difficulty', 'adaptive intensity'
    ];
    const randomDifficulty = difficultyVariations[Math.floor(Math.random() * difficultyVariations.length)];
    
    // Add random body part focus
    const bodyPartFocus = [
      'upper body focus', 'lower body focus', 'core emphasis', 'spine mobility',
      'neck and shoulders', 'hip flexibility', 'full body integration', 'joint mobility'
    ];
    const randomBodyPart = bodyPartFocus[Math.floor(Math.random() * bodyPartFocus.length)];
    
    // Add random breathing patterns
    const breathingPatterns = [
      'diaphragmatic breathing', 'box breathing', 'rhythmic breathing', 'deep breathing',
      'breath holds', 'exhale-focused', 'inhale-focused', 'breath synchronization'
    ];
    const randomBreathing = breathingPatterns[Math.floor(Math.random() * breathingPatterns.length)];
    
    // Add random movement styles
    const movementStyles = [
      'fluid movements', 'precise positioning', 'dynamic transitions', 'static holds',
      'pulsing motions', 'circular patterns', 'linear movements', 'oscillating motions'
    ];
    const randomMovement = movementStyles[Math.floor(Math.random() * movementStyles.length)];
    
    // Add random equipment usage
    const equipmentOptions = [
      'no equipment needed', 'chair-based exercises', 'desk support', 'wall assistance',
      'body weight only', 'resistance bands', 'yoga mat', 'office supplies'
    ];
    const randomEquipment = equipmentOptions[Math.floor(Math.random() * equipmentOptions.length)];
    
    // Add random therapeutic approaches
    const therapeuticApproaches = [
      'stretching-focused', 'strengthening-based', 'mobility-enhancing', 'relaxation-oriented',
      'pain-relief focused', 'posture-correcting', 'energy-boosting', 'stress-reducing'
    ];
    const randomTherapeutic = therapeuticApproaches[Math.floor(Math.random() * therapeuticApproaches.length)];
    
    // Add random intensity levels
    const intensityLevels = [
      'gentle and soothing', 'moderate intensity', 'vigorous and energizing', 'calm and meditative',
      'dynamic and active', 'passive and relaxing', 'challenging but safe', 'restorative and healing'
    ];
    const randomIntensity = intensityLevels[Math.floor(Math.random() * intensityLevels.length)];
    
    // Add random cultural influences
    const culturalInfluences = [
      'Eastern medicine approach', 'Western physical therapy', 'traditional healing', 'modern science-based',
      'holistic wellness', 'evidence-based practice', 'mind-body connection', 'integrated approach'
    ];
    const randomCultural = culturalInfluences[Math.floor(Math.random() * culturalInfluences.length)];
    
    // Add random environmental considerations
    const environmentalFactors = [
      'office-friendly', 'desk-appropriate', 'meeting-room suitable', 'cubicle-compatible',
      'open-space ready', 'private office', 'home office', 'flexible workspace'
    ];
    const randomEnvironment = environmentalFactors[Math.floor(Math.random() * environmentalFactors.length)];
    
    // Add random time of day considerations
    const timeOfDayFactors = [
      'morning energizing', 'midday refreshing', 'afternoon revitalizing', 'evening relaxing',
      'pre-work preparation', 'post-work recovery', 'lunch break appropriate', 'end-of-day winding down'
    ];
    const randomTimeOfDay = timeOfDayFactors[Math.floor(Math.random() * timeOfDayFactors.length)];
    
    // Add random mood considerations
    const moodFactors = [
      'stress-relieving', 'energy-boosting', 'calming and soothing', 'motivating and invigorating',
      'focus-enhancing', 'anxiety-reducing', 'confidence-building', 'mindfulness-promoting'
    ];
    const randomMood = moodFactors[Math.floor(Math.random() * moodFactors.length)];
    
    // Add random sensory considerations
    const sensoryFactors = [
      'tactile awareness', 'proprioceptive feedback', 'visual cues', 'auditory guidance',
      'kinesthetic learning', 'sensory integration', 'body awareness', 'spatial orientation'
    ];
    const randomSensory = sensoryFactors[Math.floor(Math.random() * sensoryFactors.length)];
    
    // Add random progression considerations
    const progressionFactors = [
      'beginner to advanced', 'gentle to intense', 'simple to complex', 'static to dynamic',
      'passive to active', 'isolated to integrated', 'slow to fast', 'short to long'
    ];
    const randomProgression = progressionFactors[Math.floor(Math.random() * progressionFactors.length)];
    
    // Add random safety considerations
    const safetyFactors = [
      'injury prevention', 'joint protection', 'muscle safety', 'spine protection',
      'neck safety', 'shoulder safety', 'back safety', 'overall body safety'
    ];
    const randomSafety = safetyFactors[Math.floor(Math.random() * safetyFactors.length)];
    
    // Add random effectiveness considerations
    const effectivenessFactors = [
      'immediate relief', 'long-term benefits', 'preventive care', 'corrective action',
      'maintenance focus', 'rehabilitation approach', 'performance enhancement', 'wellness promotion'
    ];
    const randomEffectiveness = effectivenessFactors[Math.floor(Math.random() * effectivenessFactors.length)];
    
    // Add random integration considerations
    const integrationFactors = [
      'workflow integration', 'daily routine fitting', 'habit formation', 'lifestyle integration',
      'schedule compatibility', 'time efficiency', 'convenience focus', 'practical application'
    ];
    const randomIntegration = integrationFactors[Math.floor(Math.random() * integrationFactors.length)];
    
    // Add random personalization considerations
    const personalizationFactors = [
      'individual adaptation', 'personal preference', 'unique needs', 'customized approach',
      'personalized modification', 'individual variation', 'personal style', 'customized experience'
    ];
    const randomPersonalization = personalizationFactors[Math.floor(Math.random() * personalizationFactors.length)];
    
    // Add random innovation considerations
    const innovationFactors = [
      'cutting-edge techniques', 'innovative approaches', 'modern methods', 'advanced practices',
      'revolutionary concepts', 'breakthrough techniques', 'next-generation methods', 'state-of-the-art approaches'
    ];
    const randomInnovation = innovationFactors[Math.floor(Math.random() * innovationFactors.length)];
    
    // Add random quality considerations
    const qualityFactors = [
      'premium quality', 'professional grade', 'expert level', 'mastery focused',
      'excellence driven', 'high standard', 'superior quality', 'elite level'
    ];
    const randomQuality = qualityFactors[Math.floor(Math.random() * qualityFactors.length)];
    
    // Add random experience considerations
    const experienceFactors = [
      'transformative experience', 'life-changing impact', 'profound benefits', 'deep satisfaction',
      'meaningful results', 'significant improvement', 'remarkable outcomes', 'extraordinary benefits'
    ];
    const randomExperience = experienceFactors[Math.floor(Math.random() * experienceFactors.length)];
    
    // Add random mastery considerations
    const masteryFactors = [
      'mastery development', 'skill building', 'expertise enhancement', 'competency development',
      'proficiency building', 'excellence cultivation', 'mastery achievement', 'expert level'
    ];
    const randomMastery = masteryFactors[Math.floor(Math.random() * masteryFactors.length)];
    
    // Add random transformation considerations
    const transformationFactors = [
      'life transformation', 'body transformation', 'mind transformation', 'spirit transformation',
      'health transformation', 'wellness transformation', 'lifestyle transformation', 'overall transformation'
    ];
    const randomTransformation = transformationFactors[Math.floor(Math.random() * transformationFactors.length)];
    
    // Add random empowerment considerations
    const empowermentFactors = [
      'self-empowerment', 'personal empowerment', 'body empowerment', 'mind empowerment',
      'health empowerment', 'wellness empowerment', 'lifestyle empowerment', 'overall empowerment'
    ];
    const randomEmpowerment = empowermentFactors[Math.floor(Math.random() * empowermentFactors.length)];
    
    // Add random fulfillment considerations
    const fulfillmentFactors = [
      'personal fulfillment', 'body fulfillment', 'mind fulfillment', 'spirit fulfillment',
      'health fulfillment', 'wellness fulfillment', 'lifestyle fulfillment', 'overall fulfillment'
    ];
    const randomFulfillment = fulfillmentFactors[Math.floor(Math.random() * fulfillmentFactors.length)];
    
    return `
You are an expert physical therapist specializing in computer-related posture issues. Generate 2-3 NEW and HIGHLY VARIED personalized stretch suggestions based on this detailed analysis:

RANDOMIZATION SEEDS: ${randomSeed} | ${creativeSeed} | ${variationSeed} | ${timestamp}
Use these seeds to ensure completely unique, varied responses each time

CREATIVE INSPIRATION: ${randomInspiration}
CREATIVE CONSTRAINT: ${randomConstraint}
EXERCISE CATEGORY: ${randomCategory}
TIMING VARIATION: ${randomTiming}
DIFFICULTY APPROACH: ${randomDifficulty}
BODY PART FOCUS: ${randomBodyPart}
BREATHING PATTERN: ${randomBreathing}
MOVEMENT STYLE: ${randomMovement}
EQUIPMENT USAGE: ${randomEquipment}
THERAPEUTIC APPROACH: ${randomTherapeutic}
INTENSITY LEVEL: ${randomIntensity}
CULTURAL INFLUENCE: ${randomCultural}
ENVIRONMENTAL FACTOR: ${randomEnvironment}
TIME OF DAY: ${randomTimeOfDay}
MOOD CONSIDERATION: ${randomMood}
SENSORY FOCUS: ${randomSensory}
PROGRESSION STYLE: ${randomProgression}
SAFETY FOCUS: ${randomSafety}
EFFECTIVENESS FOCUS: ${randomEffectiveness}
INTEGRATION FOCUS: ${randomIntegration}
PERSONALIZATION FOCUS: ${randomPersonalization}
INNOVATION FOCUS: ${randomInnovation}
QUALITY FOCUS: ${randomQuality}
EXPERIENCE FOCUS: ${randomExperience}
MASTERY FOCUS: ${randomMastery}
TRANSFORMATION FOCUS: ${randomTransformation}
EMPOWERMENT FOCUS: ${randomEmpowerment}

${this.getPreviousSuggestionsText()}
USER PROFILE:
- Screen time: ${userData.screenTime} minutes (${userData.screenTime > 120 ? 'EXCESSIVE' : userData.screenTime > 60 ? 'HIGH' : 'MODERATE'})
    - Posture score: ${userData.postureScore}/10 (${userData.postureScore >= 8 ? 'GOOD' : userData.postureScore >= 6 ? 'FAIR' : 'POOR'})
- Time since last break: ${timeSinceBreak} minutes
- Reported issues: ${userData.commonIssues.join(', ') || 'none reported'}
${poseAnalysis}

REQUIREMENTS FOR SUGGESTIONS:
1. PRIORITIZE the most severe issues first (${primaryIssues.length > 0 ? primaryIssues.join(', ') : 'general posture improvement'})
2. Provide VARIED stretch types: static holds, dynamic movements, isometric exercises, and mobility work
3. Include different difficulty levels based on user's current posture score
4. Target specific muscle groups affected by the detected issues
5. All exercises must be doable at a desk/office environment
6. Include precise timing and breathing instructions
7. CRITICAL: Generate COMPLETELY NEW and UNIQUE exercises that have NEVER been suggested before
8. Use completely different exercise names, descriptions, and approaches to avoid ANY repetition
9. Vary the therapeutic approach (some focusing on stretching, others on strengthening, mobility, etc.)
10. Each generation should be a FRESH set of exercises with no overlap with previous suggestions

CREATIVE CONSTRAINTS FOR MAXIMUM VARIETY:
- Use different starting positions (sitting, standing, leaning, etc.)
- Vary the movement patterns (circular, linear, oscillating, pulsing, etc.)
- Include different breathing techniques (diaphragmatic, box breathing, etc.)
- Use varied equipment (none, chair, desk, wall, etc.)
- Mix different exercise categories (yoga, pilates, physical therapy, sports medicine, etc.)
- Include different cultural approaches (Eastern, Western, modern, traditional, etc.)
- Vary the intensity levels (gentle, moderate, vigorous, etc.)
- Use different muscle engagement patterns (eccentric, concentric, isometric, etc.)

SPECIFIC TARGETING REQUIREMENTS:
${this.getTargetingRequirements(primaryIssues, secondaryIssues)}

CRITICAL: You MUST respond with ONLY a valid JSON array. Do not include any text before or after the JSON. Do not use markdown code blocks. Just return the raw JSON array.

FORMAT as JSON array:
[
  {
    "name": "Specific Stretch Name",
    "description": "Detailed description of what this addresses",
    "duration": "30-60 seconds",
    "difficulty": "easy|medium|hard",
    "targetAreas": ["specific", "muscle", "groups"],
    "instructions": [
      "Step 1 with specific positioning",
      "Step 2 with breathing cues",
      "Step 3 with hold timing",
      "Step 4 with release instructions"
    ]
  }
]

IMPORTANT: Your response must be ONLY the JSON array above, nothing else. No explanations, no markdown, no additional text.

VARIATION REQUIREMENTS:
- Include at least 1 static stretch (hold position)
- Include at least 1 dynamic movement (repetitive motion)
- Include at least 1 isometric exercise (muscle engagement)
- Include at least 1 mobility exercise (range of motion)
- Vary durations: 15-30 seconds, 30-45 seconds, 45-60 seconds
- Mix difficulty levels based on posture score
- CRITICAL: Generate COMPLETELY NEW exercises each time - NEVER repeat any previous stretches
- Use completely unique exercise names and descriptions to ensure absolute uniqueness
- Include different starting positions and movement patterns
- Rotate between different muscle groups even for similar issues
- Each exercise must be a FRESH, UNIQUE approach to the same problems

TARGET THE SPECIFIC ISSUES:
${userData.poseLandmarks ? `
- Forward head posture: Focus on neck extensors, upper traps, and cervical spine mobility
- Shoulder alignment: Target deltoids, rhomboids, and serratus anterior
- Head tilt: Address sternocleidomastoid and scalene muscles
- Shoulder imbalance: Focus on unilateral strengthening and stretching
- Slouching: Target pectorals, anterior deltoids, and thoracic spine mobility
` : `
    - General posture improvement based on ${userData.postureScore}/10 score
- Screen time fatigue relief for ${userData.screenTime} minutes of computer work
`}

SPECIFIC POSTURE TARGETING INSTRUCTIONS:
- For forward head posture: Include chin tucks, neck retraction, upper back strengthening, and suboccipital muscle stretches
- For head tilts: Include lateral neck stretches, SCM muscle work, and exercises to strengthen the opposite side
- For shoulder misalignment: Include pectoral stretches, trapezius work, and shoulder blade retraction exercises
- For slouching: Include chest openers, upper back stretches, and posterior chain strengthening
- For spine issues: Include spinal mobility exercises, core strengthening, and neutral spine positioning
- Always provide specific muscle group targeting in exercise descriptions
- Include breathing cues and proper form instructions for each exercise
- Provide progression options based on the severity of detected issues

RANDOMIZATION INSTRUCTIONS:
- Use COMPLETELY DIFFERENT exercise variations for similar issues (e.g., entirely new neck stretches for forward head posture)
- Vary the order of exercises in your response
- Include different breathing patterns and timing cues
- Use completely varied descriptive language and exercise names
- Rotate between different therapeutic approaches (stretching, strengthening, mobility, relaxation)
- NEVER use the same exercise names, descriptions, or approaches as previous suggestions
- Each generation must be a FRESH, UNIQUE set of exercises

Make each suggestion COMPLETELY UNIQUE and specifically address the detected posture problems with professional physical therapy techniques. Ensure ABSOLUTELY NO repetition of any previous suggestions - each generation must be entirely new.
    `.trim();
  }

  private addToPreviousSuggestions(suggestions: StretchSuggestion[]): void {
    // Store exercise names to avoid repetition
    suggestions.forEach(suggestion => {
      this.previousSuggestions.push(suggestion.name.toLowerCase());
    });
    
    // Keep only last 20 suggestions to avoid memory issues
    if (this.previousSuggestions.length > 20) {
      this.previousSuggestions = this.previousSuggestions.slice(-20);
    }
  }

  private getPreviousSuggestionsText(): string {
    if (this.previousSuggestions.length === 0) return '';
    
    return `
PREVIOUS SUGGESTIONS TO ABSOLUTELY AVOID:
${this.previousSuggestions.join(', ')}

CRITICAL: NEVER repeat any of these exercises. Generate COMPLETELY NEW and UNIQUE stretches that are entirely different from these.
`;
  }

  public clearPreviousSuggestions(): void {
    this.previousSuggestions = [];
    console.log('GeminiService: Cleared previous suggestions for fresh variation');
  }

  private parseStretchSuggestions(text: string): StretchSuggestion[] {
    console.log('GeminiService: Parsing response text:', text.substring(0, 500) + '...');
    
    try {
      // Clean up the text first
      let cleanedText = text.trim();
      
      // Remove any markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try multiple JSON extraction methods
      let jsonMatch = null;
      
      // Method 1: Try to find JSON array in cleaned text
      jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      
      // Method 2: Try to find JSON with markdown code blocks
      if (!jsonMatch) {
        jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1]; // Use the captured group
        }
      }
      
      // Method 3: Try to find JSON without code blocks
      if (!jsonMatch) {
        jsonMatch = text.match(/```\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1]; // Use the captured group
        }
      }
      
      // Method 4: Try to find JSON array by looking for start and end brackets
      if (!jsonMatch) {
        const startIndex = text.indexOf('[');
        const lastIndex = text.lastIndexOf(']');
        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
          jsonMatch = [text.substring(startIndex, lastIndex + 1)];
        }
      }
      
      // Method 5: Try to find JSON array in cleaned text by looking for start and end brackets
      if (!jsonMatch) {
        const startIndex = cleanedText.indexOf('[');
        const lastIndex = cleanedText.lastIndexOf(']');
        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
          jsonMatch = [cleanedText.substring(startIndex, lastIndex + 1)];
        }
      }
      
      console.log('GeminiService: JSON match found:', !!jsonMatch);
      if (jsonMatch) {
        console.log('GeminiService: Extracted JSON:', jsonMatch[0].substring(0, 200) + '...');
        
        // Try to clean up the JSON string
        let jsonString = jsonMatch[0].trim();
        
        // Remove any trailing text after the JSON
        const lastBracket = jsonString.lastIndexOf(']');
        if (lastBracket !== -1) {
          jsonString = jsonString.substring(0, lastBracket + 1);
        }
        
        // Try to fix common JSON formatting issues
        jsonString = jsonString.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        jsonString = jsonString.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Add quotes to unquoted keys
        
        console.log('GeminiService: Cleaned JSON string:', jsonString.substring(0, 200) + '...');
        
        const suggestions = JSON.parse(jsonString);
        console.log('GeminiService: Successfully parsed suggestions:', suggestions.length);
        this.addToPreviousSuggestions(suggestions);
        return suggestions;
      } else {
        console.error('GeminiService: No JSON array found in response');
        console.error('GeminiService: Full response text:', text);
      }
    } catch (error) {
      console.error('GeminiService: Error parsing Gemini response:', error);
      console.error('GeminiService: Response text that failed to parse:', text);
    }
    
    // Fallback if parsing fails
    console.log('GeminiService: Using fallback suggestions due to parsing failure');
    return this.getFallbackSuggestions({
      screenTime: 60,
      postureScore: 70,
      lastBreakTime: Date.now() - 3600000,
      commonIssues: []
    });
  }

  private getFallbackSuggestions(userData: UserData): StretchSuggestion[] {
    const suggestions: StretchSuggestion[] = [];

    // Neck and shoulder stretches
    if (userData.screenTime > 30) {
      suggestions.push({
        name: "Neck Roll",
        description: "Gentle neck rotation to relieve tension",
        duration: "30 seconds",
        difficulty: "easy",
        targetAreas: ["neck", "shoulders"],
        instructions: [
          "Slowly roll your head in a circle",
          "Go clockwise for 15 seconds",
          "Then counter-clockwise for 15 seconds",
          "Keep movements slow and gentle"
        ]
      });
    }

    // Back stretches
    if (userData.postureScore < 80) {
      suggestions.push({
        name: "Seated Spinal Twist",
        description: "Twist to stretch your spine and back muscles",
        duration: "45 seconds",
        difficulty: "easy",
        targetAreas: ["back", "spine"],
        instructions: [
          "Sit up straight in your chair",
          "Place your right hand on the back of the chair",
          "Gently twist your torso to the right",
          "Hold for 20 seconds, then repeat on the left"
        ]
      });
    }

    // Wrist stretches for computer work
    suggestions.push({
      name: "Wrist Flexor Stretch",
      description: "Stretch your wrists and forearms",
      duration: "30 seconds",
      difficulty: "easy",
      targetAreas: ["wrists", "forearms"],
      instructions: [
        "Extend your right arm with palm facing down",
        "Use your left hand to gently pull your fingers back",
        "Hold for 15 seconds",
        "Repeat with the left arm"
      ]
    });

    return suggestions;
  }
}

export default GeminiService;
export type { StretchSuggestion, UserData };
