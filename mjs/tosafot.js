console.log("tosafot.js נטען בהצלחה");

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

  renderTable(data);
}

function renderTable(data) {
  let html = `
    <style>
      table.tosafot-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        box-shadow: 0 0 10px #ccc;
        font-family: Arial, sans-serif;
        font-size: 1rem;
      }
      table.tosafot-table thead {
        background: #d3e4cd;
      }
      table.tosafot-table th, table.tosafot-table td {
        border: 1px solid #ccc;
        padding: 8px 12px;
        text-align: right;
      }
      table.tosafot-table th {
        font-weight: bold;
        color: #3a5a40;
      }
      table.tosafot-table tbody tr:hover {
        background-color: #f1f8e9;
      }
      table.tosafot-table input[type="number"] {
        width: 80px;
        padding: 4px;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      table.tosafot-table input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      table.tosafot-table button {
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 6px 14px;
        font-size: 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      table.tosafot-table button:hover {
        background-color: #45a049;
      }
    </style>

    <table class="tosafot-table">
      <thead>
        <tr>
          <th>תוספת</th>
          <th style="text-align:center;">קבוע</th>
          <th>תעריף</th>
          <th>שמור</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(row => {
    html += `
      <tr data-id="${row.id}">
        <td>${row["שם תוספת"]}</td>
        <td style="text-align:center;">
          <input type="checkbox" ${row["קבוע"] === true || row["קבוע"] === "t" ? "checked" : ""}>
        </td>
        <td><input type="number" value="${row["תעריף"]}"></td>
        <td><button onclick="saveRow(this)">💾</button></td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  document.getElementById("tosafotTable").innerHTML = html;
}


async function saveRow(btn) {
  const row = btn.closest("tr");
  const id = Number(row.dataset.id);
  const tarif = Number(row.querySelector('input[type="number"]').value);
  const fixed = row.querySelector('input[type="checkbox"]').checked;

  const res = await api("update_tosafot", {
    id,
    "תעריף": tarif,
    "קבוע": fixed
  });

  if (res.ok) {
    btn.textContent = "✔️";
    setTimeout(() => (btn.textContent = "💾"), 1000);
  } else {
    alert("שגיאה בעדכון");
  }
}
function showAddForm() {
  // הסתרת הטבלה הראשית
  document.getElementById("tosafotTable").style.display = "none";

  document.getElementById("addForm").innerHTML = `

    <form id="tosafahForm" style="background:#fff;padding:20px;border-radius:12px;
      box-shadow:0 0 10px #ccc;width:max-content;font-size:1.1rem;
      display:grid;grid-template-columns:max-content max-content;gap:15px;">
      
      <h3 style="grid-column: 1 / -1;">הוספת תוספת</h3>

      <label>שם תוספת:</label>
      <input name="שם תוספת" required style="font-size:1rem; padding:5px;">

      <label>תעריף:</label>
      <input type="number" name="תעריף" required style="font-size:1rem; padding:5px;">

      <label>קבוע:</label>
      <input type="checkbox" name="קבוע" style="margin-top:7px;">

      <div style="grid-column:1 / -1; text-align:center;">
        <button type="submit" style="font-size:1.1rem; padding:8px 30px;">💾 שמור</button>
        <button onclick="cancelAddForm()" style="font-size:1.1rem; margin-bottom:10px;">⬅️ חזרה</button>

      </div>
    </form>
  `;
  document.getElementById("tosafahForm").addEventListener("submit", addTosafah);
}
function cancelAddForm() {
  document.getElementById("addForm").innerHTML = "";
  document.getElementById("tosafotTable").style.display = "block";
}


async function addTosafah(event) {
  event.preventDefault();

  const form = event.target;
  const body = {
    "שם תוספת": form["שם תוספת"].value.trim(),
    "תעריף": Number(form["תעריף"].value),
    "קבוע": form["קבוע"].checked
  };

  const res = await api("add_tosefet", body);
  if (res.ok) {
    form.reset();
    document.getElementById("addForm").innerHTML = "";
    loadTosafot();
  } else {
    alert("שגיאה בהוספה");
  }
}


//window.onload = loadTosafot;
