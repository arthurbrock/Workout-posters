const _jsxFileName = ""; function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }const { useState, useRef, useCallback, useEffect, useMemo } = React;


// ── Strava ──────────────────────────────────────────────────────────────────
const STRAVA_CLIENT_ID     = "58825";
const STRAVA_CLIENT_SECRET = "bba7656c9258a34752c3626219681c6bb46a191b";
const STRAVA_REDIRECT_URI  = window.location.origin + window.location.pathname;
const STRAVA_SCOPE         = "activity:read_all";

function stravaToWorkout(a) {
  const typeMap = { Run:"running", Ride:"cycling", Hike:"hiking", Walk:"hiking",
                    VirtualRun:"running", VirtualRide:"cycling", Swim:"swimming" };
  const dist = (a.distance || 0) / 1000;
  const pace = dist > 0 ? Math.round((a.moving_time || 0) / dist) : 0;
  return {
    id: a.id, stravaId: a.id,
    type: typeMap[a.sport_type] || "running",
    name: a.name || "Untitled",
    city: a.location_city || a.location_country || "",
    date: (a.start_date_local || "").slice(0, 10),
    distance: Math.round(dist * 10) / 10,
    duration: a.moving_time || 0,
    avgHR: Math.round(a.average_heartrate || 0),
    maxHR: Math.round(a.max_heartrate || 0),
    avgPace: pace,
    calories: Math.round(a.calories || (a.kilojoules || 0) * 0.239),
    elevGain: Math.round(a.total_elevation_gain || 0),
    splits: (a.splits_metric || []).map(s =>
      s.distance > 0 ? Math.round(s.moving_time / (s.distance / 1000)) : 0),
    route: null,
  };
}

// ── Data ───────────────────────────────────────────────────────────────────
const WORKOUTS = [
  { id:1, type:"running",  name:"Morning 10K",     city:"São Paulo",   date:"2025-03-14", distance:10.2, duration:3180,  avgHR:158, maxHR:178, avgPace:312, calories:612,  elevGain:124, splits:[5.08,5.12,5.10,5.02,4.58,4.55,5.15,4.48,4.52,4.45] },
  { id:2, type:"running",  name:"Evening 5K",       city:"São Paulo",   date:"2025-03-11", distance:5.1,  duration:1560,  avgHR:162, maxHR:181, avgPace:305, calories:318,  elevGain:42,  splits:[5.05,5.00,4.58,5.02,5.08] },
  { id:3, type:"cycling",  name:"Weekend Ride",     city:"Rio de Janeiro", date:"2025-03-08", distance:42.0, duration:5400, avgHR:144, maxHR:172, avgPace:28,  calories:980,  elevGain:380, splits:[28,29,27,30,28,26,29,31] },
  { id:4, type:"running",  name:"Long Run",         city:"São Paulo",   date:"2025-03-02", distance:18.5, duration:6120,  avgHR:151, maxHR:169, avgPace:331, calories:1104, elevGain:210, splits:[5.30,5.28,5.25,5.22,5.18,5.20,5.35,5.28] },
  { id:5, type:"hiking",   name:"Serra da Cantareira", city:"São Paulo", date:"2025-02-22", distance:8.4,  duration:7200, avgHR:132, maxHR:158, avgPace:480, calories:720,  elevGain:560, splits:[8.10,8.20,7.55,8.05] },
  { id:6, type:"running",  name:"Tempo Run",        city:"São Paulo",   date:"2025-02-18", distance:7.0,  duration:2100,  avgHR:171, maxHR:185, avgPace:300, calories:434,  elevGain:88,  splits:[4.55,4.58,5.00,4.52,4.48,4.50,4.55] },
];

const STYLES = [
  { id:"street",  name:"Street"  },
  { id:"minimal", name:"Minimal" },
  { id:"bold",    name:"Bold"    },
  { id:"neon",    name:"Neon"    },
  { id:"retro",   name:"Retro"   },
  { id:"swiss",   name:"Swiss"   },
  { id:"route",   name:"Route"   },
];

const COLOR_COMBOS = [
  { name:"Midnight", bg:"#0A0A0A", text:"#E0DEDA" },  // Nike "Proudly in Motion" — pure black + warm off-white
  { name:"Signal",   bg:"#F03010", text:"#0A0A0A" },  // Nike Running 2025 — vivid red-orange + black
  { name:"Volt",     bg:"#00D44A", text:"#0A0A0A" },  // Nike "Something's Off" — electric green + black
  { name:"Cobalt",   bg:"#1848D6", text:"#3DFF6A" },  // "War Has No Home Here" — royal blue + neon lime
  { name:"Candy",    bg:"#F5B4CF", text:"#0A0A0A" },  // Nike Playlist — bubblegum pink + black
  { name:"Sky",      bg:"#94D8F5", text:"#0A0A0A" },  // Nike Playlist — sky blue + black
  { name:"Grape",    bg:"#9414E8", text:"#F5E800" },  // Nike "Run With Us" — vivid purple + volt yellow
  { name:"Chalk",    bg:"#F5F5F2", text:"#0A0A0A" },  // Ars Electronica — editorial white + black
];

const FORMATS = [
  { id:'portrait', label:'2:3',  w:600, h:900  },
  { id:'square',   label:'1:1',  w:600, h:600  },
  { id:'stories',  label:'9:16', w:600, h:1067 },
];

function parseGPX(text, filename) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const pts = [...doc.querySelectorAll('trkpt')].map(p => ({
    lat: +p.getAttribute('lat'), lon: +p.getAttribute('lon'),
    ele: +(_nullishCoalesce(_optionalChain([p, 'access', _2 => _2.querySelector, 'call', _3 => _3('ele'), 'optionalAccess', _4 => _4.textContent]), () => ( 0))),
    time: _nullishCoalesce(_optionalChain([p, 'access', _5 => _5.querySelector, 'call', _6 => _6('time'), 'optionalAccess', _7 => _7.textContent]), () => ( '')),
    hr:  +(_nullishCoalesce(_optionalChain([p, 'access', _8 => _8.querySelector, 'call', _9 => _9('hr, heartrate'), 'optionalAccess', _10 => _10.textContent]), () => ( 0))),
  }));
  if (!pts.length) return null;

  let dist = 0;
  for (let i = 1; i < pts.length; i++) {
    const R = 6371, dLat = (pts[i].lat - pts[i-1].lat) * Math.PI/180;
    const dLon = (pts[i].lon - pts[i-1].lon) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(pts[i-1].lat*Math.PI/180) *
              Math.cos(pts[i].lat*Math.PI/180) * Math.sin(dLon/2)**2;
    dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const t0 = new Date(pts[0].time), tN = new Date(pts[pts.length-1].time);
  const duration = isNaN(t0) ? 0 : Math.round((tN - t0) / 1000);

  let elevGain = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].ele - pts[i-1].ele;
    if (d > 0) elevGain += d;
  }

  const hrs = pts.map(p => p.hr).filter(h => h > 0);
  const avgHR = hrs.length ? Math.round(hrs.reduce((a,b) => a+b) / hrs.length) : 0;
  const avgPace = dist > 0 ? Math.round(duration / dist) : 0;

  const splits = [];
  let kmDist = 0, kmTime = 0;
  for (let i = 1; i < pts.length; i++) {
    const R = 6371, dLat = (pts[i].lat - pts[i-1].lat) * Math.PI/180;
    const dLon = (pts[i].lon - pts[i-1].lon) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(pts[i-1].lat*Math.PI/180)*Math.cos(pts[i].lat*Math.PI/180)*Math.sin(dLon/2)**2;
    const seg = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const tSeg = pts[i].time && pts[i-1].time ? (new Date(pts[i].time) - new Date(pts[i-1].time)) / 1000 : 0;
    kmDist += seg; kmTime += tSeg;
    if (kmDist >= 1) { splits.push(Math.round(kmTime / kmDist)); kmDist = 0; kmTime = 0; }
  }

  const gpxName = _optionalChain([doc, 'access', _11 => _11.querySelector, 'call', _12 => _12('name'), 'optionalAccess', _13 => _13.textContent, 'optionalAccess', _14 => _14.trim, 'call', _15 => _15()]);
  const name = gpxName || filename.replace(/\.gpx$/i,'').replace(/[-_]/g,' ');
  const date = pts[0].time ? pts[0].time.slice(0,10) : new Date().toISOString().slice(0,10);

  const step = Math.max(1, Math.floor(pts.length / 600));
  const route = pts.filter((_,i) => i % step === 0).map(p => [p.lat, p.lon]);

  return {
    id: Date.now(), type:'running', name, city:'', date,
    distance: +dist.toFixed(2), duration, avgHR, maxHR: hrs.length ? Math.max(...hrs) : 0,
    avgPace, calories: 0, elevGain: Math.round(elevGain),
    splits, route,
  };
}

const FALLBACK = {
  running:  "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1080&q=80",
  cycling:  "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1080&q=80",
  swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1080&q=80",
  hiking:   "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1080&q=80",
};

const SPORT_LABEL = { running:"RUN", cycling:"RIDE", swimming:"SWIM", hiking:"HIKE" };

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt=(s)=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`:`${m}:${String(sc).padStart(2,"0")}`;};
const fmtPace=(s,t)=>t==="cycling"?`${s}KM/H`:`${Math.floor(s/60)}'${String(s%60).padStart(2,"0")}"`;
const fmtDate=(d)=>{const dt=new Date(d);return`${String(dt.getDate()).padStart(2,"0")}.${String(dt.getMonth()+1).padStart(2,"0")}.${String(dt.getFullYear()).slice(2)}`;};
const fmtMonth=(d)=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}).toUpperCase().replace(",","");
const sparks=(splits,w,h)=>{if(!_optionalChain([splits, 'optionalAccess', _16 => _16.length]))return"";const mn=Math.min(...splits),mx=Math.max(...splits),r=mx-mn||1;return splits.map((v,i)=>`${i===0?"M":"L"}${((i/(splits.length-1))*w).toFixed(1)},${(h-((v-mn)/r)*h*0.8-h*0.1).toFixed(1)}`).join(" ");};
const luma=(hex)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return r*0.299+g*0.587+b*0.114;};


function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [x1,y1] = pts[0], [x2,y2] = pts[pts.length-1];
  const len = Math.hypot(x2-x1, y2-y1);
  let maxD = 0, maxI = 0;
  for (let i = 1; i < pts.length-1; i++) {
    const [px,py] = pts[i];
    const d = len > 0
      ? Math.abs((y2-y1)*px - (x2-x1)*py + x2*y1 - y2*x1) / len
      : Math.hypot(px-x1, py-y1);
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD > eps)
    return [...rdp(pts.slice(0,maxI+1), eps).slice(0,-1), ...rdp(pts.slice(maxI), eps)];
  return [pts[0], pts[pts.length-1]];
}

function smoothPath(pts) {
  if (pts.length < 2) return '';
  const d = [`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`];
  for (let i = 0; i < pts.length-1; i++) {
    const p0=pts[Math.max(i-1,0)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(i+2,pts.length-1)];
    const cp1x=p1[0]+(p2[0]-p0[0])/6, cp1y=p1[1]+(p2[1]-p0[1])/6;
    const cp2x=p2[0]-(p3[0]-p1[0])/6, cp2y=p2[1]-(p3[1]-p1[1])/6;
    d.push(`C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`);
  }
  return d.join(' ');
}

