$.fn.hasAttr = function(name) {  
    return this.attr(name) !== undefined;
 };
 class tbinder{

    parentEl;
    data;
    orgdata;
    tablename
    showchanges=true;
    fieldnameattr='fieldname'
    byref=false;
    oniput;
    setcngcolr(t,fieldname)
    {
        var self = this;
        if (self.showchanges)
        {

        if (!(self.data[fieldname]==self.orgdata[fieldname]))
        $(t).css('color','red');
        else
        $(t).css('color','black');
        }

    }
    setchecked(t)
    {
        if (!$(t).is(':checkbox'))
        return;
        var checkedvalue='1'
        if ($(t).hasAttr('checkedvalue'))
        checkedvalue=$(t).attr('checkedvalue')
        if ($(t).val()==checkedvalue)
        t.checked=true
        else
        t.checked=false;

    }
    getchecked(t)
    {
        if (!$(t).is(':checkbox'))
        return;
        var checkedvalue='1'
        if ($(t).hasAttr('checkedvalue'))
        checkedvalue=$(t).attr('checkedvalue')
        var uncheckedvalue='0'
        if ($(t).hasAttr('uncheckedvalue'))
        uncheckedvalue=$(t).attr('uncheckedvalue')

        if (t.checked) 
        $(t).val(checkedvalue)
        else
        $(t).val(uncheckedvalue)

    }

    bindinput()
    {
        var self = this;
        $(this.parentEl).find("["+self.fieldnameattr+"]").bind('input',function (event)
        {
            self.getchecked(this)
            let fieldname=$(this).attr(self.fieldnameattr);
            self.data[fieldname]=$(this).val()
            self.setcngcolr(this,fieldname)
            if (self.oninput)
            {
                self.oninput(event,self)
            }
            
        }
        )
    }
    setparent(parentid)
    {
        this.parentEl=document.getElementById(parentid)
    }

    refreshdata(data)
    {
        this.data={};
        this.orgdata={};
        if (this.byref) 
        this.data=data
        else
        Object.assign(this.data,data);
        Object.assign(this.orgdata,data);
      this.refreshall();
      this.bindinput()
    }
    addorgtodata()
    {
        this.data.orgdata=this.orgdata;
    }
    refreshall(){
        
        var self = this;
        $(this.parentEl).find("["+self.fieldnameattr+"]").each(function (index ,value)
        {    
            let fieldname=$(this).attr(self.fieldnameattr);
            $(this).val(self.data[fieldname])
            self.setchecked(this)
            self.setcngcolr(this,fieldname)
        }
        )
    }


constructor (config)
{
    if (config)
    {
    if (config.tablename) 
    this.tablename=config.tablename;
    if ('showchanges' in config) 
    this.showchanges=config.showchanges;
    if ('fieldnameattr' in config) 
    this.fieldnameattr=config.fieldnameattr;
    if ('oninput' in config) 
    this.oninput=config.oninput;
    if ('byref' in config) 
    this.byref=config.byref;
    }
    
    
}

}
 class Tablebinder{

    table;
    config
    binders;
    constructor (config)
    {
        this.config=config;
        this.table=config.table
    }
  refreshdata(data)
  {
  var r=this.table.rows;
  this.binders=[];
  for(var i=0;i<data.length;i++)
  {
   var b=new tbinder(this.config)
   b.parentEl=r[i+1];
   b.refreshdata(data[i])
   this.binders.push(b)
  }


  }  
}
