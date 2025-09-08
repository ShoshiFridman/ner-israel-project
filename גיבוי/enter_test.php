<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8" />
    <title>הזנת מבחנים לאברכים</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://unpkg.com/hebcal@2.5.4/dist/hebcal.min.js"></script>
    <script src="../js/api.js" defer></script>

    <script src="../js/hebrewDateUtils.js" defer></script>
    <script src="../js/avrechimTable.js" defer></script>
    <script src="../js/filters.js" defer></script>
    <script src="../js/util_snif.js" defer></script>

    <script src="../mjs/util_new.js"defer></script>
    <script src="../mjs/simpletbl.js" defer></script>
    <script src="../mjs/enter_tests.js" defer></script>

    <style>
        body {
            font-family: sans-serif;
            direction: rtl;
            padding: 20px;
        }
        label {
            margin-left: 10px;
        }
        select {
            margin-left: 10px;
        }
        table {
            margin-top: 20px;
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #aaa;
            padding: 6px;
            text-align: center;
        }
        th {
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <h2>הזנת מבחנים חודשיים</h2>

    <div>
        <label for="snifSelect">סניף:</label>
        <select id="snifSelect"></select>

        <label for="groupSelect">קבוצה:</label>
        <select id="groupSelect"></select>
        <div style="margin-top: 10px;">
  
<input type="text" id="avrechSearch" list="avrechList" placeholder="חפש לפי שם אברך" oninput="refreshAvrechim()" />
<datalist id="avrechList"></datalist>

        <label for="hebMonthSelect">חודש עברי:</label>
        <select id="hebMonthSelect"></select>
    </div>
    <input type="hidden" id="gregDate" name="gregDate">

    <br />
    <div id="tableContainer"></div>

    <br />
    <button onclick="saveAllTests()">💾 שמור מבחנים</button>

</body>
</html>
