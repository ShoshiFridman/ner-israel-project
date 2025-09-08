<form id="tarifForm" onsubmit="return false;">
  <label>סניף:</label>
  <select id="סניף" required></select>

  <label>תאריך התחלה:</label>
  <input type="date" id="תאריך_התחלה" required />

  <label>תעריף שמיס:</label>
  <input type="number" id="תעריף_שמיט" required />

  <label>תעריף שבועי:</label>
  <input type="number" id="שבועי" required />

  <label>תעריף חודשי:</label>
  <input type="number" id="חודשי" required />

  <label>תעריף בסיס:</label>
  <input type="number" id="בסיס" required />

  <label>תעריף בסיס חדש:</label>
  <input type="number" id="בסיס_חדש" required />

  <label>תעריף חבורה:</label>
  <input type="number" id="חבורה" required />

  <label>תעריף סוגיה:</label>
  <input type="number" id="סוגיה" required />

  <label>תעריף ערב:</label>
  <input type="number" id="ערב" required />

  <label>תעריף ביה"ז:</label>
  <input type="number" id="ביהז" required />

  <label>תעריף תלוש:</label>
  <input type="number" id="תלוש" required />

  <label>תלוש לחדש:</label>
  <input type="number" id="תלוש_חדש" required />

  <label>מקור הפקדה:</label>
  <input type="text" id="מקור" required />

  <button onclick="addTarifFromForm()">הוסף</button>
</form>

<script>
  async function api(fn, params = {}) {
    const res = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fn, params })
    });
    return await res.json();
  }

  async function loadSnifim() {
    const data = await api('getall_snifim');
    const select = document.getElementById('סניף');
    data.forEach(snif => {
      const opt = document.createElement('option');
      opt.value = snif['סניף_id'];
      opt.textContent = snif['שם סניף'];
      select.appendChild(opt);
    });
  }

  async function addTarifFromForm() {
    const body = {
      "תאריך התחלה": document.getElementById("תאריך_התחלה").value,
      "תעריף שמיס": +document.getElementById("תעריף_שמיט").value,
      "תעריף מבחן שבועי": +document.getElementById("שבועי").value,
      "תעריף מבחן חודשי": +document.getElementById("חודשי").value,
      "תעריף בסיס": +document.getElementById("בסיס").value,
      "תעריף בסיס חדש": +document.getElementById("בסיס_חדש").value,
      "תעריף חבורה": +document.getElementById("חבורה").value,
      "תעריף סוגיה": +document.getElementById("סוגיה").value,
      "תעריף כולל ערב": +document.getElementById("ערב").value,
      "תעריף כולל ביהז": +document.getElementById("ביהז").value,
      "תעריף תלוש": +document.getElementById("תלוש").value,
      "תלוש לחדש": +document.getElementById("תלוש_חדש").value,
      "סטטוס": "כן",
      "מקור הפקדה": document.getElementById("מקור").value,
      "קוד סניף": +document.getElementById("סניף").value
    };
    const res = await api('add_tarif', body);
    alert(res && res.ok ? 'נוסף בהצלחה' : 'שגיאה בהוספה');
    document.getElementById('tarifForm').reset();
  }

  loadSnifim();
  document.getElementById("תאריך_התחלה").value = new Date().toISOString().slice(0, 10);
</script>

