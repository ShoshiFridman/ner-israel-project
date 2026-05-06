document.addEventListener("DOMContentLoaded", async () => {
    try {
      await loadSnifim();
      await loadGroups();
      await loadAllAvrechim();
      await loadTavKavua();

      const currentHebYear = getHebrewYearFromToday();
      await loadHebrewMonths(currentHebYear);
      loadDepositStatus();

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
  