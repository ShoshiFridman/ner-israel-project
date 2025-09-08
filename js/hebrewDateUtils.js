// פונקציות עזר כלליות מ-util_new:

function getval(id) {
  let a = document.getElementById(id);
  if (!a) return '';
  if (a.value !== undefined) return a.value;
  if (a.innerText !== undefined) return a.innerText;
  return '';
}

function setval(id, val) {
  let a = document.getElementById(id);
  if (!a) return;
  if (a.value !== undefined) return (a.value = val);
  if (a.innerText !== undefined) return (a.innerText = val);
}

function sethtml(id, val) {
  let a = document.getElementById(id);
  if (!a) return;
  if (a.innerHTML !== undefined) return (a.innerHTML = val);
}

function israeldatetodate(dateString) {
  var dateComponents = dateString.split('/');
  var day = parseInt(dateComponents[0], 10);
  var month = parseInt(dateComponents[1], 10) - 1;
  var year = 2000 + parseInt(dateComponents[2], 10);
  return new Date(year, month, day);
}

function zl(s, l) {
  s = '' + s;
  while (s.length < l) s = '0' + s;
  return s;
}

function currenttime() {
  var today = new Date();
  return zl(today.getHours(), 2) + ":" + zl(today.getMinutes(), 2) + ":" + zl(today.getSeconds(), 2);
}

function currrentdate() {
  var today = new Date();
  return zl(today.getFullYear(), 2) + "-" + zl(today.getMonth() + 1, 2) + "-" + zl(today.getDate(), 2);
}

function isOdd(num) { return num % 2; }

function nwc(x, digits = 2, round = false) {
  if (!x) return 0;
  if (x == '') return x;
  x = x.toString().replace(/,/g, '');
  if (round) {
      x = Math.round(x);
  }
  var s = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!round) {
      var n = s.indexOf('.');
      if (n > -1) s = s.substring(0, n + 1) + s.substring(n + 1, n + digits + 1).replace(/,/g, '');
  }
  return s;
}

function printhtml(el) {
  let s = el.outerHTML;
  localStorage.setItem('html_to_print', s);
  window.open('printhtml.html');
}

function diffdays(date1str, date2str) {
  let date1 = new Date(date1str);
  let date2 = new Date(date2str);
  var Difference_In_Time = date2.getTime() - date1.getTime();
  var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
  return Difference_In_Days;
}

// פונקציות API לשינוי תאריכים עבריים בלועזי (נשארות כפי שהן)

const hebdatetoldate = async (d, m, y) => {
  return await api('hebdatetoldate', { d, m, y });
};

const ldatetohebdate = async (ldate) => {
  return await api('ldatetohebdate', { ldate });
};

const onchangehebdate = async (mainid) => {
  let d = getval(`${mainid}_heb_d`);
  let m = getval(`${mainid}_heb_m`);
  let y = getval(`${mainid}_heb_y`);
  let r = await hebdatetoldate(d, m, y);
  setval(mainid, r.ldate);
  setval(`${mainid}_heb_text`, r.text);
};

const onchangeldate = async (mainid) => {
  let ldate = getval(mainid);
  let hebdate = await ldatetohebdate(ldate);
  if (!hebdate || hebdate.error) {
      console.error('שגיאה בהמרת תאריך:', hebdate?.error || 'Hebdate is undefined');
      return;
  }
  setval(`${mainid}_heb_d`, hebdate.d);
  setval(`${mainid}_heb_m`, hebdate.m);
  setval(`${mainid}_heb_y`, hebdate.y);
  setval(`${mainid}_heb_text`, hebdate.text);
};

// פונקציות גימטריה ו־תאריכים עבריים מתוך hebrew_utils.js:

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

function toGematriaYear(year) {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];

  let y = year % 1000;
  let h = Math.floor(y / 100);
  let t = Math.floor((y % 100) / 10);
  let o = y % 10;

  let result = hundreds[h];

  if (t === 1 && o === 5) result += "טו";
  else if (t === 1 && o === 6) result += "טז";
  else {
      if (t > 0) result += tens[t];
      if (o > 0) result += ones[o];
  }

  return `${result.replace(/["״']/g, "")}`;
}

function getHebrewYear(date) {
  const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
  const parts = formatter.formatToParts(date);
  const yearPart = parts.find(p => p.type === 'year');
  return parseInt(yearPart?.value || new Date().getFullYear());
}

// פונקציות לטעינת חודשים עבריים, ברירת מחדל ועוד

function populateHebrewMonths(selectedMonth = null) {
  const year = parseInt(document.getElementById("hebYear")?.value);
  const leap = isHebrewLeapYear(year);

  const months = getHebrewMonthsArray(leap);

  const select = document.getElementById("hebMonth");
  if (!select) return;

  select.innerHTML = "";

  months.forEach((m, i) => {
    const o = document.createElement("option");
    o.value = i + 1;
    o.textContent = m;
    if (selectedMonth && selectedMonth === i + 1) o.selected = true;
    select.appendChild(o);
  });
}


  

function populateHebrewYears(selectId = "hebYear", rangeBack = 5) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = "";

  const thisYear = getHebrewYearFromToday();
  for (let i = thisYear; i >= thisYear - rangeBack; i--) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = toGematriaYear(i);
    select.appendChild(o);
  }
  select.value = thisYear;
}


