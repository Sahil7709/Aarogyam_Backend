// utils/medicalNLP.js
// Natural Language Processing utilities for medical symptom analysis

// Common medical symptoms and their categories
const MEDICAL_SYMPTOMS = {
  // Cardiovascular symptoms
  chest_pain: ['chest pain', 'heart pain', 'chest discomfort', 'pressure in chest'],
  palpitations: ['palpitations', 'heart racing', 'irregular heartbeat'],
  shortness_of_breath: ['shortness of breath', 'difficulty breathing', 'breathlessness', 'cannot breathe'],
  
  // Neurological symptoms
  headache: ['headache', 'head ache', 'migraine', 'head pain'],
  dizziness: ['dizziness', 'dizzy', 'lightheaded', 'vertigo'],
  numbness: ['numbness', 'tingling', 'pins and needles'],
  
  // Digestive symptoms
  nausea: ['nausea', 'feeling sick', 'queasy'],
  vomiting: ['vomiting', 'throwing up', 'emesis'],
  abdominal_pain: ['stomach pain', 'abdominal pain', 'belly pain', 'cramps'],
  diarrhea: ['diarrhea', 'loose stools', 'watery stool'],
  constipation: ['constipation', 'cannot poop', 'infrequent bowel movements'],
  
  // Musculoskeletal symptoms
  joint_pain: ['joint pain', 'arthritis', 'aching joints'],
  muscle_pain: ['muscle pain', 'myalgia', 'aching muscles'],
  back_pain: ['back pain', 'lower back pain', 'spine pain'],
  
  // Respiratory symptoms
  cough: ['cough', 'coughing'],
  sore_throat: ['sore throat', 'throat pain', 'scratchy throat'],
  congestion: ['congestion', 'stuffy nose', 'blocked nose'],
  
  // General symptoms
  fever: ['fever', 'temperature', 'hot', 'chills'],
  fatigue: ['fatigue', 'tiredness', 'exhaustion', 'low energy'],
  weight_loss: ['weight loss', 'losing weight', 'unintentional weight loss'],
  weight_gain: ['weight gain', 'gaining weight', 'unintentional weight gain']
};

// Common medical conditions and their associated symptoms
const MEDICAL_CONDITIONS = {
  common_cold: {
    name: 'Common Cold',
    symptoms: ['cough', 'sore_throat', 'congestion', 'fever', 'fatigue'],
    urgency: 'low'
  },
  flu: {
    name: 'Influenza (Flu)',
    symptoms: ['fever', 'cough', 'fatigue', 'muscle_pain', 'headache'],
    urgency: 'medium'
  },
  anxiety: {
    name: 'Anxiety',
    symptoms: ['palpitations', 'shortness_of_breath', 'dizziness', 'chest_pain'],
    urgency: 'low'
  },
  hypertension: {
    name: 'High Blood Pressure',
    symptoms: ['headache', 'dizziness', 'chest_pain', 'shortness_of_breath'],
    urgency: 'medium'
  }
};

// Response templates for different scenarios
const RESPONSE_TEMPLATES = {
  greeting: [
    "Hello! I'm here to help you with your health concerns. Please describe your symptoms in detail.",
    "Hi there! I'm your medical assistant. Tell me what's troubling you today.",
    "Welcome! I'm here to provide medical guidance. Please share your symptoms with me."
  ],
  
  symptom_acknowledgment: [
    "I understand you're experiencing {symptom}. That can be concerning.",
    "Thank you for sharing that you have {symptom}. Let's get some more information.",
    "I've noted your {symptom}. Let's explore this further."
  ],
  
  follow_up_questions: [
    "How long have you been experiencing this?",
    "Have you noticed any triggers or patterns?",
    "Are you taking any medications for this?",
    "Have you had similar symptoms before?",
    "On a scale of 1-10, how severe is the discomfort?"
  ],
  
  general_advice: [
    "It's important to stay hydrated and get plenty of rest.",
    "Monitoring your symptoms closely is recommended.",
    "Keeping a symptom diary might help identify patterns."
  ],
  
  urgent_care: [
    "Based on your symptoms, you should seek immediate medical attention.",
    "These symptoms warrant prompt evaluation by a healthcare provider.",
    "Please consider visiting an urgent care center or emergency room."
  ],
  
  routine_care: [
    "This doesn't appear to be an emergency, but you should schedule an appointment with your doctor.",
    "These symptoms should be evaluated by a healthcare professional at your earliest convenience.",
    "Consider making an appointment with your primary care physician to discuss these symptoms."
  ]
};

