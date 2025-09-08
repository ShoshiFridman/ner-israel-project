let tbl = null;
let allAvrechim = [];

async function api(fn, params = {}) {
    try {
      const res = await fetch("api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fn, params }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "שגיאה בשרת");
      return data;
    } catch (err) {
      console.error(`API error in ${fn}:`, err);
      throw err;
    }
  }
  async function fetchHebrewMonthsStart(yearHebrew) {
    const url = `https://www.hebcal.com/hebcal?v=1&year=${yearHebrew}&cfg=json&maj=on&min=on&mod=on&nx=on&s=on&mf=on&c=on`;
  
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch Hebcal data");
      const data = await res.json();
  
      // מסננים רק את אירועי ראש חודש
      const roshChodeshEvents = data.items.filter(
        (item) => item.category === "roshchodesh"
      );
  
      // מייצרים מערך עם שם החודש ותאריך הלועזי (YYYY-MM-DD)
      const months = roshChodeshEvents.map((item) => {
        const date = new Date(item.date);
        const start = date.toISOString().split("T")[0];
        const nameMatch = item.title.match(/ראש חודש (.+)/);
        const name = nameMatch ? nameMatch[1] : item.title;
        return { name, start };
      });
  
      return months;
    } catch (e) {
      console.error("Error fetching Hebrew months:", e);
      return [];
    }
  }
  
  let currentAvrechim = [];
  let currentTarifim = {};
  let currentGroups = {}; // ⬅️ חדש: קישור שם קבוצה → סניף שלה
  
  async function loadAllAvrechim() {
    try {
      allAvrechim = await api('getall_av');
      currentAvrechim = [...allAvrechim];
      renderAvrechimTable(currentAvrechim);
    } catch (e) {
      console.error("שגיאה בטעינת אברכים:", e);
      alert("לא ניתן לטעון את רשימת האברכים");
    }
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await loadSnifim();
      await loadGroups();
      await loadAllAvrechim();

      const currentHebYear = getHebrewYearFromToday();
      await loadHebrewMonths(currentHebYear);
  
      setDefaultHebMonth();  // <----- כאן מבצעים את בחירת ברירת המחדל
  
      document.getElementById("snifSelect").addEventListener("change", refreshAvrechim);
      document.getElementById("groupSelect").addEventListener("change", refreshAvrechim);
      document.getElementById("hebMonthSelect").addEventListener("change", refreshAvrechim);
      //document.getElementById("avrechSearch").addEventListener("input", refreshAvrechim);
      document.getElementById("avrechSearch").addEventListener("input", filterAvrechimByName);

      allAvrechim = await api("getall_av");

      refreshAvrechim();
    } catch (e) {
      console.error("שגיאה באתחול הדף:", e);
    }
  });
  
  
  
  async function loadSnifim() {
    const sel = document.getElementById("snifSelect");
    sel.innerHTML = '<option value="">בחר סניף</option>';
    const snifim = await api("getall_snifim");
    snifim.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s["סניף_id"];
      opt.textContent = s["שם סניף"];
      sel.appendChild(opt);
    });
  }
  
 
  async function loadGroups() {
    const sel = document.getElementById("groupSelect");
    sel.innerHTML = '<option value="">בחר קבוצה</option>';
    const groups = await api("getall_groups"); // ודא שה-API מחזיר גם סניף_id
    groups.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g["שם"];
      opt.textContent = g["שם"];
      sel.appendChild(opt);
  
      currentGroups[g["שם"]] = {
        snif_id: g["סניף_id"]  // ⬅️ שמירה של הסניף לפי שם קבוצה
      };
    });
  }
  function getHebrewYearFromToday() {
    const today = new Date();
    const janFirst = new Date(today.getFullYear(), 0, 1);
    const diff = today - janFirst;
  
    // פחות מדויק, אבל מספיק טוב למטרה של בחירת שנה עברית
    const approxHebrewYear = today.getFullYear() + 3760;
    if (today.getMonth() >= 8) return approxHebrewYear + 1; // מתשרי
    return approxHebrewYear;
  }
  function toGematria(n) {
    const letters = {
      400: "ת", 300: "ש", 200: "ר", 100: "ק", 90: "צ",
      80: "פ", 70: "ע", 60: "ס", 50: "נ", 40: "מ", 30: "ל",
      20: "כ", 10: "י", 9: "ט", 8: "ח", 7: "ז", 6: "ו",
      5: "ה", 4: "ד", 3: "ג", 2: "ב", 1: "א"
    };
    let str = "";
    let num = n;
    Object.keys(letters).map(Number).sort((a, b) => b - a).forEach(value => {
      while (num >= value) {
        str += letters[value];
        num -= value;
      }
    });
    return str;
  }
  function getHebrewYearString(date) {
    const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
    const hebrewYear = formatter.format(date); // דוג': תשפ״ה
    return hebrewYear;
  }
  function toGematriaYear(year) {
    const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
    const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
    const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  
    let y = year % 1000; // למשל: 5785 → 785
    let h = Math.floor(y / 100); // מאות
    let t = Math.floor((y % 100) / 10); // עשרות
    let o = y % 10; // אחדות
  
    let result = hundreds[h];
  
    // מקרים מיוחדים – טו, טז
    if (t === 1 && o === 5) result += "טו";
    else if (t === 1 && o === 6) result += "טז";
    else {
      if (t > 0) result += tens[t];
      if (o > 0) result += ones[o];
    }
  
    return `${result.replace(/["״']/g, "")}`; // מוסיף גרשיים תקינים
  }
  
  
  async function loadHebrewMonths() {
    const months = [
      "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר",
      "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
    ];
  
    const today = new Date();
  
    // שולח לשרת שיחזיר את התאריך העברי של היום
    const res = await api("ldatetohebdate", { ldate: today.toISOString().split("T")[0] });
    const hebrewText = res?.text || ""; // דוגמה: כ״ד תמוז תשפ״ה
  
    // מחלץ את החודש והשנה העבריים מתוך הטקסט
    const match = hebrewText.match(/ ([^ ]+) (תש״?[א-ת״]*)$/); // תופס "תמוז תשפ״ה"
    const hebMonthName = match?.[1]?.trim(); // תמוז
    const hebYearText = match?.[2]?.trim();  // תשפ״ה
  
    const hebYearNumber = getHebrewYear(today); // לדוגמה: 5785
    const yearText = toGematriaYear(hebYearNumber); // לדוגמה: תשפ״ה
  
    const select = document.getElementById("hebMonthSelect");
    select.innerHTML = "";
  
    months.forEach((m, i) => {
      const o = document.createElement("option");
      o.value = `${i + 1}-${hebYearNumber}`;
      o.textContent = `${m} ${yearText}`;
      // אל תבחר אופציה כאן
      select.appendChild(o);
    });
  }
  
  
     
  
  function getHebrewYear(date) {
    const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
    const parts = formatter.formatToParts(date);
    const yearPart = parts.find(p => p.type === 'year');
    return parseInt(yearPart?.value || new Date().getFullYear());
  }
  
  
  function setDefaultHebMonth() {
    const today = new Date();
  
    const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', {
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(today);
  
    const monthPart = parts.find((p) => p.type === 'month');
    const yearPart = parts.find((p) => p.type === 'year');
  
    if (!monthPart || !yearPart) {
      console.warn("לא הצלחנו למצוא את חלקי החודש/השנה העבריים");
      return;
    }
  
    const months = [
      "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר",
      "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
    ];
  
    const monthName = monthPart.value;
    //const yearNumber = parseInt(yearPart.value, 10);
    const yearNumber = getHebrewYear(today); // במקום parseInt(...), שגוי

    const monthNumber = months.indexOf(monthName) + 1;
    const targetValue = `${monthNumber}-${yearNumber}`;
  
    const select = document.getElementById("hebMonthSelect");
    const optionToSelect = Array.from(select.options).find(opt => opt.value === targetValue);
    console.log("🎯 ערך ברירת מחדל לחודש עברי:", targetValue);

    if (optionToSelect) {
      select.value = targetValue;
    } else if (select.options.length > 0) {
      select.selectedIndex = 0;
    }
  
    // ✅ שמירה ל־window לצורך saveAllTests
    window.selectedHebMonthName = monthName;
    window.selectedHebYearText = toGematriaYear(yearNumber);
  }
  
  
  
  
  

  async function refreshAvrechim(e) {
    console.log("📌 refreshAvrechim התחילה לרוץ");
  
  
    const changedId = e?.target?.id;

    // ⭐ ניקוי שדה שם אם בוחרים סינון אחר
    if (changedId === "snifSelect" || changedId === "groupSelect") {
      const searchInputEl = document.getElementById("avrechSearch");
      if (searchInputEl && searchInputEl.value.trim()) {
        searchInputEl.value = "";
      }
    }
    let snif_id = null;
    let group_name = null;
  
    const searchInput = document.getElementById("avrechSearch")?.value.trim().toLowerCase();
  
    // אם המשתמש מחפש אברך – לא להתחשב בסניף/קבוצה
    if (!searchInput) {
      if (changedId === "snifSelect") {
        snif_id = document.getElementById("snifSelect").value || null;
        document.getElementById("groupSelect").value = "";
      } else if (changedId === "groupSelect") {
        group_name = document.getElementById("groupSelect").value || null;
        document.getElementById("snifSelect").value = "";
      } else {
        snif_id = document.getElementById("snifSelect").value || null;
        group_name = document.getElementById("groupSelect").value || null;
      }
    } else {
      // ניקוי הבחירות אם יש חיפוש – שיהיה ברור למשתמש
      document.getElementById("snifSelect").value = "";
      document.getElementById("groupSelect").value = "";
    }
  
    const hdate = document.getElementById("hebMonthSelect").value;
    if (!hdate) return;
  
    const [month, year] = hdate.split("-");
    const monthName = [
      "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר",
      "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
    ][parseInt(month) - 1];
  
    const yearNumber = parseInt(year);
    const selectedYearText = toGematriaYear(yearNumber);
  
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long', year: 'numeric' });
    const parts = formatter.formatToParts(today);
    const currentMonthName = parts.find(p => p.type === 'month')?.value || "";
    const currentYearText = toGematriaYear(getHebrewYear(today));
  
    const clean = (s) => (s || "").trim().replace(/\s/g, '');
    const isCurrentMonth = clean(monthName) === clean(currentMonthName) && clean(selectedYearText) === clean(currentYearText);
  
    // שמירה גלובלית
    window.selectedHebMonthName = monthName;
    window.selectedHebYearText = selectedYearText;
  
    const avs = await api("get_av_filtered", {
      snif_id,
      group_name,
      month_name: monthName,
      year_hebrew: selectedYearText
    });
    currentAvrechim = avs;
  
    const tarifim = await api("getall_tarifim");
    const activeTarifim = {};
    tarifim.forEach((t) => {
      if (t["סטטוס"] === "כן") activeTarifim[t["קוד סניף"]] = t;
    });
  
    currentAvrechim = avs;
    currentTarifim = activeTarifim;
  
    const finalAvrechim = searchInput
      ? avs.filter((a) =>
          (`${a["משפחה"]} ${a["פרטי"]}`.toLowerCase().includes(searchInput))
        )
      : avs;
  
    const rows = finalAvrechim.map((a) => ({
      avrech_id: a["אברך_id"],
      snif_id: a["סניף_id"] || snif_id,
      שם: `${a["משפחה"]} ${a["פרטי"]}`,
      weekly_count: a["weekly_count"] || 0,
      monthly_test: ['t', true, 'true', 1, '1'].includes(a["monthly_test"]) ? "כן" : "לא",
      סכום: "0.00",
    }));
  
    tbl = new SimpleTable(document.getElementById("tableContainer"), {
      headers: {
        שם: "שם אברך",
        weekly_count: "מבחנים שבועיים",
        monthly_test: "חודשי?",
        סכום: "סכום לתשלום",
      },
      fieldtypes: {
        שם: "text",
        weekly_count: "numeric",
        monthly_test: "combo",
        סכום: "text",
      },
      data: rows,
      readonlyFields: ["שם", "סכום"],
      editableFields: isCurrentMonth ? ["weekly_count", "monthly_test"] : [],
      onChange: (rowIndex, field, value) => {
        if (isCurrentMonth) updateSalaries();
      },
    });
  
    if (!isCurrentMonth) {
      document.querySelectorAll('td[data-field="weekly_count"] input, td[data-field="monthly_test"] select').forEach((el) => {
        el.disabled = true;
      });
    }
  
    document.querySelectorAll('td[data-field="שם"], td[data-field="סכום"]').forEach((td) => {
      td.style.userSelect = "none";
      td.style.pointerEvents = "none";
    });
  
    updateSalaries();
  }
  
  
  function filterAvrechimByName() {
    const searchInput = document.getElementById("avrechSearch").value.trim().toLowerCase();
  
    if (!searchInput) {
      // אם אין חיפוש → טען מחדש לפי סניף/קבוצה (כמו שהיה קודם)
      refreshAvrechim();
      return;
    }
  
    // סינון מתוך כל האברכים בלי קשר לסניף/קבוצה
    const filtered = allAvrechim.filter(a => {
      const fullName = `${a["משפחה"]} ${a["פרטי"]}`.toLowerCase();
      return fullName.includes(searchInput);
    });
  
    // תצוגה מחדש של הטבלה
    renderAvrechimTable(filtered);
  }
  
  
  function renderAvrechimTable(data) {
    const rows = data.map((a) => ({
      avrech_id: a["אברך_id"],
      snif_id: a["סניף_id"],
      שם: `${a["משפחה"]} ${a["פרטי"]}`,
      weekly_count: a["weekly_count"] || 0,
      monthly_test: ['t', true, 'true', 1, '1'].includes(a["monthly_test"]) ? "כן" : "לא",
      סכום: "0.00",
    }));
  
    tbl = new SimpleTable(document.getElementById("tableContainer"), {
      headers: {
        שם: "שם אברך",
        weekly_count: "מבחנים שבועיים",
        monthly_test: "חודשי?",
        סכום: "סכום לתשלום",
      },
      fieldtypes: {
        שם: "text",
        weekly_count: "numeric",
        monthly_test: "combo",
        סכום: "text",
      },
      combos: {
        monthly_test: ["כן", "לא"]
      },
      data: rows,
      readonlyFields: ["שם", "סכום"],
      onChange: (rowIndex, field, value) => {
        updateSalaries();
      },
    });
  
    updateSalaries();
  }
  
  


