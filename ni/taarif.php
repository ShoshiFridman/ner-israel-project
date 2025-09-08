<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="UTF-8">
  <title>ניהול תעריפים</title>
  <style>
    body { font-family: sans-serif; direction: rtl; padding: 30px; background: #f0f0f0; }
    h1 { margin-bottom: 20px; }
    button { font-size: 16px; padding: 10px 20px; margin: 10px; cursor: pointer; }
    #content { margin-top: 30px; }
  </style>
  <script src="../js/api.js" defer></script>
  <script src="../js/hebrewDateUtils.js" defer></script>
  <script src="../js/util_snif.js" defer></script>
  <script src="../mjs/tosafot.js" defer></script>

  <script src="../mjs/taarif.js" defer></script>
</head>
<body>
  <h1>ניהול תעריפים</h1>
  <button onclick="showForm()">➕ הוספת תעריף חדש</button>
  <button onclick="showTable()">📋 הצגת רשימת תעריפים</button>
  <button onclick="loadTosafot()">תוספות</button>
  <div id="content"></div>
</body>
</html>
