// avrechim_table.js

function renderAvrechimTable(data) {
    
    const rows = data.map((a) => ({
      avrech_id: a["אברך_id"],
      snif_id: a["סניף_id"],
      שם: `${a["משפחה"]} ${a["פרטי"]}`,
      weekly_count: a["weekly_count"] || 0,
      monthly_test: ['t', true, 'true', 1, '1'].includes(a["monthly_test"]) ? "כן" : "לא",
      chabura_pe: ['t', true, 'true', 1, '1'].includes(a["chabura_pe"]) ? "כן" : "לא",
      chabura_ktav: ['t', true, 'true', 1, '1'].includes(a["chabura_ktav"]) ? "כן" : "לא",
      sugya_summary: a["sugya_summary"] || 0,
      סכום: "0.00",
    }));
 

  
    tbl = new SimpleTable(document.getElementById("tableContainer"), {
      headers: {
        שם: "שם אברך",
        weekly_count: "מבחנים שבועיים",
        monthly_test: "חודשי?",
        chabura_pe: "חבורה בעפ",
        chabura_ktav: "חבורה בכתב",
        sugya_summary: "מס' סוגיות",
        סכום: "סכום לתשלום",
      },
      fieldtypes: {
        שם: "text",
        weekly_count: "numeric",
        monthly_test: "combo",
        chabura_pe: "combo",
        chabura_ktav: "combo",
        sugya_summary: "numeric",
        סכום: "text",
      },
      combos: {
        monthly_test: ["כן", "לא"],
        chabura_pe: ["כן", "לא"],
        chabura_ktav: ["כן", "לא"],
      },
      readonlyFields: ["שם", "סכום"],
      
      onChange: (rowIndex, field, value) => {
        updateSalaries();
      },
    });
  
    updateSalaries();
  }
  
  function updateSalaries() {
    if (!tbl) return;
  
    const selectedDate = window.selectedGregDate;
    if (!selectedDate) {
      console.warn("לא נבחר תאריך חישוב – לא מחושב סכום");
      return;
    }
  
    const dateStr = selectedDate.split("T")[0];
  
    tbl.data.forEach((row, i) => {
      const avrech = currentAvrechim.find((a) => a["אברך_id"] == row.avrech_id);
      const groupName = avrech?.["קבוצה"];
      const snif_id = currentGroups[groupName]?.snif_id || row.snif_id;
  
      const tarif = getTarifForDate(snif_id, dateStr);
      if (!tarif) return;
  
      const w = parseInt(row.weekly_count) || 0;
      const m = row.monthly_test === "כן";
      const chaburaPe = row.chabura_pe === "כן";
      const chaburaKtav = row.chabura_ktav === "כן";
      const sugyaCount = parseInt(row.sugya_summary) || 0;
  
      let sumMivchanim = 0;
      let sumChaburot = 0;
      
      
      // מבחנים שבועיים וחודשיים
      if (w >= 2) {
        sumMivchanim += w * (parseFloat(tarif["תעריף מבחן שבועי"]) || 0);
        if (w >= 3 && m) {
          sumMivchanim += parseFloat(tarif["תעריף מבחן חודשי"]) || 0;
        }
      }
  
      // חבורות
      const chaburaTarif = parseFloat(tarif["תעריף חבורה"]) || 0;
      if (chaburaPe && chaburaKtav) {
        sumChaburot += chaburaTarif * 2;
      } else if (chaburaPe) {
        sumChaburot += chaburaTarif;
      }
  
      // סוגיות
      const sugyaTarif = parseFloat(tarif["תעריף סוגיה"]) || 0;
      sumChaburot += sugyaCount * sugyaTarif;
  
      // עדכון בתצוגה
      const rowsDOM = document.querySelectorAll("#tableContainer table tbody tr");
      const rowEl = rowsDOM[i];
  
      const tdMivchanim = rowEl?.querySelector('td[data-field="סכום מבחנים"]');
      const tdChaburot = rowEl?.querySelector('td[data-field="סכום חבורות"]');
      if (tdMivchanim) tdMivchanim.innerText = sumMivchanim.toFixed(2);
      if (tdChaburot) tdChaburot.innerText = sumChaburot.toFixed(2);
  
      // ✅ סכום כולל סופי = בסיס + שמיס + סדר + מבחנים + חבורות + תיקונים
      const base = parseFloat(row["שכר בסיס"] || 0);
      const sm = parseFloat(row['שמיס'] || 0); // שימי לב לסוגריים תקינים
      const sdr = parseFloat(row["סך סדר זכאי"] || 0);
      const fix = parseFloat(row["סכום תיקונים"] || 0);
  
      const total = (base + sm + sdr + sumMivchanim + sumChaburot + fix).toFixed(2);
      const tdTotal = rowEl?.querySelector('td[data-field="סכום כולל"]');
      if (tdTotal) tdTotal.innerText = total;
  
      // שמירה חזרה לאובייקט עצמו
      row["סכום מבחנים"] = sumMivchanim.toFixed(2);
      row["סכום חבורות"] = sumChaburot.toFixed(2);
      row["סכום כולל"] = total;


    });
  }
  
  function calculateTestAndGroupSums(row, tarif) {
    const w = parseInt(row.weekly_count) || 0;
    const m = row.monthly_test === "כן";
    const chaburaPe = row.chabura_pe === true || row.chabura_pe === "כן";
    const chaburaKtav = row.chabura_ktav === true || row.chabura_ktav === "כן";
    const sugyaCount = parseInt(row.sugya_summary || 0, 10);
  
    let sumMivchanim = 0;
    let sumChaburot = 0;
  
    if (w >= 2) {
      sumMivchanim += w * (parseFloat(tarif["תעריף מבחן שבועי"]) || 0);
      if (w >= 3 && m) {
        sumMivchanim += parseFloat(tarif["תעריף מבחן חודשי"]) || 0;
      }
    }
  
    const chaburaTarif = parseFloat(tarif["תעריף חבורה"]) || 0;
    if (chaburaPe && chaburaKtav) {
      sumChaburot += chaburaTarif * 2;
    } else if (chaburaPe) {
      sumChaburot += chaburaTarif;
    }
  
    const sugyaTarif = parseFloat(tarif["תעריף סוגיה"]) || 0;
    sumChaburot += sugyaCount * sugyaTarif;
  
    return { sumMivchanim, sumChaburot };
  }
  
  function getTarifForDate(snif_id, selectedDate) {
    const tarifList = currentTarifim[snif_id] || [];
  
    // מיון התעריפים לפי תאריך התחלה יורד כדי למצוא את הכי עדכני קודם
    const sortedTarifim = tarifList.slice().sort((a, b) =>
      b["תאריך התחלה"].localeCompare(a["תאריך התחלה"])
    );
  
    for (const tarif of sortedTarifim) {
      const start = tarif["תאריך התחלה"];
      const end = tarif["תאריך סיום"]; // יכול להיות null
      const isActive = tarif["סטטוס"] === "כן";
  
      if (isActive && start <= selectedDate) {
        // תעריף פעיל שתקף לתאריך
        return tarif;
      }
  
      if (!isActive && start <= selectedDate && selectedDate <= end) {
        // תעריף ישן שתקף לתאריך
        return tarif;
      }
    }
  
    return {}; // אם לא נמצא שום תעריף
  }
  
 