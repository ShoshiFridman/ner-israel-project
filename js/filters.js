// filters.js

function updateIsrashrayAndOther(row) {

  let taveiKnia = parseFloat(row["תוים"]) || 0;
  taveiKnia = Math.max(0, taveiKnia);

  // תחזירי את שני הסכומים למצב המקורי
  let baseIsra = parseFloat(row._original_israshray) || 0;
  let baseOther = parseFloat(row._original_other) || 0;
let betYitzhak= parseFloat(row["בית יצחק"]) || 0;
let gmach= parseFloat(row["גמח נר ישראל"]) || 0;
let half=0;
  if (taveiKnia !== 0) {
   half = taveiKnia / 2;
    row["ישראשראי"] = baseIsra - half;
    row["נר ישראל"] = baseOther - half;
    console.log("חצי תווים", half, "ישראשראי בסיסי", baseIsra, "נר ישראל בסיסי", baseOther);
  } else {
    // אם אין תווים – תחזיר למקורי
    row["ישראשראי"] = baseIsra;
    row["נר ישראל"] = baseOther;
  }
  if(betYitzhak!==0||gmach!==0)
  {
    row["נר ישראל"] =baseOther- betYitzhak- gmach-half;
  }
  /*if(gmach!==0)
  {
    row["נר ישראל"] =baseOther- gmach;
  }*/
}
/*function updateIsrashrayAndOther(row) {

  let taveiKnia = parseFloat(row["תוים"]) || 0;
  taveiKnia = Math.max(0, taveiKnia);
  
  // תחזירי את שני הסכומים למצב המקורי
  let baseIsra = parseFloat(row._original_israshray) || 0;
  let baseOther = parseFloat(row._original_other) || 0;

  if (taveiKnia !== 0) {
    const half = taveiKnia / 2;
    row["ישראשראי"] = baseIsra - half;
    row["נר ישראל"] = baseOther - half;
    console.log("חצי תווים", half, "ישראשראי בסיסי", baseIsra, "נר ישראל בסיסי", baseOther);
  } else {
    // אם אין תווים – תחזיר למקורי
    row["ישראשראי"] = baseIsra;
    row["נר ישראל"] = baseOther;
  }
}*/


