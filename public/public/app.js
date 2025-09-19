let token=null;
async function login(){
  const email=document.getElementById("email").value;
  const password=document.getElementById("pass").value;
  const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  if(!r.ok){document.getElementById("msg").innerText="Login gagal";return;}
  const d=await r.json();token=d.token;document.getElementById("msg").innerText="Login sukses";
  loadTypes();loadOffenses();
}
async function loadTypes(){
  const r=await fetch("/api/types",{headers:{Authorization:"Bearer "+token}});
  const d=await r.json();const ul=document.getElementById("types");ul.innerHTML="";
  const sel=document.getElementById("selType");sel.innerHTML="";
  d.forEach(t=>{ul.innerHTML+=`<li>${t.code} - ${t.name}</li>`;sel.innerHTML+=`<option value="${t.id}">${t.name}</option>`;});
}
async function addType(){
  const code=document.getElementById("code").value;const name=document.getElementById("name").value;
  await fetch("/api/types",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({code,name})});
  loadTypes();
}
async function addOffense(){
  const offenseTypeId=document.getElementById("selType").value;
  const lat=document.getElementById("lat").value;const lng=document.getElementById("lng").value;
  const description=document.getElementById("desc").value;
  await fetch("/api/offenses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({offenseTypeId,lat,lng,description})});
  loadOffenses();
}
async function loadOffenses(){
  const r=await fetch("/api/offenses",{headers:{Authorization:"Bearer "+token}});
  const d=await r.json();const ul=document.getElementById("offenses");ul.innerHTML="";
  d.forEach(o=>{ul.innerHTML+=`<li>${o.type_name} - ${o.description} (${o.status})</li>`;});
}