function extractColor(src, cb) {
  const img=new Image(); img.crossOrigin="anonymous";
  img.onload=()=>{
    try{
      const c=document.createElement("canvas");c.width=80;c.height=80;
      const ctx=c.getContext("2d");ctx.drawImage(img,0,0,80,80);
      const d=ctx.getImageData(0,0,80,80).data;
      let r=0,g=0,b=0,n=0;
      for(let i=0;i<d.length;i+=16){r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
      r=Math.round(r/n);g=Math.round(g/n);b=Math.round(b/n);
      const boost=2.3,mid=128;
      r=Math.min(255,Math.round(mid+(r-mid)*boost));
      g=Math.min(255,Math.round(mid+(g-mid)*boost));
      b=Math.min(255,Math.round(mid+(b-mid)*boost));
      cb(`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`);
    }catch(e){cb("#FF0000");}
  };
  img.onerror=()=>cb("#FF0000");
  img.src=src;
}

// Rotate hue 180° to get complementary color
function complementary(hex) {
  const r=parseInt(hex.slice(1,3),16)/255;
  const g=parseInt(hex.slice(3,5),16)/255;
  const b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0,s=0,l=(max+min)/2;
  if(d>0){
    s=d/(1-Math.abs(2*l-1));
    if(max===r) h=((g-b)/d+6)%6;
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h/=6;
  }
  // Rotate hue 180°
  h=(h+0.5)%1;
  // Back to RGB
  const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
  const hue2rgb=(p,q,t)=>{
    if(t<0)t+=1; if(t>1)t-=1;
    if(t<1/6)return p+(q-p)*6*t;
    if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const ro=Math.round(hue2rgb(p,q,h+1/3)*255);
  const go=Math.round(hue2rgb(p,q,h)*255);
  const bo=Math.round(hue2rgb(p,q,h-1/3)*255);
  return `#${ro.toString(16).padStart(2,"0")}${go.toString(16).padStart(2,"0")}${bo.toString(16).padStart(2,"0")}`;
}

// ══════════════════════════════════════════════════════════════════════════
// POSTERS — all 600×600, accept color + photo
// ══════════════════════════════════════════════════════════════════════════

function PosterStreet({w, color, bgColor, photo, route}) {
  const c = color||"#FF0000";
  const bgSrc = photo;
  const solidBg = bgColor || "#1a1a2e";
  const cityLine = (w.city||"YOUR CITY").toUpperCase();
  const [sx, setSx] = useState(1);

  // Measure city text width using an off-screen ghost element rendered at
  // position:fixed so it is NEVER affected by any parent transform/scale.
  // This is the only reliable way to get the true pixel width regardless of
  // how the poster card is scaled in the carousel.
  useEffect(() => {
    const ghost = document.createElement("div");
    ghost.style.cssText = [
      "position:fixed","top:-9999px","left:-9999px",
      "visibility:hidden","pointer-events:none",
      "font-family:'Barlow Condensed',sans-serif",
      "font-size:148px","font-weight:900","line-height:0.88",
      "white-space:nowrap","display:inline-block",
      "letter-spacing:-0.01em","text-transform:uppercase",
    ].join(";");
    ghost.textContent = cityLine;
    document.body.appendChild(ghost);

    const measure = () => {
      const natural = ghost.scrollWidth;
      if (natural > 0) setSx(Math.min(560 / natural, 3));
    };

    // Measure immediately, then again after fonts load (covers cold-start)
    measure();
    const t = setTimeout(measure, 120); // re-check after font paint
    _optionalChain([document, 'access', _17 => _17.fonts, 'optionalAccess', _18 => _18.ready, 'optionalAccess', _19 => _19.then, 'call', _20 => _20(measure)]);

    return () => {
      clearTimeout(t);
      document.body.removeChild(ghost);
    };
  }, [cityLine]);

  return (
    React.createElement('div', { style: {width:600,height:900,position:"relative",overflow:"hidden",background:solidBg,fontFamily:"'Barlow Condensed',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 274}}
      , bgSrc && React.createElement('img', { src: bgSrc, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 275}})
      /* TYPE */
      , React.createElement('div', { style: {position:"absolute",top:20,left:20,right:20,color:c,fontWeight:900,textTransform:"uppercase",lineHeight:0.88}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 277}}
        , React.createElement('div', { style: {overflow:"hidden"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 278}}
          , React.createElement('div', { style: {fontSize:148,lineHeight:0.88,whiteSpace:"nowrap",display:"inline-block",transformOrigin:"left center",transform:`scaleX(${sx})`,letterSpacing:"-0.01em"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 279}}, cityLine)
        )
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"baseline",fontSize:118,lineHeight:0.88,letterSpacing:"-0.01em",marginTop:2}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 281}}
          , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 282}}, w.distance.toFixed(0)), React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 282}}, "KM")
        )
      )
      /* BOTTOM — bold 3-point strip: same typeface/weight/color as headline */
      , React.createElement('div', { style: {
        position:"absolute", bottom:0, left:0, right:0,
        padding:"0 20px 32px",
        display:"flex", alignItems:"baseline", justifyContent:"space-between",
        color:c, fontWeight:900, textTransform:"uppercase",
        fontSize:42, lineHeight:1, letterSpacing:"-0.01em",
      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 286}}
        , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 293}}, fmtMonth(w.date))
        , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 294}}, fmt(w.duration))
        , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 295}}, fmtPace(w.avgPace,w.type))
      )
      , React.createElement(RouteMap, { route: route, color: color, __self: this, __source: {fileName: _jsxFileName, lineNumber: 297}})
    )
  );
}

function PosterMinimal({w, color, bgColor, photo, route}) {
  const c=color||"#1a1a1a";
  const dark = luma(c)>140;
  const bg = bgColor || (dark?"#111":"#faf8f5");
  const tp = dark?"#f0f0f0":"#1a1a1a";
  const tm = dark?"rgba(255,255,255,0.35)":"#aaa";
  const sp=sparks(w.splits,516,90);
  return (
    React.createElement('div', { style: {width:600,height:900,background:bg,fontFamily:"'DM Sans',sans-serif",padding:"60px 44px",boxSizing:"border-box",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",overflow:"hidden"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 310}}
      , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.09}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 311}})
      , React.createElement('div', { style: {position:"absolute",top:0,right:0,width:220,height:220,background:c,borderRadius:"0 0 0 220px",opacity:0.08}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 312}})
      , React.createElement('div', { style: {position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 313}}
        , React.createElement('div', { style: {fontSize:11,letterSpacing:6,color:tm,textTransform:"uppercase",marginBottom:10}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 314}}, new Date(w.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))
        , React.createElement('div', { style: {fontSize:96,fontFamily:"'Playfair Display',serif",fontWeight:900,lineHeight:0.85,color:c,marginBottom:8}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 315}}, w.distance.toFixed(1))
        , React.createElement('div', { style: {fontSize:13,letterSpacing:5,color:tm,textTransform:"uppercase"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 316}}, "Kilometres · "  , SPORT_LABEL[w.type])
      )
      , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"32px 0",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 318}}
        , [["Duration",fmt(w.duration)],["Avg HR",`${w.avgHR} bpm`],["Pace",fmtPace(w.avgPace,w.type)],["Calories",`${w.calories} kcal`]].map(([l,v])=>(
          React.createElement('div', { key: l, __self: this, __source: {fileName: _jsxFileName, lineNumber: 320}}, React.createElement('div', { style: {fontSize:10,letterSpacing:4,color:tm,textTransform:"uppercase",marginBottom:5}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 320}}, l), React.createElement('div', { style: {fontSize:24,fontWeight:500,color:tp}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 320}}, v))
        ))
      )
      , React.createElement('div', { style: {position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 323}}
        , React.createElement('div', { style: {fontSize:10,letterSpacing:3,color:tm,textTransform:"uppercase",marginBottom:10}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 324}}, "Split Rhythm" )
        , React.createElement('svg', { width: 516, height: 90, __self: this, __source: {fileName: _jsxFileName, lineNumber: 325}}, React.createElement('path', { d: sp, fill: "none", stroke: c, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 325}}))
      )
      , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"flex-end",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 327}}
        , React.createElement('div', { style: {fontSize:10,letterSpacing:3,color:tm,textTransform:"uppercase"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 328}}, "Garmin Connect" )
        , React.createElement('div', { style: {fontSize:28,color:c,opacity:0.25}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 329}}, "◎")
      )
      , React.createElement(RouteMap, { route: route, color: c, __self: this, __source: {fileName: _jsxFileName, lineNumber: 331}})
    )
  );
}

function PosterBold({w, color, bgColor, photo, route}) {
  const c   = color   || "#ff3d00";
  const bg  = bgColor || "#0f0f0f";
  const sp  = sparks(w.splits, 524, 56);
  const onC = luma(c) > 140 ? "#0A0A0A" : "#FFFFFF";
  const distStr = w.distance.toFixed(1);
  const distFs  = distStr.length <= 4 ? 158 : distStr.length <= 5 ? 128 : 106;
  return (
    React.createElement('div', { style: {width:600,height:900,background:bg,fontFamily:"'Anton',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 344}}
      , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.08}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 345}})

      /* ── COLOUR BLOCK TOP ── */
      , React.createElement('div', { style: {background:c, padding:"28px 36px 32px", position:"relative", flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 348}}
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 349}}
          , React.createElement('div', { style: {fontSize:10,letterSpacing:6,color:onC,opacity:0.65,fontFamily:"'DM Sans',sans-serif",fontWeight:600}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 350}}, SPORT_LABEL[w.type])
          , React.createElement('div', { style: {fontSize:10,letterSpacing:3,color:onC,opacity:0.5,fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 351}}, new Date(w.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase())
        )
        , React.createElement('div', { style: {fontSize:distFs,lineHeight:0.82,color:onC,letterSpacing:-5}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 353}}, distStr)
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:10}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 354}}
          , React.createElement('div', { style: {fontSize:14,letterSpacing:9,color:onC,opacity:0.55,fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 355}}, "KM")
          , React.createElement('div', { style: {fontSize:22,color:onC,opacity:0.75,letterSpacing:-1}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 356}}, fmt(w.duration))
        )
      )

      /* ── DARK STATS GRID ── */
      , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",background:"#1c1c1c",flexShrink:0,position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 361}}
        , [["AVG PACE",fmtPace(w.avgPace,w.type)],["HEART RATE",`${w.avgHR} BPM`],["CALORIES",`${w.calories} KCAL`],["ELEV GAIN",`${w.elevGain}M`]].map(([l,v])=>(
          React.createElement('div', { key: l, style: {background:bg,padding:"20px 20px"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 363}}
            , React.createElement('div', { style: {fontSize:8,letterSpacing:4,color:"#444",marginBottom:8,fontFamily:"'DM Sans',sans-serif",fontWeight:500}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 364}}, l)
            , React.createElement('div', { style: {fontSize:26,color:"#e8e8e8"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 365}}, v)
          )
        ))
      )

      /* ── SPARKLINE + FOOTER ── */
      , React.createElement('div', { style: {flex:1,padding:"28px 36px 32px",display:"flex",flexDirection:"column",justifyContent:"flex-end",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 371}}
        , w.city && React.createElement('div', { style: {fontSize:10,letterSpacing:6,color:"#2e2e2e",fontFamily:"'DM Sans',sans-serif",marginBottom:14}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 372}}, w.city.toUpperCase())
        , React.createElement('svg', { width: 524, height: 56, __self: this, __source: {fileName: _jsxFileName, lineNumber: 373}}, React.createElement('path', { d: sp, fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 373}}))
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",marginTop:12}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 374}}
          , React.createElement('div', { style: {fontSize:8,letterSpacing:5,color:"#2a2a2a",fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 375}}, "GARMIN CONNECT" )
          , React.createElement('div', { style: {fontSize:8,letterSpacing:5,color:"#2a2a2a",fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 376}}, "2025")
        )
      )
      , React.createElement(RouteMap, { route: route, color: c, __self: this, __source: {fileName: _jsxFileName, lineNumber: 379}})
    )
  );
}

