// קובץ taarif.js — גרסה מתוקנת, משתמש בקבצים כלליים

async function showForm() {
  const content = document.getElementById("content");
  const ldate = new Date().toISOString().slice(0, 10);

  //const ldate = today();
  const hdateText = await getHebDateText(ldate);

  content.innerHTML = `
    <form id="tarifForm" style="background:#fff; padding:20px; border-radius:12px; 
      box-shadow:0 0 10px #ccc; width: max-content; font-size: 1.1rem;
      display: grid; grid-template-columns: max-content max-content; column-gap: 30px; row-gap: 20px; direction: rtl;">
      
      <h3 style="grid-column: 1 / -1;">הוספת תעריף חדש</h3>
      
      <label>סניף: </label><select id="סניף" required style="font-size:1rem; padding:5px"></select>

      <label>תאריך התחלה: </label>
      <div style="display:flex; align-items:center;">
        <input type="date" id="תאריך_התחלה" required style="font-size:1rem; padding:5px" />
        <span id="hebrewDate" style="margin-right: 10px; font-weight: bold;">(${hdateText})</span>
      </div>

      ${/*[
        "שבועי", "חודשי", "בסיס", "בסיס_חדש", "חבורה", "סוגיה",
        "ערב", "ביהז", "תלוש", "תלוש_חדש", "תעריף_שמיט"
      ]*/
      [
        "מבחן שבועי", "מבחן חודשי", "חבורה", "סוגיה", "ערב", "ביהז"
      ]
      
        .map(id => `<label>${id.replace("_", " ")}: </label><input type="number" id="${id}" required style="font-size:1rem; padding:5px" />`)
        .join("")}

      <label>מקור: </label><input type="text" id="מקור" required style="font-size:1rem; padding:5px" />

      <div style="grid-column: 1 / -1; text-align: center;">
        <button type="submit" style="font-size: 1.2rem; padding: 8px 30px;">הוסף</button>
      </div>
    </form>
  `;

  await loadSnifimInto("סניף");
  document.getElementById("תאריך_התחלה").value = ldate;

  document.getElementById("תאריך_התחלה").addEventListener("change", async (e) => {
    const h = await getHebDateText(e.target.value);
    document.getElementById("hebrewDate").textContent = `(${h})`;
  });

  document.getElementById("tarifForm").onsubmit = async (e) => {
    e.preventDefault();
    const body = {
      "תאריך התחלה": document.getElementById("תאריך_התחלה").value,
      //"תעריף שמיס": +document.getElementById("תעריף_שמיט").value,
      "תעריף מבחן שבועי": +document.getElementById("מבחן שבועי").value,
      "תעריף מבחן חודשי": +document.getElementById("מבחן חודשי").value,
      //"תעריף בסיס": +document.getElementById("בסיס").value,
     // "תעריף בסיס חדש": +document.getElementById("בסיס_חדש").value,
      "תעריף חבורה": +document.getElementById("חבורה").value,
      "תעריף סוגיה": +document.getElementById("סוגיה").value,
      "תעריף כולל ערב": +document.getElementById("ערב").value,
      "תעריף כולל ביהז": +document.getElementById("ביהז").value,
      //"תעריף תלוש": +document.getElementById("תלוש").value,
      //"תלוש לחדש": +document.getElementById("תלוש_חדש").value,
      "סטטוס": "כן",
      "מקור הפקדה": document.getElementById("מקור").value,
      "קוד סניף": +document.getElementById("סניף").value,
    };
    const res = await api("add_tarif", body);
    if (res?.ok) {
      alert("תעריף נוסף בהצלחה");
      showTable();
    } else {
      alert("שגיאה בהוספה");
    }
  };
}

async function showTable() {
  const content = document.getElementById("content");
  const [data, snifim] = await Promise.all([
    api("getall_tarifim"),
    api("getall_snifim")
  ]);

  const selectHtml = `<label>בחר סניף: <select id="filterSnif">
    <option value="">-- כל הסניפים --</option>
    ${snifim.map(s => `<option value="${s["סניף_id"]}">${s["שם סניף"]}</option>`).join("")}
  </select></label><br><br>`;

  let html = `<table id="tarifTable" border="1" cellpadding="6" style="background:white;border-collapse:collapse">
    <thead style="background:#ddd">
      <tr>
        <th>סניף</th><th>תאריך התחלה</th><th>תאריך התחלה (עברי)</th>
        <th>תאריך סיום</th><th>תאריך סיום (עברי)</th>
        <th>סטטוס</th><th>מבחן שבועי</th><th>מבחן חודשי</th>
        <th>חבורה</th><th>סוגיה</th><th>ערב</th>
        <th>ביהז</th><th>מקור</th>
      </tr>
    </thead><tbody id="tarifBody">`;

  const sorted = data.sort((a, b) => b["סטטוס"] === "כן" ? 1 : -1);

  for (const row of sorted) {
    const hstart = await getHebDateText(row["תאריך התחלה"] ?? "");
    const hend = row["תאריך סיום"] ? await getHebDateText(row["תאריך סיום"]) : "";

    html += `<tr data-snif="${row["קוד סניף"]}">
      <td>${row["שם סניף"]}</td>
      <td>${row["תאריך התחלה"] ?? ""}</td><td>${hstart}</td>
      <td>${row["תאריך סיום"] ?? ""}</td><td>${hend}</td>
      <td>${row["סטטוס"] === "כן" ? "✔️" : "❌"}</td>
      <td>${row["תעריף מבחן שבועי"]}</td>
      <td>${row["תעריף מבחן חודשי"]}</td>
      
      <td>${row["תעריף חבורה"]}</td>
      <td>${row["תעריף סוגיה"]}</td>
      <td>${row["תעריף כולל ערב"]}</td>
      <td>${row["תעריף כולל ביהז"]}</td>
      
      <td>${row["מקור הפקדה"]}</td>
    </tr>`;
  }

  html += `</tbody></table>`;
  content.innerHTML = selectHtml + html;

  document.getElementById("filterSnif").addEventListener("change", (e) => {
    const val = e.target.value;
    document.querySelectorAll("#tarifBody tr").forEach(row => {
      row.style.display = !val || row.dataset.snif === val ? "" : "none";
    });
  });
}
