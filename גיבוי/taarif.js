// קובץ taarif.js מתוקן ומשופר

async function api(fn, params = {}) {
  const res = await fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fn, params }),
  });
  return res.json();
}

function today() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

async function getHebrewDate(ldate) {
  if (!ldate) return "";
  const res = await api("ldatetohebdate", { ldate });
  return res?.text || "";
}

// פונקציה לפורמט נכון של תאריך עברי לפי הקוד ב-afuncs.php
function fixHebrewDateText(text) {
  // מחליפים מספרים ערביים למספרים עבריים (אופציונלי, כאן משאירים כמו שהוא)
  // אפשר גם לשפר תיקונים ספציפיים אם צריך
  return text.replace(/[0-9]+/, (match) => {
    // לדוגמה, להמיר מספרים לערכים עבריים לפי הצורך (לא מחייב)
    return match;
  });
}

async function showForm() {
  const content = document.getElementById("content");
  const ldate = today();
  const hdateTextRaw = await getHebrewDate(ldate);
  const hdateText = fixHebrewDateText(hdateTextRaw);

  content.innerHTML = `
    <form id="tarifForm" style="
      background:#fff; padding:20px; border-radius:12px; 
      box-shadow:0 0 10px #ccc; width: max-content; font-size: 1.1rem;
      display: grid; grid-template-columns: max-content max-content; column-gap: 30px; row-gap: 20px;
      direction: rtl;
    ">
      <h3 style="grid-column: 1 / -1; margin-bottom: 10px;">הוספת תעריף חדש</h3>
      
      <label>סניף: </label><select id="סניף" required style="font-size:1rem; padding:5px"></select>

      <label>תאריך התחלה: </label>
      <div style="display:flex; align-items:center;">
        <input type="date" id="תאריך_התחלה" required style="font-size:1rem; padding:5px" />
        <span id="hebrewDate" style="margin-right: 10px; white-space: nowrap; font-weight: bold;">(${hdateText})</span>
      </div>

      ${[
        { id: "שבועי", label: "שבועי" },
        { id: "חודשי", label: "חודשי" },
        { id: "בסיס", label: "בסיס" },
        { id: "בסיס_חדש", label: "בסיס חדש" },
        { id: "חבורה", label: "חבורה" },
        { id: "סוגיה", label: "סוגיה" },
        { id: "ערב", label: "ערב" },
        { id: "ביהז", label: "ביהז" },
        { id: "תלוש", label: "תלוש" },
        { id: "תלוש_חדש", label: "תלוש לחדש" },
        { id: "תעריף_שמיט", label: "תעריף שמיס" },
      ]
        .map(
          ({ id, label }) =>
            `<label>${label}: </label><input type="number" id="${id}" required style="font-size:1rem; padding:5px" />`
        )
        .join("")}

      <label>מקור: </label><input type="text" id="מקור" required style="font-size:1rem; padding:5px" />

      <div style="grid-column: 1 / -1; text-align: center;">
        <button type="submit" style="font-size: 1.2rem; padding: 8px 30px; cursor: pointer;">הוסף</button>
      </div>
    </form>
  `;

  await loadSnifim();
  document.getElementById("תאריך_התחלה").value = ldate;

  document.getElementById("תאריך_התחלה").addEventListener("change", async (e) => {
    const h = await getHebrewDate(e.target.value);
    document.getElementById("hebrewDate").textContent = `(${fixHebrewDateText(h)})`;
  });

  document.getElementById("tarifForm").onsubmit = async function (e) {
    e.preventDefault();
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

async function loadSnifim() {
  const sel = document.getElementById("סניף");
  sel.innerHTML = "<option disabled selected>טוען...</option>";
  const data = await api("getall_snifim");
  sel.innerHTML = "";
  data.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s["סניף_id"];
    opt.textContent = s["שם סניף"];
    sel.appendChild(opt);
  });
}

async function showTable() {
  const content = document.getElementById("content");
  const [data, snifim] = await Promise.all([
    api("getall_tarifim"),
    api("getall_snifim")
  ]);

  // טופס בחירת סניף
  let selectHtml = `<label>בחר סניף: <select id="filterSnif">
    <option value="">-- כל הסניפים --</option>
    ${snifim.map(s => `<option value="${s["סניף_id"]}">${s["שם סניף"]}</option>`).join("")}
  </select></label><br><br>`;

  let html = `<table id="tarifTable" border="1" cellpadding="6" style="background:white;border-collapse:collapse">
    <thead style="background:#ddd">
      <tr>
        <th>סניף</th><th>תאריך התחלה</th><th>תאריך התחלה (עברי)</th>
        <th>תאריך סיום</th><th>תאריך סיום (עברי)</th>
        <th>סטטוס</th><th>שבועי</th><th>חודשי</th><th>בסיס</th>
        <th>בסיס חדש</th><th>חבורה</th><th>סוגיה</th><th>ערב</th>
        <th>ביהז</th><th>תלוש</th><th>תלוש חדש</th><th>שמיס</th><th>מקור</th>
      </tr>
    </thead><tbody id="tarifBody">`;

  // סידור לפי סטטוס
  const sorted = data.sort((a,b)=> b["סטטוס"] === "כן" ? 1 : -1);

  for (const row of sorted) {
    const hstart = await getHebrewDate(row["תאריך התחלה"] ?? "");
    const hend = row["תאריך סיום"] ? await getHebrewDate(row["תאריך סיום"]) : "";

    html += `<tr data-snif="${row["קוד סניף"]}">
      <td>${row["שם סניף"]}</td>
      <td>${row["תאריך התחלה"] ?? ""}</td><td>${hstart}</td>
      <td>${row["תאריך סיום"] ?? ""}</td><td>${hend}</td>
      <td>${row["סטטוס"] === "כן" ? "✔️" : "❌"}</td>
      <td>${row["תעריף מבחן שבועי"]}</td>
      <td>${row["תעריף מבחן חודשי"]}</td>
      <td>${row["תעריף בסיס"]}</td>
      <td>${row["תעריף בסיס חדש"]}</td>
      <td>${row["תעריף חבורה"]}</td>
      <td>${row["תעריף סוגיה"]}</td>
      <td>${row["תעריף כולל ערב"]}</td>
      <td>${row["תעריף כולל ביהז"]}</td>
      <td>${row["תעריף תלוש"]}</td>
      <td>${row["תלוש לחדש"]}</td>
      <td>${row["תעריף שמיס"]}</td>
      <td>${row["מקור הפקדה"]}</td>
    </tr>`;
  }

  html += `</tbody></table>`;
  content.innerHTML = selectHtml + html;

  // הוספת אירוע לשינוי הסניף
  document.getElementById("filterSnif").addEventListener("change", (e) => {
    const val = e.target.value;
    document.querySelectorAll("#tarifBody tr").forEach(row => {
      if (!val || row.dataset.snif === val) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
}
