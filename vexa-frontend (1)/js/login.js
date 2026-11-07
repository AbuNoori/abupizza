// Ist schon jemand angemeldet, geht es direkt weiter
var already=currentUser();
if(already && already.aktiv){ location.replace(already.mustChange?"einstellungen.html":"dashboard.html"); }

function doLogin(){
  var res=login(document.getElementById("lm").value.trim(), document.getElementById("lp").value);
  var err=document.getElementById("le");
  if(res==="inaktiv"){ err.textContent="Dieses Konto ist deaktiviert. Bitte den Chef fragen."; return; }
  if(!res){ err.textContent="E-Mail oder Passwort ist falsch."; return; }
  location.href=res.mustChange?"einstellungen.html":"dashboard.html";
}
document.getElementById("lb").addEventListener("click",doLogin);
document.addEventListener("keydown",function(e){ if(e.key==="Enter") doLogin(); });