/*
async function refreshAvrechim(e) {
  console.log("📌 refreshAvrechim התחילה לרוץ");

  const changedId = e?.target?.id;

  if (changedId === "snifSelect" || changedId === "groupSelect") {
    const searchInputEl = document.getElementById("avrechSearch");
    if (searchInputEl && searchInputEl.value.trim()) {
      searchInputEl.value = "";
    }
  }

  let snif_id = null;
  let group_name = null;

  const searchInput = document.getElementById("avrechSearch")?.value.trim().toLowerCase();

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
    document.getElementById("snifSelect").value = "";
    document.getElementById("groupSelect").value = "";
  }

  // בדיקה שיש תאריך עברי תקין
  const monthEl = document.getElementById("hebMonth");
  const yearEl = document.getElementById("hebYear");

  if (!monthEl || !yearEl || !monthEl.value || !yearEl.value) {
    console.warn("לא נבחר חודש או שנה עבריים");
    return;
  }

  const month = parseInt(monthEl.value);
  const year = parseInt(yearEl.value);

  const monthName = [
    "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר",
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
  ][month - 1];

  const yearNumber = year;
  const selectedYearText = toGematriaYear(yearNumber);

  // בדיקת האם החודש הנוכחי (להגדרת עריכה)
  const today = new Date();
  const isCurrentMonth =
    month === getHebrewMonth(today) &&
    year === getHebrewYear(today);

  // המרת תאריך עברי ללועזי
  const hebDateString = `${monthName}-${year}`;
  window.selectedHebMonthName = monthName;
  window.selectedHebYearText = selectedYearText;
  window.selectedGregDate = await convertHebDateToGreg(hebDateString);
  console.log("📆 תאריך לועזי שנשמר לחישוב:", window.selectedGregDate);

  // שליפת אברכים עם פילטרים
  const avs = await api("get_av_filtered", {
    snif_id,
    group_name,
    month_name: monthName,
    year_hebrew: selectedYearText
  });

  currentAvrechim = avs;

  // שליפת תעריפים
  const tarifim = await api("getall_tarifim");

  const tarifimBySnif = {};
  tarifim.forEach((t) => {
    const snif = t["קוד סניף"];
    if (!tarifimBySnif[snif]) tarifimBySnif[snif] = [];
    tarifimBySnif[snif].push(t);
  });
  currentTarifim = tarifimBySnif;

  // סינון אברכים לפי חיפוש
  const finalAvrechim = searchInput
    ? avs.filter((a) =>
        (`${a["משפחה"]} ${a["פרטי"]}`.toLowerCase().includes(searchInput))
      )
    : avs;
   
const fixPayments = await api("get_fix_totals", {
  month: window.selectedHebMonthName,
  year: window.selectedHebYearText
});
const fixAmounts = fixPayments?.payments || {};


  // בונים את שורות הטבלה כולל בדיקת תשלום על סיכום סוגיות לפי סניף האברך
  const rows = finalAvrechim.map((a) => {
    
    const snifId = a["סניף_id"] || snif_id;

    // מחפשים תעריף פעיל של הסניף
    const tarifList = currentTarifim[snifId] || [];
    const activeTarif = tarifList.find(t => t["סטטוס"] === "כן");

    // האם הסניף משלם על סיכום סוגיות (סוגיה > 0)
    const hasSugya = activeTarif && Number(activeTarif["תעריף סוגיה"]) > 0;
    const base = parseFloat(a["base"] || 0);
    const sm = parseFloat(a["sm"] || 0);
    const sdr = parseFloat(a["sdarim_Z_sum"] || 0);
    const sumFix = parseFloat(a["סכום_תיקונים"] || 0);  // זה מכיל אצלך רק סכום + תיקונים
    let kolel = parseFloat(a["סכום_כולל"] || 0);  // זה מכיל אצלך רק סכום + תיקונים
    const testSum = 0;   // יתעדכן ב-updateSalaries
    const chaburaSum = 0; // גם כן יתעדכן

    const row = {
      avrech_id: a["אברך_id"],
      snif_id: snifId,
      שם: `${a["משפחה"]} ${a["פרטי"]}`,
      "שכר בסיס": base.toFixed(2),
      "שמיס": sm.toFixed(2),
      "סדר זכאי": a["sdarim_Z"] ?? 0,
      "סך סדר זכאי": sdr.toFixed(2),
    
      weekly_count: a["weekly_count"] || 0,
      monthly_test: ['t', true, 'true', 1, '1'].includes(a["monthly_test"]) ? "כן" : "לא",
      chabura_pe: ['t', true, 'true', 1, '1'].includes(a["chabura_pe"]) ? "כן" : "לא",
      chabura_ktav: ['t', true, 'true', 1, '1'].includes(a["chabura_ktav"]) ? "כן" : "לא",
    
      "סכום מבחנים": "0.00", // יתעדכן אחר כך
      "סכום חבורות": "0.00", // יתעדכן אחר כך
      "סכום תיקונים": sumFix.toFixed(2), // זה רק מה שיש במסד (ולא הבסיס)
      //"סכום כולל": (base + sm + sdr + sumFix+testSum+chaburaSum).toFixed(2), // בשלב זה בלי מבחנים וחבורות
      "סכום כולל": (kolel).toFixed(2), 

      "מעשר קבוע": a["מעשר_קבוע"] !== null ? Number(a["מעשר_קבוע"]).toFixed(2) : "0.00",
      "מעשר באחוזים": a["מעשר_באחוזים"] !== null ? Number(a["מעשר_באחוזים"]).toFixed(2) : "0.00",
      "סכום סופי לאחר מעשר":"0"
    

    };
    const maaserKvua = parseFloat(row["מעשר קבוע"]) || 0;
    const maaserPercent = parseFloat(row["מעשר באחוזים"]) || 0;

    let totalAfterMaaser = kolel;
   if (maaserPercent > 0) {
     totalAfterMaaser = totalAfterMaaser * (1 - maaserPercent / 100);
}
if (maaserKvua!=0) {
  totalAfterMaaser -= maaserKvua;
}
 row["סכום סופי לאחר מעשר"] = totalAfterMaaser.toFixed(2);

   
    if (hasSugya) {
      row.sugya_summary = parseInt(a["sugya_summary"]) || 0;
      row.hasSugya = true;
    }
   row.actions = `
   <button class="fix-btn" title="עריכת תיקון" ${!isCurrentMonth ? "disabled" : ""} onclick="openFixForm(${row.avrech_id}, '${row.שם}')">✏️</button>
   <button class="fix-btn" title="פירוט תיקונים" onclick="showFixDetails(${row.avrech_id})">ℹ️</button>

 `;
 

 
    const fixKey = String(row.avrech_id);

  row["סכום תיקונים"] = fixAmounts[fixKey] !== undefined ? Number(fixAmounts[fixKey]).toFixed(2) : "0.00";
  const city = (a["עיר"] || "").toString().trim();
  const group = (a["קבוצה"] || "").toString().trim();
  let tosafot = a["תוספות"] || "[]";

  if (typeof tosafot === "string") {
    try {
      tosafot = JSON.parse(tosafot);
    } catch (e) {
      console.error("שגיאה בפענוח JSON של תוספות:", e);
      tosafot = [];
    }
  }
  


  let israDefault = 500;


  if (group === "רבנים" || city !== "רכסים") israDefault = 0;
 else{
  for (const t of tosafot) {
  console.log("raw t:", t);
  console.log("typeof t:", typeof t);

  const name = t["שם"] || "";
  console.log(`בודק תוספת: *${name}*`);

  if (name.trim() === "מענק לידה") israDefault += 200;
  else if (name.trim() === "מענק בר מצווה") israDefault += 250;
  else if (name.trim() === "מענק חתונה") israDefault += 700;
 }

  }
 
  
  console.log("ישראשראי לאחר חישוב:", israDefault);
  
  

  row["ישראשראי"] = israDefault;
  row["נר ישראל"] = row["סכום סופי לאחר מעשר"] -row["ישראשראי"];
  row["בית יצחק"] = parseFloat(a["בית_יצחק"] || 0);
  row["גמח נר ישראל"] = parseFloat(a["גמח_נר_ישראל"] || 0);

  row["תוים"] = parseFloat(a["תוים"] || 0);
  row["חנות תוים"] = a["חנות_תוים"] || "יש";

  row._original_israshray = row["ישראשראי"];
    row._original_other = row["נר ישראל"];
    /*if (row["תוים"] > 0) {
      updateIsrashrayAndOther(row);
    }//
    if (row["תוים"] > 0||row["בית יצחק"] > 0||row["גמח נר ישראל"] > 0) {
      updateIsrashrayAndOther(row);
    }
    
   row["שמור כקבוע"] = "✔️";

 
 
    return row;
  });


  // האם לפחות אברך אחד צריך את שדה סיכום סוגיות
  const includeSugya = rows.some(r => r.hasSugya);

  let headers;

  if (includeSugya) {
    headers = {
      שם: "שם אברך",
      "שכר בסיס":"שכר בסיס",
      "שמיס":"שמיס",
      "סדר זכאי":"סדר זכאי",
      "סך סדר זכאי":"סך סדר זכאי",

      weekly_count: "מבחנים שבועיים",
      monthly_test: "חודשי?",
      "סכום מבחנים": "סכום מבחנים",
      sugya_summary: "מס' סוגיות", // מופיע לפני חבורות
      chabura_pe: "חבורה בעפ",
      chabura_ktav: "חבורה בכתב",
      "סכום חבורות": "סכום חבורות",
    };
  } else {
    headers = {
      שם: "שם אברך",
      "שכר בסיס":"שכר בסיס",
      "שמיס":"שמיס",
      "סדר זכאי":"סדר זכאי",
      "סך סדר זכאי":"סך סדר זכאי",
      weekly_count: "מבחנים שבועיים",
      monthly_test: "חודשי?",
      "סכום מבחנים": "סכום מבחנים",
      chabura_pe: "חבורה בעפ",
      chabura_ktav: "חבורה בכתב",
      "סכום חבורות": "סכום חבורות",
    };
  }
  
  headers.actions = "⚙️ תיקונים";
  headers["סכום תיקונים"] = "סכום תיקונים";
  headers["סכום כולל"] = "סכום כולל";

  headers["מעשר קבוע"] = "מעשר קבוע";
headers["מעשר באחוזים"] = "מעשר באחוזים";

 headers["סכום סופי לאחר מעשר"] = "סכום סופי לאחר מעשר";
 headers["ישראשראי"] = "ישראשראי";
 headers["נר ישראל"] = "נר ישראל";
 headers["בית יצחק"] = "בית יצחק";
 headers["גמח נר ישראל"] = "גמח נר ישראל";

 headers["תוים"] = "תוים";
 headers["חנות תוים"] = "חנות תוים";
 headers["שמור כקבוע"] = "שמור תוים כקבוע";



  let fieldtypes = {
    שם: "text",
    weekly_count: "numeric",
    monthly_test: "combo",
    chabura_pe: "combo",
    chabura_ktav: "combo",
    "סכום מבחנים": "text",
    "סכום חבורות": "text",
  };
  
  if (includeSugya) {
    fieldtypes.sugya_summary = "numeric";
  }
  fieldtypes.actions ="html";// "button";
  fieldtypes["סכום תיקונים"] = "text";
  fieldtypes["שכר בסיס"] = "text"; // או numeric אם מתאים
  fieldtypes["סך סדר זכאי"] = "text"; // או numeric אם מתאים

  fieldtypes["שמיס"] = "text";
  fieldtypes["סדר זכאי"] = "numeric";
  fieldtypes["מעשר קבוע"] = "text";  // או numeric אם תרצה
fieldtypes["מעשר באחוזים"] = "text";
fieldtypes["סכום כולל"] = "text";

fieldtypes["סכום סופי לאחר מעשר"] = "text";
fieldtypes["ישראשראי"] = "numeric";
fieldtypes["נר ישראל"] = "numeric";
fieldtypes["תוים"] = "numeric";
fieldtypes["חנות תוים"] = "combo";

//fieldtypes["שמור כקבוע"] = "html";
fieldtypes["שמור כקבוע"] = "button";

fieldtypes["בית יצחק"] = "numeric";
fieldtypes["גמח נר ישראל"] = "numeric";


  // אופציות קומבו
  const combos = {
    monthly_test: ["כן", "לא"],
    chabura_pe: ["כן", "לא"],
    chabura_ktav: ["כן", "לא"],
  };
  combos["חנות תוים"] = ["יש","ברכל","רמי לוי","אושר עד"];

  // שדות נעולים וניתנים לעריכה לפי חודש
  const readonlyFields = [
    "שם", "סכום מבחנים", "סכום חבורות", "סכום תיקונים", "שכר בסיס", "שמיס", "סדר זכאי","מעשר קבוע", "מעשר באחוזים","סך סדר זכאי","סכום כולל","סכום סופי לאחר מעשר","ישראשראי","נר ישראל"
  ];
  
  let editableFields = [];

  if (isCurrentMonth) {
    editableFields = ["weekly_count", "monthly_test", "chabura_pe", "chabura_ktav","תוים","חנות תוים"];
    if (includeSugya) editableFields.push("sugya_summary");
  }

  // יצירת הטבלה
  tbl = new SimpleTable(document.getElementById("tableContainer"), {
    headers,
    fieldtypes,
    comboOptions: combos,
    
    readonlyFields,
    editableFields,
    data: rows,
    onChange: (rowIndex, field, value) => {
      const row = tbl.data[rowIndex];

      // עדכון שדה בשורה
      row[field] = value;
      if (field === "תוים"||field === "בית יצחק"||field === "גמח נר ישראל") {
            //tbl.data[rowIndex]["תוים"] = parseFloat(value) || 0;

        updateIsrashrayAndOther(row); // פונקציית חישוב שאתה יוצר
        tbl.refreshRow(rowIndex); // ריענון התצוגה של השורה
      }
      if (isCurrentMonth) updateSalaries();
    },
    onAction: (rowIndex, field) => {
      console.log("onAction fired!", field, rowIndex);

      if (!isCurrentMonth) return;
      const row = tbl.data[rowIndex];
 
      if (field === "actions") {
        openFixForm(row.avrech_id, row.שם);
      }
      if (field === "שמור כקבוע") {
        const row = tbl.data[rowIndex];

    
        saveKvuaById(row.avrech_id, rowIndex);
      }
      
    },
    
    showRowNumber: true,
  });

 if (!isCurrentMonth) {
  // מבחנים שבועיים + חודשי
  document.querySelectorAll('td[data-field="weekly_count"] input, td[data-field="monthly_test"] select').forEach(el => {
    el.disabled = true;
  });

  // סיכום סוגיות
  if (includeSugya) {
    document.querySelectorAll('td[data-field="sugya_summary"] input').forEach(el => {
      el.disabled = true;
    });
  }

  // חבורה בע"פ ובכתב
  document.querySelectorAll('td[data-field="chabura_pe"] select, td[data-field="chabura_ktav"] select').forEach(el => {
    el.disabled = true;
  });
}


  // נעילת עמודות שאסור לבחור בהן בכלל
  document.querySelectorAll('td[data-field="שם"], td[data-field="סכום"]').forEach((td) => {
    td.style.userSelect = "none";
    td.style.pointerEvents = "none";
  });

  // סיום: עדכון חישובים (אם יש)
  updateSalaries();
} 
 
*/

