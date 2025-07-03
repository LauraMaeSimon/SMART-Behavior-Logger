const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Load reporter names and student names from the database at startup
const dbPath = path.join(__dirname, 'incidents.db');
const db = new sqlite3.Database(dbPath);
let reporterList = [];
let studentList = [];
let reporterEmailMap = {};

function loadExistingData() {
  // Load reporter names and emails
  db.all('SELECT DISTINCT reporterName, reporterEmail FROM incidents WHERE reporterName IS NOT NULL AND reporterName != ""', [], (err, rows) => {
    if (!err && rows) {
      reporterList = rows.map(r => r.reporterName.trim()).filter(Boolean);
      // Create a map of reporter names to emails
      rows.forEach(row => {
        if (row.reporterName && row.reporterEmail) {
          reporterEmailMap[row.reporterName.trim()] = row.reporterEmail.trim();
        }
      });
    }
  });
  
  // Load student names
  db.all('SELECT DISTINCT studentName FROM incidents WHERE studentName IS NOT NULL AND studentName != ""', [], (err, rows) => {
    if (!err && rows) {
      studentList = rows.map(r => r.studentName.trim()).filter(Boolean);
    }
  });
}

loadExistingData();
// Refresh data every 5 minutes
setInterval(loadExistingData, 5 * 60 * 1000);

router.post('/parse-incident', async (req, res) => {
  const { transcript } = req.body;
  const prompt = `Extract incident information from this text and return a JSON object with these fields:
- studentName: The name of the student(s) involved
- category: The type of incident (choose from: disruptive-behavior, off-task, defiance-non-compliance, disrespectful-language, peer-conflict, respectful-participation, on-task-engagement, helping-peers, leadership-initiative, note)
- location: Where the incident occurred (room number, classroom, hallway, etc.)
- reporterName: Who is reporting this incident
- reporterEmail: Email of the reporter (if mentioned)
- description: A detailed description of what happened, including any additional context or notes

Analyze the text carefully and choose the most appropriate category based on the behavior described. For location, extract specific places mentioned. For description, include all relevant details about the incident.

Text: """${transcript}"""

Return only the JSON object, no other text.`;

  try {
    const response = await hf.textGeneration({
      model: 'microsoft/DialoGPT-medium', // Using a free model
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.1,
        do_sample: false
      }
    });

    const text = response.generated_text;
    
    // Extract JSON from the response
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      // If no JSON found, try to parse the response manually
      const fallbackResult = parseFallback(transcript);
      return res.json(fallbackResult);
    }
    
    const json = JSON.parse(jsonMatch[0]);
    // Always set timestamp to current time
    json.dateTime = new Date().toISOString();
    res.json(json);
  } catch (error) {
    console.error('Hugging Face API error:', error);
    // Use fallback parser if API fails
    const fallbackResult = parseFallback(transcript);
    res.json(fallbackResult);
  }
});

