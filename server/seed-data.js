const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'incidents.db');
const db = new sqlite3.Database(dbPath);

const sampleIncidents = [
  {
    title: 'Student disruptive during lesson',
    description: 'Student repeatedly interrupted the teacher during math lesson',
    category: 'disruptive-behavior',
    location: 'Room 201',
    reporterName: 'Mrs. Johnson',
    reporterEmail: 'johnson@school.edu',
    studentName: 'Alex Rodriguez',
    dateTime: '2024-01-15T10:30:00',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Student helping classmate with assignment',
    description: 'Student voluntarily helped struggling classmate understand the science project',
    category: 'helping-peers',
    location: 'Room 105',
    reporterName: 'Mr. Davis',
    reporterEmail: 'davis@school.edu',
    studentName: 'Sarah Chen',
    dateTime: '2024-01-14T14:20:00',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Student refusing to follow directions',
    description: 'Student refused to put away phone when asked multiple times',
    category: 'defiance-non-compliance',
    location: 'Room 302',
    reporterName: 'Ms. Wilson',
    reporterEmail: 'wilson@school.edu',
    studentName: 'Alex Rodriguez',
    dateTime: '2024-01-13T09:15:00',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Student demonstrating leadership',
    description: 'Student organized group activity and helped coordinate team efforts',
    category: 'leadership-initiative',
    location: 'Room 105',
    reporterName: 'Mr. Davis',
    reporterEmail: 'davis@school.edu',
    studentName: 'Sarah Chen',
    dateTime: '2024-01-12T11:00:00',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Student off-task during independent work',
    description: 'Student was playing games on phone instead of completing assigned work',
    category: 'off-task',
    location: 'Room 201',
    reporterName: 'Mrs. Johnson',
    reporterEmail: 'johnson@school.edu',
    studentName: 'Michael Thompson',
    dateTime: '2024-01-11T13:45:00',
    createdAt: new Date().toISOString()
  }
];

// Insert sample data
sampleIncidents.forEach(incident => {
  const sql = `INSERT INTO incidents (title, description, category, location, reporterName, reporterEmail, studentName, dateTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [incident.title, incident.description, incident.category, incident.location, incident.reporterName, incident.reporterEmail, incident.studentName, incident.dateTime, incident.createdAt];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error inserting incident:', err);
    } else {
      console.log(`Inserted incident ID: ${this.lastID}`);
    }
  });
});

console.log('Sample data insertion complete!');
db.close(); 