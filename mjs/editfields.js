class teditfields{
divclass=''
labelclass='' //optional
inputclass='' //optional
renderhtml;
ltrsetter;
labels;
getlabel(k)
{
    if ((this.labels) && (k in this.labels))
    return this.labels[k];
    return k;
}
ffld(k,v) {
    var s=`<div ${this.divclass}><div ${this.labelclass}>${this.getlabel(k)}</div>`
    let dir='rtl'
    if (this.ltrsetter)
    dir=this.ltrsetter(k)   
    let c=''
    if ((this.renderhtml)  && (c=this.renderhtml(k,v)))
    s+=c
    else
    s+=`<input dir=${dir} fn=${k} ${this.inputclass}>`
    s+='</div>'
    return s;
}
fflds(data)
{
  var s='';
  for (var key in data) {
 if (data.hasOwnProperty(key)) {
  s+=this.ffld(key,data[key]);
  $(this.container).html(s)
}

}
}
constructor(container,p)
{
  this.container=container;
  if (p) //p is optional
  {
  if ('renderhtml' in p)
  this.renderhtml=p.renderhtml;
  if ('ltrsetter' in p)
  this.ltrsetter=p.ltrsetter;
  if ('divclass' in p)
  this.divclass=`class=${p.divclass}`;
  if ('inputclass' in p)
  this.inputclass=`class=${p.inputclass}`;
  if ('labelclass' in p)
  this.labelclass=`class=${p.labelclass}`;
  if ('labels' in p)
  this.labels=p.labels;
  }
}

}