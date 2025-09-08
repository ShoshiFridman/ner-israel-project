function getval(id)
{
    let a=document.getElementById(id)
    if (!a) return '';
    if (a.value!==undefined)
    return a.value
    if (a.innerText!==undefined)
    return a.innerText
    return '';
 }
 function setval(id,val)
{
    let a=document.getElementById(id)
    if (!a) return ;
    if (a.value!==undefined)
    return  (a.value=val)
    if (a.innerText!==undefined)
    return (a.innerText=val)
  
 }
 function sethtml(id,val)
 {
     let a=document.getElementById(id)
     if (!a) return ;
     
     if (a.innerHTML!==undefined)
     return (a.innerHTML=val)
   
  }
function israeldatetodate(dateString)
{
    var dateComponents = dateString.split('/');
var day = parseInt(dateComponents[0], 10);
var month = parseInt(dateComponents[1], 10) - 1; // Months are 0-indexed in JavaScript
var year = 2000 + parseInt(dateComponents[2], 10); // Assuming the year is in the range 2000-2099

// Convert the components to a Date object
return  new Date(year, month, day);
}  
Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
  
    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
           ].join('-');
  };
  Date.prototype.toDateTimeInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,16);
   
});
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10)
   
});
  Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
  Date.prototype.nextMonth = function() {

  this.setMonth(this.getMonth() + 1);
  return this;
  }

function todate(s)    
{
    
    s=s.split(' ')[0].split('-');
    return s[2]+'/'+s[1]+'/'+s[0];
}
function getparam(prm,defaultvalue)
{
    const urlParams = new URLSearchParams(window.location.search);
    let p=urlParams.get(prm)
    if ((p==null) && (defaultvalue!=null))
    p=defaultvalue;
    return p
}
function zl(s,l)
{
    s=''+s;
    while (s.length<l)
    s='0'+s
    return s
}
function currenttime()
{
    var today = new Date();
return  zl(today.getHours(),2) + ":" + zl(today.getMinutes(),2) + ":" + zl(today.getSeconds(),2);

}
function currrentdate()
{
    var today = new Date();
    return  zl(today.getFullYear(),2) + "-" + zl(today.getMonth()+1,2) + "-" + zl(today.getDate(),2);  
}
function isOdd(num) { return num % 2;}

function nwc(x,digits=2,round=false) {
    if (!x)
    return 0;
    if (x=='') 
    return x;
    x=x.toString().replace(/,/g,'')
    if (round)
    {x=Math.round(x)}
    
    var s=x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   if (!round)
   {
    var n=s.indexOf('.');
    if (n>-1)
       s=s.substring(0,n+1)+s.substring(n+1,n+digits+1).replace(/,/g,'')
   }
    return s;
}
function printhtml(el)
{
    let s=el.outerHTML;
    localStorage.setItem('html_to_print',s)
    window.open('printhtml.html')
    
}
function diffdays(date1str,date2str)
{
 let date1=new Date(date1str)
 let date2=new Date(date2str)
    // To calculate the time difference of two dates
var Difference_In_Time = date2.getTime() - date1.getTime();

// To calculate the no. of days between two dates
var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
return Difference_In_Days
}