// להוסיף מאזין שדה החיפוש:

function filterAvrechimByName() {
  const searchInput = document.getElementById("avrechSearch").value.trim().toLowerCase();
  const filtered = currentAvrechim.filter(a => {
    const fullName = `${a["משפחה"]} ${a["פרטי"]}`.toLowerCase();
    return fullName.includes(searchInput);
  });

  const rows = filtered.map((a) => ({
    avrech_id: a["אברך_id"],
    snif_id: a["סניף_id"],
    שם: `${a["משפחה"]} ${a["פרטי"]}`,
    weekly_count: a["weekly_count"] || 0,
    monthly_test: ['t', true, 'true', 1, '1'].includes(a["monthly_test"]) ? "כן" : "לא",
    סכום: "0.00",
  }));

  tbl = new SimpleTable(document.getElementById("tableContainer"), {
    headers: {
      שם: "שם אברך",
      weekly_count: "מבחנים שבועיים",
      monthly_test: "חודשי?",
      סכום: "סכום לתשלום",
    },
    fieldtypes: {
      שם: "text",
      weekly_count: "numeric",
      monthly_test: "combo",
      סכום: "text",
    },
    data: rows,
    readonlyFields: ["שם", "סכום"],
    onChange: (rowIndex, field, value) => {
      updateSalaries();
    },
  });
    updateSalaries();
}

  
  function updateSalaries() {
    if (!tbl) return;
  
    tbl.data.forEach((row, i) => {
      const avrech = currentAvrechim.find((a) => a["אברך_id"] == row.avrech_id);
      const groupName = avrech?.["קבוצה"];
      const snif_id = currentGroups[groupName]?.snif_id || row.snif_id;
  
      const tarif = currentTarifim[snif_id] || {};
  
      const w = parseInt(row.weekly_count) || 0;
      const m = row.monthly_test === "כן";
  
      let sum = 0;
      if (w >= 2) {
        sum += w * (parseFloat(tarif["תעריף מבחן שבועי"]) || 0);
        if (w >= 3 && m) {
          sum += parseFloat(tarif["תעריף מבחן חודשי"]) || 0;
        }
      }
  
      //row["סכום"] = sum.toFixed(2);
  
      // עדכון התצוגה בטבלה
      const rows = document.querySelectorAll("#tableContainer table tbody tr");
      const סכוםTd = rows[i]?.querySelector('td[data-field="סכום"]');
      //if (סכוםTd) סכוםTd.innerText = sum.toFixed(2);
    });
  }
  async function convertHebDateToGreg(hdate) {
    const response = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fn: 'hebtold',
        params: { hdate }
      })
    });
    const data = await response.json();
    if (data.ldate) {
      return data.ldate; // תאריך לועזי בפורמט YYYY-MM-DD
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  }
  
  // שימוש:
  convertHebDateToGreg('תמוז-5785').then(date => {
    console.log('תאריך לועזי:', date);
  }).catch(console.error);
  
  async function saveAllTests() {
    try {
      const rows = tbl?.data || [];
  
      if (!window.selectedHebMonthName || !window.selectedHebYearText) {
        throw new Error("חודש עברי לא הוגדר כראוי");
      }
  
      const hebYearNumber = window.selectedHebYearNumber || getHebrewYear(new Date());
  
      const monthName = window.selectedHebMonthName.replace(/\s/g, '');
  
      // נבנה את המחרוזת בפורמט שנדרש לשרת: "תמוז-5785"
      const hebDateString = `${monthName}-${hebYearNumber}`;
  
      // המרת תאריך עברי ללועזי (מתוך הפונקציה הקיימת)
      const gregDate = await convertHebDateToGreg(hebDateString);
  
      const payload = rows.map((row) => ({
        avrech_id: row.avrech_id,
        weekly_count: row.weekly_count,
        monthly_test: row.monthly_test === "כן",
        month_name: monthName,
        year_hebrew: window.selectedHebYearText, // מחרוזת בגימטריה כמו "תשפה"
        ldate: gregDate,
      }));
      
  
      console.log("Payload to save_tests:", payload);
  
      const result = await api("save_tests", payload);
      alert("נשמר בהצלחה!");
    } catch (e) {
      console.error("שגיאה בשמירה:", e);
      alert("שגיאה בשמירה, ראה קונסול");
    }
  }
 
  function addFixButtons() {
    const tableRows = document.querySelectorAll("#tableContainer table tbody tr");
    tableRows.forEach((tr, i) => {
      // הוסף טור חדש עם כפתור תיקון אם לא קיים
      if (!tr.querySelector(".fix-btn")) {
        const td = document.createElement("td");
        td.classList.add("fix-btn");
        const btn = document.createElement("button");
        btn.textContent = "תיקון";
        btn.dataset.avrechId = tbl.data[i].avrech_id;
        btn.addEventListener("click", () => openFixForm(tbl.data[i].avrech_id));
        td.appendChild(btn);
        tr.appendChild(td);
      }
    });
  }
  async function openFixForm(avrech_id) {
    try {
      const monthName = window.selectedHebMonthName;
      const yearHeb = window.selectedHebYearText;
      
      // בקשה לשרת לקבלת מבחני אברך בחודש
      const data = await api("get_tests_by_avrech_month", { avrech_id, month_name: monthName, year_hebrew: yearHeb });
      
      // אם אין נתונים - אתחל עם ערכים ברירת מחדל
      const testData = data.length ? data[0] : { weekly_count: 0, monthly_test: false };
      
      // יצירת טופס דינמי, אפשר להציג בתוך מודאל או div
      const formHtml = `
        <form id="fixForm">
          <h3>תיקון מבחנים ל${monthName} ${yearHeb}</h3>
          <label>מבחנים שבועיים:</label>
          <input type="number" name="weekly_count" value="${testData.weekly_count}" min="0" />
          <br/>
          <label>מבחן חודשי:</label>
          <select name="monthly_test">
            <option value="כן" ${testData.monthly_test ? "selected" : ""}>כן</option>
            <option value="לא" ${!testData.monthly_test ? "selected" : ""}>לא</option>
          </select>
          <br/>
          <button type="submit">שמור</button>
          <button type="button" onclick="closeFixForm()">בטל</button>
        </form>
      `;
      // הצגה לדוגמה בתוך div מסוים:
      document.getElementById("fixFormContainer").innerHTML = formHtml;
      
      document.getElementById("fixForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveFixedTests(avrech_id, monthName, yearHeb);
      });
    } catch (e) {
      alert("שגיאה בטעינת נתוני המבחנים");
      console.error(e);
    }
  }
  function closeFixForm() {
    document.getElementById("fixFormContainer").innerHTML = "";
  }
    