async function refreshAvrechim(e) {
  console.log("📌 refreshAvrechim התחילה לרוץ");

  const changedId = e?.target?.id;

  if (changedId === "snifSelect" || changedId === "groupSelect") {
    const searchInputEl = document.getElementById("avrechSearch");
    if (searchInputEl && searchInputEl.value.trim()) {
      searchInputEl.value = "";
    }
  }

  let snif_id = null;
  let group_name = null;

  const searchInput = document.getElementById("avrechSearch")?.value.trim().toLowerCase();

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
    document.getElementById("snifSelect").value = "";
    document.getElementById("groupSelect").value = "";
  }

  // בדיקה שיש תאריך עברי תקין
  const monthEl = document.getElementById("hebMonth");
  const yearEl = document.getElementById("hebYear");

  if (!monthEl || !yearEl || !monthEl.value || !yearEl.value) {
    console.warn("לא נבחר חודש או שנה עבריים");
    return;
  }

  const month = parseInt(monthEl.value);
  const year = parseInt(yearEl.value);

  const monthName = [
    "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר",
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
  ][month - 1];

  const yearNumber = year;
  const selectedYearText = toGematriaYear(yearNumber);

  // בדיקת האם החודש הנוכחי (להגדרת עריכה)
  const today = new Date();
  const isCurrentMonth =
    month === getHebrewMonth(today) &&
    year === getHebrewYear(today);

  // המרת תאריך עברי ללועזי
  const hebDateString = `${monthName}-${year}`;
  window.selectedHebMonthName = monthName;
  window.selectedHebYearText = selectedYearText;
  window.selectedGregDate = await convertHebDateToGreg(hebDateString);
  console.log("📆 תאריך לועזי שנשמר לחישוב:", window.selectedGregDate);

  // שליפת אברכים עם פילטרים
  const avs = await api("get_av_filtered", {
    snif_id,
    group_name,
    month_name: monthName,
    year_hebrew: selectedYearText
  });

  currentAvrechim = avs;

  // שליפת תעריפים
  const tarifim = await api("getall_tarifim");

  const tarifimBySnif = {};
  tarifim.forEach((t) => {
    const snif = t["קוד סניף"];
    if (!tarifimBySnif[snif]) tarifimBySnif[snif] = [];
    tarifimBySnif[snif].push(t);
  });
  currentTarifim = tarifimBySnif;

  // סינון אברכים לפי חיפוש
  const finalAvrechim = searchInput
    ? avs.filter((a) =>
        (`${a["משפחה"]} ${a["פרטי"]}`.toLowerCase().includes(searchInput))
      )
    : avs;
   
