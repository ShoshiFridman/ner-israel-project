console.log("✅ fixes.js נטען");

async function openFixForm(avrechId, avrechName) {
  const avrech = currentAvrechim.find(a => a["אברך_id"] == avrechId);
  const snif_id = avrech?.["סניף_id"];
  const gregDate = new Date();
  const dateStr = gregDate.toISOString().split("T")[0];
  const tarif = getTarifForDate(snif_id, dateStr);
  const hasSugyaTarif = parseFloat(tarif?.["תעריף סוגיה"] || 0) > 0;

  // טוענים את התוספות לפני השימוש
  let tosafot = [];
  const tosafotData = await api("get_tosafot");
  tosafot = tosafotData.map(t => `תוספת: ${t["שם תוספת"]}`);

  const fixTypes = [
    "מבחן שבועי",
    "מבחן חודשי",
    "חבורה בכתב",
    "חבורה בעפ"
  ];
  if (hasSugyaTarif) fixTypes.push("סיכום סוגיות");
  fixTypes.push("אחר"); // הוספנו כאן
  fixTypes.push("מעשר מתוספת חג");

  const fixTypeOptions = fixTypes.map(t => `<option value="${t}">${t}</option>`).join("") +
                         `<option disabled>―― תוספות ――</option>` +
                         tosafot.map(t => `<option value="${t}">${t}</option>`).join("");

  const html = `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">📌 תיקון עבור: ${avrechName}</h3>
        <button onclick="modal.close()" style="font-size:16px; background:none; border:none; cursor:pointer;">❌</button>
      </div>
      <label>סוג תיקון:
        <select id="fixType">${fixTypeOptions}</select>
      </label>
      <br/>
      <label>שנה:
        <select id="fixYear"></select>
      </label>
      <label>חודש:
        <select id="fixMonth"></select>
      </label>
      <br/>
      <div id="amountRow">
        <label>כמות:
          <input type="number" id="fixAmount" value="1" min="1" />
        </label>
      </div>
      <br/>
      <label>הערה:
        <input type="text" id="fixNote" />
      </label>
      <br/><br/>
      <label id="otherAmountLabel" style="display:none;">סכום חופשי:
  <input type="number" id="otherFixAmount" />
</label>
<br/>
      <button onclick="submitFix(${avrechId})">💾 שמירה</button>
    </div>
  `;

  modal.fire({ html, css: "top:20%;padding:25px;width:300px" });

  setTimeout(() => {
    const fixTypeEl = document.getElementById("fixType");
    const amountRow = document.getElementById("amountRow");

    // הסתרת שדות חודש ושנה אם זו תוספת
    const hideMonthYearIfTosefet = () => {
      const type = fixTypeEl.value;
      const isTosefet = tosafot.includes(type);
      //const isTosefet = tosafot.includes(type) || type === "אחר";
      const isMaaserFromTosefet = (type === "מעשר מתוספת חג");

      const isOther = type === "אחר";
    
      const hideDate = isTosefet;
      document.getElementById("fixMonth").parentElement.style.display = (isTosefet || isMaaserFromTosefet) ? "none" : "inline-block";
      document.getElementById("fixYear").parentElement.style.display = (isTosefet || isMaaserFromTosefet) ? "none" : "inline-block";
      amountRow.style.display = (type === "מבחן שבועי" || type === "סיכום סוגיות") ? "block" : "none";
      document.getElementById("otherAmountLabel").style.display = isOther ? "block" : "none";
      
     /* document.getElementById("fixMonth").parentElement.style.display = hideDate ? "none" : "inline-block";
      document.getElementById("fixYear").parentElement.style.display = hideDate ? "none" : "inline-block";
      amountRow.style.display = (type === "מבחן שבועי" || type === "סיכום סוגיות") ? "block" : "none";
    
      document.getElementById("otherAmountLabel").style.display = isOther ? "block" : "none";*/
    };
    

    fixTypeEl.addEventListener("change", hideMonthYearIfTosefet);
    hideMonthYearIfTosefet();

    // מילוי שנים עבריות
    populateHebrewYears("fixYear");
    const yearSelect = document.getElementById("fixYear");
    const selectedYear = parseInt(yearSelect.value);
    const months = getHebrewMonthsArray(isHebrewLeapYear(selectedYear));

    // מילוי חודשים
    const monthSelect = document.getElementById("fixMonth");
    monthSelect.innerHTML = "";
    months.forEach(m => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      monthSelect.appendChild(o);
    });

    yearSelect.addEventListener("change", (e) => {
      const y = parseInt(e.target.value);
      const leap = isHebrewLeapYear(y);
      const months = getHebrewMonthsArray(leap);
      monthSelect.innerHTML = "";
      months.forEach(m => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        monthSelect.appendChild(o);
      });
    });

    // ברירת מחדל חודש – החודש הקודם
    const today = new Date();
    const currentMonthIndex = getHebrewMonth(today) - 1;
    const monthList = getHebrewMonthsArray(isHebrewLeapYear(getHebrewYear(today)));
    const prevIndex = (currentMonthIndex - 1 + monthList.length) % monthList.length;
    const defaultMonth = monthList[prevIndex];
    monthSelect.value = defaultMonth;

    // הצגת שדה כמות רק לסוגים מסוימים (לא תוספות)
    const updateAmountRow = () => {
      const type = fixTypeEl.value;
      const showAmount = ["מבחן שבועי", "סיכום סוגיות"].includes(type);
      amountRow.style.display = showAmount ? "block" : "none";
    };
    fixTypeEl.addEventListener("change", updateAmountRow);
    updateAmountRow();

  }, 0);
}

