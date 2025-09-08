<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="UTF-8" />
  <title>ניהול תעריפים - הוספה ותצוגה</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      direction: rtl;
      padding: 20px;
      background: #f9f9f9;
    }
    h2 {
      margin-bottom: 10px;
    }
    form {
      background: white;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 6px;
      box-shadow: 0 0 8px rgba(0,0,0,0.1);
    }
    label {
      display: block;
      margin-top: 10px;
      font-weight: bold;
    }
    input, select {
      width: 200px;
      padding: 6px;
      margin-top: 3px;
      font-size: 14px;
    }
    button {
      margin-top: 15px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 0 8px rgba(0,0,0,0.1);
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: center;
      font-size: 14px;
    }
    th {
      background: #eee;
    }
  </style>
</head>
<body>

  <h2>הוספת תעריף חדש</h2>
  <form id="tarifForm" onsubmit="return false;">
    <label for="סניף">סניף:</label>
    <select id="סניף" name="סניף" required></select>

    <label for="תאריך_התחלה">תאריך התחלה (לועזי בלבד):</label>
    <input type="date" id="תאריך_התחלה" name="תאריך_התחלה" required />

    <label for="תעריף_שמיט">תעריף שמיס:</label>
    <input type="number" id="תעריף_שמיט" name="תעריף_שמיט" required />

    <label for="שבועי">תעריף מבחן שבועי:</label>
    <input type="number" id="שבועי" name="שבועי" required />

    <label for="חודשי">תעריף מבחן חודשי:</label>
    <input type="number" id="חודשי" name="חודשי" required />

    <label for="בסיס">תעריף בסיס:</label>
    <input type="number" id="בסיס" name="בסיס" required />

    <label for="בסיס_חדש">תעריף בסיס חדש:</label>
    <input type="number" id="בסיס_חדש" name="בסיס_חדש" required />

    <label for="חבורה">תעריף חבורה:</label>
    <input type="number" id="חבורה" name="חבורה" required />

    <label for="סוגיה">תעריף סוגיה:</label>
    <input type="number" id="סוגיה" name="סוגיה" required />

    <label for="ערב">תעריף כולל ערב:</label>
    <input type="number" id="ערב" name="ערב" required />

    <label for="ביהז">תעריף כולל ביהז:</label>
    <input type="number" id="ביהז" name="ביהז" required />

    <label for="תלוש">תעריף תלוש:</label>
    <input type="number" id="תלוש" name="תלוש" required />

    <label for="תלוש_חדש">תלוש לחדש:</label>
    <input type="number" id="תלוש_חדש" name="תלוש_חדש" required />

    <label for="מקור">מקור הפקדה:</label>
    <input type="text" id="מקור" name="מקור" required />

    <button onclick="addTarifFromForm()">הוסף תעריף</button>
  </form>

  <h2>רשימת תעריפים לפי סניפים</h2>
  <button onclick="loadTarifim()">טען תעריפים</button>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>שם סניף</th>
        <th>תאריך התחלה</th>
        <th>תאריך סיום</th>
        <th>סטטוס</th>
        <th>שמיס</th>
        <th>שבועי</th>
        <th>חודשי</th>
        <th>בסיס</th>
        <th>בסיס חדש</th>
        <th>חבורה</th>
        <th>סוגיה</th>
        <th>ערב</th>
        <th>ביהז</th>
        <th>תלוש</th>
        <th>תלוש לחדש</th>
        <th>מקור הפקדה</th>
      </tr>
    </thead>
    <tbody id="tarifTableBody"></tbody>
  </table>

