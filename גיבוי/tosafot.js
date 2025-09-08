console.log("tosafot.js נטען בהצלחה"); // בדיקת טעינה

async function api(fn, params = {}) {
  const res = await fetch("api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fn, params })
  });
  return res.json();
}
async function loadTosafot() {
    const data = await api("get_tosafot");
    const content = document.getElementById("content");
    content.innerHTML = `
      <button onclick="showAddForm()">➕ הוספת תוספת</button>
      <div id="addForm" style="margin:15px 0;"></div>
      <div id="tosafotTable"></div>
    `;
  
    let html = `<table>
      <tr><th>תוספת</th><th>קבוע</th><th>תעריף</th><th>שמור</th></tr>`;
  
    data.forEach(row => {
      html += `
        <tr data-id="${row.id}">
          <td>${row["שם תוספת"]}</td>
          <td style="text-align:center;">
            <input type="checkbox" ${row["קבוע"] === true || row["קבוע"] === 't' ? 'checked' : ''}>
          </td>
          <td><input type="number" value="${row["תעריף"]}"></td>
          <td><button onclick="saveRow(this)">💾</button></td>
        </tr>`;
    });
  
    html += "</table>";
    document.getElementById("tosafotTable").innerHTML = html;
  }
  
  async function saveRow(btn) {
    const row = btn.closest("tr");
    const id = Number(row.dataset.id);
    const tarif = Number(row.querySelector('input[type="number"]').value);
    const fixed = row.querySelector('input[type="checkbox"]').checked;
  
    const res = await api("update_tosafot", {
      id, "תעריף": tarif, "קבוע": fixed
    });
  
    if (res.ok) {
      btn.textContent = "✔️";
      setTimeout(() => (btn.textContent = "💾"), 1000);
    } else {
      alert("שגיאה בעדכון");
    }
  }
  

function showAddForm() {
  document.getElementById("addForm").innerHTML = `
    <form id="tosafahForm" style="background:#f9f9f9;padding:10px;border:1px solid #ccc;border-radius:8px;">
      <label>שם תוספת: <input name="שם תוספת" required></label>
      <label>תעריף: <input type="number" name="תעריף" required></label>
      <label>קבוע: <input type="checkbox" name="קבוע"></label>
      <button type="submit">💾 שמור</button>
    </form>
  `;
  document.getElementById("tosafahForm").addEventListener("submit", addTosafah);
}

async function addTosafah(event) {
  event.preventDefault(); // קריטי למנוע שליחת טופס רגילה

  const form = event.target;
  const body = {
    "שם תוספת": form["שם תוספת"].value.trim(),
    "תעריף": Number(form["תעריף"].value),
    "קבוע": form["קבוע"].checked
  };

  const res = await api("add_tosefet", body);
  console.log("API response:", res); // בדיקת תגובת השרת
  if (res.ok) {
    form.reset();
    document.getElementById("addForm").innerHTML = ""; // הסתרת טופס
    loadTosafot(); // ריענון טבלה
  } else {
    alert("שגיאה בהוספה");
  }
}

window.onload = loadTosafot;