/*async function openFixForm(avrechId, avrechName) {
  const avrech = currentAvrechim.find(a => a["אברך_id"] == avrechId);
  const snif_id = avrech?.["סניף_id"];
  const gregDate = new Date();
  const dateStr = gregDate.toISOString().split("T")[0];
  const tarif = getTarifForDate(snif_id, dateStr);
  const hasSugyaTarif = parseFloat(tarif?.["תעריף סוגיה"] || 0) > 0;

  // טוענים את התוספות לפני השימוש
  let tosafot = [];
  const tosafotData = await api("get_tosafot");
  tosafot = tosafotData.map(t => `תוספת: ${t["שם תוספת"]}`);

  const fixTypes = [
    "מבחן שבועי",
    "מבחן חודשי",
    "חבורה בכתב",
    "חבורה בעפ"
  ];
  if (hasSugyaTarif) fixTypes.push("סיכום סוגיות");
  fixTypes.push("אחר"); // הוספנו כאן

  const fixTypeOptions = fixTypes.map(t => `<option value="${t}">${t}</option>`).join("") +
                         `<option disabled>―― תוספות ――</option>` +
                         tosafot.map(t => `<option value="${t}">${t}</option>`).join("");

  const html = `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">📌 תיקון עבור: ${avrechName}</h3>
        <button onclick="modal.close()" style="font-size:16px; background:none; border:none; cursor:pointer;">❌</button>
      </div>
      <label>סוג תיקון:
        <select id="fixType">${fixTypeOptions}</select>
      </label>
      <br/>
      <label>שנה:
        <select id="fixYear"></select>
      </label>
      <label>חודש:
        <select id="fixMonth"></select>
      </label>
      <br/>
      <div id="amountRow">
        <label>כמות:
          <input type="number" id="fixAmount" value="1" min="1" />
        </label>
      </div>
      <br/>
      <label>הערה:
        <input type="text" id="fixNote" />
      </label>
      <br/><br/>
      <label id="otherAmountLabel" style="display:none;">סכום חופשי:
  <input type="number" id="otherFixAmount" />
</label>
<br/>
      <button onclick="submitFix(${avrechId})">💾 שמירה</button>
    </div>
  `;

  modal.fire({ html, css: "top:20%;padding:25px;width:300px" });

  setTimeout(() => {
    const fixTypeEl = document.getElementById("fixType");
    const amountRow = document.getElementById("amountRow");

    // הסתרת שדות חודש ושנה אם זו תוספת
    const hideMonthYearIfTosefet = () => {
      const type = fixTypeEl.value;
      const isTosefet = tosafot.includes(type);
      //const isTosefet = tosafot.includes(type) || type === "אחר";

      const isOther = type === "אחר";
    
      const hideDate = isTosefet;
    
      document.getElementById("fixMonth").parentElement.style.display = hideDate ? "none" : "inline-block";
      document.getElementById("fixYear").parentElement.style.display = hideDate ? "none" : "inline-block";
      amountRow.style.display = (type === "מבחן שבועי" || type === "סיכום סוגיות") ? "block" : "none";
    
      document.getElementById("otherAmountLabel").style.display = isOther ? "block" : "none";
    };
    

    fixTypeEl.addEventListener("change", hideMonthYearIfTosefet);
    hideMonthYearIfTosefet();

    // מילוי שנים עבריות
    populateHebrewYears("fixYear");
    const yearSelect = document.getElementById("fixYear");
    const selectedYear = parseInt(yearSelect.value);
    const months = getHebrewMonthsArray(isHebrewLeapYear(selectedYear));

    // מילוי חודשים
    const monthSelect = document.getElementById("fixMonth");
    monthSelect.innerHTML = "";
    months.forEach(m => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      monthSelect.appendChild(o);
    });

    yearSelect.addEventListener("change", (e) => {
      const y = parseInt(e.target.value);
      const leap = isHebrewLeapYear(y);
      const months = getHebrewMonthsArray(leap);
      monthSelect.innerHTML = "";
      months.forEach(m => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        monthSelect.appendChild(o);
      });
    });

    // ברירת מחדל חודש – החודש הקודם
    const today = new Date();
    const currentMonthIndex = getHebrewMonth(today) - 1;
    const monthList = getHebrewMonthsArray(isHebrewLeapYear(getHebrewYear(today)));
    const prevIndex = (currentMonthIndex - 1 + monthList.length) % monthList.length;
    const defaultMonth = monthList[prevIndex];
    monthSelect.value = defaultMonth;

    // הצגת שדה כמות רק לסוגים מסוימים (לא תוספות)
    const updateAmountRow = () => {
      const type = fixTypeEl.value;
      const showAmount = ["מבחן שבועי", "סיכום סוגיות"].includes(type);
      amountRow.style.display = showAmount ? "block" : "none";
    };
    fixTypeEl.addEventListener("change", updateAmountRow);
    updateAmountRow();

  }, 0);
}*/
// שליחת הנתונים לתיקון

