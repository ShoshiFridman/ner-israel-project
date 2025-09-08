// enter_tests.js

let tbl = null;
let allAvrechim = [];
let currentAvrechim = [];
let currentTarifim = {};
let currentGroups = {};
let tavimKvua = {};

/*async function loadTavKavua() {
  console.log("טעינת תווי קניה קבועים");
  const res = await api("get_tav_kniya_kvuim");
  console.log("תוצאה מהשרת:", res);

  res.forEach(row => {
    tavimKvua[row["אברך_id"]] = row;
  });
}*/
async function loadTavKavua() {
  console.log("טעינת תווי קניה קבועים");
  const res = await api("get_tav_kniya_kvuim");
  res.forEach(row => {
    tavimKvua[row["אברך_id"]] = {
      avrech_id: Number(row["אברך_id"]),
      store: row["חנות"] ?? "",
      amount: Number(row["סכום"]) || 0,
      active: row["פעיל"] === 't' || row["פעיל"] === true
    };
  });
  console.log("tavimKvua:", tavimKvua);
}

async function loadAllAvrechim() {
  try {
    allAvrechim = await api("getall_av");
    currentAvrechim = [...allAvrechim];
    renderAvrechimTable(currentAvrechim);
  } catch (e) {
    console.error("שגיאה בטעינת אברכים:", e);
    alert("לא ניתן לטעון את רשימת האברכים");
  }
}
async function saveAllTests() {
  try {
    const rows = tbl?.data || [];

    if (!window.selectedHebMonthName || !window.selectedHebYearText) {
      throw new Error("חודש עברי לא הוגדר כראוי");
    }

    const hebYearNumber = window.selectedHebYearNumber || getHebrewYear(new Date());
    const monthName = window.selectedHebMonthName.replace(/\s/g, '');
    const hebDateString = `${monthName}-${hebYearNumber}`;
    const gregDate = await convertHebDateToGreg(hebDateString);
    window.selectedGregDate = gregDate;

    const testSummaryPayload = [];
    const paymentPayload = [];

    for (const row of rows) {
      const avrech = currentAvrechim.find(a => a["אברך_id"] == row.avrech_id);
      const groupName = avrech?.["קבוצה"];
      const snif_id = currentGroups[groupName]?.snif_id || row.snif_id;
      const tarif = getTarifForDate(snif_id, gregDate);
      if (!tarif) continue;

      const w = parseInt(row.weekly_count) || 0;
      const m = row.monthly_test === "כן";
      const chaburaPe = row.chabura_pe === true || row.chabura_pe === "כן";
      const chaburaKtav = row.chabura_ktav === true || row.chabura_ktav === "כן";
      const sugyaCount = parseInt(row.sugya_summary || 0, 10);
      const fixAmount = parseFloat(row["סכום תיקונים"] || 0);
      const base = parseInt(row["שכר בסיס"]) || 0;
      const sm = parseInt(row["שמיס"]) || 0;
      const zakai = parseInt(row["סך סדר זכאי"]) || 0;

      const sofi = base+sm+zakai;
      const afterMaaser=parseFloat(row["סכום סופי לאחר מעשר"] || 0);
     // const isra = parseFloat(row["ישראשראי"] || 0);
      //const otherPay = parseFloat(row["תשלום אחר"] || 0);


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
      } else if (chaburaPe || chaburaKtav) {
        sumChaburot += chaburaTarif;
      }

      const sugyaTarif = parseFloat(tarif["תעריף סוגיה"]) || 0;
      sumChaburot += sugyaCount * sugyaTarif;

      const total = sumMivchanim + sumChaburot;
      console.log((row["שכר בסיס"] +row["שמיס"]+row["סך סדר זכאי"])+"!!!!!!!!!!!!!!!!   ");

      // נוסיף לרשימת הסיכומים
      testSummaryPayload.push({
        avrech_id: row.avrech_id,
        weekly_count: w,
        monthly_test: m,
        chabura_pe: chaburaPe,
        chabura_ktav: chaburaKtav,
        sugya_summary: sugyaCount,
        month_name: monthName,
        year_hebrew: window.selectedHebYearText,
        ldate: gregDate
      });
     const sumTav= parseInt(row["תוים"]) || 0;
     const shopTav =row["חנות תוים"];
    const betYitzhak=parseInt(row["בית יצחק"]) || 0;
    const gmach=parseInt(row["גמח נר ישראל"]) || 0;

      // נוסיף לרשימת התשלומים
      paymentPayload.push({
        avrech_id: row.avrech_id,
        חודש: monthName,
        שנה: window.selectedHebYearText,
        סכום: total.toFixed(2),
        סכום_תיקונים: fixAmount.toFixed(2),
       סכום_כולל: (total + fixAmount+sofi),       //.toFixed(2),
       maanakIsra:0,
       תווי_קניה_שח:sumTav,
       חנות_תו:shopTav,
      בית_יצחק:betYitzhak,
       גמח_נר_ישראל:gmach
// סכום_אחר_מעשר:afterMaaser
      // ישראשראי:isra.toFixed(2),
      // תשלום_אחר:otherPay.toFixed(2)
      });
    }

    // 🔁 שלב 1 – שמירת מבחנים
    const res1 = await api("save_tests", testSummaryPayload);
    console.log("📝 שמירת מבחנים:", res1);

    // 🔁 שלב 2 – שמירת תשלומים
    const res2 = await api("save_or_fix_payments", paymentPayload);

    
    console.log("💵 נשמרו תשלומים:", res2);

    alert("✅ המבחנים והתשלומים נשמרו בהצלחה!");

  } catch (e) {
    console.error("שגיאה בשמירה:", e);
    alert("⚠️ שגיאה בשמירה, ראה קונסול");
  }
  await refreshAvrechim();

}