const fixPayments = await api("get_fix_totals", {
  month: window.selectedHebMonthName,
  year: window.selectedHebYearText
});
const fixAmounts = fixPayments?.payments || {};


  // בונים את שורות הטבלה כולל בדיקת תשלום על סיכום סוגיות לפי סניף האברך
  const rows = finalAvrechim.map((a) => {
    
    const snifId = a["סניף_id"] || snif_id;

    // מחפשים תעריף פעיל של הסניף
    const tarifList = currentTarifim[snifId] || [];
    const activeTarif = tarifList.find(t => t["סטטוס"] === "כן");

    // האם הסניף משלם על סיכום סוגיות (סוגיה > 0)
    const hasSugya = activeTarif && Number(activeTarif["תעריף סוגיה"]) > 0;
    const base = parseFloat(a["base"] || 0);
    const sm = parseFloat(a["sm"] || 0);
    const sdr = parseFloat(a["sdarim_Z_sum"] || 0);
    const sumFix = parseFloat(a["סכום_תיקונים"] || 0);  // זה מכיל אצלך רק סכום + תיקונים
    let kolel = parseFloat(a["סכום_כולל"] || 0);  // זה מכיל אצלך רק סכום + תיקונים
    const testSum = 0;   // יתעדכן ב-updateSalaries
    const chaburaSum = 0; // גם כן יתעדכן

    const row = {
      avrech_id: a["אברך_id"],
      snif_id: snifId,
      שם: `${a["משפחה"]} ${a["פרטי"]}`,
      "שכר בסיס": base.toFixed(2),
      "שמיס": sm.toFixed(2),
      "סדר זכאי": a["sdarim_Z"] ?? 0,
      "סך סדר זכאי": sdr.toFixed(2),
    
      weekly_count: a["weekly_count"] || 0,
      monthly_test: ['t', true, 'true', 1, '1'].includes(a["monthly_test"]) ? "כן" : "לא",
      chabura_pe: ['t', true, 'true', 1, '1'].includes(a["chabura_pe"]) ? "כן" : "לא",
      chabura_ktav: ['t', true, 'true', 1, '1'].includes(a["chabura_ktav"]) ? "כן" : "לא",
    
      "סכום מבחנים": "0.00", // יתעדכן אחר כך
      "סכום חבורות": "0.00", // יתעדכן אחר כך
      "סכום תיקונים": sumFix.toFixed(2), // זה רק מה שיש במסד (ולא הבסיס)
      //"סכום כולל": (base + sm + sdr + sumFix+testSum+chaburaSum).toFixed(2), // בשלב זה בלי מבחנים וחבורות
      "סכום כולל": (kolel).toFixed(2), 

      "מעשר קבוע": a["מעשר_קבוע"] !== null ? Number(a["מעשר_קבוע"]).toFixed(2) : "0.00",
      "מעשר באחוזים": a["מעשר_באחוזים"] !== null ? Number(a["מעשר_באחוזים"]).toFixed(2) : "0.00",
      "סכום סופי לאחר מעשר":"0"
    

    };
    const maaserKvua = parseFloat(row["מעשר קבוע"]) || 0;
    const maaserPercent = parseFloat(row["מעשר באחוזים"]) || 0;

    let totalAfterMaaser = kolel;
   if (maaserPercent > 0) {
     totalAfterMaaser = totalAfterMaaser * (1 - maaserPercent / 100);
}
if (maaserKvua!=0) {
  totalAfterMaaser -= maaserKvua;
}
 row["סכום סופי לאחר מעשר"] = totalAfterMaaser.toFixed(2);

   
    if (hasSugya) {
      row.sugya_summary = parseInt(a["sugya_summary"]) || 0;
      row.hasSugya = true;
    }
   row.actions = `
   <button class="fix-btn" title="עריכת תיקון" ${!isCurrentMonth ? "disabled" : ""} onclick="openFixForm(${row.avrech_id}, '${row.שם}')">✏️</button>
   <button class="fix-btn" title="פירוט תיקונים" onclick="showFixDetails(${row.avrech_id})">ℹ️</button>

 `;
 

 
    const fixKey = String(row.avrech_id);

  row["סכום תיקונים"] = fixAmounts[fixKey] !== undefined ? Number(fixAmounts[fixKey]).toFixed(2) : "0.00";
  const city = (a["עיר"] || "").toString().trim();
  const group = (a["קבוצה"] || "").toString().trim();
  let tosafot = a["תוספות"] || "[]";

  if (typeof tosafot === "string") {
    try {
      tosafot = JSON.parse(tosafot);
    } catch (e) {
      console.error("שגיאה בפענוח JSON של תוספות:", e);
      tosafot = [];
    }
  }
  


  let israDefault = 500;


  if (group === "רבנים" || city !== "רכסים") israDefault = 0;
 else{
  for (const t of tosafot) {
  console.log("raw t:", t);
  console.log("typeof t:", typeof t);

  const name = t["שם"] || "";
  console.log(`בודק תוספת: *${name}*`);

  if (name.trim() === "מענק לידה") israDefault += 200;
  else if (name.trim() === "מענק בר מצווה") israDefault += 250;
  else if (name.trim() === "מענק חתונה") israDefault += 700;
 }

  }
 
  
  console.log("ישראשראי לאחר חישוב:", israDefault);
  
  

  row["ישראשראי"] = israDefault;
  row["נר ישראל"] = row["סכום סופי לאחר מעשר"] -row["ישראשראי"];
  row["בית יצחק"] = parseFloat(a["בית_יצחק"] || 0);
  row["גמח נר ישראל"] = parseFloat(a["גמח_נר_ישראל"] || 0);

  row["תוים"] = parseFloat(a["תוים"] || 0);
  row["חנות תוים"] = a["חנות_תוים"] || "יש";

  row._original_israshray = row["ישראשראי"];
    row._original_other = row["נר ישראל"];
    /*if (row["תוים"] > 0) {
      updateIsrashrayAndOther(row);
    }*/
    if (row["תוים"] > 0||row["בית יצחק"] > 0||row["גמח נר ישראל"] > 0) {
      updateIsrashrayAndOther(row);
    }
    
   row["שמור כקבוע"] = "✔️";

 
 
    return row;
  });


  // האם לפחות אברך אחד צריך את שדה סיכום סוגיות
  const includeSugya = rows.some(r => r.hasSugya);

  let headers;

  if (includeSugya) {
    headers = {
      שם: "שם אברך",
      "שכר בסיס":"שכר בסיס",
      "שמיס":"שמיס",
      "סדר זכאי":"סדר זכאי",
      "סך סדר זכאי":"סך סדר זכאי",

      weekly_count: "מבחנים שבועיים",
      monthly_test: "חודשי?",
      "סכום מבחנים": "סכום מבחנים",
      sugya_summary: "מס' סוגיות", // מופיע לפני חבורות
      chabura_pe: "חבורה בעפ",
      chabura_ktav: "חבורה בכתב",
      "סכום חבורות": "סכום חבורות",
    };
  } else {
    headers = {
      שם: "שם אברך",
      "שכר בסיס":"שכר בסיס",
      "שמיס":"שמיס",
      "סדר זכאי":"סדר זכאי",
      "סך סדר זכאי":"סך סדר זכאי",
      weekly_count: "מבחנים שבועיים",
      monthly_test: "חודשי?",
      "סכום מבחנים": "סכום מבחנים",
      chabura_pe: "חבורה בעפ",
      chabura_ktav: "חבורה בכתב",
      "סכום חבורות": "סכום חבורות",
    };
  }
  
  headers.actions = "⚙️ תיקונים";
  headers["סכום תיקונים"] = "סכום תיקונים";
  headers["סכום כולל"] = "סכום כולל";

  headers["מעשר קבוע"] = "מעשר קבוע";