function setDefaultHebrewMonthAndYear() {
  const today = new Date();
  const year = getHebrewYear(today);
  const leap = isHebrewLeapYear(year);

  const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
  const parts = formatter.formatToParts(today);
  const monthName = parts.find(p => p.type === 'month')?.value;

  const months = getHebrewMonthsArray(leap);
  const monthNumber = months.indexOf(monthName) + 1;
  

  populateHebrewMonths(monthNumber);
 populateHebrewYears();
}

function getHebrewMonth(date) {
  const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });

  const parts = formatter.formatToParts(date);
  const monthPart = parts.find(p => p.type === 'month');
  const monthName = monthPart?.value?.trim();

  const year = getHebrewYear(date);
  const months = getHebrewMonthsArray(isHebrewLeapYear(year));

  const index = months.indexOf(monthName);
  return index === -1 ? NaN : index + 1;
}

async function convertHebDateToGreg(hdate) {
  return api("hebtold", { hdate }).then((res) => {
    if (res.ldate) return res.ldate;
    throw new Error(res.error || "Unknown error");
  });
}

function monthNameFromNumber(n) {
  const months = [
    "תשרי", "חשוון", "כסלו", "טבת", "שבט",
    "אדר א", "אדר ב", "אדר", // נשים את כולם כדי לתמוך גם וגם
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
  ];
  return months[n - 1] || "";
}
function getHebrewMonthsArray(leapYear) {
  return [
    "תשרי", "חשוון", "כסלו", "טבת", "שבט",
    leapYear ? "אדר א" : "אדר",
    ...(leapYear ? ["אדר ב"] : []),
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
  ];
}

/*async function loadHebrewMonths() {
  const months = [
      "תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר",
      "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"
  ];

  const today = new Date();

  const res = await api("ldatetohebdate", { ldate: today.toISOString().split("T")[0] });
  const hebrewText = res?.text || "";
  const match = hebrewText.match(/ ([^ ]+) (תש״?[א-ת״]*)$/);
  const hebMonthName = match?.[1]?.trim();
  const hebYearText = match?.[2]?.trim();

  const hebYearNumber = getHebrewYear(today);
  const yearText = toGematriaYear(hebYearNumber);

  const select = document.getElementById("hebMonthSelect");
  select.innerHTML = "";

  months.forEach((m, i) => {
      const o = document.createElement("option");
      o.value = `${i + 1}-${hebYearNumber}`;
      o.textContent = `${m} ${yearText}`;
      select.appendChild(o);
  });
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
  const yearNumber = getHebrewYear(today);

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

  window.selectedHebMonthName = monthName;
  window.selectedHebYearText = toGematriaYear(yearNumber);
}*/

async function getHebDateText(ldate) {
  if (!ldate) return "";
  const res = await api("ldatetohebdate", { ldate });
  return res?.text || "";
}
function getHebrewYearFromToday() {
  const today = new Date();
  const approxHebrewYear = today.getFullYear() + 3760;
  return today.getMonth() >= 8 ? approxHebrewYear + 1 : approxHebrewYear;
}
function isHebrewLeapYear(hebrewYear) {
  // לפי הכלל של 7 פעמים ב־19 שנה
  return [0, 3, 6, 8, 11, 14, 17].includes(hebrewYear % 19);
}
const specialMonths = ["תשרי", "ניסן","אב"];

function populatePrevMonthsCheckboxes(currMonth, currYear) {
  const container = document.getElementById("prevMonths");
  container.innerHTML = "";

  let m = currMonth;
  let y = currYear;

  for (let i = 0; i < 12; i++) {
    const monthsArray = getHebrewMonthsArray(isHebrewLeapYear(y));
    const monthName = monthsArray[m - 1];
    const value = monthName + "/" + toGematriaYear(y);

    const btn = document.createElement("div");
    btn.className = "month-btn";
    btn.textContent = monthName + " " + toGematriaYear(y);

    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
      btn.dataset.selected = btn.classList.contains("selected") ? "1" : "0";
    });

    container.appendChild(btn);

    m--;
    if (m < 1) {
      y--;
      m = getHebrewMonthsArray(isHebrewLeapYear(y)).length;
    }
  }
}

/*
function populatePrevMonthsCheckboxes(currMonth, currYear) {
  const container = document.getElementById("prevMonths");
  container.innerHTML = ""; // ריקון קודם

  let m = currMonth;
  let y = currYear;

  for (let i = 0; i < 12; i++) {
    const monthsArray = getHebrewMonthsArray(isHebrewLeapYear(y));
    const monthName = monthsArray[m - 1];

    // יצירת צ'קבוקס
    const wrapper = document.createElement("div");
    wrapper.style.margin = "2px 0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = monthName + "/" + toGematriaYear(y); // שנה בעברית

    const label = document.createElement("label");
    label.textContent = monthName + " " + toGematriaYear(y);
    label.style.marginRight = "5px";

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    container.appendChild(wrapper);

    // חזרה חודש אחורה
    m--;
    if (m < 1) {
      y--;
      m = getHebrewMonthsArray(isHebrewLeapYear(y)).length;
    }
  }
}*/

function initPrevMonths() {
  const today = new Date();
  const currMonth = getHebrewMonth(today);
  const currYear = getHebrewYear(today);

  const monthsArray = getHebrewMonthsArray(isHebrewLeapYear(currYear));
  const currentMonthName = monthsArray[currMonth - 1];

  // רק אם החודש מיוחד מציגים
  if (specialMonths.includes(currentMonthName)) {
    document.getElementById("prevMonthsContainer").style.display = "block";
    populatePrevMonthsCheckboxes(currMonth, currYear);
  } else {
    document.getElementById("prevMonthsContainer").style.display = "none";
  }

  
}