async function loadGroups() {
  const sel = document.getElementById("groupSelect");
  sel.innerHTML = '<option value="">בחר קבוצה</option>';
  const groups = await api("getall_groups");
  groups.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g["שם"];
    opt.textContent = g["שם"];
    sel.appendChild(opt);

    currentGroups[g["שם"]] = {
      snif_id: g["סניף_id"]
    };
  });
}


document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadSnifimInto("snifSelect", "בחר סניף");
    await loadGroups();
    await loadAllAvrechim();
    await loadTavKavua();

    // קוראים פעם אחת בלבד לפונקציה שמגדירה חודש ושנה ברירת מחדל
    setDefaultHebrewMonthAndYear();
    initPrevMonths();
    // מאזינים לשינויים בסניף, קבוצה, חודש ושנה
    document.getElementById("snifSelect").addEventListener("change", refreshAvrechim);
    document.getElementById("groupSelect").addEventListener("change", refreshAvrechim);
    document.getElementById("hebMonth").addEventListener("change", refreshAvrechim);
    document.getElementById("hebYear").addEventListener("change", () => {
      populateHebrewMonths();  // בעת שינוי שנה נטען מחדש חודשים לפי שנת מעוברת
      refreshAvrechim();
    });

    document.getElementById("avrechSearch").addEventListener("input", filterAvrechimByName);

    // רענון ראשוני של טבלת האברכים
    refreshAvrechim();
  } catch (e) {
    console.error("שגיאה באתחול הדף:", e);
  }
});


function setDefaultHebrewMonthAndYear() {
  const today = new Date();
  const year = getHebrewYear(today);
  const leap = isHebrewLeapYear(year);

  const months = [
    "תשרי", "חשוון", "כסלו", "טבת", "שבט",
    leap ? "אדר א" : "אדר",
    ...(leap ? ["אדר ב"] : []),
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
  ];

  // משתמשים ב־Intl בשביל לקבל את שם החודש העברי הנוכחי
  const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
  const monthName = formatter.format(today);

  const monthNumber = months.indexOf(monthName) + 1;

  // טוענים שנים קודם
  populateHebrewYears();

  // בוחרים את השנה הנוכחית כברירת מחדל
  const yearSelect = document.getElementById("hebYear");
  if (yearSelect) yearSelect.value = year;

  // טוענים חודשים עם החודש הנוכחי כברירת מחדל
  populateHebrewMonths(monthNumber);
}


async function showFixDetails(avrech_id) {
  const month = window.selectedHebMonthName;
  const year = window.selectedHebYearText;

  const res = await api("get_fixes_for_avrech", {
    avrech_id,
    "חודש": month,
    "שנה": year
  });

  const fixes = res || [];

  if (fixes.length === 0) {
    modal.fire({
      html: "<h3>לא נמצאו תיקונים לחודש זה</h3>",
      css: "top:25%;padding:20px;"
    });
    return;
  }

  let html = `<h3 style="margin-bottom:10px;">פירוט תיקונים</h3>`;
  fixes.forEach(f => {
    html += `
      <div style="border-bottom:1px solid #ccc;padding:10px 0;text-align:right;">
        <strong>סוג:</strong> ${f["סוג_תיקון"]}<br />
        <strong>עבור:</strong> ${f["חודש"]} ${f["שנה"]}<br />
        <strong>הערה:</strong> ${f["הערה"] || "—"}
      </div>
    `;
  });

  modal.fire({
    html,
    css: "top:25%;padding:20px;width:400px;max-width:90%;text-align:right;"
  });
}
//טיפול בהפקדות כלליות

