/*async function fetchAndDecode(url, type,data) {
  let response = await fetch(url,
    {
        method: 'POST',
        body:JSON.stringify(data)
    }
    
    );

  let content;

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    if(type === 'blob') {
      content = await response.blob();
    } else if(type === 'text') {
      content = await response.text();
    }
  }
  return content;
}*/
async function fetchAndDecode(url, type, data) {
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  let content;
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    if (type === 'blob') {
      content = await response.blob();
    } else if (type === 'text') {
      content = await response.text();
    }
  }
  return content;
}

/*async function api(fn,params={}) //returns object . error in console
{
  let s=await mpost('api.php',{fn,params})
  try {
    var r=JSON.parse(s)
    return r;
  } catch (error) {
    console.log('eror: '+error);
    console.log('ret: '+s);
    
    
  }
}*/
function api(name, args, cb) {
  fetch('api.php?fn=' + name, {
      method: 'POST',
      body: JSON.stringify(args),
      headers: { 'Content-Type': 'application/json' }
  })
  .then(r => r.text()) // קודם קוראים טקסט
  .then(txt => {
      console.log('ret:', txt);
      if (!txt || txt.startsWith('<')) {
          throw new Error("שרת החזיר תגובה לא תקינה");
      }
      let data = JSON.parse(txt);
      cb(data);
  })
  .catch(e => {
      console.error('eror:', e);
  });
}

async function mpost(url,data)
{
    return await fetchAndDecode(url,'text',data)
}
async function mpostd(url,data)
{
    let s=await fetchAndDecode(url,'text',data)
    try {
      return JSON.parse(s)
    } catch (error) {
      alert(s)
    }
}

function openlogin()
{
  window.open('a_login.php');

}
async function dologin(un,pass)
{
  let s= await fetchAndDecode('api.php','text',{un,pass})
  let a=JSON.parse(s)
  if (a.token)
  {
    localStorage.setItem('api_token',a.token)
    return 'ok'
  }  
  return a.msg;

}
async function apipost(req,param,url='api.php')
{
  let data={};
  data.req=req;
  data.param=param;
  data.token=localStorage.getItem('api_token') 
   if (!data.token)
   {
    openlogin;
    return;
   }
   let s= await fetchAndDecode(url,'text',data)
   if (s=='token expired')
   {
    openlogin;
   
   }
   return s;
}

//פונקציה שאני הוספתי למבחנים

async function api_mivchan(method, data = {}) {
  const res = await fetch(`api_mivchan.php?method=${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
  });
  return await res.json();
}


//.......................