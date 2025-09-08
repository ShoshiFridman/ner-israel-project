async function api(fn, params = {}) {
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
  }
  
  