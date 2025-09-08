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