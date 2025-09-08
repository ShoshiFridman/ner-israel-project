$.fn.hasAttr = function(name) {  
    return this.attr(name) !== undefined;
 };
 function mgetposition( elem )
{
    var p={left:0,top:0} 
    do {
      if ( !isNaN( elem.offsetLeft ) )
      {
          p.left += elem.offsetLeft;
      }
      if ( !isNaN( elem.offsetTop ) )
      {
          p.top += elem.offsetTop;
      }
    } while( elem = elem.parentElement );
    return p;
}

 class Mselect{
globallistclass='mselect-list'
globaldivclass='mslect-item'   
globalinputclass 
elements=[];
match



addelement(t,params={},options={})
{
   let el=this.findelement(t)
   if (el) 
   {
   el.params=params
   el.options=options
   }
   else
    {
     
     el={select:t,params,options}
     this.elements.push(el)
    }
    this.createselection(el);
}
setparams(t,params)
{
   let el=this.findelement(t)
   if (el)
   el.params=params;
   this.createselection(el)
}
toclass(c)
{
    if (!c) return '';
    return ' class= '+c
}
getlistclass(el)
{
    let c=el.options.listclass
    if (!c)
    c=this.globallistclass
    return this.toclass(c)
}
getdivclass(el)
{
    let c=el.options.divclass
    if (!c)
    c=this.globaldivclass
    return this.toclass(c)
}
getinputclass(el)
{
    let c=el.options.inputclass
    if (!c)
    c=this.globalinputclass
    return this.toclass(c)
}
ismatch(str,option)
{
    if (this.match)
    {
        return this.match(str,option)
    }
    if (option.text.indexOf(str)>-1) return true;
}  
search(el)
{
    let s=el.input.val()
    if (!s)
    {
        this.fillvalues(el)
        return;
    }
    el.values=[];
    for (const o of el.select[0].options)
    {
        if (this.ismatch(s,o))
        el.values.push(o.value)
    }
}
setdivposition(el)
{
    let element=$(el.select)
    let offset = element.offset();//mgetposition(element[0]);
    let w=element.outerWidth()
    let h=element.height()
    let top = offset.top+h+1;
    let left = offset.left;
    left=left-w+element.width()
    //let right=$(document.body).outerWidth()-left-w 
    let right=$(window).width()-left-w 
    el.listcont.css('top', top);
    el.listcont.css('right', right);
     
}
createselection(el)
{
  self=this
  let listclass=this.getlistclass(el)
  let divclass=this.getdivclass(el)
  let inputclass=this.getinputclass(el)
  let element=$(el.select)
  let offset = element.offset();//mgetposition(element[0]);
  let w=element.outerWidth()
  let h=element.height()
  let top = offset.top+h+1;
  let left = offset.left;
  //let right=$(document.body).outerWidth()-left-w 
  let right=$(window).width()-left-w 
  let direction=element[0].style.direction || element[0].dir

  let style=`style="position:absolute;top:${top}px;right:${right}px;min-width:${w}px;direction:${direction};"`
  let s=`<div ${style}></div>`
  let listcont=$(s);
  s= `<input ${inputclass} mselectel=input style="width:${w-10}px">`
  let input=$(s);
  input.on('input',function (event)
  {
    self.search(el)
    self.buildlist(el)
  }
  )
  input.on('keydown',function (event)
  {
    self.inputkey(el,event)
   
  }
  )
  
  listcont.append(input)
  s=`  <div ${listclass}></div>`
  let list=$(s);
  listcont.append(list)
  $(document.body).append(listcont)
  el.listcont=listcont;
  el.input=input;
  el.list=list;
  el.itemclass=divclass;
  el.values=[];
  this.addevents(el)
  el.listcont.hide()


}
checkfocus(el,event)
{
    let t=event.relatedTarget;
    if ((t) && (el.listcont.find(t).length)) return;
    el.listcont.hide()
}
hideoptions(el)
{
    for (const o of el.select[0].options)
    {
        o.hidden=true;
    }
}
doselect(el,value)
{
    el.select.val(value)
    el.listcont.hide()
    el.select.trigger("input")
    el.select.change()
}
doclick(el,t)
{
  let index=$(t).attr('index');
  let value=el.select[0].options[index].value;
  this.doselect(el,value)
}
inputkey(el,e) {

  
   
    if (e.keyCode == '40') {
       e.preventDefault()
       el.list.find('div').first().focus() // down arrow
    }
    if (e.keyCode == '27') {
        el.listcont.hide()
    }
    if (e.keyCode == '13') {
        e.preventDefault()
       if (el.values.length==1)
       {
        let value=el.values[0]
        this.doselect(el,value)
       }

     }
    

}
 divkey(el,e) {

    
  
    if (e.keyCode == '38') {
        e.preventDefault()
        $(e.target).prev().focus()
    }
    else if (e.keyCode == '40') {
        e.preventDefault()
       $(e.target).next().focus()
    }
    else if (e.keyCode == '13') {
        e.preventDefault()
       this.doclick(el,e.target)
    }
   

}
buildlist(el)
{
  let s='';
  let index=0;
  self=this;
  for (const o of el.select[0].options)
  {
      if (el.values.indexOf(o.value)>-1) 
      s+=`<div tabindex=-1 ${el.itemclass} index=${index}>${o.text}</div>`
      index++;  
  }
  el.list.html(s);
  el.list.find('div').on('click',function (event)
  {
    self.doclick(el,event.target)
  }
  )
  el.list.find('div').on('focusout',function (event)
  {
    self.checkfocus(el,event)
  }
  )
  el.list.find('div').on('keydown',function (event)
  {
    self.divkey(el,event)
  }
  )
}
fillvalues(el)
{
   el.values=[];
    for (const o of el.select[0].options)
    {
        el.values.push(o.value)
    }
}
addevents(el)
{
var self=this;    
el.select.on('focus',function (event)
{
    self.setdivposition(el)
    el.listcont.show()
    self.hideoptions(el)
    self.fillvalues(el)
    el.input.val('')
    self.buildlist(el);
    setTimeout(
        function ()
        {el.input.focus()
        },100);
}
)
el.input.on('focusout',function (event)
{
  self.checkfocus(el,event)
}
)
}
updateoptions(el)
{

}
findelement(t)
{
   let self=this;
    for ( const e of self.elements)
   { 
       if (e.select==t) 
       return e
   } 
   return null
}


constructor (config)
{
    if (config)
    {
    if ('match' in config) 
    this.match=config.match;
    }
}

 }


 /*
 const input = document.getElementById('myInput');
const excludedElement = document.getElementById('excludedElement');

input.addEventListener('blur', function(event) {
  const relatedTarget = event.relatedTarget;

  // Check if the relatedTarget is the excluded element or its descendant
  if (relatedTarget !== excludedElement && !excludedElement.contains(relatedTarget)) {
    // Run your function here
    console.log('Element lost focus, excluding specific element');
  }
});

 */