/**
 * Analyze user message for medical symptoms
 * @param {string} message - User's message
 * @returns {Array} - Array of detected symptoms
 */
export const analyzeSymptoms = (message) => {
  const detectedSymptoms = [];
  const lowerMessage = message.toLowerCase();
  
  // Check for symptoms in the message
  for (const [symptomKey, symptomVariants] of Object.entries(MEDICAL_SYMPTOMS)) {
    for (const variant of symptomVariants) {
      if (lowerMessage.includes(variant)) {
        detectedSymptoms.push({
          key: symptomKey,
          description: variant,
          matchedText: variant
        });
        break; // Avoid duplicate detection for the same symptom category
      }
    }
  }
  
  return detectedSymptoms;
};

/**
 * Identify possible medical conditions based on symptoms
 * @param {Array} symptoms - Array of detected symptoms
 * @returns {Array} - Array of possible conditions
 */
export const identifyConditions = (symptoms) => {
  const possibleConditions = [];
  const symptomKeys = symptoms.map(symptom => symptom.key);
  
  // Check for matching conditions
  for (const [conditionKey, conditionData] of Object.entries(MEDICAL_CONDITIONS)) {
    const matchingSymptoms = conditionData.symptoms.filter(symptom => 
      symptomKeys.includes(symptom)
    );
    
    if (matchingSymptoms.length > 0) {
      possibleConditions.push({
        key: conditionKey,
        name: conditionData.name,
        matchedSymptoms: matchingSymptoms,
        confidence: matchingSymptoms.length / conditionData.symptoms.length,
        urgency: conditionData.urgency
      });
    }
  }
  
  // Sort by confidence (highest first)
  possibleConditions.sort((a, b) => b.confidence - a.confidence);
  
  return possibleConditions;
};

/**
 * Generate a response based on detected symptoms and conditions
 * @param {Array} symptoms - Detected symptoms
 * @param {Array} conditions - Possible conditions
 * @returns {string} - Generated response
 */
export const generateResponse = (symptoms, conditions) => {
  // If no symptoms detected, provide a general response
  if (symptoms.length === 0) {
    const greetings = RESPONSE_TEMPLATES.greeting;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Acknowledge the primary symptom
  const primarySymptom = symptoms[0];
  const acknowledgments = RESPONSE_TEMPLATES.symptom_acknowledgment;
  let response = acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
    .replace('{symptom}', primarySymptom.description);
  
  // Add follow-up question
  const followUps = RESPONSE_TEMPLATES.follow_up_questions;
  response += ' ' + followUps[Math.floor(Math.random() * followUps.length)];
  
  // If conditions identified, provide guidance
  if (conditions.length > 0) {
    const primaryCondition = conditions[0];
    response += ` Based on your symptoms, this could be related to ${primaryCondition.name}.`;
    
    // Add urgency-based advice
    if (primaryCondition.urgency === 'high') {
      const urgentAdvice = RESPONSE_TEMPLATES.urgent_care;
      response += ' ' + urgentAdvice[Math.floor(Math.random() * urgentAdvice.length)];
    } else {
      const routineAdvice = RESPONSE_TEMPLATES.routine_care;
      response += ' ' + routineAdvice[Math.floor(Math.random() * routineAdvice.length)];
    }
  } else {
    // General advice when no specific conditions identified
    const generalAdvice = RESPONSE_TEMPLATES.general_advice;
    response += ' ' + generalAdvice[Math.floor(Math.random() * generalAdvice.length)];
  }
  
  return response;
};

/**
 * Process a user message and generate an appropriate medical response
 * @param {string} message - User's message
 * @returns {Object} - Response object with detected symptoms, conditions, and generated response
 */
export const processMedicalMessage = (message) => {
  // Analyze symptoms in the message
  const symptoms = analyzeSymptoms(message);
  
  // Identify possible conditions
  const conditions = identifyConditions(symptoms);
  
  // Generate response
  const response = generateResponse(symptoms, conditions);
  
  return {
    symptoms,
    conditions,
    response,
    timestamp: new Date()
  };
};

export default {
  analyzeSymptoms,
  identifyConditions,
  generateResponse,
  processMedicalMessage
};