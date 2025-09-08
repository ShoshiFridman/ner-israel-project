<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8" />
    <title>הזנת נתונים חודשיים</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://unpkg.com/hebcal@2.5.4/dist/hebcal.min.js"></script>
    <script src="../js/api.js" defer></script>

    <script src="../js/hebrewDateUtils.js" defer></script>
    <script src="../js/avrechimTable.js" defer></script>
    <script src="../js/filters.js" defer></script>
    <script src="../js/util_snif.js" defer></script>
    <script src="../js/fixes.js"></script>


    <script src="../mjs/simpletbl.js" defer></script>
    <script src="../mjs/modal.js" defer></script>

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
        .fix-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 2px 6px;
  margin: 0 2px;
  line-height: 1;
}
.fix-btn:hover {
  background-color: #e0e0e0;
  border-radius: 4px;
}
.filters-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.actions-panel {
    margin-right: auto; /* דוחף את הכפתורים לשמאל ב־RTL */
    display: flex;
    gap: 10px;
    border: 1px solid #ccc;
    padding: 8px 12px;
    background-color: #f9f9f9;
    border-radius: 6px;
}

.action-btn {
    background-color: #4CAF50; /* ירוק */
    color: white;
    border: none;
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.action-btn:hover {
    background-color: #45a049;
}
#prevMonths {
  display: flex;
  gap: 6px;
  overflow-x: auto; /* גלילה אופקית */
  white-space: nowrap; /* למנוע מעבר שורה */
  border: 1px solid #ccc;
  padding: 6px;
  border-radius: 6px;
  max-width: 100%; /* ניתן לשנות לרוחב רצוי */
  background-color: #fafafa;
}

.month-btn {
  display: inline-block;
  border: 1px solid #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
  white-space: nowrap;
}

.month-btn.selected {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}





    </style>
</head>
<body>

    <h2> ניהול חודשי</h2>

    <div>
        <label for="snifSelect">סניף:</label>
        <select id="snifSelect"></select>

        <label for="groupSelect">קבוצה:</label>
        <select id="groupSelect"></select>
        <div class="filters-row">
    <input type="text" id="avrechSearch" list="avrechList" placeholder="חפש לפי שם אברך" oninput="refreshAvrechim()" />
    <datalist id="avrechList"></datalist>

    <label for="hebMonth">חודש:</label>
    <select id="hebMonth"></select>

    <label for="hebYear">שנה:</label>
    <select id="hebYear"></select>
    <div id="prevMonthsContainer" style="display:none; margin:10px 0;">
  <label>בחר חודשים קודמים עבור חישוב ממוצע למלגה החודשית:</label>
  <div id="prevMonths"></div>
</div>

    <div class="actions-panel">
    <button class="action-btn" onclick="createMonthlyMilga()"> צור נתוני מלגה חודשית</button>

    <button class="action-btn" onclick="firstPayment()">צור הפקדה ראשונה</button>
    <button class="action-btn" onclick="otherPayment()">פעימה נוספת</button>
  <button class="action-btn" onclick="openGeneralDepositModal()">קבע מקור הפקדה כללי</button>

</div>

    <div id="generalDepositModal" style="display: none; position: fixed; top: 30%; right: 30%; background: white; padding: 20px; border: 1px solid gray; z-index: 1000;">
  <h3>הפקדה כללית</h3>
  <label>בחר מקור הפקדה:</label>
  <select id="depositSource">
    <option value="בית_יצחק">בית יצחק</option>
    <option value="גמח_נר_ישראל">גמח נר ישראל</option>
  </select><br><br>
  <label>סכום:</label>
  <input type="number" id="depositAmount" /><br><br>
  <button onclick="applyGeneralDeposit()">אישור</button>
  <button onclick="document.getElementById('generalDepositModal').style.display='none'">ביטול</button>
</div>

</div>

    <input type="hidden" id="gregDate" name="gregDate">

    <br />
    <div id="tableContainer"></div>

    <br />
    <button onclick="saveAllTests()">💾 שמור </button>
   
</body>
</html>