function PosterNeon({w, color, bgColor, photo, route}) {
  const c=color||"#00ff88";
  const bg=bgColor||"#050508";
  const sp=sparks(w.splits,516,80);
  return (
    React.createElement('div', { style: {width:600,height:900,background:bg,fontFamily:"'Space Mono',monospace",padding:"52px 42px",boxSizing:"border-box",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",overflow:"hidden"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 389}}
      , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.07}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 390}})
      , [150,300,450,600,750].map(y=>React.createElement('div', { key: y, style: {position:"absolute",left:0,top:y,right:0,height:1,background:"rgba(255,255,255,0.025)"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 391}}))
      , [150,300,450].map(x=>React.createElement('div', { key: x, style: {position:"absolute",top:0,left:x,bottom:0,width:1,background:"rgba(255,255,255,0.025)"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 392}}))
      , React.createElement('div', { style: {position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 393}}
        , React.createElement('div', { style: {fontSize:9,letterSpacing:6,color:c,opacity:0.6,marginBottom:16}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 394}}, SPORT_LABEL[w.type], " · "  , w.date)
        , React.createElement('div', { style: {fontSize:110,color:"#fff",lineHeight:0.82,letterSpacing:-4,textShadow:`0 0 40px ${c}77`}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 395}}, w.distance.toFixed(1))
        , React.createElement('div', { style: {fontSize:14,color:c,letterSpacing:8,marginTop:10,textShadow:`0 0 20px ${c}`}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 396}}, "KILOMETRES")
      )
      , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 398}}
        , [["TIME",fmt(w.duration)],["HR",`${w.avgHR}`],["PACE",fmtPace(w.avgPace,w.type)]].map(([l,v])=>(
          React.createElement('div', { key: l, style: {border:`1px solid ${c}30`,padding:"14px 12px",borderRadius:4}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 400}}
            , React.createElement('div', { style: {fontSize:8,letterSpacing:4,color:c,opacity:0.45,marginBottom:7}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 401}}, l)
            , React.createElement('div', { style: {fontSize:19,color:"#fff",textShadow:`0 0 8px ${c}55`}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 402}}, v)
          )
        ))
      )
      , React.createElement('div', { style: {position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 406}}
        , React.createElement('svg', { width: 516, height: 80, __self: this, __source: {fileName: _jsxFileName, lineNumber: 407}}
          , React.createElement('defs', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 408}}, React.createElement('linearGradient', { id: "ng5", x1: "0", y1: "0", x2: "1", y2: "0", __self: this, __source: {fileName: _jsxFileName, lineNumber: 408}}, React.createElement('stop', { offset: "0%", stopColor: c, stopOpacity: "0.1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 408}}), React.createElement('stop', { offset: "50%", stopColor: c, stopOpacity: "1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 408}}), React.createElement('stop', { offset: "100%", stopColor: c, stopOpacity: "0.1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 408}})))
          , React.createElement('path', { d: sp, fill: "none", stroke: "url(#ng5)", strokeWidth: 2, strokeLinecap: "round", style: {filter:`drop-shadow(0 0 5px ${c})`}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 409}})
        )
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",marginTop:10}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 411}}
          , React.createElement('div', { style: {fontSize:7,letterSpacing:5,color:"#1a1a1a"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 412}}, "GARMIN CONNECT" )
          , React.createElement('div', { style: {fontSize:7,letterSpacing:5,color:"#1a1a1a"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 413}}, "v2.0")
        )
      )
      , React.createElement(RouteMap, { route: route, color: c, __self: this, __source: {fileName: _jsxFileName, lineNumber: 416}})
    )
  );
}

function PosterRetro({w, color, bgColor, photo, route}) {
  const c   = color   || "#3DFF6A";
  const bg  = bgColor || "#1848D6";
  const distStr = w.distance.toFixed(1);
  // Scale font size so the distance number fills the width
  const distFs  = distStr.length <= 3 ? 240 : distStr.length <= 4 ? 196 : 158;
  const runName = (w.name || "MORNING RUN").toUpperCase();
  // Trim name so it doesn't overflow
  const nameDisplay = runName.length > 20 ? runName.slice(0, 20) + "…" : runName;
  return (
    React.createElement('div', { style: {width:600,height:900,background:bg,fontFamily:"'Barlow Condensed',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",padding:"38px 36px 36px",boxSizing:"border-box"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 431}}
      , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.10}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 432}})

      /* ── TOP LABEL ── */
      , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 435}}
        , React.createElement('div', { style: {fontSize:11,letterSpacing:7,color:c,opacity:0.55,fontFamily:"'DM Sans',sans-serif",fontWeight:700}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 436}}
          , SPORT_LABEL[w.type], " / "  , new Date(w.date).toLocaleDateString("en-US",{month:"long",year:"numeric"}).toUpperCase()
        )
        , React.createElement('div', { style: {fontSize:11,letterSpacing:3,color:c,opacity:0.35,fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 439}}, "GARMIN")
      )

      /* ── GIANT DISTANCE ── fills most of the poster ── */
      , React.createElement('div', { style: {flex:1,display:"flex",flexDirection:"column",justifyContent:"center",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 443}}
        , React.createElement('div', { style: {fontSize:distFs,lineHeight:0.82,color:c,fontWeight:900,letterSpacing:-6,wordBreak:"break-all"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 444}}
          , distStr
        )
        , React.createElement('div', { style: {fontSize:52,letterSpacing:6,color:c,fontWeight:900,marginTop:6,opacity:0.55}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 447}}, "KM")
        , React.createElement('div', { style: {height:2,background:c,opacity:0.18,margin:"28px 0"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 448}})
        , React.createElement('div', { style: {fontSize:42,color:c,fontWeight:900,lineHeight:1.05,letterSpacing:-1,opacity:0.9}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 449}}
          , nameDisplay
        )
        , w.city && React.createElement('div', { style: {fontSize:14,color:c,letterSpacing:5,fontWeight:900,marginTop:10,opacity:0.4}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 452}}, w.city.toUpperCase())
      )

      /* ── BOTTOM STATS STRIP ── */
      , React.createElement('div', { style: {borderTop:`2px solid ${c}22`,paddingTop:22,position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 456}}
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"flex-end"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 457}}
          , [["TIME",fmt(w.duration)],["HR",`${w.avgHR}`],["PACE",fmtPace(w.avgPace,w.type)],["ELEV",`${w.elevGain}M`]].map(([l,v])=>(
            React.createElement('div', { key: l, __self: this, __source: {fileName: _jsxFileName, lineNumber: 459}}
              , React.createElement('div', { style: {fontSize:8,letterSpacing:4,color:c,opacity:0.4,fontFamily:"'DM Sans',sans-serif",marginBottom:6}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 460}}, l)
              , React.createElement('div', { style: {fontSize:24,color:c,fontWeight:900}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 461}}, v)
            )
          ))
        )
      )
      , React.createElement(RouteMap, { route: route, color: c, __self: this, __source: {fileName: _jsxFileName, lineNumber: 466}})
    )
  );
}

