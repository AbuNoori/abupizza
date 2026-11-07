/* Konten – nur der Chef: Teammitglieder anlegen, sperren, Passwort zurücksetzen */
if(requireChef()) (function(){
  var created="";
  function build(){
    var page=renderShell("konten.html","Konten","Nur der Chef kann Team-Konten anlegen und verwalten.","");
    page.innerHTML='<div class="card"><h3>Neues Team-Konto anlegen</h3>'+
      '<p class="hint" style="margin:6px 0 12px">Das Startpasswort wird automatisch erzeugt (8 Zeichen). Das Teammitglied muss es beim ersten Login selbst ändern. Danach darf es in seinem Konto nur noch sein Passwort ändern.</p>'+
      '<div class="grid2"><label>Name<input id="n1"></label><label>E-Mail<input id="n2" type="email"></label></div>'+
      '<div id="err"></div><button class="btn pri" id="add">Konto anlegen</button>'+created+'</div>'+
      '<h2 style="margin:26px 0 12px">Alle Konten</h2><div class="wrap"><table class="mid"><thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th><th>Passwort</th><th>Letzte Anmeldung</th><th></th></tr></thead><tbody>'+
      getAccounts().map(function(a){
        var istChef=a.rolle==="admin";
        return '<tr><td><b>'+esc(a.name)+'</b></td><td>'+esc(a.email)+'</td><td>'+(istChef?"Chef":"Team")+'</td>'+
          '<td>'+(a.aktiv?'<span class="chip c-ok">Aktiv</span>':'<span class="chip c-red">Gesperrt</span>')+'</td>'+
          '<td>'+(a.mustChange?'<span class="chip c-warn">Startpasswort</span>':'<span class="chip c-ok">Eigenes Passwort</span>')+'</td>'+
          '<td>'+fmtTs(a.lastLogin)+'</td><td>'+(istChef?'':
            '<button class="btn sm" data-t="'+a.id+'">'+(a.aktiv?"Sperren":"Entsperren")+'</button> <button class="btn sm" data-r="'+a.id+'">Passwort zurücksetzen</button>')+'</td></tr>';
      }).join("")+'</tbody></table></div>';

    document.getElementById("add").addEventListener("click",function(){
      var name=document.getElementById("n1").value.trim(), email=document.getElementById("n2").value.trim(), err=document.getElementById("err");
      err.className="box bad";
      if(!name||!email){ err.textContent="Bitte Name und E-Mail ausfüllen."; return; }
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent="Bitte eine gültige E-Mail-Adresse eingeben."; return; }
      var accs=getAccounts();
      if(accs.some(function(a){ return a.email.toLowerCase()===email.toLowerCase(); })){ err.textContent="Diese E-Mail hat schon ein Konto."; return; }
      var pass=generatePassword();
      accs.push({id:newId(),name:name,email:email,passwort:pass,rolle:"mitarbeiter",aktiv:true,mustChange:true});
      saveAccounts(accs);
      audit("Team-Konto angelegt: "+name+" ("+email+")");
      created=credsHTML("Konto für "+name+" angelegt",email,pass);
      build();
    });
    page.onclick=function(e){
      var t=e.target.getAttribute("data-t"), rr=e.target.getAttribute("data-r"), cp=e.target.getAttribute("data-copy");
      if(cp){ try{ navigator.clipboard.writeText(cp); e.target.textContent="Kopiert"; }catch(x){} return; }
      var accs=getAccounts();
      if(t){
        accs.forEach(function(a){ if(a.id==t && a.rolle!=="admin"){ a.aktiv=!a.aktiv; audit((a.aktiv?"Konto entsperrt: ":"Konto gesperrt: ")+a.email); } });
        saveAccounts(accs); created=""; build();
      }
      if(rr && confirm("Neues Startpasswort für dieses Konto erzeugen?")){
        var pass=generatePassword(), who=null;
        accs.forEach(function(a){ if(a.id==rr && a.rolle!=="admin"){ a.passwort=pass; a.mustChange=true; who=a; } });
        saveAccounts(accs);
        if(who){ audit("Passwort zurückgesetzt für "+who.email); created=credsHTML("Neues Passwort für "+who.name,who.email,pass); }
        build();
      }
    };
  }
  function credsHTML(title,email,pass){
    return '<div class="box ok" style="margin-top:14px"><b>'+esc(title)+'</b><br>E-Mail: <b>'+esc(email)+'</b><br>Startpasswort:<br><span class="pw" id="pwshow">'+esc(pass)+'</span> '+
      '<button class="btn sm" data-copy="'+esc(pass)+'">Kopieren</button><br><span class="hint" style="color:inherit">Gib diese Daten dem Teammitglied weiter. Das Passwort wird nur jetzt angezeigt.</span></div>';
  }
  build();
})();