headers["מעשר באחוזים"] = "מעשר באחוזים";

 headers["סכום סופי לאחר מעשר"] = "סכום סופי לאחר מעשר";
 headers["ישראשראי"] = "ישראשראי";
 headers["נר ישראל"] = "נר ישראל";
 headers["בית יצחק"] = "בית יצחק";
 headers["גמח נר ישראל"] = "גמח נר ישראל";

 headers["תוים"] = "תוים";
 headers["חנות תוים"] = "חנות תוים";
 headers["שמור כקבוע"] = "שמור תוים כקבוע";



  let fieldtypes = {
    שם: "text",
    weekly_count: "numeric",
    monthly_test: "combo",
    chabura_pe: "combo",
    chabura_ktav: "combo",
    "סכום מבחנים": "text",
    "סכום חבורות": "text",
  };
  
  if (includeSugya) {
    fieldtypes.sugya_summary = "numeric";
  }
  fieldtypes.actions ="html";// "button";
  fieldtypes["סכום תיקונים"] = "text";
  fieldtypes["שכר בסיס"] = "text"; // או numeric אם מתאים
  fieldtypes["סך סדר זכאי"] = "text"; // או numeric אם מתאים

  fieldtypes["שמיס"] = "text";
  fieldtypes["סדר זכאי"] = "numeric";
  fieldtypes["מעשר קבוע"] = "text";  // או numeric אם תרצה