function PosterSwiss({w, color, bgColor, photo, route}) {
  const c=color||"#e63323";
  const bg=bgColor||"#ffffff";
  const sp=sparks(w.splits,456,60);
  return (
    React.createElement('div', { style: {width:600,height:900,background:bg,fontFamily:"'IBM Plex Mono',monospace",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 476}}
      , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.05}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 477}})
      , React.createElement('div', { style: {background:c,height:8,position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 478}})
      , React.createElement('div', { style: {padding:"32px 44px",flex:1,display:"flex",flexDirection:"column",position:"relative"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 479}}
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",marginBottom:40}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 480}}
          , React.createElement('div', { style: {fontSize:10,letterSpacing:3,color:"#bbb"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 481}}, w.date)
          , React.createElement('div', { style: {fontSize:10,letterSpacing:3,color:"#bbb"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 482}}, SPORT_LABEL[w.type])
        )
        , React.createElement('div', { style: {marginBottom:36}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 484}}
          , React.createElement('div', { style: {fontSize:120,fontWeight:700,color:"#111",lineHeight:0.82,letterSpacing:-7}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 485}}, w.distance.toFixed(1))
          , React.createElement('div', { style: {height:3,background:c,width:80,marginTop:16}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 486}})
          , React.createElement('div', { style: {fontSize:11,letterSpacing:7,color:"#bbb",marginTop:10}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 487}}, "KILOMETRES")
        )
        , React.createElement('div', { style: {flex:1}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 489}}
          , [["Duration",fmt(w.duration)],["Avg Heart Rate",`${w.avgHR} bpm`],[w.type==="cycling"?"Avg Speed":"Avg Pace",fmtPace(w.avgPace,w.type)],["Calories",`${w.calories} kcal`],["Elev. Gain",`${w.elevGain}m`]].map(([l,v],i)=>(
            React.createElement('div', { key: l, style: {display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${i===0?c:"#f0f0f0"}`}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 491}}
              , React.createElement('div', { style: {fontSize:9,letterSpacing:3,color:"#aaa",fontWeight:500}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 492}}, l.toUpperCase())
              , React.createElement('div', { style: {fontSize:13,fontWeight:500,color:"#111"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 493}}, v)
            )
          ))
        )
        , React.createElement('div', { style: {marginTop:28}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 497}}
          , React.createElement('svg', { width: 456, height: 60, __self: this, __source: {fileName: _jsxFileName, lineNumber: 498}}, React.createElement('path', { d: sp, fill: "none", stroke: c, strokeWidth: 1.5, strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 498}}))
          , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",marginTop:18}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 499}}
            , React.createElement('div', { style: {fontSize:7,letterSpacing:5,color:"#ddd",fontWeight:500}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 500}}, "GARMIN CONNECT" )
            , React.createElement('div', { style: {fontSize:7,letterSpacing:5,color:"#ddd",fontWeight:500}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 501}}, "2025")
          )
        )
      )
      , React.createElement(RouteMap, { route: route, color: c, __self: this, __source: {fileName: _jsxFileName, lineNumber: 505}})
    )
  );
}

function PosterRoute({w, color, bgColor, photo, route}) {
  const c = color || "#e8e8e8";
  const bg = bgColor || "#0d0d0d";

  if (!route || route.length < 2) {
    return (
      React.createElement('div', { style: {width:600,height:900,background:bg,position:"relative",overflow:"hidden",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 516}}
        , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.07}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 518}})
        , React.createElement('div', { style: {textAlign:"center",opacity:0.25}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 519}}
          , React.createElement('svg', { width: "48", height: "48", viewBox: "0 0 48 48"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 520}}
            , React.createElement('path', { d: "M8 40 C12 24 20 10 24 10 S36 20 40 8"           , stroke: c, strokeWidth: "2", strokeLinecap: "round", fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 521}})
          )
          , React.createElement('div', { style: {fontSize:11,color:c,letterSpacing:5,marginTop:16,fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 523}}, "IMPORT A GPX FILE"   )
        )
      )
    );
  }

  const PAD_X=60, PAD_TOP=80, PAD_BOT=200;
  const areaW=600-PAD_X*2, areaH=900-PAD_TOP-PAD_BOT;
  const lats=route.map(p=>p[0]), lons=route.map(p=>p[1]);
  const minLat=Math.min(...lats), maxLat=Math.max(...lats);
  const minLon=Math.min(...lons), maxLon=Math.max(...lons);
  const latSpan=maxLat-minLat||0.001, lonSpan=maxLon-minLon||0.001;
  const sc=Math.min(areaW/lonSpan, areaH/latSpan);
  const routeW=lonSpan*sc, routeH=latSpan*sc;
  const offX=PAD_X+(areaW-routeW)/2, offY=PAD_TOP+(areaH-routeH)/2;
  const toX=lon=>offX+(lon-minLon)*sc;
  const toY=lat=>offY+routeH-(lat-minLat)*sc;

  const screenPts=route.map(([lat,lon])=>[toX(lon),toY(lat)]);
  const simplified=rdp(screenPts,5);
  const pathD=smoothPath(simplified);

  return (
    React.createElement('div', { style: {width:600,height:900,background:bg,position:"relative",overflow:"hidden",fontFamily:"'DM Sans',sans-serif"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 546}}
      , photo && React.createElement('img', { src: photo, crossOrigin: "anonymous", style: {position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.07}, alt: "", __self: this, __source: {fileName: _jsxFileName, lineNumber: 547}})
      , React.createElement('svg', { style: {position:"absolute",top:0,left:0,width:600,height:900}, viewBox: "0 0 600 900"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 548}}
        , React.createElement('path', { d: pathD, stroke: c, strokeWidth: "2.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 549}})
      )
      , React.createElement('div', { style: {position:"absolute",bottom:0,left:0,right:0,padding:"0 60px 52px"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 551}}
        , React.createElement('div', { style: {height:1,background:c,opacity:0.12,marginBottom:28}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 552}})
        , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"baseline"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 553}}
          , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 554}}
            , React.createElement('span', { style: {fontSize:64,fontWeight:700,color:c,lineHeight:1,letterSpacing:-2}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 555}}, w.distance.toFixed(1))
            , React.createElement('span', { style: {fontSize:14,color:c,opacity:0.5,marginLeft:8,letterSpacing:3}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 556}}, "KM")
          )
          , React.createElement('div', { style: {textAlign:"right"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 558}}
            , React.createElement('div', { style: {fontSize:11,color:c,opacity:0.5,letterSpacing:4}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 559}}, fmtDate(w.date))
            , w.city && React.createElement('div', { style: {fontSize:11,color:c,opacity:0.35,letterSpacing:3,marginTop:4}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 560}}, w.city.toUpperCase())
          )
        )
      )
    )
  );
}

// Per-style default background colors (used when no photo uploaded)
const STYLE_BG = {
  street:  "#1a1a2e",
  minimal: "#faf8f5",
  bold:    "#0f0f0f",
  neon:    "#050508",
  retro:   "#1848D6",
  swiss:   "#ffffff",
  route:   "#0d0d0d",
};

const POSTER_MAP={street:PosterStreet,minimal:PosterMinimal,bold:PosterBold,neon:PosterNeon,retro:PosterRetro,swiss:PosterSwiss,route:PosterRoute};
function Poster({id,w,color,photo,bgColor,route}){
  const C=POSTER_MAP[id];
  return React.createElement(C, { w: w, photo: photo, color: color, bgColor: bgColor, route: route, __self: this, __source: {fileName: _jsxFileName, lineNumber: 582}});
}

// ══════════════════════════════════════════════════════════════════════════
// CITY → COLOR PALETTE
// Each city maps to a { bg, accent } pair. bg = poster background,
// accent = text/graphic color. Both flow into the poster color prop.
// ══════════════════════════════════════════════════════════════════════════
const CITY_PALETTES = {
  // Brazil
  "são paulo":         { bg:"#0d0d0d",  accent:"#e8e8e8" },  // noir black + white
  "sao paulo":         { bg:"#0d0d0d",  accent:"#e8e8e8" },
  "rio de janeiro":    { bg:"#0a4f3c",  accent:"#f7e94e" },  // jungle green + carnival yellow
  "florianópolis":     { bg:"#006994",  accent:"#b8e4f7" },  // ocean blue + seafoam
  "florianopolis":     { bg:"#006994",  accent:"#b8e4f7" },
  "curitiba":          { bg:"#2b3a52",  accent:"#c8a96e" },  // cool steel + warm brass
  "belo horizonte":    { bg:"#3a1f4b",  accent:"#f0c040" },  // purple dusk + gold
  "salvador":          { bg:"#c8420a",  accent:"#fce94f" },  // terracotta + festival yellow
  "brasília":          { bg:"#1a3a5c",  accent:"#e8d5a0" },  // modernist sky + limestone
  "brasilia":          { bg:"#1a3a5c",  accent:"#e8d5a0" },
  // USA
  "los angeles":       { bg:"#e8521a",  accent:"#ffd04a" },  // sunset orange + golden hour
  "new york":          { bg:"#1a1a2e",  accent:"#d4d4d4" },  // midnight skyline + silver
  "new york city":     { bg:"#1a1a2e",  accent:"#d4d4d4" },
  "miami":             { bg:"#e8006e",  accent:"#00e8c8" },  // art deco pink + aqua
  "chicago":           { bg:"#1c3f6e",  accent:"#c8a96e" },  // lake blue + brass
  "san francisco":     { bg:"#c84a24",  accent:"#e8d080" },  // golden gate rust + fog
  "seattle":           { bg:"#1e3d30",  accent:"#88c8a0" },  // evergreen + rain
  "austin":            { bg:"#7c3b1e",  accent:"#f5c842" },  // texas clay + sun
  "nashville":         { bg:"#2a1200",  accent:"#e8b04a" },  // honky tonk dark + bourbon gold
  "boston":            { bg:"#8b1a1a",  accent:"#e8e0d0" },  // colonial red + cream
  "denver":            { bg:"#4a2c6e",  accent:"#f0a830" },  // rocky mtn violet + amber
  "portland":          { bg:"#2d4a2a",  accent:"#e8c8a0" },  // forest + cedar
  "new orleans":       { bg:"#2a1a5e",  accent:"#f5c518" },  // jazz purple + gold
  // Europe
  "london":            { bg:"#2a2a3a",  accent:"#b8b8b8" },  // overcast + silver
  "paris":             { bg:"#1a1a3e",  accent:"#e8d090" },  // midnight + champagne
  "berlin":            { bg:"#111111",  accent:"#e8e800" },  // dark + bauhaus yellow
  "amsterdam":         { bg:"#0d3349",  accent:"#f28c38" },  // canal + tulip orange
  "barcelona":         { bg:"#b83020",  accent:"#f8c418" },  // gaudí red + mediterranean sun
  "madrid":            { bg:"#8b1818",  accent:"#f5c518" },  // royal red + gold
  "lisbon":            { bg:"#1e3a6e",  accent:"#f5e0b8" },  // azulejo + limestone
  "porto":             { bg:"#5a1e0e",  accent:"#e8c890" },  // port wine + stone
  "rome":              { bg:"#8b4010",  accent:"#f5deb3" },  // terracotta + wheat
  "milan":             { bg:"#0a0a0a",  accent:"#d4af37" },  // fashion black + gold
  "zurich":            { bg:"#3a3a4a",  accent:"#f0f0f0" },  // swiss grey + white
  "vienna":            { bg:"#2a1a4a",  accent:"#e8d4a0" },  // imperial purple + cream
  "prague":            { bg:"#8b4a1a",  accent:"#f0d880" },  // bohemian amber + gold
  "copenhagen":        { bg:"#1a3a5a",  accent:"#e8b870" },  // nordic fjord + amber
  "stockholm":         { bg:"#0a2a4a",  accent:"#f5c800" },  // nordic blue + yellow
  "oslo":              { bg:"#1a2a3a",  accent:"#c8e0f0" },  // fjord slate + ice blue
  "helsinki":          { bg:"#1e3050",  accent:"#f0f4f8" },  // baltic + white
  "athens":            { bg:"#1e4a7a",  accent:"#f0e8c8" },  // aegean + marble
  "istanbul":          { bg:"#6a1a2a",  accent:"#f0c060" },  // bosphorus burgundy + gold
  // Asia
  "tokyo":             { bg:"#0a0818",  accent:"#ff4785" },  // night + neon cherry
  "kyoto":             { bg:"#2d1b0e",  accent:"#e8987c" },  // bamboo + temple orange
  "osaka":             { bg:"#1a0a2a",  accent:"#ff8c00" },  // neon dotonbori
  "seoul":             { bg:"#1a1a2a",  accent:"#e8c8d0" },  // han river night + blush
  "singapore":         { bg:"#b80e2a",  accent:"#f8f8f8" },  // flag red + white
  "hong kong":         { bg:"#0a1a3a",  accent:"#e85818" },  // harbour night + sunset
  "shanghai":          { bg:"#1a2a4a",  accent:"#e8c060" },  // bund + gold
  "beijing":           { bg:"#8b1a1a",  accent:"#e8d060" },  // forbidden city + imperial
  "mumbai":            { bg:"#c84818",  accent:"#f8e060" },  // spice orange + turmeric
  "dubai":             { bg:"#c8a040",  accent:"#0a0a0a" },  // gold + black
  "bangkok":           { bg:"#8b1a5a",  accent:"#f8e800" },  // lotus purple + temple gold
  // Oceania
  "sydney":            { bg:"#0a3060",  accent:"#f8c820" },  // harbour navy + sun
  "melbourne":         { bg:"#1a1a2a",  accent:"#c8a8e8" },  // laneway + neon
  "auckland":          { bg:"#1a3a2a",  accent:"#e8d0a0" },  // fern green + kauri
  // Americas
  "buenos aires":      { bg:"#3a5a8a",  accent:"#f0f0f0" },  // river plate blue + white
  "bogotá":            { bg:"#2a1a4a",  accent:"#f8c840" },  // andean + gold
  "bogota":            { bg:"#2a1a4a",  accent:"#f8c840" },
  "lima":              { bg:"#c84818",  accent:"#f8f0e0" },  // inca terracotta + cream
  "santiago":          { bg:"#3a3a5a",  accent:"#c8d8e8" },  // andean slate + sky
  "mexico city":       { bg:"#6a1a1a",  accent:"#f8c840" },  // aztec red + marigold
  "havana":            { bg:"#c85818",  accent:"#e8e050" },  // cuban sun + yellow
  "toronto":           { bg:"#1a2a4a",  accent:"#e8e8e8" },  // great lakes + white
  "montreal":          { bg:"#1a1a3a",  accent:"#e85858" },  // st lawrence + rouge
  "vancouver":         { bg:"#1a3a4a",  accent:"#88c8a8" },  // pacific + cedar
  // Africa
  "cape town":         { bg:"#1a3a2a",  accent:"#e8c878" },  // table mountain + fynbos
  "nairobi":           { bg:"#2d1b0e",  accent:"#e8a820" },  // savanna earth + gold
  "marrakech":         { bg:"#8b2a0a",  accent:"#f8c840" },  // medina red + souk gold
  "lagos":             { bg:"#1a4a2a",  accent:"#f8d840" },  // mangrove + sun
  "cairo":             { bg:"#c8a040",  accent:"#1a1a1a" },  // desert sand + black
  "casablanca":        { bg:"#0a2a4a",  accent:"#f8f0d0" },  // atlantic + white
};

function getCityPalette(city) {
  if (!city) return null;
  const key = city.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents for matching
  const direct = CITY_PALETTES[city.toLowerCase().trim()];
  if (direct) return direct;
  // Try accent-stripped version
  for (const [k, v] of Object.entries(CITY_PALETTES)) {
    const kn = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (kn === key) return v;
  }
  return null;
}


// ══════════════════════════════════════════════════════════════════════════
// ROOT — single page, light theme
// ══════════════════════════════════════════════════════════════════════════
// ── Darken a hex color by blending toward black at `amount` (0–1) ──────────
function RouteMap({ route, color }) {
  if (!route || route.length < 2) return null;
  const W = 600, H = 900, PAD = 50;
  const lats = route.map(p => p[0]), lons = route.map(p => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat || 0.001;
  const lonSpan = maxLon - minLon || 0.001;
  const scaleX = (W - PAD*2) / lonSpan;
  const scaleY = (H - PAD*2) / latSpan;
  const sc = Math.min(scaleX, scaleY);
  const offX = (W - lonSpan * sc) / 2;
  const offY = (H - latSpan * sc) / 2;
  const toX = lon => offX + (lon - minLon) * sc;
  const toY = lat => H - offY - (lat - minLat) * sc;
  const d = route.map(([lat,lon],i) => `${i===0?'M':'L'}${toX(lon).toFixed(1)},${toY(lat).toFixed(1)}`).join(' ');
  return (
    React.createElement('svg', { style: {position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.45,pointerEvents:'none'},
      viewBox: `0 0 ${W} ${H}`, fill: "none", xmlns: "http://www.w3.org/2000/svg", __self: this, __source: {fileName: _jsxFileName, lineNumber: 708}}
      , React.createElement('path', { d: d, stroke: color, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 710}})
    )
  );
}

function PosterStage({ style, wEff, color, effectiveBg, bgColor, fmt, route, offset = 308 }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const compute = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const pad = offset === 0 ? 32 : 48;
      const fill = offset === 0 ? 0.93 : 0.7;
      const s = Math.min((width - pad) / fmt.w, (height - pad) / fmt.h) * fill;
      setScale(Math.max(0.1, s));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fmt]);

  return (
    React.createElement('div', { ref: containerRef, style: {
      position:"absolute", left:offset, top:0, right:offset, bottom:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      overflow:"hidden",
    }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 735}}
      , React.createElement('div', { style: { width:fmt.w, height:fmt.h, transform:`scale(${scale})`, transformOrigin:"center center", flexShrink:0, borderRadius:24, overflow:"hidden", position:"relative" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 740}}
        , React.createElement('div', { style: {position:"absolute",inset:0,background:bgColor}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 741}})
        , React.createElement('div', { style: { position:"absolute", left:0, right:0, top:(fmt.h-900)/2, height:900 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 742}}
          , React.createElement(Poster, { id: style, w: wEff, color: color, photo: effectiveBg, bgColor: bgColor, route: route, __self: this, __source: {fileName: _jsxFileName, lineNumber: 743}})
        )
      )
    )
  );
}

function darkenHex(hex, amount = 0.55) {
  const r = Math.round(parseInt(hex.slice(1,3),16) * (1 - amount));
  const g = Math.round(parseInt(hex.slice(3,5),16) * (1 - amount));
  const b = Math.round(parseInt(hex.slice(5,7),16) * (1 - amount));
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

// ── Parse URL params into a synthetic workout (deep-link support) ───────────
// Supports: ?city=London&distance=10&duration=3180&type=running&name=Morning+Run&date=2025-03-14
function parseUrlWorkout() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (!p.get("city") && !p.get("distance")) return null;
    return {
      id: 0, // sentinel for "came from URL"
      type:     p.get("type")     || "running",
      name:     p.get("name")     || "My Workout",
      city:     p.get("city")     || "Your City",
      date:     p.get("date")     || new Date().toISOString().slice(0,10),
      distance: parseFloat(p.get("distance") || 0),
      duration: parseInt(p.get("duration")   || 0),
      avgHR:    parseInt(p.get("hr")         || 0),
      maxHR:    0, avgPace: parseInt(p.get("pace") || 0),
      calories: parseInt(p.get("cal")        || 0),
      elevGain: parseInt(p.get("elev")       || 0),
      splits:   [],
    };
  } catch (e2) { return null; }
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "posterprefs_v1";
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e3) { return {}; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch (e4) {}
}


// ── Responsive helper ────────────────────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}


// ── Workout row helpers ───────────────────────────────────────────────────────
function fmtDist(km) {
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
}
function fmtDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month:"short", day:"numeric" });
}

function App() {
  // ── Bootstrap: URL params take priority, then localStorage, then defaults ──
  const urlWorkout = useMemo(() => parseUrlWorkout(), []);
  const prefs      = useMemo(() => loadPrefs(), []);

  // If a URL workout came in, prepend it to the list
  const [gpxWorkout, setGpxWorkout] = useState(null);
  const gpxFileRef = useRef(null);
  const [stravaActs, setStravaActs] = useState([]);
  const WORKOUTS_EFF = useMemo(() =>
    [gpxWorkout, urlWorkout].filter(Boolean).concat(stravaActs.length ? stravaActs : WORKOUTS)
  , [gpxWorkout, urlWorkout, stravaActs]);
  const [idx,setIdx]               = useState(() => _nullishCoalesce(prefs.idx, () => ( 0)));
  const [comboIdx,setComboIdx]     = useState(() => _nullishCoalesce(prefs.comboIdx, () => ( 0)));
  const [workoutIdx,setWorkoutIdx] = useState(() => urlWorkout ? 0 : (_nullishCoalesce(prefs.workoutIdx, () => ( 0))));
  const { text: color, bg: bgColor } = _nullishCoalesce(COLOR_COMBOS[comboIdx], () => ( COLOR_COMBOS[0]));
  const [customCity,setCustomCity] = useState(() => _nullishCoalesce(prefs.customCity, () => ( "")));
  const [dropOpen,setDropOpen]     = useState(false);
  const [downloading,setDl]        = useState(false);
  const exportRef = useRef(null);
  const fileRef   = useRef(null); // kept for optional user photo upload in modal
  const [bgPresetIdx, setBgPresetIdx] = useState(1);
  const [customBg, setCustomBg]       = useState(null);
  const [formatIdx, setFormatIdx]     = useState(() => _nullishCoalesce(prefs.formatIdx, () => ( 0)));
  const { w: winW }          = useWindowSize();
  const isMobile             = winW < 1024;
  const [mobileTab, setMobileTab] = useState("activity");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [toast, setToast]                 = useState(null); // { msg, icon }

  const fmt = FORMATS[formatIdx];
  const [stravaToken, setStravaToken] = useState(() => {
    const t = localStorage.getItem("strava_token");
    const exp = localStorage.getItem("strava_token_expiry");
    if (!t || !exp) return null;
    if (Date.now() / 1000 > Number(exp)) { localStorage.removeItem("strava_token"); return null; }
    return t;
  });
  const [stravaLoading, setStravaLoading] = useState(false);
  // true when user has connected a real data source (not just demo workouts)
  const hasRealData = !!(stravaToken || gpxWorkout || urlWorkout);

  const w     = _nullishCoalesce(WORKOUTS_EFF[workoutIdx], () => ( WORKOUTS_EFF[0]));
  const style = STYLES[idx].id;

  // Persist prefs
  useEffect(() => {
    savePrefs({ idx, comboIdx, workoutIdx: urlWorkout ? 0 : workoutIdx, customCity, formatIdx });
  }, [idx, comboIdx, workoutIdx, customCity, formatIdx, urlWorkout]);

  const activeCity = customCity.trim() || w.city;
  const wEff = useMemo(() => ({ ...w, city: activeCity }), [w, activeCity]);

  // Reset customCity when workout changes
  useEffect(() => { setCustomCity(""); }, [workoutIdx]);

  // Strava: handle OAuth callback (?code= in URL after redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    window.history.replaceState({}, "", window.location.pathname);
    setStravaLoading(true);
    fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, code, grant_type: "authorization_code" }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.access_token) {
        localStorage.setItem("strava_token", data.access_token);
        localStorage.setItem("strava_token_expiry", data.expires_at);
        localStorage.setItem("strava_refresh_token", data.refresh_token);
        setStravaToken(data.access_token);
      } else { setStravaLoading(false); }
    })
    .catch(() => setStravaLoading(false));
  }, []);

  // Strava: silent token refresh on return visits (access token expired but refresh token exists)
  useEffect(() => {
    if (stravaToken) return;
    const refreshToken = localStorage.getItem("strava_refresh_token");
    if (!refreshToken) return;
    setStravaLoading(true);
    fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, refresh_token: refreshToken, grant_type: "refresh_token" }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.access_token) {
        localStorage.setItem("strava_token", data.access_token);
        localStorage.setItem("strava_token_expiry", data.expires_at);
        localStorage.setItem("strava_refresh_token", data.refresh_token);
        setStravaToken(data.access_token);
      } else {
        localStorage.removeItem("strava_refresh_token");
        setStravaLoading(false);
      }
    })
    .catch(() => setStravaLoading(false));
  }, []);

  // Strava: fetch recent activities when token is available
  useEffect(() => {
    if (!stravaToken) return;
    setStravaLoading(true);
    fetch("https://www.strava.com/api/v3/athlete/activities?per_page=25", {
      headers: { Authorization: `Bearer ${stravaToken}` },
    })
    .then(r => {
      if (r.status === 401) { localStorage.removeItem("strava_token"); setStravaToken(null); throw new Error("Unauthorized"); }
      return r.json();
    })
    .then(acts => {
      if (Array.isArray(acts)) {
        setStravaActs(acts.map(stravaToWorkout));
        setWorkoutIdx(0); // auto-select most recent
        setToast({ icon:"✓", msg:`Strava connected — ${acts.length} activities loaded` });
        setTimeout(() => setToast(null), 3500);
      }
      setStravaLoading(false);
    })
    .catch(() => setStravaLoading(false));
  }, [stravaToken]);

  // Strava: lazy-load GPS route when a Strava activity is selected
  useEffect(() => {
    const sel = WORKOUTS_EFF[workoutIdx];
    if (!_optionalChain([sel, 'optionalAccess', _21 => _21.stravaId]) || sel.route || !stravaToken) return;
    fetch(`https://www.strava.com/api/v3/activities/${sel.stravaId}/streams?keys=latlng&key_by_type=true`, {
      headers: { Authorization: `Bearer ${stravaToken}` },
    })
    .then(r => r.json())
    .then(data => {
      const pts = _optionalChain([data, 'access', _22 => _22.latlng, 'optionalAccess', _23 => _23.data]);
      if (!_optionalChain([pts, 'optionalAccess', _24 => _24.length])) return;
      const step = Math.max(1, Math.floor(pts.length / 600));
      const route = pts.filter((_, i) => i % step === 0);
      setStravaActs(prev => prev.map(a => a.stravaId === sel.stravaId ? { ...a, route } : a));
    })
    .catch(() => {});
  }, [workoutIdx, stravaToken]);

  const share = useCallback(async () => {
    if (!exportRef.current) return;
    setDl(true);
    try {
      if (!window.html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      const canvas = await window.html2canvas(exportRef.current, {
        scale: 3, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
      });

      const filename = `${wEff.name.replace(/\s+/g,"-").toLowerCase()}_${style}.png`;

      // Try Web Share API first (mobile → triggers iOS/Android share sheet → Instagram Stories)
      if (navigator.canShare) {
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${wEff.name} — ${wEff.city}`,
          });
          return; // done — share sheet handled it
        }
      }

      // Fallback: direct download (desktop / unsupported browsers)
      const a = document.createElement("a");
      a.download = filename;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch(e) {
      if (_optionalChain([e, 'optionalAccess', _25 => _25.name]) !== "AbortError") alert("Export failed."); // AbortError = user cancelled share sheet
    } finally {
      setDl(false);
    }
  }, [style, wEff]);

  const BG_PRESETS = [null]; // null = blank/solid color
  const effectiveBg = customBg || BG_PRESETS[bgPresetIdx];


  // ── MOBILE LAYOUT (< 1024px) ────────────────────────────────────────────
  if (isMobile) return (
    React.createElement('div', { style: { width:"100vw", height:"100vh", display:"flex", flexDirection:"column", background:"#0a0a0a", overflow:"hidden", position:"relative" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1007}}
      , React.createElement('div', { className: "noise", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1008}})

      /* Hidden export target */
      , React.createElement('div', { ref: exportRef, style: { position:"fixed", top:-9999, left:-9999, width:fmt.w, height:fmt.h, overflow:"hidden", pointerEvents:"none", background:bgColor }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1011}}
        , React.createElement('div', { style: { position:"absolute", left:0, right:0, top:(fmt.h-900)/2, height:900 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1012}}
          , React.createElement(Poster, { id: style, w: wEff, color: color, photo: effectiveBg, bgColor: bgColor, route: wEff.route||null, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1013}})
        )
      )

      /* ── Toast ── */
      , toast && (
        React.createElement('div', { style: { position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:500, background:"rgba(30,30,30,0.97)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:500, color:"#fff", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", whiteSpace:"nowrap" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1019}}
          , React.createElement('span', { style: { color:"#4ADE80", fontSize:15 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1020}}, toast.icon)
          , toast.msg
        )
      )

      /* ── Top bar — workout dropdown ── */
      , React.createElement('div', { style: { flexShrink:0, padding:"10px 14px", position:"relative", zIndex:200 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1026}}
        , React.createElement('button', { className: "tb-btn", style: { width:"100%", justifyContent:"space-between", padding:"0 14px" },
          onClick: () => setDropOpen(o => !o), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1027}}
          , React.createElement('div', { style: { display:"flex", flexDirection:"column", alignItems:"flex-start", overflow:"hidden", gap:1 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1029}}
            , React.createElement('span', { style: { fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1030}}, w.name)
            , (w.distance > 0 || w.date) && (
              React.createElement('span', { style: { fontSize:11, color:"rgba(255,255,255,0.42)", fontWeight:400 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1032}}
                , [w.distance > 0 && fmtDist(w.distance), w.date && fmtDateShort(w.date)].filter(Boolean).join(" · ")
              )
            )
          )
          , React.createElement('svg', { width: "12", height: "12", viewBox: "0 0 12 12"   , fill: "none", style: { flexShrink:0, opacity:0.5, transform:dropOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1037}}
            , React.createElement('path', { d: "M3 4.5L6 7.5L9 4.5"   , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1038}})
          )
        )
        , dropOpen && (
          React.createElement('div', { style: { position:"absolute", top:"calc(100% + 4px)", left:14, right:14, background:"rgba(14,10,10,0.98)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:14, overflow:"hidden", zIndex:300, boxShadow:"0 16px 48px rgba(0,0,0,0.7)", maxHeight:300, overflowY:"auto" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1042}}
            , WORKOUTS_EFF.map((wo, i) => (
              React.createElement('div', { key: wo.id, onClick: () => { setWorkoutIdx(i); setDropOpen(false); },
                style: { padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:i===workoutIdx?"rgba(255,255,255,0.08)":"transparent", borderBottom:i<WORKOUTS_EFF.length-1?"1px solid rgba(255,255,255,0.06)":"none" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1044}}
                , React.createElement('div', { style: { display:"flex", flexDirection:"column", gap:2, overflow:"hidden" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1046}}
                  , React.createElement('span', { style: { fontSize:13, fontWeight:i===workoutIdx?600:400, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1047}}, wo.name)
                  , (wo.distance > 0 || wo.date) && (
                    React.createElement('span', { style: { fontSize:11, color:"rgba(255,255,255,0.4)" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1049}}
                      , [wo.distance > 0 && fmtDist(wo.distance), wo.date && fmtDateShort(wo.date)].filter(Boolean).join(" · ")
                    )
                  )
                )
                , i===workoutIdx && React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 14 14"   , fill: "none", style: {flexShrink:0,marginLeft:8}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1054}}, React.createElement('path', { d: "M2.5 7L5.5 10L11.5 4"   , stroke: "white", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1054}}))
              )
            ))
          )
        )
      )

      /* ── Poster — fills remaining space ── */
      , React.createElement('div', { style: { flex:"1 1 0", minHeight:0, position:"relative" },
        onTouchStart: e => { e._touchStartX = e.touches[0].clientX; },
        onTouchEnd: e => {
          const dx = e.changedTouches[0].clientX - (_nullishCoalesce(e._touchStartX, () => ( e.changedTouches[0].clientX)));
          if (Math.abs(dx) > 50) setIdx(i => (i + (dx < 0 ? 1 : -1) + STYLES.length) % STYLES.length);
        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1062}}
        , React.createElement(PosterStage, { style: style, wEff: wEff, color: color, effectiveBg: effectiveBg, bgColor: bgColor, fmt: fmt, route: wEff.route||null, offset: 0, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1068}})
        /* Swipe hint dots */
        , React.createElement('div', { style: { position:"absolute", bottom:10, left:0, right:0, display:"flex", justifyContent:"center", gap:5, pointerEvents:"none" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1070}}
          , STYLES.map((_,i) => (
            React.createElement('div', { key: i, style: { width:i===idx?14:5, height:5, borderRadius:3, background:i===idx?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.2)", transition:"all 0.2s" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1072}})
          ))
        )
      )

      /* ── Bottom bar ── */
      , React.createElement('div', { style: { flexShrink:0, background:"rgba(8,8,8,0.97)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.08)", padding:"12px 14px 20px" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1078}}

        , !hasRealData ? (
          /* ── State A: no real data — prompt to connect ── */
          React.createElement(React.Fragment, null
            , React.createElement('button', { onClick: () => {
              window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=${STRAVA_SCOPE}`;
            }, style: { width:"100%", height:50, background:"#FC4C02", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:9, marginBottom:10, fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.01em" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1083}}
              , React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 24 24"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1086}}
                , React.createElement('path', { d: "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"     , fill: "white", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1087}})
              ), "Connect Strava"

            )
            , React.createElement('div', { style: { display:"flex", gap:8 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1091}}
              , React.createElement('button', { className: "tb-btn", style: { flex:1 }, onClick: () => _optionalChain([gpxFileRef, 'access', _26 => _26.current, 'optionalAccess', _27 => _27.click, 'call', _28 => _28()]), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1092}}
                , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 20 20"   , fill: "none", style: {opacity:0.6}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1093}}
                  , React.createElement('path', { d: "M10 2v10M6 5l4-3 4 3"    , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1094}})
                  , React.createElement('path', { d: "M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3"        , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1095}})
                )
                , React.createElement('span', { style: {fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1097}}, "Import GPX" )
              )
              , React.createElement('button', { className: "tb-btn", style: { flex:1 }, onClick: () => setCustomizeOpen(true), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1099}}
                , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 14 14"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1100}}
                  , React.createElement('circle', { cx: "7", cy: "7", r: "2.5", stroke: "white", strokeWidth: "1.4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1101}})
                  , React.createElement('path', { d: "M7 1v2M7 11v2M1 7h2M11 7h2"    , stroke: "white", strokeWidth: "1.4", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1102}})
                  , React.createElement('path', { d: "M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41"      , stroke: "white", strokeWidth: "1.2", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1103}})
                )
                , React.createElement('span', { style: {fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1105}}, "Customize")
              )
            )
          )
        ) : (
          /* ── State B: data connected — normal controls ── */
          React.createElement('div', { style: { display:"flex", gap:8 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1111}}
            , React.createElement('button', { className: "tb-btn", style: { padding:"0 18px", gap:6, flexShrink:0 }, onClick: () => setCustomizeOpen(true), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1112}}
              , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 14 14"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1113}}
                , React.createElement('circle', { cx: "7", cy: "7", r: "2.5", stroke: "white", strokeWidth: "1.4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1114}})
                , React.createElement('path', { d: "M7 1v2M7 11v2M1 7h2M11 7h2"    , stroke: "white", strokeWidth: "1.4", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1115}})
                , React.createElement('path', { d: "M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41"      , stroke: "white", strokeWidth: "1.2", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1116}})
              )
              , React.createElement('span', { style: { fontSize:13, fontWeight:500 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1118}}, "Customize")
            )
            , React.createElement('button', { onClick: share, disabled: downloading, className: "dl-btn", style: { flex:1 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1120}}
              , downloading
                ? React.createElement(React.Fragment, null, React.createElement('span', { style: {display:"inline-block",width:14,height:14,border:"2.5px solid rgba(0,0,0,0.2)",borderTopColor:"#111",borderRadius:"50%",animation:"spin 0.6s linear infinite"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1122}}), "Exporting…")
                : navigator.canShare
                  ? React.createElement(React.Fragment, null, React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 18 18"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1124}}, React.createElement('path', { d: "M9 1v10M5 4l4-3 4 3"    , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1124}}), React.createElement('path', { d: "M3 10v5a1 1 0 001 1h10a1 1 0 001-1v-5"        , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1124}})), "Share to Instagram"  )
                  : React.createElement(React.Fragment, null, React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 18 18"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1125}}, React.createElement('path', { d: "M9 2v10M5 8l4 4 4-4"    , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1125}}), React.createElement('path', { d: "M3 14h12" , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1125}})), "Download PNG" )
              
            )
          )
        )
      )

      /* ── Customize modal ── */
      , customizeOpen && (
        React.createElement('div', { style: { position:"fixed", inset:0, zIndex:400, display:"flex", flexDirection:"column", justifyContent:"flex-end" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1134}}
          , React.createElement('div', { onClick: () => setCustomizeOpen(false), style: { position:"absolute", inset:0, background:"rgba(0,0,0,0.65)" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1135}})
          , React.createElement('div', { style: { position:"relative", background:"#111", borderRadius:"20px 20px 0 0", maxHeight:"82vh", display:"flex", flexDirection:"column", boxShadow:"0 -20px 60px rgba(0,0,0,0.8)" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1136}}

            /* Handle + header */
            , React.createElement('div', { style: { padding:"12px 20px 0", flexShrink:0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1139}}
              , React.createElement('div', { style: { width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.18)", margin:"0 auto 16px" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1140}})
              , React.createElement('div', { style: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1141}}
                , React.createElement('span', { style: { fontSize:12, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.32)", textTransform:"uppercase" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1142}}, "Customize")
                , React.createElement('button', { onClick: () => setCustomizeOpen(false), style: { background:"rgba(255,255,255,0.08)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:14 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1143}}, "✕")
              )
            )

            /* Scrollable content — most-used controls first */
            , React.createElement('div', { className: "mobile-tab-content", style: { overflowY:"auto", padding:"0 20px 32px", WebkitOverflowScrolling:"touch" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1148}}

              /* Style */
              , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1151}}, "Poster Style" )
              , React.createElement('div', { style: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1152}}
                , STYLES.map((s,i) => (
                  React.createElement('button', { key: s.id, onClick: () => setIdx(i), style: { padding:"6px 13px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:i===idx?600:400, border:i===idx?"1px solid rgba(255,255,255,0.5)":"1px solid rgba(255,255,255,0.12)", background:i===idx?"rgba(255,255,255,0.12)":"transparent", color:"#fff", transition:"all 0.15s" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1154}}, s.name)
                ))
              )

              /* Colors */
              , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1159}}, "Color Scheme" )
              , React.createElement('div', { style: { display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1160}}
                , COLOR_COMBOS.map((c,i) => (
                  React.createElement('div', { key: i, title: c.name, onClick: () => setComboIdx(i), style: { width:52, height:36, borderRadius:8, overflow:"hidden", cursor:"pointer", flexShrink:0, border:i===comboIdx?"2px solid #fff":"1px solid rgba(255,255,255,0.15)", transition:"border-color 0.15s, transform 0.12s", transform:i===comboIdx?"scale(1.08)":"scale(1)" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1162}}
                    , React.createElement('div', { style: { height:"55%", background:c.bg }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1163}})
                    , React.createElement('div', { style: { height:"45%", background:c.text }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1164}})
                  )
                ))
              )

              /* City */
              , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1170}}, "City / Title"  )
              , React.createElement('input', { className: "panel-input", placeholder: w.city, value: customCity, onChange: e => setCustomCity(e.target.value), style: { marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1171}})

              , React.createElement('div', { className: "panel-divider", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1173}})

              /* Data source */
              , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1176}}, "Activity Source" )
              , React.createElement('div', { className: "upload-row", onClick: () => {
                if (stravaToken) { localStorage.removeItem("strava_token"); localStorage.removeItem("strava_token_expiry"); localStorage.removeItem("strava_refresh_token"); setStravaToken(null); setStravaActs([]); }
                else { window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=${STRAVA_SCOPE}`; }
              }, style: { marginBottom:10 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1177}}
                , React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24"   , fill: "none", style: {flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1181}}
                  , React.createElement('path', { d: "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"     , fill: stravaToken?"#FC4C02":"rgba(255,255,255,0.45)", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1182}})
                )
                , React.createElement('span', { style: {color:stravaToken?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.55)",fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1184}}
                  , stravaLoading?"Loading…":stravaToken?`Strava connected (${stravaActs.length} activities)`:"Connect Strava"
                )
                , stravaToken && React.createElement('div', { style: {marginLeft:"auto",width:16,height:16,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1187}}, "✕")
              )
              , React.createElement('div', { className: "upload-row", onClick: () => _optionalChain([gpxFileRef, 'access', _29 => _29.current, 'optionalAccess', _30 => _30.click, 'call', _31 => _31()]), style: { marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1189}}
                , React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 20 20"   , fill: "none", style: {opacity:0.45,flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1190}}
                  , React.createElement('path', { d: "M10 2v10M6 5l4-3 4 3"    , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1191}})
                  , React.createElement('path', { d: "M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3"        , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1192}})
                )
                , React.createElement('span', { style: {color:gpxWorkout?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.55)",fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1194}}
                  , gpxWorkout?gpxWorkout.name:"Import GPX file"
                )
                , gpxWorkout && React.createElement('div', { onClick: e=>{e.stopPropagation();setGpxWorkout(null);setWorkoutIdx(0);}, style: {marginLeft:"auto",width:16,height:16,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1197}}, "✕")
              )

              , React.createElement('div', { className: "panel-divider", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1200}})

              /* Format */
              , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1203}}, "Format")
              , React.createElement('div', { style: { display:"flex", gap:8, marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1204}}
                , FORMATS.map((f,i) => (
                  React.createElement('button', { key: f.id, onClick: () => setFormatIdx(i), style: { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 12px", borderRadius:8, cursor:"pointer", border:i===formatIdx?"1px solid rgba(255,255,255,0.5)":"1px solid rgba(255,255,255,0.12)", background:i===formatIdx?"rgba(255,255,255,0.10)":"transparent", color:"#fff", fontFamily:"'DM Sans',sans-serif" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1206}}
                    , React.createElement('div', { style: { width:f.id==="square"?22:f.id==="stories"?14:18, height:f.id==="square"?22:f.id==="stories"?24:26, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:2 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1207}})
                    , React.createElement('span', { style: {fontSize:10,opacity:0.7}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1208}}, f.label)
                  )
                ))
              )

              /* Background */
              , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1214}}, "Background Image" )
              , React.createElement('div', { style: { display:"flex", gap:8, alignItems:"center", marginBottom:12 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1215}}
                , React.createElement('button', { type: "button", onClick: () => { setBgPresetIdx(0); setCustomBg(null); }, style: { borderRadius:8, padding:0, border:bgPresetIdx===0&&!customBg?"2px solid #fff":"1px solid rgba(255,255,255,0.12)", overflow:"hidden", width:52, height:52, background:bgColor, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1216}}
                  , React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 18 18"   , fill: "none", opacity: "0.4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1217}}, React.createElement('line', { x1: "2", y1: "2", x2: "16", y2: "16", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1217}}), React.createElement('line', { x1: "16", y1: "2", x2: "2", y2: "16", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1217}}))
                )
                , customBg && (
                  React.createElement('button', { type: "button", style: { borderRadius:8, padding:0, border:"2px solid #fff", overflow:"hidden", width:52, height:52, background:"#222", cursor:"default", position:"relative", flexShrink:0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1220}}
                    , React.createElement('img', { src: customBg, alt: "uploaded", style: { width:"100%", height:"100%", objectFit:"cover" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1221}})
                    , React.createElement('div', { onClick: e => { e.stopPropagation(); setCustomBg(null); }, style: { position:"absolute", top:2, right:2, width:16, height:16, borderRadius:"50%", background:"rgba(0,0,0,0.7)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1222}}, "✕")
                  )
                )
                , React.createElement('div', { className: "upload-row", onClick: () => _optionalChain([fileRef, 'access', _32 => _32.current, 'optionalAccess', _33 => _33.click, 'call', _34 => _34()]), style: { flex:1, marginBottom:0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1225}}
                  , React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 20 20"   , fill: "none", style: {opacity:0.45,flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1226}}
                    , React.createElement('rect', { x: "1", y: "4", width: "18", height: "13", rx: "2", stroke: "white", strokeWidth: "1.5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1227}})
                    , React.createElement('circle', { cx: "7", cy: "10", r: "2", stroke: "white", strokeWidth: "1.5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1228}})
                    , React.createElement('path', { d: "M1 14l4-3 3 3 3-4 5 6"      , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1229}})
                  )
                  , React.createElement('span', { style: {color:"rgba(255,255,255,0.55)",fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1231}}, "Upload a photo"  )
                )
              )

            )
          )
        )
      )

      , dropOpen && React.createElement('div', { onClick: () => setDropOpen(false), style: { position:"fixed", inset:0, zIndex:250 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1240}})
    )
  );

  return (
    React.createElement('div', { style: { width:"100vw", height:"100vh", background:"#000000", overflow:"hidden", position:"relative" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1245}}
      , React.createElement('div', { className: "noise", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1246}})

      /* Hidden export target */
      , React.createElement('div', { ref: exportRef, style: { position:"fixed", top:-9999, left:-9999, width:fmt.w, height:fmt.h, overflow:"hidden", pointerEvents:"none", background:bgColor }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1249}}
        , React.createElement('div', { style: { position:"absolute", left:0, right:0, top:(fmt.h-900)/2, height:900 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1250}}
          , React.createElement(Poster, { id: style, w: wEff, color: color, photo: effectiveBg, bgColor: bgColor, route: wEff.route||null, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1251}})
        )
      )

      /* ── LEFT PANEL: Activities ── */
      , React.createElement('div', { className: "panel panel-left" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 1256}}

        /* Logo */
        , React.createElement('div', { style: { fontSize:11, fontWeight:700, letterSpacing:"0.14em", color:"rgba(255,255,255,0.28)", textTransform:"uppercase", marginBottom:22 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1259}}, "Workout Poster"

        )

        /* ── Strava Connect ── */
        , React.createElement('div', { className: "upload-row", onClick: () => {
          if (stravaToken) {
            localStorage.removeItem("strava_token");
            localStorage.removeItem("strava_token_expiry");
            localStorage.removeItem("strava_refresh_token");
            setStravaToken(null); setStravaActs([]);
          } else {
            window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=${STRAVA_SCOPE}`;
          }
        }, style: { marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1264}}
          , React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24"   , fill: "none", style: {flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1274}}
            , React.createElement('path', { d: "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"     ,
              fill: stravaToken ? "#FC4C02" : "rgba(255,255,255,0.45)", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1275}})
          )
          , React.createElement('span', { style: {color: stravaToken ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)", fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1278}}
            , stravaLoading ? "Loading…" : stravaToken ? `Strava (${stravaActs.length} activities)` : "Connect Strava"
          )
          , stravaToken && (
            React.createElement('div', { style: { marginLeft:"auto",width:16,height:16,borderRadius:"50%",background:"rgba(255,255,255,0.15)",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1282}}, "✕")
          )
        )

        /* ── GPX Upload ── */
        , React.createElement('input', { ref: gpxFileRef, type: "file", accept: ".gpx", style: {display:"none"}, onChange: async e=>{
          const f=e.target.files[0]; if(!f) return;
          const text=await f.text();
          const workout=parseGPX(text,f.name);
          if(workout){ setGpxWorkout(workout); setWorkoutIdx(0); }
          e.target.value='';
        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1288}})
        , React.createElement('div', { className: "upload-row", onClick: ()=>_optionalChain([gpxFileRef, 'access', _35 => _35.current, 'optionalAccess', _36 => _36.click, 'call', _37 => _37()]), style: { marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1295}}
          , React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 20 20"   , fill: "none", style: {opacity:0.45,flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1296}}
            , React.createElement('path', { d: "M10 2v10M6 5l4-3 4 3"    , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1297}})
            , React.createElement('path', { d: "M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3"        , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1298}})
          )
          , React.createElement('span', { style: {color:gpxWorkout?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.55)",fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1300}}
            , gpxWorkout ? gpxWorkout.name : "Import GPX file"
          )
          , gpxWorkout && (
            React.createElement('div', { onClick: e=>{e.stopPropagation();setGpxWorkout(null);setWorkoutIdx(0);}, style: {
              marginLeft:"auto",width:16,height:16,borderRadius:"50%",
              background:"rgba(255,255,255,0.15)",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0,
            }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1304}}, "✕")
          )
        )

        /* ── Activity ── */
        , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1313}}, "Activity")
        , React.createElement('div', { style: { position:"relative", marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1314}}
          , React.createElement('button', { className: "tb-btn", style: { width:"100%", justifyContent:"space-between", padding:"0 12px" },
            onClick: () => setDropOpen(o => !o), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1315}}
            , React.createElement('span', { style: { fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", fontSize:13 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1317}}, w.name)
            , React.createElement('svg', { width: "12", height: "12", viewBox: "0 0 12 12"   , fill: "none", style: { flexShrink:0, opacity:0.5, transform:dropOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1318}}
              , React.createElement('path', { d: "M3 4.5L6 7.5L9 4.5"   , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1319}})
            )
          )
          , dropOpen && (
            React.createElement('div', { style: {
              position:"absolute", top:"calc(100% + 8px)", left:0, right:0,
              background:"rgba(14,10,10,0.98)", backdropFilter:"blur(24px)",
              border:"1px solid rgba(255,255,255,0.10)", borderRadius:14,
              overflow:"hidden", zIndex:200,
              boxShadow:"0 16px 48px rgba(0,0,0,0.7)",
            }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1323}}
              , WORKOUTS_EFF.map((wo, i) => (
                React.createElement('div', { key: wo.id,
                  onClick: () => { setWorkoutIdx(i); setDropOpen(false); },
                  style: {
                    padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between",
                    cursor:"pointer",
                    background: i===workoutIdx ? "rgba(255,255,255,0.08)" : "transparent",
                    borderBottom: i<WORKOUTS_EFF.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    fontSize:13, fontWeight: i===workoutIdx ? 600 : 400, color:"#fff",
                  },
                  onMouseOver: e=>e.currentTarget.style.background="rgba(255,255,255,0.11)",
                  onMouseOut: e=>e.currentTarget.style.background=i===workoutIdx?"rgba(255,255,255,0.08)":"transparent", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1331}}

                  , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 1343}}, wo.name)
                  , i===workoutIdx && (
                    React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 14 14"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1345}}
                      , React.createElement('path', { d: "M2.5 7L5.5 10L11.5 4"   , stroke: "white", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1346}})
                    )
                  )
                )
              ))
            )
          )
        )

      )/* end left panel */

      /* ── RIGHT PANEL: Customization ── */
      , React.createElement('div', { className: "panel", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1358}}

        /* ── Poster Style ── */
        , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1361}}, "Poster Style" )
        , React.createElement('div', { style: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1362}}
          , STYLES.map((s, i) => (
            React.createElement('button', { key: s.id, onClick: () => setIdx(i), style: {
              padding:"5px 11px", borderRadius:8, fontSize:12, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight: i===idx ? 600 : 400,
              border: i===idx ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
              background: i===idx ? "rgba(255,255,255,0.12)" : "transparent",
              color:"#fff", transition:"all 0.15s",
            }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1364}}, s.name)
          ))
        )

        , React.createElement('div', { className: "panel-divider", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1374}})

        /* ── City ── */
        , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1377}}, "City / Title"  )
        , React.createElement('input', {
          className: "panel-input",
          placeholder: w.city,
          value: customCity,
          onChange: e => setCustomCity(e.target.value),
          style: { marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1378}}
        )

        , React.createElement('div', { className: "panel-divider", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1386}})

        /* ── Color Scheme ── */
        , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1389}}, "Color Scheme" )
        , React.createElement('div', { style: { display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1390}}
          , COLOR_COMBOS.map((c, i) => (
            React.createElement('div', {
              key: i,
              title: c.name,
              onClick: () => setComboIdx(i),
              style: {
                width:44, height:32, borderRadius:8, overflow:"hidden", cursor:"pointer", flexShrink:0,
                border: i===comboIdx ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                transition:"border-color 0.15s, transform 0.12s",
                transform: i===comboIdx ? "scale(1.08)" : "scale(1)",
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1392}}

              , React.createElement('div', { style: { height:"55%", background:c.bg }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1403}})
              , React.createElement('div', { style: { height:"45%", background:c.text }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1404}})
            )
          ))
        )

        , React.createElement('div', { className: "panel-divider", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1409}})

        /* ── Background Image ── */
        , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1412}}, "Background Image" )
        , React.createElement('div', { style: { display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1413}}
          /* Blank option */
          , React.createElement('button', {
            type: "button",
            onClick: () => { setBgPresetIdx(0); setCustomBg(null); },
            style: {
              borderRadius:8, padding:0,
              border: bgPresetIdx===0 && !customBg ? "2px solid #fff" : "1px solid rgba(255,255,255,0.12)",
              overflow:"hidden", width:52, height:52,
              background:bgColor, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1415}}

            , React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 18 18"   , fill: "none", opacity: "0.4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1426}}
              , React.createElement('line', { x1: "2", y1: "2", x2: "16", y2: "16", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1427}})
              , React.createElement('line', { x1: "16", y1: "2", x2: "2", y2: "16", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1428}})
            )
          )
          /* Uploaded photo */
          , customBg && (
            React.createElement('button', {
              type: "button",
              onClick: () => {},
              style: {
                borderRadius:8, padding:0,
                border: "2px solid #fff",
                overflow:"hidden", width:52, height:52,
                background:"#222", cursor:"default", position:"relative",
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1433}}

              , React.createElement('img', { src: customBg, alt: "uploaded", style: { width:"100%", height:"100%", objectFit:"cover" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1443}})
              , React.createElement('div', {
                onClick: e => { e.stopPropagation(); setCustomBg(null); },
                style: {
                  position:"absolute", top:2, right:2,
                  width:16, height:16, borderRadius:"50%",
                  background:"rgba(0,0,0,0.7)", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:9, color:"#fff", lineHeight:1,
                }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1444}}
, "✕")
            )
          )
        )

        /* ── Upload photo ── */
        , React.createElement('input', { ref: fileRef, type: "file", accept: "image/*", style: {display:"none"}, onChange: e=>{
          const f=e.target.files[0]; if(!f||!f.type.startsWith("image/")) return;
          const reader = new FileReader();
          reader.onload = ev => { setCustomBg(ev.target.result); };
          reader.readAsDataURL(f);
        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1459}})
        , React.createElement('div', { className: "upload-row", onClick: ()=>_optionalChain([fileRef, 'access', _38 => _38.current, 'optionalAccess', _39 => _39.click, 'call', _40 => _40()]), style: { marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1465}}
          , React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 20 20"   , fill: "none", style: {opacity:0.45,flexShrink:0}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1466}}
            , React.createElement('rect', { x: "1", y: "4", width: "18", height: "13", rx: "2", stroke: "white", strokeWidth: "1.5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1467}})
            , React.createElement('circle', { cx: "7", cy: "10", r: "2", stroke: "white", strokeWidth: "1.5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1468}})
            , React.createElement('path', { d: "M1 14l4-3 3 3 3-4 5 6"      , stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1469}})
          )
          , React.createElement('span', { style: {color:"rgba(255,255,255,0.55)",fontSize:13}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1471}}, "Upload a photo"  )
        )

        /* Spacer pushes download to bottom */
        , React.createElement('div', { style: { flex:1 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1475}})

        /* ── Format ── */
        , React.createElement('div', { className: "panel-label", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1478}}, "Format")
        , React.createElement('div', { style: { display:"flex", gap:8, marginBottom:20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1479}}
          , FORMATS.map((f, i) => (
            React.createElement('button', { key: f.id, onClick: () => setFormatIdx(i), style: {
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              padding:"8px 10px", borderRadius:8, cursor:"pointer",
              border: i===formatIdx ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
              background: i===formatIdx ? "rgba(255,255,255,0.10)" : "transparent",
              color:"#fff", fontFamily:"'DM Sans',sans-serif",
            }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1481}}
              , React.createElement('div', { style: {
                width: f.id==='square' ? 22 : f.id==='stories' ? 14 : 18,
                height: f.id==='square' ? 22 : f.id==='stories' ? 24 : 26,
                background:"rgba(255,255,255,0.15)",
                border:"1px solid rgba(255,255,255,0.3)", borderRadius:2,
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1488}})
              , React.createElement('span', { style: {fontSize:10, opacity:0.7}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1494}}, f.label)
            )
          ))
        )

        /* ── Download / Share ── */
        , React.createElement('button', { onClick: share, disabled: downloading, className: "dl-btn", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1500}}
          , downloading
            ? React.createElement(React.Fragment, null, React.createElement('span', { style: {display:"inline-block",width:14,height:14,border:"2.5px solid rgba(0,0,0,0.2)",borderTopColor:"#111",borderRadius:"50%",animation:"spin 0.6s linear infinite"}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1502}}), "Exporting…")
            : navigator.canShare
              ? React.createElement(React.Fragment, null
                  , React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 18 18"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1505}}
                    , React.createElement('path', { d: "M9 1v10M5 4l4-3 4 3"    , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1506}})
                    , React.createElement('path', { d: "M3 10v5a1 1 0 001 1h10a1 1 0 001-1v-5"        , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1507}})
                  ), "Share to Instagram"

                )
              : React.createElement(React.Fragment, null
                  , React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 18 18"   , fill: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1512}}
                    , React.createElement('path', { d: "M9 2v10M5 8l4 4 4-4"    , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1513}})
                    , React.createElement('path', { d: "M3 14h12" , stroke: "#111", strokeWidth: "1.8", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1514}})
                  ), "Download PNG"

                )
          
        )
      )

      /* ── CAROUSEL (fills remaining space beside panel) ── */
      , React.createElement(PosterStage, { style: style, wEff: wEff, color: color, effectiveBg: effectiveBg, bgColor: bgColor, fmt: fmt, route: wEff.route||null, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1523}})

      /* Tap-outside overlay for dropdown */
      , dropOpen && React.createElement('div', { onClick: ()=>setDropOpen(false), style: {position:"fixed",inset:0,zIndex:150}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1526}})
    )
  );
}

// Mount in plain HTML page (garmin-v19.html)
window.App = App;
const mountNode = document.getElementById("root");
if (mountNode && window.ReactDOM && window.React) {
  const root = window.ReactDOM.createRoot(mountNode);
  root.render(window.React.createElement(App));
}