<script>
  // עוזר להציג וי או איקס במקום כן/לא
  function formatStatus(status) {
    return status === 'כן' ? '✔️' : '❌';
  }

  // קריאת API
  async function api(fn, params = {}) {
    try {
      const response = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fn, params })
      });
      return await response.json();
    } catch (err) {
      console.error('API error:', err);
      return null;
    }
  }

  // טעינת סניפים לתפריט הנפתח בטופס
  async function loadSnifim() {
    const select = document.getElementById('סניף');
    select.innerHTML = '';
    const data = await api('getall_snifim');
    if (Array.isArray(data)) {
      data.forEach(snif => {
        const option = document.createElement('option');
        option.value = snif['סניף_id'];
        option.textContent = snif['שם סניף'];
        select.appendChild(option);
      });
    } else {
      alert('שגיאה בטעינת הסניפים');
    }
  }

  // טעינת כל התעריפים להצגה בטבלה
  async function loadTarifim() {
    const data = await api('getall_tarifim');
    const tbody = document.getElementById('tarifTableBody');
    tbody.innerHTML = '';

    if (!Array.isArray(data)) {
      tbody.innerHTML = '<tr><td colspan="17">שגיאה בטעינת תעריפים</td></tr>';
      return;
    }

    // סדר לפי סטטוס: קודם 'כן', אחר כך 'לא'
    data.sort((a, b) => (a["סטטוס"] === 'כן' ? -1 : 1));

    data.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${row["שם סניף"] || ""}</td>
        <td>${row["תאריך התחלה"] || ""}</td>
        <td>${row["תאריך סיום"] || ""}</td>
        <td>${formatStatus(row["סטטוס"])}</td>
        <td>${row["תעריף שמיס"] ?? ""}</td>
        <td>${row["תעריף מבחן שבועי"] ?? ""}</td>
        <td>${row["תעריף מבחן חודשי"] ?? ""}</td>
        <td>${row["תעריף בסיס"] ?? ""}</td>
        <td>${row["תעריף בסיס חדש"] ?? ""}</td>
        <td>${row["תעריף חבורה"] ?? ""}</td>
        <td>${row["תעריף סוגיה"] ?? ""}</td>
        <td>${row["תעריף כולל ערב"] ?? ""}</td>
        <td>${row["תעריף כולל ביהז"] ?? ""}</td>
        <td>${row["תעריף תלוש"] ?? ""}</td>
        <td>${row["תלוש לחדש"] ?? ""}</td>
        <td>${row["מקור הפקדה"] ?? ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // הוספת תעריף מהטופס
  async function addTarifFromForm() {
    const body = {
      "תאריך התחלה": document.getElementById("תאריך_התחלה").value,
      "תעריף שמיס": Number(document.getElementById("תעריף_שמיט").value),
      "תעריף מבחן שבועי": Number(document.getElementById("שבועי").value),
      "תעריף מבחן חודשי": Number(document.getElementById("חודשי").value),
      "תעריף בסיס": Number(document.getElementById("בסיס").value),
      "תעריף בסיס חדש": Number(document.getElementById("בסיס_חדש").value),
      "תעריף חבורה": Number(document.getElementById("חבורה").value),
      "תעריף סוגיה": Number(document.getElementById("סוגיה").value),
      "תעריף כולל ערב": Number(document.getElementById("ערב").value),
      "תעריף כולל ביהז": Number(document.getElementById("ביהז").value),
      "תעריף תלוש": Number(document.getElementById("תלוש").value),
      "תלוש לחדש": Number(document.getElementById("תלוש_חדש").value),
      "סטטוס": "כן",
      "מקור הפקדה": document.getElementById("מקור").value,
      "קוד סניף": Number(document.getElementById("סניף").value)
    };

    const res = await api('add_tarif', body);
    if (res && res.ok) {
      alert('התעריף נוסף בהצלחה');
      document.getElementById('tarifForm').reset();

      // איפוס תאריך התחלה לברירת מחדל היום
      const today = new Date().toISOString().slice(0, 10);
      document.getElementById("תאריך_התחלה").value = today;

      // רענון הטבלה
      loadTarifim();
    } else {
      alert('אירעה שגיאה בהוספת התעריף');
    }
  }

  // הפעלה ראשונית
  window.onload = () => {
    loadSnifim();
    loadTarifim();

    // קבע תאריך התחלה כברירת מחדל היום
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("תאריך_התחלה").value = today;
  };
</script>

</body>
</html>