async function submitFix(avrechId) {
  try {
    const rowEl = document.querySelector(`#tableContainer tr[data-avrech-id="${avrechId}"]`);
    if (!rowEl) {
      console.warn("לא נמצא שורת אברך עם avrechId:", avrechId);
    }

    const tdMivchanim = rowEl?.querySelector('td[data-field="סכום מבחנים"]');
    const mivchanimBefore = tdMivchanim ? parseFloat(tdMivchanim.innerText) : 0;

    const סוג_תיקון = getval("fixType");
    const חודש = getval("fixMonth");
    let שנה = getval("fixYear");
    const ldate = await convertHebDateToGreg(`${חודש}-${שנה}`);
    const yearSelect = document.getElementById("fixYear");
    שנה = yearSelect.options[yearSelect.selectedIndex].textContent;

    const חודש_תיקון = window.selectedHebMonthName?.replace(/\s/g, '') || '';
    const שנה_תיקון = window.selectedHebYearText || '';

    let כמות = parseInt(getval("fixAmount")) || 1;
    let תעריף_תוספת = 0;
    let הערה = getval("fixNote");
    const isTosefet = סוג_תיקון.startsWith("תוספת: ") || סוג_תיקון === "אחר";
    const isMaaserFromTosefet = סוג_תיקון === "מעשר מתוספת חג";

    //const isTosefet = סוג_תיקון.startsWith("תוספת: ");
    const isOther = סוג_תיקון === "אחר";

    if (isTosefet) {
      const tosafotName = סוג_תיקון.replace("תוספת: ", "");
      const foundTosafet = (window.tosafotData || []).find(t => t["שם תוספת"] === tosafotName);
      if (foundTosafet) {
        תעריף_תוספת = parseFloat(foundTosafet["תעריף"]);
      }
      כמות = 1;
    }

    let סכום_חופשי = 0;

if (isOther) {
  סכום_חופשי = parseFloat(getval("otherFixAmount")) || 0;
  הערה = getval("otherFixNote") || הערה;
  כמות = 1;
}


    // אימות
    /*if (!חודש || !שנה || !סוג_תיקון ||
        (!חודש_תיקון && !isTosefet && !isOther) ||
        (!שנה_תיקון && !isTosefet && !isOther)) {
      alert("יש למלא את כל השדות");
      return;
    }*/
    if (!חודש || !שנה || !סוג_תיקון ||
      (!חודש_תיקון && !isTosefet && !isOther && !isMaaserFromTosefet) ||
      (!שנה_תיקון && !isTosefet && !isOther && !isMaaserFromTosefet)) {
    alert("יש למלא את כל השדות");
    return;
  }
 /* 
    const apiData = {
      avrech_id: avrechId,
      סוג_תיקון,
     // חודש: (isTosefet ) ? חודש_תיקון : חודש,
     // שנה: (isTosefet ) ? שנה_תיקון : שנה,
     חודש: (!isTosefet || isOther) ? חודש : חודש_תיקון,
     שנה: (!isTosefet || isOther) ? שנה : שנה_תיקון,

      כמות,
      הערה,
      תאריך_לועזי: ldate,
      חודש_תיקון,
      שנה_תיקון,
      תעריף_תוספת
    };*/

const useFixDate = isTosefet || isMaaserFromTosefet;
const tdMaaser = rowEl?.querySelector('td[data-field="סכום סופי לאחר מעשר"]');

//const tdIsra = rowEl?.querySelector('td[data-field="ישראשראי"]');
//const tdOther = rowEl?.querySelector('td[data-field="תשלום אחר"]');

const apiData = {
  avrech_id: avrechId,
  סוג_תיקון,

 חודש: useFixDate ? חודש_תיקון : חודש,
 שנה: useFixDate ? שנה_תיקון : שנה, 
  כמות,
  הערה,
  תאריך_לועזי: ldate,
  חודש_תיקון,
  שנה_תיקון,
  תעריף_תוספת,
  סכום_אחר_מעשר: parseFloat(tdMaaser?.innerText || "0").toFixed(2)

 // ישראשראי: parseFloat(tdIsra?.innerText || "0").toFixed(2),
 // תשלום_אחר: parseFloat(tdOther?.innerText || "0").toFixed(2)
  
};

if (isTosefet) {
  apiData["תעריף_תוספת"] = תעריף_תוספת;
}

    const res = await api("add_fix", apiData);

    if (!res.success) {
      alert("❌ שגיאה בשמירת התיקון");
      return;
    }

    const apiApplyData = {
      avrech_id: avrechId,
     // חודש: (isTosefet ) ? חודש_תיקון : חודש,
     // שנה: (isTosefet ) ? שנה_תיקון : שנה,
     חודש: useFixDate ? חודש_תיקון : חודש,
     שנה: useFixDate ? שנה_תיקון : שנה,

      חודש_תיקון,
      שנה_תיקון,
      סוג_תיקון,
      סכום_אחר_מעשר: parseFloat(tdMaaser?.innerText || "0").toFixed(2)

     // ישראשראי: parseFloat(tdIsra?.innerText || "0").toFixed(2),
     // תשלום_אחר: parseFloat(tdOther?.innerText || "0").toFixed(2)
    };
    
    
if (isOther) {
  apiApplyData["סכום_חופשי"] = סכום_חופשי;
}

const res2 = await api("apply_fix_and_update_payment", apiApplyData);

    
    if (!res2.success) {
      alert("❗ שגיאה בחישוב התשלום לאחר תיקון");
      return;
    }

    setTimeout(() => {
      const updatedRow = document.querySelector(`#tableContainer tr[data-avrech-id="${avrechId}"]`);
      const tdMivchanimAfter = updatedRow?.querySelector('td[data-field="סכום מבחנים"]');
      const tdFix = updatedRow?.querySelector('td[data-field="סכום תיקונים"]');

      const mivchanimAfter = tdMivchanimAfter ? parseFloat(tdMivchanimAfter.innerText) : 0;
      const diff = +(mivchanimAfter - mivchanimBefore).toFixed(2);

      if (tdFix && !isNaN(diff) && diff !== 0) {
        const currentFix = parseFloat(tdFix.innerText || "0") || 0;
        tdFix.innerText = (currentFix + diff).toFixed(2);
      }
    }, 0);

    alert("✅ התיקון נשמר והחישוב עודכן בהצלחה");
    modal.close();
    await refreshAvrechim();

  } catch (e) {
    console.error("שגיאה ב־submitFix:", e);
    alert(`⚠️ שגיאה בביצוע התיקון:\n${e.message || e}`);
  }
}



