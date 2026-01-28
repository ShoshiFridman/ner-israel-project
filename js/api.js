/*async function api(fn, params = {}) {
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
  }*/
  async function api(fn, params = {}) {
    try {
      const res = await fetch("api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fn, params }),
      });
  
      const text = await res.text(); // קודם תקבל טקסט
      console.log(`DEBUG response from ${fn}:`, text); // תראה מה השרת מחזיר
  
      const data = JSON.parse(text); // עכשיו תנסה לפרסר ל-JSON
      if (!res.ok || data.error) throw new Error(data.error || "שגיאה בשרת");
      return data;
    } catch (err) {
      console.error(`API error in ${fn}:`, err);
      throw err;
    }
  }
  
  
  