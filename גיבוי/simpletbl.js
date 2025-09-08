class SimpleTable {
    constructor(container, { headers, data, fieldtypes, onChange, readonlyFields = [] }) {
      this.container = container;
      this.headers = headers; // { fieldName: "שם לתצוגה" }
      this.data = data; // מערך של אובייקטים
      this.fieldtypes = fieldtypes || {}; // { fieldName: "text" | "numeric" | "combo" }
      this.onChange = onChange || (() => {});
      this.readonlyFields = readonlyFields; // מערך של שמות שדות לקריאה בלבד
      this.render();
    }
  
    render() {
      const table = document.createElement("table");
      table.className = "simple-table";
    
      // כותרת
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      headRow.appendChild(document.createElement("th")); // מספר שורה
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
    
        // מספר שורה
        const numTd = document.createElement("td");
        numTd.textContent = rowIndex + 1;
        tr.appendChild(numTd);
    
        // תאים לפי שדות
        for (const key of Object.keys(this.headers)) {
          const td = document.createElement("td");
          td.dataset.field = key; // ✅ חשוב גם בשדות לקריאה בלבד
    
          const type = this.fieldtypes[key] || "text";
    
          if (this.readonlyFields.includes(key)) {
            // שדה לקריאה בלבד – מציגים טקסט בלבד
            td.textContent = row[key];
          } else {
            let input;
    
            if (type === "combo") {
              input = document.createElement("select");
              ["כן", "לא"].forEach((opt) => {
                const o = document.createElement("option");
                o.value = opt;
                o.text = opt;
                input.appendChild(o);
              });
            } else {
              input = document.createElement("input");
              input.type = type === "numeric" ? "number" : "text";
            }
    
            input.value = row[key];
            input.addEventListener("change", () => {
              this.data[rowIndex][key] =
                type === "numeric" ? Number(input.value) : input.value;
              this.onChange(rowIndex, key, this.data[rowIndex][key]);
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
  
 
 