function openGeneralDepositModal() {
  document.getElementById("generalDepositModal").style.display = "block";
}

function closeGeneralDepositModal() {
  document.getElementById("generalDepositModal").style.display = "none";
}
function applyGeneralDeposit() {
  const source = document.getElementById("depositSource").value;
  const amount = parseFloat(document.getElementById("depositAmount").value);
  const month = window.selectedHebMonthName;
  const year = window.selectedHebYearText;

  if (!month || !year) {
    alert("יש לבחור חודש ושנה.");
    return;
  }
  if (isNaN(amount) || amount < 0) {
    alert("אנא הזן סכום תקין");
    return;
  }

  for (let i = 0; i < tbl.data.length; i++) {
    const row = tbl.data[i];

    // הוספת הסכום למקור הנבחר (בית יצחק או גמח נר ישראל)
    //row[source] = (parseFloat(row[source]) || 0) + amount;
    row[source]=amount;
    // הפחתת הסכום מ"שדה נר ישראל"
    row["נר ישראל"] = (parseFloat(row["נר ישראל"]) || 0) - amount;

    // עדכון חישובים אם יש
    updateIsrashrayAndOther(row); // הפונקציה שאת משתמשת בה
    tbl.refreshRow(i); // רענון השורה בטבלה
  }
  /*if (typeof updateSalaries === "function" && isCurrentMonth) {
    updateSalaries();
  }*/
  api("applyGeneralDepositToTashlumim", { "חודש": month, "שנה": year,"מקור":source,"סכום":amount }, function (res) {
    if (res.success) {
      alert("✅ ההפקדות עודכנו בהצלחה.");
    } else {
      alert("❌ שגיאה: " + res.error);
    }
  });

  closeGeneralDepositModal();
  refreshAvrechim();

}


function firstPayment() {
  const month = window.selectedHebMonthName;
  const year = window.selectedHebYearText;

  if (!month || !year) {
    alert("יש לבחור חודש ושנה.");
    return;
  }
  if (!confirm("האם אתה בטוח שברצונך ליצור הפקדות לכל האברכים?")) return;
console.log(month+"  "+year);
  api("update_deposits_from_payments", { "חודש": month, "שנה": year }, function (res) {
    if (res.success) {
      alert("✅ ההפקדות עודכנו בהצלחה.");
    } else {
      alert("❌ שגיאה: " + res.error);
    }
  });
}
function otherPayment() {
  const month = window.selectedHebMonthName;
  const year = window.selectedHebYearText;

  if (!month || !year) {
    alert("יש לבחור חודש ושנה.");
    return;
  }
  if (!confirm("האם אתה בטוח שברצונך ליצור פעימה חדשה?")) return;
  api("other_deposit", { "חודש": month, "שנה": year }, function (res) {
    if (res.success) {
      alert("✅ ההפקדות עודכנו בהצלחה.");
    } else {
      alert("❌ שגיאה: " + res.error);
    }
  });
}

/*async function createMonthlyMilga() {
  const month = window.selectedHebMonthName;
  const year = window.selectedHebYearText;

  if (!month || !year) {
      alert("יש לבחור חודש ושנה.");
      return;
  }

  try {
      const res = await api("createMilga", { "חודש": month, "שנה": year });
      console.log("API response:", res);

      if (res.success) {
          alert("✅ " + ( " נתוני מילגה עבור חודש " +month +" נוצרו בהצלחה."));
         // alert("✅ " + (res.message || "נתוני מילגה עבור חודש"+month +" עודכנו בהצלחה."));

      } else {
          alert("❌ שגיאה: " + (res.error || "לא ידועה"));
      }
  } catch (e) {
      console.error(e);
      alert("❌ קרתה שגיאה ב־API");
  }
}*/

async function createMonthlyMilga() {
  const monthEl = document.getElementById("hebMonth");
  const yearEl = document.getElementById("hebYear");
  const monthName = monthEl.options[monthEl.selectedIndex].textContent;
  const yearText = yearEl.options[yearEl.selectedIndex].textContent;
  
  let prevMonths = [];
  if (specialMonths.includes(monthName)) {
    prevMonths = Array.from(document.querySelectorAll("#prevMonths input:checked"))
                      .map(cb => cb.value);
  }

  try {
      const res = await api("createMilga", { 
          "חודש": monthName, 
          "שנה": yearText,
          prevMonths 
      });
      if (res.success) {
          alert("✅ נתוני מילגה עבור חודש " + monthName + " נוצרו בהצלחה.");
      } else {
          alert("❌ שגיאה: " + (res.error || "לא ידועה"));
      }
  } catch (e) {
      alert("❌ קרתה שגיאה ב־API");
  }
}