const hebdatetoldate=async (d,m,y)=>
{
    return await api('hebdatetoldate',{d,m,y})
}
const ldatetohebdate =async (ldate)=>
{
    return await api('ldatetohebdate',{ldate})
}
const onchangehebdate=async (mainid)=>
{
    let d=getval(`${mainid}_heb_d`);
    let m=getval(`${mainid}_heb_m`);
    let y=getval(`${mainid}_heb_y`);
    let r=await hebdatetoldate(d,m,y)
    setval(mainid,r.ldate)
    setval(`${mainid}_heb_text`,r.text);
}
const onchangeldate=async (mainid)=>
{
    let ldate=getval(mainid)
    let hebdate=await ldatetohebdate(ldate)
    if (!hebdate || hebdate.error) {
        console.error('שגיאה בהמרת תאריך:', hebdate?.error || 'Hebdate is undefined');
        return;
    }
    setval(`${mainid}_heb_d`,hebdate.d);
    setval(`${mainid}_heb_m`,hebdate.m);
    setval(`${mainid}_heb_y`,hebdate.y);
    setval(`${mainid}_heb_text`,hebdate.text);
 
    
}
function Gematria(num, flag = 0,alafim=false)	// Return Gimatria in Hebrew for the given number.
{			
	num = Math.floor(num);
	
	if (num >= 1000)
	{	
    if (alafim) 
        return Gematria(Math.floor(num / 1000)) + "'" + Gematria(num % 1000, 1);
    else 
    return  Gematria(num % 1000, 1);
    }			
	var s1 = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
	var s2 = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
	var s3 = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
						
	var Gim = s1[Math.floor(num / 100)] +
	    s2[Math.floor((num % 100) / 10)] +
	    s3[num % 10];
	
	Gim = String(Gim).replace(/יה/g,'טו').replace(/יו/g,'טז');
	
	if (Gim.length > 1)
		Gim = Gim.slice(0, -1)  + Gim.slice(-1);
	
    //	Gim = Gim.slice(0, -1) + '"' + Gim.slice(-1);
	if ((Gim.length == 0 || Gim == "Na\"N") && flag == 0)
		Gim = (num == 0) ? "אפס" : "לא ניתן לחישוב"
			
	return Gim;
}
/*const  createHebdateElement=(id,fromyear,toyear,inputclass,addtext)=>{
 
    if (!toyear)
    {
        let today = new Date();
        toyear=today.getFullYear()+3761
    }
    let days=['א','ב','ג','ד','ה','ו','ז','ח','ט','י',
    'יא','יב','יג','יד','טו','טז','יז','יח','יט','כ',
    'כא','כב','כג','כד','כה','כו','כז','כח','כט','ל'];
    let months=['תשרי','חשון','כסלו','טבת','שבט','אדר א','אדר [ב]','ניסן','אייר','סיוון','תמוז','אב','אלול']
   let inpc='';
   if (inputclass) 
   inpc=`class="${inputclass}`
   
   let daysselect=`<select ${inpc} id=${id}_heb_d onchange=onchangehebdate('${id}')>`
   for (let i=0;i<days.length;i++)
   daysselect+=`<option value="${i+1}">${days[i]}</option>`
   daysselect+='</select>'
   let monthsselect=`<select ${inpc} id=${id}_heb_m onchange=onchangehebdate('${id}')>`
   for (let i=0;i<months.length;i++)
   monthsselect+=`<option value="${i+1}">${months[i]}</option>`
   monthsselect+='</select>'
   let yearsselect=`<select ${inpc} id=${id}_heb_y onchange=onchangehebdate('${id}')>`
   for (let i=toyear;i>=fromyear;i--)
   yearsselect+=`<option value="${i}">${Gematria(i)}</option>`
   yearsselect+='</select>'
   let s=daysselect+monthsselect+yearsselect+`<input id=${id} type=date oninput=onchangeldate('${id}')>`
   if (addtext)
   s+=`<span id=${id}_heb_text>`
   return s;


}*/

function createHebdateElement(id, fromYear, toYear) {
    let days = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י',
        'יא','יב','יג','יד','טו','טז','יז','יח','יט','כ',
        'כא','כב','כג','כד','כה','כו','כז','כח','כט','ל'];
    let months = ['תשרי','חשון','כסלו','טבת','שבט','אדר א','אדר ב','ניסן','אייר','סיוון','תמוז','אב','אלול'];

    let daysselect = `<select id=${id}_heb_d onchange="onHebDateChange('${id}')">`;
    days.forEach((day, i) => {
        daysselect += `<option value="${i+1}">${day}</option>`;
    });
    daysselect += '</select>';

    let monthsselect = `<select id=${id}_heb_m onchange="onHebDateChange('${id}')">`;
    months.forEach((month, i) => {
        monthsselect += `<option value="${i+1}">${month}</option>`;
    });
    monthsselect += '</select>';

    let yearsselect = `<select id=${id}_heb_y onchange="onHebDateChange('${id}')">`;
    for(let y = toYear; y >= fromYear; y--) {
        yearsselect += `<option value="${y}">${Gematria(y)}</option>`;
    }
    yearsselect += '</select>';

    return daysselect + monthsselect + yearsselect;
}
function today() {
    return new Date().toISOString().split("T")[0];
  }
  