/*
async function submitFix(avrechId) {
  try {
    const rowEl = document.querySelector(`#tableContainer tr[data-avrech-id="${avrechId}"]`);
    if (!rowEl) {
      console.warn("לא נמצא שורת אברך עם avrechId:", avrechId);
    }

    const tdMivchanim = rowEl?.querySelector('td[data-field="סכום מבחנים"]');
    const mivchanimBefore = tdMivchanim ? parseFloat(tdMivchanim.innerText) : 0;

    const סוג_תיקון = getval("fixType");
    const חודש = getval("fixMonth");
    let שנה = getval("fixYear");
    const ldate = await convertHebDateToGreg(`${חודש}-${שנה}`);
    const yearSelect = document.getElementById("fixYear");
    שנה = yearSelect.options[yearSelect.selectedIndex].textContent;

    const חודש_תיקון = window.selectedHebMonthName?.replace(/\s/g, '') || '';
    const שנה_תיקון = window.selectedHebYearText || '';

    let כמות = parseInt(getval("fixAmount")) || 1;
    let תעריף_תוספת = 0;
    let הערה = getval("fixNote");
    const isTosefet = סוג_תיקון.startsWith("תוספת: ") || סוג_תיקון === "אחר";

    //const isTosefet = סוג_תיקון.startsWith("תוספת: ");
    const isOther = סוג_תיקון === "אחר";

    if (isTosefet) {
      const tosafotName = סוג_תיקון.replace("תוספת: ", "");
      const foundTosafet = (window.tosafotData || []).find(t => t["שם תוספת"] === tosafotName);
      if (foundTosafet) {
        תעריף_תוספת = parseFloat(foundTosafet["תעריף"]);
      }
      כמות = 1;
    }

    let סכום_חופשי = 0;

if (isOther) {
  סכום_חופשי = parseFloat(getval("otherFixAmount")) || 0;
  הערה = getval("otherFixNote") || הערה;
  כמות = 1;
}


    // אימות
    if (!חודש || !שנה || !סוג_תיקון ||
        (!חודש_תיקון && !isTosefet && !isOther) ||
        (!שנה_תיקון && !isTosefet && !isOther)) {
      alert("יש למלא את כל השדות");
      return;
    }

    const apiData = {
      avrech_id: avrechId,
      סוג_תיקון,
     // חודש: (isTosefet ) ? חודש_תיקון : חודש,
     // שנה: (isTosefet ) ? שנה_תיקון : שנה,
     חודש: (!isTosefet || isOther) ? חודש : חודש_תיקון,
     שנה: (!isTosefet || isOther) ? שנה : שנה_תיקון,

      כמות,
      הערה,
      תאריך_לועזי: ldate,
      חודש_תיקון,
      שנה_תיקון,
      תעריף_תוספת
    };

    const res = await api("add_fix", apiData);

    if (!res.success) {
      alert("❌ שגיאה בשמירת התיקון");
      return;
    }

    const apiApplyData = {
      avrech_id: avrechId,
     // חודש: (isTosefet ) ? חודש_תיקון : חודש,
     // שנה: (isTosefet ) ? שנה_תיקון : שנה,
      חודש: (!isTosefet || isOther) ? חודש : חודש_תיקון,
      שנה: (!isTosefet || isOther) ? שנה : שנה_תיקון,

      חודש_תיקון,
      שנה_תיקון,
      סוג_תיקון
    };
    
    
if (isOther) {
  apiApplyData["סכום_חופשי"] = סכום_חופשי;
}

const res2 = await api("apply_fix_and_update_payment", apiApplyData);

    
    if (!res2.success) {
      alert("❗ שגיאה בחישוב התשלום לאחר תיקון");
      return;
    }

    setTimeout(() => {
      const updatedRow = document.querySelector(`#tableContainer tr[data-avrech-id="${avrechId}"]`);
      const tdMivchanimAfter = updatedRow?.querySelector('td[data-field="סכום מבחנים"]');
      const tdFix = updatedRow?.querySelector('td[data-field="סכום תיקונים"]');

      const mivchanimAfter = tdMivchanimAfter ? parseFloat(tdMivchanimAfter.innerText) : 0;
      const diff = +(mivchanimAfter - mivchanimBefore).toFixed(2);

      if (tdFix && !isNaN(diff) && diff !== 0) {
        const currentFix = parseFloat(tdFix.innerText || "0") || 0;
        tdFix.innerText = (currentFix + diff).toFixed(2);
      }
    }, 0);

    alert("✅ התיקון נשמר והחישוב עודכן בהצלחה");
    modal.close();
    await refreshAvrechim();

  } catch (e) {
    console.error("שגיאה ב־submitFix:", e);
    alert(`⚠️ שגיאה בביצוע התיקון:\n${e.message || e}`);
  }
}*/