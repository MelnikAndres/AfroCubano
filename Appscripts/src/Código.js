function doGet(e) {
  const ss = SpreadsheetApp.openById('1AT3R8hj_MDcAfx8C-9TURI2U1murs3qnoop4AeGk-LM');
  let sheet = ss.getSheetByName('Pasos');
  const dataRange= sheet.getDataRange();
  const values = dataRange.getValues(); // still use for other columns

  // Remove header row
  values.shift();

  const result = values.map((row, i) => {
    return {
      nombre: row[0],
      orisha: row[1],
      audio: row[2] ? row[2].toLowerCase() === 'si' : false,
      enganche: row[3],
      video: row[4] ? row[4].toLowerCase() === 'si' : false,
    };
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

