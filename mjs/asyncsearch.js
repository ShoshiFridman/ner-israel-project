class Asyncsearch{
searchrunning;
binder
lastdata
dosearchfunc
constructor (binder,dosearchfunc)
{
    this.lastdata={};
    this.binder=binder;
    this.dosearchfunc=dosearchfunc;
    this.searchrunning=false;

}
search(forcesearch)
{
    if (this.searchrunning)
    return;
    if  ((!forcesearch) && (oEqual(this.lastdata,this.binder.data))) 
    return;
    Object.assign(this.lastdata,this.binder.data);
    this.dosearchfunc(this)
}




}


function oEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
  
    if (keys1.length !== keys2.length) {
      return false;
    }
  
    for (let key of keys1) {
      if (object1[key] !== object2[key]) {
        return false;
      }
    }
  
    return true;
  }