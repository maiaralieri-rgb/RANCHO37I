// Mock completo do Firebase Firestore para testar a lógica do app sem rede.
// Reproduz onSnapshot, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc.

let _id = 0;
const genId = () => 'id_' + (++_id);

export class MockDB {
  constructor(){ this.data = {}; this.listeners = []; }
  _key(path){ return path.join('/'); }
  _emit(){
    // dispara todos os listeners registrados
    for(const l of this.listeners) l.fire();
  }
}

export function makeApi(db){
  function doc(_db, ...path){ return {type:'doc', path}; }
  function collection(_db, ...path){ return {type:'col', path}; }
  function query(ref){ return ref; }
  function orderBy(){ return {orderBy:true}; }

  async function getDoc(ref){
    const k = ref.path.join('/');
    const v = db.data[k];
    return {
      exists: ()=> v!==undefined,
      id: ref.path[ref.path.length-1],
      data: ()=> v
    };
  }
  async function getDocs(ref){
    const prefix = ref.path.join('/') + '/';
    const docs = Object.keys(db.data)
      .filter(k => k.startsWith(prefix) && k.slice(prefix.length).indexOf('/')===-1)
      .map(k => ({ id:k.slice(prefix.length), data:()=>db.data[k] }));
    return { docs, size: docs.length, empty: docs.length===0 };
  }
  async function setDoc(ref, val){ db.data[ref.path.join('/')] = JSON.parse(JSON.stringify(val)); db._emit(); }
  async function addDoc(ref, val){ const id=genId(); db.data[ref.path.join('/')+'/'+id] = JSON.parse(JSON.stringify(val)); db._emit(); return {id}; }
  async function updateDoc(ref, val){ const k=ref.path.join('/'); db.data[k]={...db.data[k],...JSON.parse(JSON.stringify(val))}; db._emit(); }
  async function deleteDoc(ref){ delete db.data[ref.path.join('/')]; db._emit(); }

  function onSnapshot(ref, cb, errCb){
    const isDoc = ref.type==='doc';
    const listener = {
      fire(){
        try {
          if(isDoc){
            const k=ref.path.join('/'); const v=db.data[k];
            cb({ exists:()=>v!==undefined, id:ref.path[ref.path.length-1], data:()=>v });
          } else {
            const prefix=ref.path.join('/')+'/';
            const docs=Object.keys(db.data)
              .filter(k=>k.startsWith(prefix)&&k.slice(prefix.length).indexOf('/')===-1)
              .map(k=>({id:k.slice(prefix.length),data:()=>db.data[k]}));
            cb({docs, size:docs.length, empty:docs.length===0});
          }
        } catch(e){ if(errCb) errCb(e); else throw e; }
      }
    };
    db.listeners.push(listener);
    listener.fire(); // dispara imediatamente como o Firebase real
    const unsub = ()=>{ const i=db.listeners.indexOf(listener); if(i>=0) db.listeners.splice(i,1); };
    return unsub;
  }

  return { doc, collection, query, orderBy, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot };
}
