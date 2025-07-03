// Google Apps Script to create Google Sheets from incident data
// Deploy this as a web app to enable direct Google Sheets creation

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const incidents = data.incidents;
    const title = data.title || 'Incident Log';
    
    // Create a new Google Sheet
    const spreadsheet = SpreadsheetApp.create(title);
    const sheet = spreadsheet.getActiveSheet();
    
    // Rename the sheet to "Behavior Tracker"
    sheet.setName('Behavior Tracker');
    
    // Set headers
    const headers = ['Student', 'Date/Time', 'Description', 'Category', 'Location', 'Reporter Name', 'Reporter Email'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#3eb8ea');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    
    // Add data if incidents exist
    if (incidents && incidents.length > 0) {
      const rows = incidents.map(incident => [
        incident.studentName,
        incident.dateTime,
        incident.description,
        incident.category,
        incident.location,
        incident.reporterName,
        incident.reporterEmail
      ]);
      
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, headers.length);
    }
    
    // Return the spreadsheet URL
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        spreadsheetId: spreadsheet.getId(),
        spreadsheetUrl: spreadsheet.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Google Apps Script is running. Use POST to create sheets.')
    .setMimeType(ContentService.MimeType.TEXT);
} 