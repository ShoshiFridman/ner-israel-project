
class tmodal{
html
el
innerel
innerdivstyle
closeonclick=true
fulldivstyle=' style="position:absolute;z-index:50;right:0;top:0;left:0;height:100vh;background-color:rgb(200,200,200,0.2);';
width;
vmodal(p)
{
  if ('fullwidth' in p)
  this.fulldivstyle+='width:'+p.fullwidth+';'
  else
  this.fulldivstyle+='width:100vw;'
  if ('fullheight' in p)
  this.fulldivstyle+='height:'+p.fullheight+';'
  else
  this.fulldivstyle+='height:100vh;'

  this.fulldivstyle+='"'
  var thiswidth;
  var thisleft;
  var thistop='50%'
  var thisright;
  if ('top' in p)
  thistop=p.top; 
  if ('left' in p)
  thisleft=p.left; 
  if ('right' in p)
  thisright=p.right; 
  
  if ('width' in p)
  thiswidth=p.width; 
  this.innerdivstyle=' style="z-index:100;background-color:white;margin: 0;'
    this.innerdivstyle+=`position: absolute;top: ${thistop};`;
    if (thiswidth)
    this.innerdivstyle+='width:'+thiswidth+';'
    if (thisleft)
    this.innerdivstyle+='left:'+thisleft+';'
    if (thisright)
    this.innerdivstyle+='right:'+thisright+';'

    if ((!thisleft) && (!thisright))
    this.innerdivstyle+='left: 50%;transform: translate(-50%,-0%);border:solid 1px;';
    this.innerdivstyle+='text-align:center;"';
    this.innerel=$('<div '+this.innerdivstyle+'>'+this.html+'</div>');
   if  ('css' in p)
 {
   let css=p.css.split(';');
   for(let i=0;i<css.length;i++)
   if (css[i].trim())
   {
    let a=css[i].split(':');
    this.innerel.css(a[0].trim(),a[1].trim());
   }

 }
  this.innerel.html(this.html);
    this.el=$('<div '+this.fulldivstyle+'></div>');
    
  $(this.el).appendTo('body')
  $(this.innerel).appendTo(this.el)
  if (this.closeonclick)
  $(this.el).on('click',function (event) {
    if (event.target==this)  
    event.preventDefault();
    if (p.noclose) return;
    if (event.target==this)  
    $(this).remove()
    })

}
  fire(p) {
    this.close()
    this.html=p.html;
    if ('closeonclick' in p)
    this.closeonclick=p.closeonclick;
    this.vmodal(p)
    
}
close()
{
 if (this.el)
  this.el.remove()
}

}
var modal=new tmodal;

/*example
  modal.fire({
  html:s,
  css:'top:25%;padding:20px;'

  })
*/