// Fallback parser function
function parseFallback(transcript) {
  const result = {
    studentName: '',
    category: '',
    location: '',
    reporterName: '',
    reporterEmail: '',
    description: '',
    dateTime: new Date().toISOString()
  };

  const lowerTranscript = transcript.toLowerCase();

  // Look for student names using the studentList from database
  for (const student of studentList) {
    if (student && lowerTranscript.includes(student.toLowerCase())) {
      result.studentName = student;
      break;
    }
  }

  // If no student found in database, use regex patterns
  if (!result.studentName) {
    const studentPatterns = [
      /student\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
      /child\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:was|is|had|got|got into|involved in)/i,
      /(?:incident with|problem with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of studentPatterns) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        result.studentName = match[1].trim();
        break;
      }
    }
  }

  // Look for locations - more comprehensive patterns
  const locationPatterns = [
    /room\s+(\d+)/i,
    /(?:in|at|location)\s+([^,\.]+)/i,
    /(?:classroom|hallway|cafeteria|gym|library|office|bathroom|playground)\s*(\d*)/i,
    /(?:building|floor)\s+([^,\.]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      if (pattern.source.includes('room')) {
        result.location = `Room ${match[1]}`;
      } else if (match[1]) {
        result.location = match[0].trim();
      } else {
        result.location = match[0].trim();
      }
      break;
    }
  }

  // Look for reporter names using the reporterList from database
  for (const reporter of reporterList) {
    if (reporter && lowerTranscript.includes(reporter.toLowerCase())) {
      result.reporterName = reporter;
      // Auto-fill email if available
      if (reporterEmailMap[reporter]) {
        result.reporterEmail = reporterEmailMap[reporter];
      }
      break;
    }
  }

  // If not found, use regex patterns
  if (!result.reporterName) {
    const reporterPatterns = [
      /reported by\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
      /reporter\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
      /(?:mr\.|mrs\.|miss|ms\.|dr\.)\s+([a-zA-Z]+)/i
    ];
    for (const pattern of reporterPatterns) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        const reporterName = match[1].trim();
        result.reporterName = reporterName;
        // Check if we have an email for this reporter
        if (reporterEmailMap[reporterName]) {
          result.reporterEmail = reporterEmailMap[reporterName];
        }
        break;
      }
    }
  }

  // Look for common incident categories - more comprehensive
  const categories = {
    // Disruptive behavior
    'fighting': 'disruptive-behavior',
    'fight': 'disruptive-behavior',
    'throwing': 'disruptive-behavior',
    'threw': 'disruptive-behavior',
    'yelling': 'disruptive-behavior',
    'screaming': 'disruptive-behavior',
    'disruptive': 'disruptive-behavior',
    'running': 'disruptive-behavior',
    'ran': 'disruptive-behavior',
    'jumping': 'disruptive-behavior',
    'climbing': 'disruptive-behavior',
    'banging': 'disruptive-behavior',
    'slamming': 'disruptive-behavior',
    
    // Off task
    'off task': 'off-task',
    'off-task': 'off-task',
    'not working': 'off-task',
    'not doing work': 'off-task',
    'distracted': 'off-task',
    'daydreaming': 'off-task',
    'playing': 'off-task',
    'drawing': 'off-task',
    'talking': 'off-task',
    'chatting': 'off-task',
    
    // Defiance
    'refusing': 'defiance-non-compliance',
    'refused': 'defiance-non-compliance',
    'defiant': 'defiance-non-compliance',
    'won\'t': 'defiance-non-compliance',
    'will not': 'defiance-non-compliance',
    'ignoring': 'defiance-non-compliance',
    'ignored': 'defiance-non-compliance',
    'disobeying': 'defiance-non-compliance',
    'disobeyed': 'defiance-non-compliance',
    
    // Peer conflict
    'bullying': 'peer-conflict',
    'bully': 'peer-conflict',
    'conflict': 'peer-conflict',
    'argument': 'peer-conflict',
    'arguing': 'peer-conflict',
    'teasing': 'peer-conflict',
    'teased': 'peer-conflict',
    'pushing': 'peer-conflict',
    'pushed': 'peer-conflict',
    'hitting': 'peer-conflict',
    'hit': 'peer-conflict',
    
    // Disrespectful language
    'disrespectful': 'disrespectful-language',
    'rude': 'disrespectful-language',
    'swearing': 'disrespectful-language',
    'cursing': 'disrespectful-language',
    'inappropriate language': 'disrespectful-language',
    'bad words': 'disrespectful-language',
    
    // Positive behaviors
    'participated': 'respectful-participation',
    'participating': 'respectful-participation',
    'helped': 'helping-peers',
    'helping': 'helping-peers',
    'assisted': 'helping-peers',
    'leadership': 'leadership-initiative',
    'led': 'leadership-initiative',
    'on task': 'on-task-engagement',
    'working': 'on-task-engagement',
    'focused': 'on-task-engagement',
    'concentrating': 'on-task-engagement'
  };

  // Check for category matches
  for (const [keyword, category] of Object.entries(categories)) {
    if (lowerTranscript.includes(keyword)) {
      result.category = category;
      break;
    }
  }

  // If no category found, default to note
  if (!result.category) {
    result.category = 'note';
  }

  // Build a comprehensive description
  let descriptionParts = [];
  
  // Add student info if found
  if (result.studentName) {
    descriptionParts.push(`${result.studentName}`);
  }
  
  // Add behavior description
  if (result.category !== 'note') {
    const behaviorMap = {
      'disruptive-behavior': 'was disruptive',
      'off-task': 'was off task',
      'defiance-non-compliance': 'was defiant',
      'disrespectful-language': 'used disrespectful language',
      'peer-conflict': 'had a conflict with peers',
      'respectful-participation': 'participated well',
      'on-task-engagement': 'was on task',
      'helping-peers': 'helped peers',
      'leadership-initiative': 'demonstrated leadership'
    };
    descriptionParts.push(behaviorMap[result.category] || 'had an incident');
  }
  
  // Add location if found
  if (result.location) {
    descriptionParts.push(`in ${result.location}`);
  }
  
  // Add original transcript as additional context
  descriptionParts.push(`- ${transcript}`);
  
  result.description = descriptionParts.join(' ') + '.';
  
  // If no description was built, use the original transcript
  if (!result.description || result.description === '.') {
    result.description = transcript;
  }

  return result;
}

module.exports = router; 