fieldtypes["מעשר באחוזים"] = "text";
fieldtypes["סכום כולל"] = "text";

fieldtypes["סכום סופי לאחר מעשר"] = "text";
fieldtypes["ישראשראי"] = "numeric";
fieldtypes["נר ישראל"] = "numeric";
fieldtypes["תוים"] = "numeric";
fieldtypes["חנות תוים"] = "combo";

//fieldtypes["שמור כקבוע"] = "html";
fieldtypes["שמור כקבוע"] = "button";

fieldtypes["בית יצחק"] = "numeric";
fieldtypes["גמח נר ישראל"] = "numeric";


  // אופציות קומבו
  const combos = {
    monthly_test: ["כן", "לא"],
    chabura_pe: ["כן", "לא"],
    chabura_ktav: ["כן", "לא"],
  };
  combos["חנות תוים"] = ["יש","ברכל","רמי לוי","אושר עד"];

  // שדות נעולים וניתנים לעריכה לפי חודש
  const readonlyFields = [
    "שם", "סכום מבחנים", "סכום חבורות", "סכום תיקונים", "שכר בסיס", "שמיס", "סדר זכאי","מעשר קבוע", "מעשר באחוזים","סך סדר זכאי","סכום כולל","סכום סופי לאחר מעשר","ישראשראי","נר ישראל"
  ];
  
  let editableFields = [];

  if (isCurrentMonth) {
    editableFields = ["weekly_count", "monthly_test", "chabura_pe", "chabura_ktav","תוים","חנות תוים"];
    if (includeSugya) editableFields.push("sugya_summary");
  }

  // יצירת הטבלה
  tbl = new SimpleTable(document.getElementById("tableContainer"), {
    headers,
    fieldtypes,
    comboOptions: combos,
    
    readonlyFields,
    editableFields,
    data: rows,
    onChange: (rowIndex, field, value) => {
      const row = tbl.data[rowIndex];

      // עדכון שדה בשורה
      row[field] = value;
      if (field === "תוים"||field === "בית יצחק"||field === "גמח נר ישראל") {
            //tbl.data[rowIndex]["תוים"] = parseFloat(value) || 0;

        updateIsrashrayAndOther(row); // פונקציית חישוב שאתה יוצר
        tbl.refreshRow(rowIndex); // ריענון התצוגה של השורה
      }
      if (isCurrentMonth) updateSalaries();
    },
    onAction: (rowIndex, field) => {
      console.log("onAction fired!", field, rowIndex);

      if (!isCurrentMonth) return;
      const row = tbl.data[rowIndex];
 
      if (field === "actions") {
        openFixForm(row.avrech_id, row.שם);
      }
      if (field === "שמור כקבוע") {
        const row = tbl.data[rowIndex];

    
        saveKvuaById(row.avrech_id, rowIndex);
      }
      
    },
    
    showRowNumber: true,
  });

 if (!isCurrentMonth) {
  // מבחנים שבועיים + חודשי
  document.querySelectorAll('td[data-field="weekly_count"] input, td[data-field="monthly_test"] select').forEach(el => {
    el.disabled = true;
  });

  // סיכום סוגיות
  if (includeSugya) {
    document.querySelectorAll('td[data-field="sugya_summary"] input').forEach(el => {
      el.disabled = true;
    });
  }

  // חבורה בע"פ ובכתב
  document.querySelectorAll('td[data-field="chabura_pe"] select, td[data-field="chabura_ktav"] select').forEach(el => {
    el.disabled = true;
  });
}


  // נעילת עמודות שאסור לבחור בהן בכלל
  document.querySelectorAll('td[data-field="שם"], td[data-field="סכום"]').forEach((td) => {
    td.style.userSelect = "none";
    td.style.pointerEvents = "none";
  });

  // סיום: עדכון חישובים (אם יש)
  updateSalaries();
} 
 


