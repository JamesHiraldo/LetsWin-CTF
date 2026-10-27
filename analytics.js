(function(root) {
  "use strict";
  function time(value) {
    if (typeof value === "number" && Number.isFinite(value)) { const t=Math.abs(value)<1e11?value*1000:value; return Math.abs(t)<=8640000000000000?t:NaN; }
    const s=String(value??"").trim(); if(!s)return NaN;
    if (/^\d{10}(?:\.\d+)?$/.test(s))return Number(s)*1000;
    if (/^\d{13}$/.test(s))return Number(s);
    if(!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i.test(s)) return NaN;
    const calendar=new Date(s.slice(0,10)+"T00:00:00Z");
    if(!Number.isFinite(calendar.getTime())||calendar.toISOString().slice(0,10)!==s.slice(0,10))return NaN;
    return Date.parse(s.length===10?s+"T00:00:00Z":/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)?s:s.replace(" ","T")+"Z");
  }
  function displayTime(value,zone) { const t=time(value);return Number.isFinite(t)?new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",timeZoneName:"short"}).format(t):String(value??""); }
  function analyze(rows,{timeKey="timestamp",groupKey="source",from="",to="",duplicatesOnly=false}={}) {
    const start=from?time(from):-Infinity,end=to?time(to):Infinity;
    if(Number.isNaN(start)||Number.isNaN(end)||start>end)throw new Error("Enter a valid UTC time range; the start must precede the end.");
    const signature=r=>JSON.stringify(Object.keys(r).filter(k=>!["number","line"].includes(k)&&!k.startsWith("_")).sort().map(k=>[k,r[k]]));
    const counts=new Map();for(const r of rows){const s=signature(r);counts.set(s,(counts.get(s)||0)+1);}
    const filtered=rows.filter(r=>{const t=time(r[timeKey]);return (!from&&!to||Number.isFinite(t)&&t>=start&&t<=end)&&(!duplicatesOnly||counts.get(signature(r))>1);});
    const groups=new Map(),timeline=new Map();let unknownTimes=0,duplicateRows=0;
    for(const r of filtered){const g=String(r[groupKey]??"(missing)");groups.set(g,(groups.get(g)||0)+1);const t=time(r[timeKey]);if(Number.isFinite(t)){const bucket=new Date(Math.floor(t/60000)*60000).toISOString();timeline.set(bucket,(timeline.get(bucket)||0)+1);}else unknownTimes++;if(counts.get(signature(r))>1)duplicateRows++;}
    return {rows:filtered,groups:[...groups].sort((a,b)=>b[1]-a[1]),timeline:[...timeline].sort((a,b)=>a[0].localeCompare(b[0])),unknownTimes,duplicateRows};
  }
  const api={time,displayTime,analyze};root.CTFAnalytics=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
