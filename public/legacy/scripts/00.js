
/* Safari can reject Storage access for locally opened files. Preserve playability in memory. */
(function(){
 function safeStore(name){
  var memory={};
  try{
   var nativeStore=window[name];
   var test='__tt_storage_test__';
   nativeStore.setItem(test,'1');
   nativeStore.removeItem(test);
   return nativeStore;
  }catch(error){
   return {
    getItem:function(k){return Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null},
    setItem:function(k,v){memory[String(k)]=String(v)},
    removeItem:function(k){delete memory[String(k)]},
    clear:function(){memory={}},
    key:function(i){return Object.keys(memory)[i]||null},
    get length(){return Object.keys(memory).length}
   };
  }
 }
 window.TTLocalStore=safeStore('localStorage');
 window.TTSessionStore=safeStore('sessionStorage');
})();