function filterAvrechimByName() {
  const searchInput = document.getElementById("avrechSearch").value.trim().toLowerCase();

  if (!searchInput) {
    refreshAvrechim();
    return;
  }

  const filtered = allAvrechim.filter(a => {
    const fullName = `${a["משפחה"]} ${a["פרטי"]}`.toLowerCase();
    return fullName.includes(searchInput);
  });

  renderAvrechimTable(filtered);
}





function saveKvuaById(avrechId, rowIndex) {
  
  const row = tbl.data[rowIndex];

  if (!row || row.avrech_id != avrechId) {
    console.error("שגיאה בהתאמת שורה לאברך", avrechId);
    return;
  }

  const amount = parseFloat(row["תוים"]) || 0;
  const store = row["חנות תוים"] || "";

  if (amount <= 0 || store === "") {
    alert("יש להזין סכום תווים וחנות לפני השמירה.");
    return;
  }
//  row["תוים"] = tbl.getCellValue(rowIndex, "תוים"); // קחי את הערך כפי שהוזן ממש בטבלה
//row["חנות תוים"] = tbl.getCellValue(rowIndex, "חנות תוים");

  updateIsrashrayAndOther(row);
  tbl.refreshRow(rowIndex); // רענון שורה בודדת
  saveKvua(avrechId, amount, store);
}


function saveKvua(avrechId, amount, store) {
  console.log("🧪 נתוני שמירה קבועה:", { avrechId, amount, store });

  if (!amount || amount === 0 || !store) {
    alert("יש להזין סכום תווים וחנות לפני השמירה.");
    return;
  }

  api("save_fixed_tavim", {
    avrech_id: avrechId,
    amount: amount,
    store: store
  })
    .then(() => alert("✅ נשמר כקבוע בהצלחה"))
    .catch(err => {
      console.error("שגיאה בשמירה קבועה", err);
      alert("❌ שגיאה בשמירה");
    });
    
}

  

