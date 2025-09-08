class SimpleTable {
  constructor(container, {
    headers = {},
    data = [],
    fieldtypes = {},
    comboOptions = {},
    onChange = () => {},
    onAction = () => {},  // ✅ הוספת שורה זו
    readonlyFields = [],
    showRowNumber = true
  } = {}) {
    this.container = container;
    this.headers = headers;
    this.data = data;
    this.fieldtypes = fieldtypes;
    this.comboOptions = comboOptions;
    this.onChange = onChange;
    this.onAction = onAction; // ✅ שמירה בתוך המחלקה
    this.readonlyFields = readonlyFields;
    this.showRowNumber = showRowNumber;
    this.render();
  }
  
  createInput(key, type, value, onChange) {
    let input;

    if (type === "combo") {
      input = document.createElement("select");
      (this.comboOptions[key] || ["כן", "לא"]).forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.text = opt;
        if (opt === value) o.selected = true;
        input.appendChild(o);
      });
    } else {
      input = document.createElement("input");
      input.type = type === "numeric" ? "number" : "text";
      input.value = value ?? "";
    }

    input.addEventListener("change", () => {
      let val = input.value;
      if (type === "numeric") val = Number(val);
      onChange(val);
    });

    return input;
  }
  refreshRow(rowIndex) {
    const tbody = this.container.querySelector("tbody");
    if (!tbody) return;
  
    // הסר את השורה הקיימת
    const oldRow = tbody.children[rowIndex];
    if (oldRow) tbody.removeChild(oldRow);
  
    // צור את השורה מחדש
    const newRow = this.renderRow(this.data[rowIndex], rowIndex);
    tbody.insertBefore(newRow, tbody.children[rowIndex]);
  }
  renderRow(row, rowIndex) {
    const tr = document.createElement("tr");
  
    if (row.avrech_id !== undefined) {
      tr.dataset.avrechId = row.avrech_id;
    }
  
    if (this.showRowNumber) {
      const numTd = document.createElement("td");
      numTd.textContent = rowIndex + 1;
      tr.appendChild(numTd);
    }
  
    for (const key of Object.keys(this.headers)) {
      const td = document.createElement("td");
      td.dataset.field = key;
  
      const type = this.fieldtypes[key] || "text";
  
      if (type === "button") {
        const btn = document.createElement("button");
        btn.textContent = row[key] || "⚙️ פעולה";
        btn.className = "simple-table-button";
        btn.addEventListener("click", () => {
          if (typeof this.onAction === "function") {
            this.onAction(rowIndex, key);
          }
        });
        td.appendChild(btn);
      }
      else if (type === "html") {
        td.innerHTML = row[key] ?? "";
      } else if (this.readonlyFields.includes(key)) {
        td.textContent = row[key] ?? "";
      } else {
        const input = this.createInput(key, type, row[key], (val) => {
          this.data[rowIndex][key] = val;
          this.onChange(rowIndex, key, val);
        });
        td.appendChild(input);
      }
  
      tr.appendChild(td);
    }
  
    return tr;
  }
    
  render() {
    console.log("הפונקציה X רצה");
    if (!Array.isArray(this.data)) {
      console.error("❌ SimpleTable: data לא תקין:", this.data);
      this.data = [];
    }
    const table = document.createElement("table");
    table.className = "simple-table";

    // כותרת
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    if (this.showRowNumber) {
      headRow.appendChild(document.createElement("th")); // עמודת מספר שורה ריקה לכותרת
    }
    for (const key of Object.keys(this.headers)) {
      const th = document.createElement("th");
      th.textContent = this.headers[key];
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    // שורות
    const tbody = document.createElement("tbody");
    this.data.forEach((row, rowIndex) => {

      const tr = document.createElement("tr");
     
      if (row.avrech_id !== undefined) {
        tr.dataset.avrechId = row.avrech_id;
      }
      /*else {
        console.warn(`שורה מספר ${rowIndex} חסרה avrech_id!`, row);
      }*/
      if (this.showRowNumber) {
        const numTd = document.createElement("td");
        numTd.textContent = rowIndex + 1;
        tr.appendChild(numTd);
      }

      for (const key of Object.keys(this.headers)) {
        const td = document.createElement("td");
        td.dataset.field = key;
      
        const type = this.fieldtypes[key] || "text";
      
        if (type === "button") {
          const btn = document.createElement("button");
          btn.textContent = row[key] || "⚙️ פעולה";
          btn.className = "simple-table-button";
          btn.addEventListener("click", () => {
            if (typeof this.onAction === "function") {
              this.onAction(rowIndex, key);
            }
          });
          td.appendChild(btn);
        }
        else if (type === "html") {
          td.innerHTML = row[key] ?? "";
        } else if (this.readonlyFields.includes(key)) {
          td.textContent = row[key] ?? "";
        } else {
          const input = this.createInput(key, type, row[key], (val) => {
            this.data[rowIndex][key] = val;
            this.onChange(rowIndex, key, val);
          });
          td.appendChild(input);
        }
        
      
        tr.appendChild(td);
      }
      

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    this.container.innerHTML = "";
    this.container.appendChild(table);
  }

}

window.SimpleTable = SimpleTable;
