//לעבוד עם וירטואלי שעובד מדוייק לתקן את הסקרול בתנאי שיותר מדלתא 32 מתקן וירטואלי ומחזיר את הסקרול למקמו הנכון
class vscroll{

height
itemheight
totalRows
render
scroller
container
lasty=0
first=0
pagesize=32
scrollheight
virtualscroll
virtualscrollTop=0
Runit
mousewheelEl
timer
renderneeded
createContainer (w, h) {
    var c = document.createElement('div');
    c.style.width = w+'px';
    c.style.height = h+'px';
    c.style.overflow = 'auto';
    c.style.position = 'relative';
    c.style.padding = 0;
    c.style.border = '1px solid black';
    return c;
  };
  createScroller () {
    this.virtualscroll=(this.itemheight*this.totalRows)-this.height;
    this.scrollheight=this.height*this.pagesize
    this.Runit=this.virtualscroll/this.scrollheight; 
    var h=this.scrollheight+this.height;
    var scroller = document.createElement('div');
    scroller.style.opacity = 0;
    scroller.style.position = 'absolute';
    scroller.style.top = 0;
    scroller.style.left = 0;
    scroller.style.width = '1px';
    scroller.style.height = h + 'px';
    return scroller;
  };  
  onScroll(e) {
    e = e || window.event; //ie
    var te = e.target || e.srcElement; //ie
  var scrollTop = te.scrollTop; // Triggers reflow
    if ((scrollTop>0)  && (scrollTop<this.scrollheight) && (Math.abs(scrollTop-this.lasty)<this.pagesize) )
    return; //smaller then 1 unit
    if ((scrollTop>0)  && (scrollTop<this.scrollheight) && (Math.abs(scrollTop-this.lasty)==this.pagesize) )
    {
    this.updatevirtualscroll((scrollTop-this.lasty)/this.pagesize)
        this.lasty=scrollTop
        return; //1 unit
    }
    this.updatevirtualscroll(0,scrollTop)
    this.lasty=scrollTop;
  
  }
updatevirtualscroll(step,y)  
{
if (step)
{
this.virtualscrollTop+=step*this.itemheight
this.virtualscrollTop=(this.virtualscrollTop<0 ? 0 : this.virtualscrollTop)
this.virtualscrollTop=(this.virtualscrollTop>this.virtualscroll ? this.virtualscroll : this.virtualscrollTop)
if (this.virtualscrollTop-(this.lasty*this.Runit)>this.Runit)
//update scrollbar needed
this.container.scrollTop=this.virtualscrollTop/this.Runit;

}
else
{
  //  if (y)
    var Vs=y*this.Runit;
    if 
    (
    (Vs==0)
    ||
    (Vs==this.virtualscrol)
    ||
    (Math.abs(Vs-this.virtualscrollTop)>=this.Runit)
    )
    this.virtualscrollTop=Vs
}
var First=Math.round(this.virtualscrollTop/this.itemheight)
First=(First<0?0:First)
if (First!=this.first)
{
    this.first=First;
    if (this.timer)
    this.renderneeded=true
    else
    this.render(this.first,this.getcount())
}


}
createvscroll()
{
  var self=this;
  var width=25;
  this.scroller = this.createScroller();
  this.container = this.createContainer(width, this.height);
  this.container.appendChild(this.scroller);
   if(this.container.attachEvent)
   {
  this.container.attachEvent('onscroll', function (e) {self.onScroll(e)});
  
   }
else
{
    this.container.addEventListener('scroll', function (e) {self.onScroll(e)});
    if (this.mousewheelEl)
    {
       this.mousewheelEl.onwheel=event => self.onwheel(event)
    }
}
  return this.container;
 
}
onwheel(e)
{
 var n=e.deltaY/Math.abs(e.deltaY)
 this.scrolltoitem(this.first+n)

}

constructor (config)
    {
        this.height=config.height;
        this.itemheight=config.itemheight;
        this.totalRows=config.rows;//-Math.floor(height/itemheight);
        this.render=config.renderfunc;
        if (config.viewelement)
        {
        if ((typeof config.viewelement)=='string')
        this.mousewheelEl=document.getElementById(config.viewelement)
        else
            this.mousewheelEl=config.viewelement;
        }
        this.createvscroll()
        if (config.scrollbar)
        {
        if ((typeof config.scrollbar)=='string')
        var Parent=document.getElementById(config.scrollbar)
        else
          var Parent=config.scrollbar;
          Parent.innerHTML='';
          Parent.append(this.container)
        }
        if (config.timer)
        {
            this.timer=config.timer;
            var self=this;
            setInterval(function (){self.dotimer() },this.timer)
        }

        this.render(this.first,this.getcount());

    }

    dotimer()
    {
        if (!this.renderneeded) return;
        this.renderneeded=false
        this.render(this.first,this.getcount())
    }
    scrolltoitem(n)    
{
 if (n==this.first) 
 return;
    this.updatevirtualscroll(n-this.first)
}
getcount()
{
    return Math.min(Math.floor(this.height/this.itemheight),this.totalRows-this.first)
}
}
function newvscroll(height,itemheight,totalrows,render)
{
    var a=new vscroll(height,itemheight,totalrows,render)
    return a.container
}
