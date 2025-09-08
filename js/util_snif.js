async function loadSnifimInto(selectId, defaultText = "בחר סניף") {
    const sel = document.getElementById(selectId);
    sel.innerHTML = `<option value="">${defaultText}</option>`;
  
    const snifim = await api("getall_snifim") || [];
    snifim.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s["סניף_id"];
      opt.textContent = s["שם סניף"];
      sel.appendChild(opt);
    });
  }
  