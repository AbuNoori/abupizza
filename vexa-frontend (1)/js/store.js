/* ============================================================
   VEXA – Daten, Konten und Anmeldung
   Ersatz für Datenbank/Backend: Alles liegt im localStorage des Browsers.
   Wenn Backend und Datenbank fertig sind, werden nur die Funktionen
   get.../save.../login() durch Aufrufe an die API ersetzt.
   ============================================================ */
var K_ACC="vexa_accounts_v2", K_SESSION="vexa_session_v2", K_MIETEN="vexa_mieten_v4",
    K_AUDIT="vexa_audit_v1", K_CHECK="vexa_lastcheck_v1";
var CONTACT={ mail:"vex@avisbudget.example", tel:"+43 1 000 00 00" };
var STATIONEN=["Wien Flughafen","Wien Zentrum","Wien Hauptbahnhof","Graz","Linz","Salzburg","Innsbruck"];

/* ---------- Datums-Helfer ---------- */
var WT=["So","Mo","Di","Mi","Do","Fr","Sa"];
function pad(n){ return String(n).padStart(2,"0"); }
function isoDate(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function todayISO(){ return isoDate(new Date()); }
function nowTs(){ var d=new Date(); return isoDate(d)+"T"+pad(d.getHours())+":"+pad(d.getMinutes()); }
function D(s){ var a=s.slice(0,10).split("-"); return new Date(+a[0],a[1]-1,+a[2]); }
function addDays(s,n){ var d=D(s); d.setDate(d.getDate()+n); return isoDate(d); }
function diffDays(a,b){ return Math.round((D(b)-D(a))/864e5); }
function fmtDate(s){ return s ? s.slice(0,10).split("-").reverse().join(".") : "–"; }
function fmtTs(s){ return s ? fmtDate(s)+" "+s.slice(11,16) : "–"; }
function fmtShort(s){ var d=D(s); return WT[d.getDay()]+" "+pad(d.getDate())+"."+pad(d.getMonth()+1)+"."; }
function fmtLong(s){ return WT[D(s).getDay()]+", "+fmtDate(s); }
function inTage(n){ return n===0?"heute":n===1?"morgen":n===-1?"gestern":n>0?"in "+n+" Tagen":"vor "+(-n)+" Tagen"; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

var GRUPPEN=["Kleinwagen","Kompaktklasse","Mittelklasse","Kombi","SUV","Transporter","Oberklasse"];
function newToken(){ var a=new Uint8Array(10); crypto.getRandomValues(a); var c="abcdefghjkmnpqrstuvwxyz23456789"; return Array.prototype.map.call(a,function(b){ return c[b%c.length]; }).join(""); }

/* Eine leere Miete mit allen Feldern. Das Kennzeichen wird erst später eingetragen (Bearbeiten oder Fahrzeugtausch). */
function blankMiete(o){
  var T=todayISO();
  var r={ id:newId(), marke:"Avis", kunde:"", kontakt:"", email:"", tel:"", fahrzeug:"", gruppe:"Kompaktklasse", mva:"", kennzeichen:"", kmStart:"",
    start:T, ende:T, turn:T, created:T, vstart:null, history:[], lastWechsel:null, wechselBy:null, wechselCount:0,
    mail:null, mailTs:null, mailBy:null, draft:null, booking:null, turnDone:null, turnBy:null, closed:false, notiz:"", token:newToken(), log:[] };
  for(var k in o) r[k]=o[k];
  return r;
}

/* ---------- Beispieldaten (immer relativ zu "heute") ---------- */
function seedMieten(){
  var T=todayISO();
  function d(n){ return addDays(T,n); }
  function wd(n){ var x=d(n); while(D(x).getDay()===0||D(x).getDay()===6) x=addDays(x,1); return x; }
  function L(n,by,text,time){ return {ts:d(n)+"T"+(time||"09:00"),by:by,text:text}; }
  function mk(o){ return blankMiete(o); }
  var C="Chef", K="Kunde (Buchungsseite)";
  return [
    mk({id:1,marke:"Avis",kunde:"Demo Events e.U.",kontakt:"Frau Huber",email:"huber@demo-events.at",tel:"0664 111 22 33",fahrzeug:"Mercedes A 180",gruppe:"Kompaktklasse",mva:"4720011",kennzeichen:"W-627RF",kmStart:"8100",start:d(-63),ende:d(100),turn:d(40),created:d(-63),mail:d(-17),mailTs:d(-17)+"T10:15",mailBy:C,
      log:[L(-63,C,"Miete erfasst und als Langzeitmiete erkannt (163 Tage)"),L(-17,C,"Kunden-E-Mail mit Kalender-Link an huber@demo-events.at versendet","10:15")]}),
    mk({id:2,marke:"Budget",kunde:"Beispiel Bau GmbH",kontakt:"Herr Gruber",email:"gruber@beispiel-bau.at",tel:"0664 222 33 44",fahrzeug:"Ford Focus",gruppe:"Kompaktklasse",mva:"4720112",kennzeichen:"W-762KL",kmStart:"14310",start:d(-50),ende:d(40),turn:d(40),created:d(-50),
      vstart:d(-6),lastWechsel:d(-6),wechselBy:C,wechselCount:1,
      history:[{marke:"Budget",fahrzeug:"Fiat Tipo",gruppe:"Kompaktklasse",mva:"4720012",kennzeichen:"W-159AR",von:d(-50),bis:d(-6),kmStart:"5200",kmEnd:"14200",schaeden:"Kleiner Kratzer an der Stoßstange",by:C,neu:"Ford Focus (W-762KL)",termin:fmtDate(wd(-6))+" 08:30, Graz"}],
      log:[L(-50,C,"Miete erfasst und als Langzeitmiete erkannt (90 Tage)"),L(-6,C,"Fahrzeugtausch durchgeführt: Fiat Tipo (W-159AR, Rückgabe bei 14200 km) gegen Ford Focus (W-762KL, Übernahme bei 14310 km). Neues Turnback-Datum "+fmtDate(d(40)),"14:05")]}),
    mk({id:3,marke:"Avis",kunde:"Muster Logistik KG",kontakt:"Herr Maier",email:"maier@muster-logistik.at",tel:"0664 333 44 55",fahrzeug:"Audi A3 Sportback",gruppe:"Kompaktklasse",mva:"4720013",kennzeichen:"W-902LB",kmStart:"3000",start:d(-50),ende:d(80),turn:d(60),created:d(-50),
      log:[L(-50,C,"Miete erfasst und als Langzeitmiete erkannt (130 Tage)")]}),
    mk({id:4,marke:"Budget",kunde:"Demo Consulting OG",kontakt:"Frau Leitner",email:"leitner@demo-consulting.at",tel:"0664 444 55 66",fahrzeug:"Skoda Octavia Combi",gruppe:"Kombi",mva:"4720014",kennzeichen:"W-336MC",kmStart:"1200",start:d(-52),ende:d(60),turn:d(30),created:d(-52),mail:d(-6),mailTs:d(-6)+"T11:00",mailBy:C,
      log:[L(-52,C,"Miete erfasst und als Langzeitmiete erkannt (112 Tage)"),L(-6,C,"Kunden-E-Mail mit Kalender-Link an leitner@demo-consulting.at versendet","11:00")]}),
    mk({id:5,marke:"Avis",kunde:"Muster Pharma AG",kontakt:"Dr. Weber",email:"weber@muster-pharma.at",tel:"0664 555 66 77",fahrzeug:"Seat Leon",gruppe:"Kompaktklasse",mva:"4720015",kennzeichen:"W-118PE",kmStart:"9500",start:d(-55),ende:d(70),turn:d(50),created:d(-55),mail:d(-9),mailTs:d(-9)+"T09:20",mailBy:C,
      booking:{date:wd(3),time:"10:00",station:"Wien Flughafen",at:d(-6)+"T08:12",by:K,bemerkung:""},
      log:[L(-55,C,"Miete erfasst und als Langzeitmiete erkannt (125 Tage)"),L(-9,C,"Kunden-E-Mail mit Kalender-Link an weber@muster-pharma.at versendet","09:20"),L(-6,K,"Termin gebucht: "+fmtDate(wd(3))+" 10:00 Uhr, Wien Flughafen","08:12")]}),
    mk({id:6,marke:"Budget",kunde:"Muster Logistik KG",kontakt:"Herr Maier",email:"maier@muster-logistik.at",tel:"0664 333 44 55",fahrzeug:"Opel Astra",gruppe:"Kompaktklasse",mva:"4720016",kennzeichen:"W-243TH",kmStart:"2000",start:d(-52),ende:d(70),turn:d(-2),created:d(-52),
      log:[L(-52,C,"Miete erfasst und als Langzeitmiete erkannt (122 Tage)")]}),
    mk({id:7,marke:"Avis",kunde:"Wegwe GmbH",kontakt:"Frau Berger",email:"berger@wegwe.at",tel:"0664 777 88 99",fahrzeug:"BMW 320d",gruppe:"Oberklasse",mva:"4720017",kennzeichen:"W-78632",kmStart:"500",start:d(-42),ende:d(90),turn:d(60),created:d(-42),
      log:[L(-42,C,"Miete erfasst und als Langzeitmiete erkannt (132 Tage)")]}),
    mk({id:8,marke:"Budget",kunde:"Beispiel Bau GmbH",kontakt:"Herr Gruber",email:"gruber@beispiel-bau.at",tel:"0664 222 33 44",fahrzeug:"VW Tiguan",gruppe:"SUV",mva:"4720018",kennzeichen:"W-859SG",kmStart:"7400",start:d(-36),ende:d(90),turn:d(22),created:d(-36),
      log:[L(-36,C,"Miete erfasst und als Langzeitmiete erkannt (126 Tage)")]}),
    mk({id:9,marke:"Avis",kunde:"Demo Events e.U.",kontakt:"Frau Huber",email:"huber@demo-events.at",tel:"0664 111 22 33",fahrzeug:"VW Golf",gruppe:"Kompaktklasse",mva:"4720019",kennzeichen:"",kmStart:"100",start:d(-1),ende:d(90),turn:d(100),created:T,
      log:[L(0,C,"Miete erfasst und als Langzeitmiete erkannt (91 Tage)")]}),
    mk({id:10,marke:"Budget",kunde:"Alpen Transporte GmbH",kontakt:"Herr Aigner",email:"aigner@alpen-transporte.at",tel:"0664 999 00 11",fahrzeug:"Audi Q3",gruppe:"SUV",mva:"4720020",kennzeichen:"W-555ZZ",kmStart:"6000",start:d(-100),ende:d(-10),turn:d(-12),created:d(-100),
      mail:d(-56),mailTs:d(-56)+"T09:00",mailBy:C,turnDone:d(-12),turnBy:C,closed:true,
      log:[L(-100,C,"Miete erfasst und als Langzeitmiete erkannt (90 Tage)"),L(-12,C,"Turnback durchgeführt (Fahrzeug an Händler zurückgegeben)"),L(-12,C,"Vorgang abgeschlossen")]})
  ];
}
function seedIfEmpty(){
  // Am Anfang gibt es nur das Chef-Konto (Rolle "admin" = Chef).
  if(!localStorage.getItem(K_ACC)){
    localStorage.setItem(K_ACC, JSON.stringify([{id:1,name:"Chef",email:"chef@vexa.de",passwort:"Chef2026",rolle:"admin",aktiv:true,mustChange:true}]));
  }
  if(!localStorage.getItem(K_MIETEN)){
    localStorage.setItem(K_MIETEN, JSON.stringify(seedMieten()));
  }
}
seedIfEmpty();

/* ---------- Speicher ---------- */
function getAccounts(){ return JSON.parse(localStorage.getItem(K_ACC)||"[]"); }
function saveAccounts(a){ localStorage.setItem(K_ACC, JSON.stringify(a)); }
function getMieten(){ return JSON.parse(localStorage.getItem(K_MIETEN)||"[]"); }
function saveMieten(m){ localStorage.setItem(K_MIETEN, JSON.stringify(m)); }
function getMiete(id){ return getMieten().filter(function(r){ return r.id==id; })[0]; }
function updateMiete(r){ var all=getMieten(); for(var i=0;i<all.length;i++){ if(all[i].id==r.id) all[i]=r; } saveMieten(all); }
function deleteMiete(id){ saveMieten(getMieten().filter(function(r){ return r.id!=id; })); }
function newId(){ return Date.now()+Math.floor(Math.random()*1000); }

function getAudit(){ return JSON.parse(localStorage.getItem(K_AUDIT)||"[]"); }
function audit(text,by){
  var u=currentUser(), a=getAudit();
  a.push({ts:nowTs(),by:by||(u?u.name:"System"),text:text});
  localStorage.setItem(K_AUDIT, JSON.stringify(a.slice(-500)));
}
function addLog(miete,text,by){
  var u=currentUser();
  miete.log.push({ts:nowTs(),by:by||(u?u.name:"System"),text:text});
}

/* ---------- Anmeldung und Rechte ---------- */
function currentUser(){
  var id=localStorage.getItem(K_SESSION);
  if(!id) return null;
  return getAccounts().filter(function(a){ return a.id==id; })[0] || null;
}
function isChef(){ var u=currentUser(); return !!u && u.rolle==="admin"; }
function login(email,pass){
  var accs=getAccounts();
  for(var i=0;i<accs.length;i++){
    var a=accs[i];
    if(a.email.toLowerCase()===email.toLowerCase() && a.passwort===pass){
      if(!a.aktiv){ audit("Anmeldung abgelehnt (Konto deaktiviert): "+a.email,"System"); return "inaktiv"; }
      localStorage.setItem(K_SESSION, a.id);
      a.lastLogin=nowTs(); saveAccounts(accs);
      audit("Angemeldet");
      return a;
    }
  }
  audit("Fehlgeschlagener Anmeldeversuch für "+email,"System");
  return null;
}
function logout(){ localStorage.removeItem(K_SESSION); }
function requireLogin(){
  var u=currentUser();
  if(!u || !u.aktiv){ logout(); location.replace("login.html"); return null; }
  // Beim ersten Login muss zuerst ein eigenes Passwort gesetzt werden
  if(u.mustChange && location.pathname.indexOf("einstellungen.html")===-1){ location.replace("einstellungen.html"); return null; }
  return u;
}
function requireChef(){
  var u=requireLogin();
  if(!u) return null;
  if(u.rolle!=="admin"){ alert("Diese Seite ist nur für den Chef."); location.replace("dashboard.html"); return null; }
  return u;
}
function generatePassword(){
  var chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // ohne 0/O/1/l/I
  var arr=new Uint32Array(8); crypto.getRandomValues(arr);
  var p=""; for(var i=0;i<8;i++) p+=chars[arr[i]%chars.length];
  return p;
}
function changePassword(userId,newPass){
  var accs=getAccounts();
  accs.forEach(function(a){ if(a.id==userId){ a.passwort=newPass; a.mustChange=false; } });
  saveAccounts(accs);
  audit("Eigenes Passwort geändert");
}
