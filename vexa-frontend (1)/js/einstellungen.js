/* Einstellungen: Jeder darf hier nur sein eigenes Passwort ändern */
var U0=requireLogin();
if(U0) (function(){
  var must=!!U0.mustChange, chef=U0.rolle==="admin";
  var page=renderShell("einstellungen.html","Einstellungen",must?"Bitte lege zuerst dein eigenes Passwort fest.":"Dein Konto und dein Passwort.","");
  page.innerHTML=(must?'<div class="box warn"><b>Willkommen, '+esc(U0.name)+'!</b> Du hast ein Startpasswort bekommen. Bitte ändere es jetzt, bevor du weitermachst.</div>':'')+
    '<div class="cols"><div class="card"><h3>Passwort ändern</h3>'+
    '<label style="margin-top:12px">Aktuelles Passwort<input id="p0" type="password" autocomplete="current-password"></label>'+
    '<label>Neues Passwort (mindestens 8 Zeichen)<input id="p1" type="password" autocomplete="new-password"></label>'+
    '<label>Neues Passwort wiederholen<input id="p2" type="password" autocomplete="new-password"></label>'+
    '<div id="msg"></div><button class="btn pri" id="save">Passwort speichern</button></div>'+
    '<div class="card"><h3>Mein Konto</h3><dl class="info">'+
    '<div><dt>Name</dt><dd>'+esc(U0.name)+'</dd></div><div><dt>E-Mail</dt><dd>'+esc(U0.email)+'</dd></div>'+
    '<div><dt>Rolle</dt><dd>'+(chef?"Chef":"Team")+'</dd></div><div><dt>Letzte Anmeldung</dt><dd>'+fmtTs(U0.lastLogin)+'</dd></div></dl>'+
    '<p class="hint" style="margin-top:12px">'+(chef?'Du kannst unter „Konten“ Teammitglieder anlegen und verwalten.':'Name und E-Mail kann nur der Chef ändern. Du darfst dein Passwort ändern.')+'</p></div></div>'+
    '<div class="card"><h3>Regeln im System</h3><dl class="info">'+
    '<div><dt>Langzeitmiete</dt><dd>Mehr als 30 Tage</dd></div><div><dt>Regulärer Fahrzeugtausch</dt><dd>Nach 60 Tagen</dd></div>'+
    '<div><dt>Maximale Nutzungsdauer</dt><dd>90 Tage</dd></div><div><dt>Turnback / Verkauf</dt><dd>Tausch entsprechend früher</dd></div>'+
    '<div><dt>Kundeninformation</dt><dd>14 Tage vor dem Tausch per E-Mail</dd></div></dl></div>';

  document.getElementById("save").addEventListener("click",function(){
    var m=document.getElementById("msg"); m.className="box bad";
    var p0=document.getElementById("p0").value, p1=document.getElementById("p1").value, p2=document.getElementById("p2").value;
    var me=currentUser();
    if(p0!==me.passwort){ m.textContent="Das aktuelle Passwort stimmt nicht."; return; }
    if(p1.length<8){ m.textContent="Das neue Passwort braucht mindestens 8 Zeichen."; return; }
    if(p1===p0){ m.textContent="Das neue Passwort muss anders sein als das alte."; return; }
    if(p1!==p2){ m.textContent="Die beiden neuen Passwörter sind nicht gleich."; return; }
    changePassword(me.id,p1);
    location.href="dashboard.html";
  });
})();
