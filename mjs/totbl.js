//import {Tablebinder} from './bind.js';
function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  if (str=='') return true;
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

class Totbl{


container
tableclass;
tableid;
headers
notvisiblefields
fieldtypes
onclick
ondblclick
viewlineno=true;
extradata
data
sortfield
sortdir=1;
renderhtml
sortnumeric
getkeys
hdrrender
dobind //assumes table an data same dimmenssions
bindfields
nobindfields
inputrender
aftersort
selectedclass='rowselected'
rowselected
fltr
addbinder(bindfields,nobindfields,inputrender)
{
  this.bindfields=bindfields;
  this.nobindfields=nobindfields
  this.bindoninput=inputrender
  this.dobind=true;
}
inputupdate(e,r,field)
{
  this.data[r][field]=e.target.value
}
inputblur(e,r,c,td)
{
  let element=e.target;
  $(element).remove();
    this.refreshcell(r,c)

}
refreshcell(r,c)
{
  let k=Object.keys(data[r])[c];
  //let k = Object.keys(this.data[r])[c];

  let tbl=document.getElementById(this.tableid)
  tbl.rows[r+1].cells[c+1].innterHTML=this.cell(data[r],k,c)
  //tbl.rows[r+1].cells[c+1].innerHTML=this.cell(data[r],k,c)

}
createinput(e)
{
  if (e.target.tagName!="TD" )
  return
  var  self=this;
  let td=e.target
  let r=td.closest('tr').rowIndex-1 //-1 th row
  let c=td.cellIndex-1
  let field=Object.keys(this.data[r])[c];
  let inp=null;
  if (this.inputrender) 
  {
  inp=this.inputrender(td,field,r,c) 
  }
  if (!inp)
  {
  inp=document.createElement('input');
  inp.value=td.innerText;
  inp.style.width = '100%';
  td.append(inp);
 
  inp.addEventListener("input", function(e) {
    self.inputupdate(e,r,field);
  });
  }
  inp.addEventListener("blur", function(e) {
    self.inputblur(e,r,c,td);
  
})
inp.focus()
}
formatvalue(k,v)
{
    let ft;
    let fts=this.fieldtypes;
    if (fts)
    ft=fts[k];
    var s=v;
    if (s==null)
        s='';
    if ((ft) && ((ft.indexOf('float')>-1) || (ft.indexOf('numeric')>-1)  )&& (!isNaN(parseFloat(s))))
    {
    var n=parseFloat(s)
    s=n.toLocaleString()
   
  }
    return s
}

hdr(k)
{
    var hdrs=this.headers;
    var keytxt=k;
    if ((hdrs) && (hdrs[k])) 
    keytxt= hdrs[k];
    if (this.hdrrender)
    return `<th field="${k}">${this.hdrrender(k)}</th>`;
    else
    return `<th field="${k}">${keytxt}</th>`;

}
hdrs(h)
{
    if (this.getkeys) 
    var keys=this.getkeys(h)
    else
    var keys=Object.keys(h) ;
    var rslt='<thead><tr>';
    if (this.viewlineno)
    rslt+='<th></th>';
    for (var i=0;i<keys.length;i++)
{
  if ((!this.notvisiblefields) || (this.notvisiblefields.indexOf(keys[i])==-1))
  rslt+=this.hdr(keys[i]);
    
}
 rslt+='</tr></thead>';
return rslt;
}
cell(c,k,index)
{
  var html;
  if (this.renderhtml)
  {  
  var html=this.renderhtml(k,c[k],index)
  }
  if (html)
  return `<td>${html}</td>`
  else
  return `<td>${this.formatvalue(k,c[k])}</td>`
}
row(r,index)
{
  if (this.fltr)
  {
    if (!this.fltr(index))
{
  return '';
}
 
  }
  if (this.getkeys) 
  var keys=this.getkeys(r)
  else
  var keys=Object.keys(this.data[0])//Object.keys(r) ;
    var rslt='<tr>';
    if (this.viewlineno)
    rslt+=`<td>${index+1}</td>`
    for (var i=0;i<keys.length;i++)
{
  if ((!this.notvisiblefields) || (this.notvisiblefields.indexOf(keys[i])==-1))
  rslt+=this.cell(r,keys[i],index);
}
 rslt+='</tr>';
return rslt;
}
tbl(data,fieldtypes,extradata)
{
  this.data=data
  if (extradata )
  this.extradata=extradata
  this.fieldtypes=fieldtypes  
  if ((data) && (data.length))
    {
    let tblid='';
    if (this.tableid)
    tblid=`id=${this.tableid.trim()}`
      var rslt=`<table ${this.tableclass} ${tblid}>`
    rslt+=this.hdrs(data[0]);
    rslt+='<tbody>'
    for (let i=0;i<data.length;i++)
    rslt+=this.row(data[i],i);
    rslt+='</tbody></table>'
    }
    else
    rslt='<div style="margin-top:20px;font-size:18pt;color:red">אין תוצאות</div>'
    $(this.container).html(rslt)
    this.addon()
}
setselected(t,e)
{
  
 
  var  self=this;
  $(self.container).find('tr').removeClass(self.selectedclass)
  $(t).addClass(self.selectedclass)
  if (self.rowselected) this.rowselected(t.rowIndex);
}
addon()
{
var self=this;
$(self.container).off('click', 'td');
$(self.container).off('dblclick', 'td');
$(self.container).off('click', 'th');
$(self.container).on('click', 'tr', function(event)
   
{
    self.setselected(this,event)
     
})
    if ((self.onclick) || (this.dobind))

   $(self.container).on('click', 'td', function(event)
   
{
     if (self.dobind) self.createinput(event)
     self.onclick(event)
     /*if (self.dobind) self.createinput(event);
if (typeof self.onclick === 'function') {
    self.onclick(event);
}  */
}
)
if (self.ondblclick)
$(self.container).on('dblclick', 'td', function(event)
{
self.ondblclick(event)  
}
)

$(self.container).on('click', 'th', function(event)
   
{
       self.thclick(event)  
}
)


}

dosort()
{
  var self=this;
  this.data.sort(function(a,b){ return self.compare(a,b)} );  
  this.tbl(this.data,this.fieldtypes,this.extradata)
  
}
thclick(e)
{
  var self=this;
  let cfield=e.target.innerText
  if (e.target.getAttribute('field'))
  cfield=e.target.getAttribute('field')
  if (this.sortfield==cfield) 
  this.sortdir=-1*this.sortdir
  else
  this.sortdir=1;
  this.sortfield=cfield;
 this.dosort()
 if (this.aftersort)
  this.aftersort();

}
refreshdata()
{
  this.tbl(this.data,this.fieldtypes,this.extradata)
}

comparenum(a,b)
{
return (a-b)/Math.abs(a-b)*this.sortdir
}
 compare( a, b ) {
  if ((this.sortnumeric)  && (isNumeric(a[this.sortfield])) && (isNumeric(b[this.sortfield])) )
  return this.comparenum(a[this.sortfield],b[this.sortfield])
  
  if ( a[this.sortfield] < b[this.sortfield] ){
    return -1*this.sortdir;
  }
  if ( a[this.sortfield] > b[this.sortfield] ){
    return 1*this.sortdir;
  }
  return 0;
}


constructor(container,p)
{
  this.container=container;
  if (p) //p is optional
  {

  if ('tableclass' in p)
  this.tableclass=`class=${p.tableclass}`;
  if ('tableid' in p)
  this.tableid=p.tableid.trim();
  
  if ('fieldtypes' in p)
  this.fieldtypes=p.fieldtypes;
  if ('headers' in p)
  this.headers=p.headers;
  if ('onclick' in p)
  this.onclick=p.onclick;
  if ('ondblclick' in p)
  this.ondblclick=p.ondblclick;
  if ('renderhtml' in p)
  this.renderhtml=p.renderhtml;
  if ('sortnumeric' in p)
  this.sortnumeric=p.sortnumeric;
  if ('aftersort' in p)
  this.aftersort=p.aftersort;
  if ('notvisiblefields' in p)
  this.notvisiblefields=p.notvisiblefields
  if ('getkeys' in p)
  this.getkeys=p.getkeys;
  if ('selectedclass' in p)
  this.selectedclass=p.selectedclass;
  if ('rowselected' in p)
  this.rowselected=p.rowselected;
  if ('hdrrender' in p)
  this.hdrrender=p.hdrrender;
  if (('dobind' in p) && (p.dobind))
  this.addbinder();
  if ('fltr' in p )
  this.fltr=p.fltr
  
  }
}





}