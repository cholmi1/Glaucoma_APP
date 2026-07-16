import React, { useState, useMemo } from "react";
import {
  LineChart, Line, ScatterChart, Scatter, ComposedChart, Area, Bar, Cell, XAxis, YAxis, ZAxis, ResponsiveContainer,
  ReferenceArea, ReferenceLine, Tooltip, CartesianGrid,
} from "recharts";
import {
  Eye, Droplets, Droplet, ClipboardList, Activity, Home, Watch, Bluetooth, Check, ChevronRight,
  ChevronLeft, AlertTriangle, AlertCircle, Bell, Plus, Moon, Footprints, HeartPulse, Coffee, Wine,
  Leaf, Wind, Clock, Stethoscope, Smartphone, CheckCircle2, Send, User, Sparkles, Gauge, RefreshCw,
  ShieldCheck, Pill, Bed, Dumbbell, Cigarette, Waves, X, Trash2, Info, ListChecks, Search,
} from "lucide-react";

/* ============================================================
   안압케어 — 녹내장 통합관리 (환자 앱 + 의료진 웹)
   by C&V Tech · CVT200 companion · 프로토타입 v2
   ============================================================ */

const C = {
  ink: "#0A2A31", primary: "#0E5563", primaryDeep: "#083841", aqua: "#3EA6A6",
  mint: "#E6F0EF", mintDeep: "#D3E6E4", bg: "#F3F7F6", card: "#FFFFFF", line: "#E2EAE9",
  sub: "#5E7A7C", gold: "#C39A2E", goldSoft: "#F3E9CC",
  low: "#2E9E7B", lowSoft: "#E4F2EC", mid: "#D79A2B", midSoft: "#FBEFD3",
  high: "#D25C46", highSoft: "#FBE6E0", odC: "#0E5563", osC: "#C39A2E", od: "#0E5563", os: "#C39A2E", grey: "#AAB9B8",
};
const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', system-ui, sans-serif";
const RISK = {
  저: { label: "낮음", c: C.low, soft: C.lowSoft },
  중: { label: "주의", c: C.mid, soft: C.midSoft },
  고: { label: "높음", c: C.high, soft: C.highSoft },
  "-": { label: "참고", c: C.sub, soft: "#EEF2F1" },
};

const PATIENT = { name: "이순영", age: 64, dx: "정상안압녹내장 (NTG)", targetOD: 15, targetOS: 16 };

/* ---------- IOP: 1개월 일별 추세 ---------- */
const IOP_DAILY = [
  { d: "6/5", od: 16.2, os: 15.3 }, { d: "6/8", od: 15.8, os: 15.0 },
  { d: "6/11", od: 16.9, os: 15.6 }, { d: "6/14", od: 16.1, os: 15.2 },
  { d: "6/17", od: 15.6, os: 14.8 }, { d: "6/20", od: 16.5, os: 15.4 },
  { d: "6/23", od: 17.4, os: 15.9 }, { d: "6/25", od: 15.9, os: 15.1 },
  { d: "6/27", od: 16.4, os: 15.3 }, { d: "6/29", od: 15.7, os: 14.9 },
  { d: "6/30", od: 16.6, os: 15.4 }, { d: "7/1", od: 17.1, os: 15.9 },
  { d: "7/2", od: 16.9, os: 15.5 },
];
/* 점안 순응도 ↔ 안압 (일별, 1개월) — 병렬 시각화용. missed=점안 누락일 */
const ADH_IOP = [
  { d: "6/5", od: 16.0, os: 15.1, adh: 100 }, { d: "6/8", od: 15.8, os: 15.0, adh: 100 },
  { d: "6/10", od: 18.7, os: 16.8, adh: 50, missed: true }, { d: "6/12", od: 16.1, os: 15.2, adh: 100 },
  { d: "6/15", od: 15.9, os: 15.0, adh: 100 }, { d: "6/18", od: 19.4, os: 17.3, adh: 33, missed: true },
  { d: "6/21", od: 16.2, os: 15.3, adh: 100 }, { d: "6/23", od: 18.9, os: 16.9, adh: 50, missed: true },
  { d: "6/25", od: 15.9, os: 15.1, adh: 100 }, { d: "6/28", od: 16.0, os: 15.0, adh: 100 },
  { d: "6/30", od: 16.6, os: 15.4, adh: 100 }, { d: "7/1", od: 18.3, os: 16.6, adh: 50, missed: true },
  { d: "7/2", od: 16.9, os: 15.5, adh: 100 }, { d: "7/3", od: 17.2, os: 15.6, adh: 100 },
];
/* 오늘 실시간 측정 세션 (다회) */
const SESSIONS_INIT = [
  { id: "s1", t: "07:40", tv: 7.67, od: 16.4, os: 15.2, ctx: "기상 직후" },
  { id: "s2", t: "12:10", tv: 12.17, od: 17.2, os: 15.6, ctx: "" },
  { id: "s3", t: "18:30", tv: 18.5, od: 16.1, os: 15.0, ctx: "저녁 점안 전" },
];
function AdhIopDot(props) {
  const { cx, cy, payload, stroke } = props;
  if (cx == null) return null;
  return <circle cx={cx} cy={cy} r={payload.missed ? 5 : 3} fill={payload.missed ? "#D25C46" : stroke} stroke="#fff" strokeWidth={1.4} />;
}

/* ---------- 기간 추세 공통 (일자 = 실시간 측정 평균 · 최소/최대 동반) ---------- */
const PERIODS = ["2주", "1개월", "3개월", "6개월", "1년", "누적"];
const TODAY_REF = new Date(2026, 6, 3);
function _rnd(seed) { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }
function _hash(s) { let x = 7; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 100000; return x; }
function _fmt(date, kind) {
  const m = date.getMonth() + 1, d = date.getDate(), yy = String(date.getFullYear()).slice(2);
  if (kind === "mon") return `${m}월`;
  if (kind === "ym") return `${yy}.${m}`;
  return `${m}/${d}`;
}
const _CFG = {
  "2주": { n: 14, step: 1, kind: "md", spread: 1.6 },
  "1개월": { n: 15, step: 2, kind: "md", spread: 1.9 },
  "3개월": { n: 13, step: 7, kind: "md", spread: 2.4 },
  "6개월": { n: 12, step: 15, kind: "md", spread: 2.8 },
  "1년": { n: 12, step: 30, kind: "mon", spread: 3.3 },
  "누적": { n: 16, step: 40, kind: "ym", spread: 3.6 },
};
function trendData(period) {
  const c = _CFG[period] || _CFG["1개월"]; const base = _hash(period);
  const out = [];
  for (let i = 0; i < c.n; i++) {
    const date = new Date(TODAY_REF); date.setDate(date.getDate() - (c.n - 1 - i) * c.step);
    const wave = Math.sin((i / c.n) * Math.PI * 1.6 + (base % 6)) * 0.9;
    const odAvg = +(16.3 + wave + (_rnd(base + i) - 0.5) * 0.7).toFixed(1);
    const osAvg = +(15.2 + wave * 0.8 + (_rnd(base + 500 + i) - 0.5) * 0.6).toFixed(1);
    const dOD = c.spread * (0.6 + _rnd(base + 90 + i) * 0.5);
    const dOS = c.spread * (0.55 + _rnd(base + 130 + i) * 0.5);
    const odMin = +(odAvg - dOD * 0.55).toFixed(1), odMax = +(odAvg + dOD * 0.6).toFixed(1);
    const osMin = +(osAvg - dOS * 0.5).toFixed(1), osMax = +(osAvg + dOS * 0.55).toFixed(1);
    out.push({ d: _fmt(date, c.kind), odAvg, odMin, odMax, osAvg, osMin, osMax, odRange: [odMin, odMax], osRange: [osMin, osMax] });
  }
  return out;
}
function adhIopData(period) {
  const c = _CFG[period] || _CFG["1개월"]; const base = _hash(period) + 3;
  const agg = c.kind !== "md";
  const out = [];
  for (let i = 0; i < c.n; i++) {
    const date = new Date(TODAY_REF); date.setDate(date.getDate() - (c.n - 1 - i) * c.step);
    const r = _rnd(base + i);
    const missed = agg ? r < 0.3 : r < 0.24;
    const adh = missed ? Math.round(45 + _rnd(base + 40 + i) * 25) : Math.round(96 + _rnd(base + 60 + i) * 4);
    const w = Math.sin((i / c.n) * Math.PI * 1.4) * 0.6;
    const od = +((missed ? 18.6 : 16.2) + w + (_rnd(base + 80 + i) - 0.5) * 0.7).toFixed(1);
    const os = +((missed ? 16.7 : 15.1) + w * 0.8 + (_rnd(base + 120 + i) - 0.5) * 0.6).toFixed(1);
    out.push({ d: _fmt(date, c.kind), adh, od, os, missed });
  }
  return out;
}
const _pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`;
const RANGE_FROM_DEFAULT = isoDate(new Date(2026, 5, 3)); // 2026-06-03
const RANGE_TO_DEFAULT = isoDate(TODAY_REF);              // 2026-07-03
function _spanCfg(days) {
  if (days <= 30) return { step: Math.max(1, Math.round(days / 13)), kind: "md", spread: 1.9 };
  if (days <= 120) return { step: 7, kind: "md", spread: 2.4 };
  if (days <= 210) return { step: 15, kind: "md", spread: 2.8 };
  if (days <= 400) return { step: 30, kind: "mon", spread: 3.3 };
  return { step: Math.round(days / 15), kind: "ym", spread: 3.6 };
}
function _iopPoint(date, kind, base, i, spread) {
  const wave = Math.sin(i * 0.5 + (base % 6)) * 0.9;
  const odAvg = +(16.3 + wave + (_rnd(base + i) - 0.5) * 0.7).toFixed(1);
  const osAvg = +(15.2 + wave * 0.8 + (_rnd(base + 500 + i) - 0.5) * 0.6).toFixed(1);
  const dOD = spread * (0.6 + _rnd(base + 90 + i) * 0.5);
  const dOS = spread * (0.55 + _rnd(base + 130 + i) * 0.5);
  const odMin = +(odAvg - dOD * 0.55).toFixed(1), odMax = +(odAvg + dOD * 0.6).toFixed(1);
  const osMin = +(osAvg - dOS * 0.5).toFixed(1), osMax = +(osAvg + dOS * 0.55).toFixed(1);
  return { d: _fmt(date, kind), odAvg, odMin, odMax, osAvg, osMin, osMax, odRange: [odMin, odMax], osRange: [osMin, osMax] };
}
function trendDataRange(fromStr, toStr) {
  const from = new Date(fromStr), to = new Date(toStr);
  if (isNaN(from) || isNaN(to) || to <= from) return trendData("1개월");
  const days = Math.round((to - from) / 86400000);
  const c = _spanCfg(days);
  const n = Math.max(2, Math.min(24, Math.floor(days / c.step) + 1));
  const base = _hash(fromStr + toStr);
  const out = [];
  for (let i = 0; i < n; i++) {
    const date = new Date(from); date.setDate(date.getDate() + Math.round((i * days) / (n - 1)));
    out.push(_iopPoint(date, c.kind, base, i, c.spread));
  }
  return out;
}
function adhIopDataRange(fromStr, toStr) {
  const from = new Date(fromStr), to = new Date(toStr);
  if (isNaN(from) || isNaN(to) || to <= from) return adhIopData("1개월");
  const days = Math.round((to - from) / 86400000);
  const c = _spanCfg(days);
  const agg = c.kind !== "md";
  const n = Math.max(2, Math.min(24, Math.floor(days / c.step) + 1));
  const base = _hash(fromStr + toStr) + 3;
  const out = [];
  for (let i = 0; i < n; i++) {
    const date = new Date(from); date.setDate(date.getDate() + Math.round((i * days) / (n - 1)));
    const r = _rnd(base + i);
    const missed = agg ? r < 0.3 : r < 0.24;
    const adh = missed ? Math.round(45 + _rnd(base + 40 + i) * 25) : Math.round(96 + _rnd(base + 60 + i) * 4);
    const w = Math.sin(i * 0.5) * 0.6;
    const od = +((missed ? 18.6 : 16.2) + w + (_rnd(base + 80 + i) - 0.5) * 0.7).toFixed(1);
    const os = +((missed ? 16.7 : 15.1) + w * 0.8 + (_rnd(base + 120 + i) - 0.5) * 0.6).toFixed(1);
    out.push({ d: _fmt(date, c.kind), adh, od, os, missed });
  }
  return out;
}
const _dateInp = { border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 8px", fontSize: 11.5, fontFamily: FONT, color: C.ink, outline: "none", background: "#fff" };
function PeriodPicker({ period, from, to, onPreset, onFrom, onTo }) {
  const custom = period === "custom";
  return (
    <div className="flex flex-col gap-2">
      <PeriodTabs value={period} onChange={onPreset} />
      <div className="flex items-center gap-2" style={{ flexWrap: "wrap", padding: "6px 9px", borderRadius: 10, border: `1px solid ${custom ? C.primary : C.line}`, background: custom ? C.mint : "#fff" }}>
        <span style={{ fontSize: 11, color: custom ? C.primary : C.sub, fontWeight: 800 }}>직접 선택</span>
        <input type="date" value={from} max={to} onChange={(e) => onFrom(e.target.value)} style={_dateInp} />
        <span style={{ color: C.sub, fontSize: 12 }}>~</span>
        <input type="date" value={to} min={from} onChange={(e) => onTo(e.target.value)} style={_dateInp} />
      </div>
    </div>
  );
}
function TrendTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0] && payload[0].payload; if (!p) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 10px", fontSize: 11.5, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
      <div style={{ fontWeight: 700, color: C.ink, marginBottom: 3 }}>{label}</div>
      <div style={{ color: C.od }}>우안 평균 {p.odAvg} <span style={{ color: C.sub }}>(최소 {p.odMin} · 최대 {p.odMax})</span></div>
      <div style={{ color: C.os }}>좌안 평균 {p.osAvg} <span style={{ color: C.sub }}>(최소 {p.osMin} · 최대 {p.osMax})</span></div>
    </div>
  );
}
function PeriodTabs({ value, onChange }) {
  return (
    <div className="flex" style={{ gap: 4, flexWrap: "wrap" }}>
      {PERIODS.map((p) => (
        <button key={p} onClick={() => onChange(p)} className="cursor-pointer"
          style={{ border: `1px solid ${value === p ? C.primary : C.line}`, background: value === p ? C.primary : "#fff", color: value === p ? "#fff" : C.sub, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>{p}</button>
      ))}
    </div>
  );
}
function TrendChart({ data, height = 190, targetOS = 16 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <ReferenceArea y1={12} y2={targetOS + 1} fill={C.low} fillOpacity={0.07} />
        <CartesianGrid stroke={C.line} vertical={false} />
        <XAxis dataKey="d" interval="preserveStartEnd" minTickGap={16} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} />
        <YAxis domain={[10, 22]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<TrendTip />} />
        <Area dataKey="odRange" stroke="none" fill={C.od} fillOpacity={0.13} isAnimationActive={false} />
        <Area dataKey="osRange" stroke="none" fill={C.os} fillOpacity={0.13} isAnimationActive={false} />
        <Line type="monotone" dataKey="odAvg" stroke={C.od} strokeWidth={2.4} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="osAvg" stroke={C.os} strokeWidth={2.4} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
function TrendLegend() {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap" style={{ marginTop: 6 }}>
      <Legend c={C.od} t="우안 평균" /><Legend c={C.os} t="좌안 평균" />
      <div className="flex items-center gap-1.5"><span style={{ width: 14, height: 9, borderRadius: 2, background: C.od, opacity: 0.2 }} /><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>일중 범위(최소–최대)</span></div>
    </div>
  );
}
function DayStat({ eye, avg, min, max, col }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 11px" }}>
      <div className="flex items-baseline gap-1.5"><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{eye}</span><span style={{ fontSize: 18, fontWeight: 800, color: col, fontVariantNumeric: "tabular-nums" }}>{avg}</span><span style={{ fontSize: 10.5, color: C.sub }}>평균</span></div>
      <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>최소 {min} · 최대 {max} mmHg</div>
    </div>
  );
}

/* ---------- 점안제 라이브러리 (성분명별 그룹 · 대우제약 상단) ---------- */
const DRUG_LIB = [
  { cat: "라타노프로스트", items: [
    { name: "잘타라노 점안액", ingr: "라타노프로스트", maker: "대우제약", dose: "일회용", def: "1일 1회 · 취침 전", own: true },
  ]},
  { cat: "도르졸라미드 + 티몰롤 (복합)", items: [
    { name: "제티솝 점안액", ingr: "도르졸라미드+티몰롤", maker: "대우제약", dose: "다회용", def: "1일 2회", own: true },
    { name: "코솝-에스 점안액", ingr: "도르졸라미드+티몰롤", maker: "한국엠에스디", dose: "일회용", def: "1일 2회" },
  ]},
  { cat: "트라보프로스트", items: [
    { name: "트라바탄 점안액", ingr: "트라보프로스트", maker: "한국알콘", dose: "다회용", def: "1일 1회 · 취침 전" },
  ]},
  { cat: "비마토프로스트", items: [
    { name: "루미간 점안액", ingr: "비마토프로스트", maker: "한국애브비", dose: "다회용", def: "1일 1회 · 취침 전" },
  ]},
  { cat: "티몰롤", items: [
    { name: "티모프틱 점안액", ingr: "티몰롤", maker: "한국엠에스디", dose: "다회용", def: "1일 2회" },
  ]},
  { cat: "브리모니딘", items: [
    { name: "알파간 점안액", ingr: "브리모니딘", maker: "한국애브비", dose: "다회용", def: "1일 2~3회" },
  ]},
  { cat: "도르졸라미드", items: [
    { name: "트루솝 점안액", ingr: "도르졸라미드", maker: "한국엠에스디", dose: "다회용", def: "1일 3회" },
  ]},
  { cat: "브린졸라미드", items: [
    { name: "아좁트 점안액", ingr: "브린졸라미드", maker: "한국알콘", dose: "다회용", def: "1일 2회" },
  ]},
  { cat: "브리모니딘 + 티몰롤 (복합)", items: [
    { name: "콤비간 점안액", ingr: "브리모니딘+티몰롤", maker: "한국애브비", dose: "다회용", def: "1일 2회" },
  ]},
  { cat: "히알루론산 (인공눈물)", items: [
    { name: "히알산 점안액", ingr: "히알루론산", maker: "대우제약", dose: "다회용", def: "필요 시", own: true },
    { name: "리안점안액 (일회용)", ingr: "히알루론산 0.15%", maker: "삼일제약", dose: "일회용", def: "필요 시" },
    { name: "히아박점안액 (다회용)", ingr: "히알루론산 0.1%", maker: "태준제약", dose: "다회용", def: "필요 시" },
  ]},
];
const MEDS_INIT = [
  { id: "m1", name: "잘타라노 점안액", ingr: "라타노프로스트", maker: "대우제약", dose: "일회용", time: "21:00", freq: "1일 1회 · 취침 전", eye: "양안", taken: false, src: "manual" },
  { id: "m2", name: "콤비간 점안액", ingr: "브리모니딘+티몰롤", maker: "한국애브비", dose: "다회용", time: "08:00", freq: "1일 2회", eye: "양안", taken: true, at: "08:05", src: "device" },
  { id: "m3", name: "콤비간 점안액", ingr: "브리모니딘+티몰롤", maker: "한국애브비", dose: "다회용", time: "20:00", freq: "1일 2회", eye: "양안", taken: false, src: "device" },
  { id: "m4", name: "리안점안액 (일회용)", ingr: "히알루론산 0.15%", maker: "삼일제약", dose: "일회용", time: "필요 시", freq: "건조감 시", eye: "양안", taken: false, src: "manual" },
];

const WATCH = { device: "Galaxy Watch", steps: 6420, stepGoal: 8000, sleepH: 6, sleepM: 40, sleepQuality: "보통", hr: 72, irn: true, irnDate: "6/30" };

/* ============================================================
   전자 문진 — 12개 항목 전체
   ============================================================ */
const Q = [
  { id: "Q1", pri: 1, title: "수면 자세·머리 높이", freq: "월 1회", icon: Bed,
    save: "주된 수면 자세, 머리 올림 방식, 월별 추세",
    subs: [
      { id: "Q1-1", type: "single", q: "평소 주무실 때 어떤 자세로 가장 오래 주무십니까?", opts: [
        { t: "침대 머리를 20~30° 올리고 잔다", r: "저", fb: "잘하고 계십니다. 이 자세는 야간 안압을 약 1.5~2.0 mmHg 낮춥니다. 유지해 주세요." },
        { t: "평평하게 바로 누워 잔다", r: "중", fb: "바로 누운 자세는 야간 안압을 최대 6 mmHg 높일 수 있습니다. 침대 헤드를 올리거나 웨지 베개를 사용해 보세요." },
        { t: "주로 옆으로 누워 잔다", r: "중", fb: "옆으로 자면 아래쪽 눈의 안압이 더 높아질 수 있습니다. 머리를 함께 올리고 다음 진료 때 상의해 보세요." },
        { t: "엎드려 잔다", r: "고", fb: "엎드린 자세는 안압을 가장 많이 올립니다. 옆으로 눕도록 바꾸고 진료 때 자세 교정을 상의하세요." },
      ]},
      { id: "Q1-2", type: "single", q: "수면 시 머리를 올리는 방식은?", opts: [
        { t: "침대 헤드 자체를 올림", r: "저", fb: "가장 권장되는 방식입니다. 상체 경사가 안정적입니다." },
        { t: "경사형 웨지 베개 사용", r: "저", fb: "좋은 방법입니다. 일반 베개보다 경사가 안정적입니다." },
        { t: "일반 베개 여러 개 겹침", r: "중", fb: "자는 중 자세가 흐트러져 효과가 제한적입니다. 헤드 상승이나 웨지 베개를 권장합니다." },
        { t: "머리를 별도로 올리지 않음", r: "고", fb: "가능한 방법으로 머리를 20~30° 올리기를 권장합니다." },
      ]},
    ]},
  { id: "Q2", pri: 2, title: "수면무호흡 · 진단 · CPAP", freq: "초기 1회", icon: Waves,
    save: "OSA 진단 상태, CPAP 사용·빈도, 선별 증상 점수(0~4), 분기별 변화",
    subs: [
      { id: "Q2-1", type: "single", q: "수면무호흡증을 진단받은 적이 있습니까?", opts: [
        { t: "진단받은 적 없음", r: "-", fb: "아래 증상이 있다면 수면 전문의 상담을 고려해 보세요." },
        { t: "진단받았으나 치료하지 않음", r: "고", fb: "OSA는 녹내장 위험을 약 65% 높인다는 연구가 있습니다. CPAP 등 치료 재개를 상의해 보세요." },
        { t: "진단받았고 CPAP 사용 중", r: "중", fb: "CPAP을 꾸준히 사용해 주세요. 사용이 줄면 야간 저산소·안압 변동이 다시 나타날 수 있습니다." },
        { t: "진단받았으나 CPAP 사용 중단", r: "고", fb: "중단 후 OSA 증상이 재발할 수 있고 녹내장 진행과 연관됩니다. 재개 여부를 상의해 보세요." },
      ]},
      { id: "Q2-2", type: "multi", q: "최근 1개월간 해당하는 증상을 모두 선택하세요.", intg: (s) => s.filter((i) => i !== 4).length >= 2 ? "코골이·무호흡·아침 두통·낮 졸음은 OSA 대표 증상입니다. OSA가 있으면 녹내장 위험이 최대 65% 높다는 연구가 있습니다. 수면 클리닉/이비인후과 상담을 권장합니다." : null, opts: [
        { t: "가족이 지적할 정도의 심한 코골이", r: "중" },
        { t: "자다가 숨이 멎는 모습을 목격당함", r: "고" },
        { t: "아침에 두통이 자주 있음", r: "중" },
        { t: "낮에 참기 어려운 졸음", r: "중" },
        { t: "위 증상 모두 없음", r: "저" },
      ]},
    ]},
  { id: "Q3", pri: 3, title: "혈압약 복용 시점", freq: "초기 1회", icon: Pill,
    save: "혈압약 복용 여부·시점, 분복 여부, 혈관성 증상 점수, 변경 이력",
    subs: [
      { id: "Q3-1", type: "single", q: "현재 혈압약을 복용하십니까? 복용 시점을 선택하세요.", opts: [
        { t: "복용하지 않음", r: "-", fb: "가정 혈압을 정기적으로 측정해 주세요." },
        { t: "아침에만 복용", r: "저", fb: "아침 복용은 야간 저혈압 위험이 낮습니다. 현재 시점을 유지해 주세요." },
        { t: "아침·저녁 분복", r: "중", fb: "저녁 복용 후 야간 혈압이 과도하게 떨어질 수 있습니다. NTG가 있으면 복용 시점을 상의해 보세요." },
        { t: "취침 전 복용", r: "고", fb: "취침 전 복용은 야간 저혈압으로 시신경 관류를 떨어뜨릴 수 있습니다. 안과·내과와 시점 조정을 상의하세요." },
        { t: "복용 시간이 불규칙", r: "고", fb: "복용 시점이 일정하지 않으면 야간 혈압 변동이 커집니다. 일정한 시간에 복용하시고 상의해 보세요." },
      ]},
      { id: "Q3-2", type: "multi", q: "평소 다음 증상이 있습니까? (참고용)", intg: (s) => s.filter((i) => i !== 3).length >= 1 ? "혈관성 위험 요인이 있으실 수 있습니다. 안과 진료 시 함께 말씀해 주세요." : null, opts: [
        { t: "일어설 때 어지럼증", r: "중" }, { t: "기립성 저혈압 진단 이력", r: "중" },
        { t: "손발이 자주 차가움", r: "중" }, { t: "위 증상 없음", r: "저" },
      ]},
    ]},
  { id: "Q4", pri: 4, title: "동반 질환 (당뇨·고혈압)", freq: "초기 1회", icon: Activity,
    save: "당뇨 유무·유형, HbA1c 구간, 고혈압 단계, 분기별 변화",
    subs: [
      { id: "Q4-1", type: "single", q: "당뇨 진단을 받으셨습니까?", opts: [
        { t: "없음", r: "저", fb: "현재 진단 이력이 없습니다." },
        { t: "공복혈당 장애 (당뇨 전단계)", r: "중", fb: "전단계는 미세혈관에 영향을 줄 수 있습니다. 식이·운동 관리를 함께 해주세요." },
        { t: "제2형 당뇨", r: "중", fb: "당뇨 관리 상태가 시신경 건강에도 영향을 줍니다. HbA1c 7% 이하 유지가 권장됩니다." },
        { t: "제1형 당뇨", r: "중", fb: "당뇨 관리 상태가 시신경 건강에도 영향을 줍니다." },
      ]},
      { id: "Q4-2", type: "single", q: "최근 HbA1c(당화혈색소) 수치는? (당뇨 진단 시)", showIf: (a) => a["Q4-1"] != null && a["Q4-1"] !== 0, opts: [
        { t: "7% 미만 (조절 양호)", r: "저", fb: "혈당 조절이 잘 되고 있습니다. 유지해 주세요." },
        { t: "7~8% (조절 보통)", r: "중", fb: "내과 주치의와 혈당 조절 강화를 상의해 보세요." },
        { t: "8% 이상 (조절 불량)", r: "고", fb: "조절되지 않는 고혈당은 미세혈관 건강에 영향을 줍니다. 적극적 관리를 상의해 주세요." },
        { t: "모름", r: "-", fb: "다음 내과 진료 때 HbA1c를 확인해 주세요." },
      ]},
      { id: "Q4-3", type: "single", q: "고혈압 진단을 받으셨습니까?", opts: [
        { t: "없음 (120/80 미만)", r: "저", fb: "혈압이 정상 범위입니다." },
        { t: "전고혈압 (120~139/80~89)", r: "저", fb: "식이·운동·체중 관리를 권장합니다." },
        { t: "고혈압 1단계 (140~159/90~99)", r: "중", fb: "야간 혈압 패턴이 녹내장에 영향을 줄 수 있어 약 복용 시점을 상의해 주세요." },
        { t: "고혈압 2단계 (160↑/100↑)", r: "고", fb: "적극적 관리가 필요합니다. 내과와 즉시 상의하고 안과 진료 시 알려 주세요." },
      ]},
    ]},
  { id: "Q5", pri: 5, title: "안압 급상승 유발 행동", freq: "분기 1회", icon: Dumbbell,
    save: "선택된 위험 행동 목록, 분기별 변화",
    subs: [
      { id: "Q5-1", type: "multi", q: "평소 자주 하시는 것을 모두 선택하세요.", opts: [
        { t: "역전 요가/스트레칭 (다운독·물구나무·쟁기)", r: "고", fb: "역전 자세는 안압을 급격히 높입니다. 복식호흡이나 일반 자세 요가로 대체하세요." },
        { t: "숨을 참으며 무거운 중량 운동", r: "고", fb: "발살바 호흡은 안압을 최대 4 mmHg 높입니다. 숨을 내쉬며 중등 중량·고반복으로 바꿔 보세요." },
        { t: "꽉 끼는 수영 고글 자주 착용", r: "중", fb: "안와 압박이 안압을 일시적으로 높입니다. 큰 사이즈/마스크형 고글을 권장합니다." },
        { t: "목을 조이는 넥타이·칼라 오래 착용", r: "중", fb: "목 조임은 경정맥 압력을 높여 안압을 올릴 수 있습니다. 느슨하게 매세요." },
        { t: "눈을 자주 비비거나 세게 누름", r: "중", fb: "일시적으로 안압을 크게 높입니다. 가려움·건조감엔 처방 인공눈물을 사용하세요." },
        { t: "트럼펫·호른 등 고압 관악기 연주", r: "중", fb: "발살바 유사 상승을 유발할 수 있습니다. 연주 후 안압 변동을 정기 점검해 주세요." },
        { t: "단시간에 물 1L 이상 급하게 마심", r: "중", fb: "일시적 안압 상승(water-drinking test 원리)이 있을 수 있습니다. 나눠서 천천히 드세요." },
        { t: "위 항목 모두 해당 없음", r: "저", fb: "위험 행동이 적은 편입니다. 현재 패턴을 유지해 주세요." },
      ]},
    ]},
  { id: "Q6", pri: 6, title: "흡연 상태·강도·금연", freq: "초기 1회", icon: Cigarette,
    save: "흡연 상태, 일평균 흡연량, 기간, 자동 산출 Pack-year, 금연 후 경과",
    subs: [
      { id: "Q6-1", type: "single", q: "흡연 상태는?", opts: [
        { t: "비흡연 (평생 100개비 미만)", r: "저", fb: "비흡연 상태입니다. 잘 유지해 주세요." },
        { t: "과거 흡연 (현재 금연)", r: "중", fb: "금연을 잘 유지하고 계십니다. 장기 금연은 시야 진행 위험을 낮춥니다." },
        { t: "현재 흡연 중", r: "고", fb: "20 pack-year 이상 누적 흡연은 시야 악화 속도와 관련됩니다. 금연을 권장하며 금연상담전화(1544-9030)를 이용할 수 있습니다." },
      ]},
      { id: "Q6-2", type: "packyear", q: "일평균 흡연량과 흡연 기간 (현재/과거 흡연자)", showIf: (a) => a["Q6-1"] === 1 || a["Q6-1"] === 2 },
      { id: "Q6-3", type: "single", q: "금연 후 경과 기간 (과거 흡연자만)", showIf: (a) => a["Q6-1"] === 1, opts: [
        { t: "1년 미만", r: "중", fb: "금연 초기입니다. 1년 이상 지속하면 위험 감소가 본격화됩니다." },
        { t: "1~5년", r: "중", fb: "잘 유지하고 계십니다. 5년 이상 지속하면 추가 감소가 기대됩니다." },
        { t: "5~10년", r: "저", fb: "장기 금연을 잘 유지하고 계십니다." },
        { t: "10년 이상", r: "저", fb: "비흡연자에 가까운 위험 수준으로 보고됩니다." },
      ]},
    ]},
  { id: "Q7", pri: 7, title: "카페인 섭취", freq: "주 1회", icon: Coffee,
    save: "일평균 카페인 잔 수 구간, 진한 섭취 빈도, 주별 변화",
    subs: [
      { id: "Q7-1", type: "single", q: "하루 카페인 음료(커피·에너지음료·진한 차) 섭취량은?", opts: [
        { t: "마시지 않음", r: "저", fb: "카페인 섭취가 없으십니다." },
        { t: "1~2잔", r: "저", fb: "적정 범위입니다. 안압이 잘 조절되면 현재 수준을 유지하셔도 됩니다." },
        { t: "3~4잔", r: "중", fb: "녹내장 환자는 카페인 후 안압이 일시 상승할 수 있습니다. 2잔 이내로 줄이거나 일부 디카페인으로 바꿔 보세요." },
        { t: "5잔 이상", r: "고", fb: "하루 5잔 이상은 녹내장 위험을 약 1.6배 높인다는 연구가 있습니다. 점진적으로 줄이기를 권장합니다." },
      ]},
      { id: "Q7-2", type: "single", q: "한 번에 진한 커피(더블샷 등)를 드시는 편입니까?", opts: [
        { t: "거의 없음", r: "저", fb: "" },
        { t: "가끔", r: "중", fb: "진한 농도는 안압을 더 크게 올릴 수 있습니다. 농도를 낮추거나 나누어 드세요." },
        { t: "자주", r: "고", fb: "진한 카페인은 안압 변동을 키웁니다. 농도를 낮추거나 디카페인으로 일부 대체하세요." },
      ]},
    ]},
  { id: "Q8", pri: 8, title: "식이 (녹색 잎채소·질산염)", freq: "주 1회", icon: Leaf,
    save: "녹색 잎채소 섭취 빈도, 식단 패턴, 주별 변화",
    subs: [
      { id: "Q8-1", type: "single", q: "시금치·케일·상추 등 녹색 잎채소를 얼마나 자주 드십니까?", opts: [
        { t: "매일 1접시 이상", r: "저", fb: "잘하고 계십니다. 질산염 매개 시신경 보호 효과가 기대됩니다." },
        { t: "주 3~5회", r: "저", fb: "충분한 빈도입니다. 가능하면 매일로 늘려 보세요." },
        { t: "주 1~2회", r: "중", fb: "빈도가 낮은 편입니다. 매 식사에 잎채소 한 가지를 추가해 보세요." },
        { t: "거의 먹지 않음", r: "고", fb: "충분히 드시면 녹내장 위험이 최대 44% 낮아질 수 있다는 연구가 있습니다. 단계적으로 늘려 보세요." },
      ]},
      { id: "Q8-2", type: "single", q: "평소 식단을 가장 잘 설명하는 항목은?", opts: [
        { t: "채소·과일·생선·올리브오일 위주 (지중해·MIND)", r: "저", fb: "위험 감소와 연관된 식단입니다. 유지해 주세요." },
        { t: "일반적 한식 (채소 반찬·생선·잡곡)", r: "저", fb: "균형 잡힌 식단입니다. 잎채소 비중을 조금 더 늘려 보세요." },
        { t: "육류·정제 탄수화물 위주", r: "중", fb: "채소·생선·견과류 비중을 늘리면 시신경 보호에 도움이 됩니다." },
        { t: "외식·가공식품 위주", r: "고", fb: "채소·질산염 섭취가 부족할 수 있습니다. 하루 한 끼라도 채소 위주로 바꿔 보세요." },
      ]},
    ]},
  { id: "Q9", pri: 9, title: "유산소 운동 습관", freq: "주 1회", icon: Footprints, watchLink: "걸음 수 연동 시 자동값 우선",
    save: "주당 유산소 빈도·시간, 강도, 발살바 동반, 신체 제약, 주별 추세",
    subs: [
      { id: "Q9-1", type: "single", q: "일주일에 유산소 운동을 어느 정도 하십니까?", opts: [
        { t: "주 3회 이상, 회당 30분 이상", r: "저", fb: "잘하고 계십니다. 안압을 낮추고 눈 혈류를 개선합니다. 유지해 주세요." },
        { t: "주 1~2회", r: "중", fb: "'약간 숨이 차는' 강도로 주 3회·회당 30분을 목표로 늘려 보세요." },
        { t: "거의 하지 않음 (좌식 생활)", r: "고", fb: "활동량이 많을수록 시야 진행이 느렸다는 연구가 있습니다. 하루 20~30분 빠르게 걷기부터 시작하세요." },
        { t: "운동하고 싶으나 신체 제약", r: "중", fb: "무리 없는 활동(짧은 산책·실내 자전거)을 시도하고, 진료 때 적절한 방법을 상의해 보세요." },
      ]},
      { id: "Q9-2", type: "single", q: "운동 강도는 어느 정도입니까?", opts: [
        { t: "숨이 약간 차고 땀나는(중강도) 이상", r: "저", fb: "중강도 이상은 안압 강하·혈류 개선 효과가 큽니다. 좋은 강도입니다." },
        { t: "가볍게 걷는 정도(저강도)", r: "중", fb: "가능하면 '약간 숨이 차는' 중강도까지 올리면 효과가 더 큽니다." },
        { t: "숨을 참거나 힘주어 버티는 동작 많음", r: "중", fb: "발살바 동작은 안압을 일시적으로 높입니다. 숨을 내쉬며 수행하고 Q5도 확인해 주세요." },
      ]},
    ]},
  { id: "Q10", pri: 10, title: "수면 시간·수면의 질", freq: "월 1회", icon: Moon, watchLink: "수면 시간 연동 시 자동값 우선",
    save: "평균 수면 시간 구간, 규칙성, 질 등급, 수면제 복용, 월별 추세",
    subs: [
      { id: "Q10-1", type: "single", q: "평소 하루 수면 시간은 어느 정도입니까?", opts: [
        { t: "6시간 미만 (부족)", r: "중", fb: "수면 부족은 위험을 다소 높입니다. 하루 약 7시간을 목표로 규칙적으로 맞춰 보세요." },
        { t: "6~9시간 (적정)", r: "저", fb: "적정 수면입니다. 약 7시간 전후가 최적으로 보고됩니다. 유지해 주세요." },
        { t: "9시간 초과 (과다)", r: "중", fb: "지나치게 길어도 위험이 다소 높아집니다. 배경 요인을 살펴보고 지속되면 상의해 보세요." },
        { t: "일정하지 않음 (교대근무 등)", r: "중", fb: "불규칙하면 안압·혈압 주기 리듬이 흐트러집니다. 가능한 범위에서 일정하게 유지해 보세요." },
      ]},
      { id: "Q10-2", type: "single", q: "최근 1개월간 수면의 질은 어떠십니까?", opts: [
        { t: "잘 자고 개운함", r: "저", fb: "수면의 질이 양호합니다. 유지해 주세요." },
        { t: "잠들기 어렵거나 자주 깸 (경도)", r: "중", fb: "취침 전 카페인·스마트폰을 줄이고 규칙적 습관을 시도해 보세요. Q7도 확인해 보세요." },
        { t: "거의 매일 불면으로 힘듦", r: "고", fb: "지속 불면은 위험 증가와 연관됩니다. 개선되지 않으면 수면 클리닉 상담을 권장합니다." },
        { t: "수면제를 복용해야 잠듦", r: "중", fb: "정기 복용 중이면 진료 때 알려 주세요. 일부 약물은 전신 상태에 영향을 줄 수 있습니다." },
      ]},
    ]},
  { id: "Q11", pri: 11, title: "부정맥·심방세동", freq: "초기 1회", icon: HeartPulse, watchFlag: true, watchLink: "워치 불규칙 맥박(IRN) 자동 병기",
    save: "부정맥·AF 진단·유형, 불규칙 맥박 자각, 워치 IRN 유무·감지일, 확진 여부, 변경 이력",
    subs: [
      { id: "Q11-1", type: "single", q: "부정맥 또는 심방세동을 진단받은 적이 있습니까?", opts: [
        { t: "진단받은 적 없음", r: "저", fb: "부정맥·심방세동 진단 이력이 없습니다." },
        { t: "심방세동(AF) 진단받음", r: "중", fb: "AF는 혈관성 경로로 위험을 다소 높일 수 있습니다(특히 NTG). 안과 진료 시 알려 주고 정기 검사를 유지하세요." },
        { t: "기타 부정맥 진단받음", r: "중", fb: "안과 진료 시 함께 말씀해 주세요. 심장내과 관리 상태 유지가 도움이 됩니다." },
        { t: "진단 없으나 불규칙 / 워치에서 감지됨", r: "중", fb: "불규칙 맥박을 느끼셨다면 심장내과 심전도(ECG) 확인을 권장합니다. 미확진 부정맥이 있을 수 있습니다." },
      ]},
    ]},
  { id: "Q12", pri: 12, title: "음주", freq: "주 1회", icon: Wine,
    save: "주당 음주 빈도, 1회 섭취량, 폭음 여부, 주별 추세",
    subs: [
      { id: "Q12-1", type: "single", q: "평소 1주간 음주 빈도는?", opts: [
        { t: "음주 안 함", r: "저", fb: "안압 관리에 유리한 습관입니다." },
        { t: "주 1회 이하", r: "저", fb: "빈도가 낮습니다. 한 번에 많이 마시지 않도록 유의해 주세요." },
        { t: "주 2~3회", r: "중", fb: "잦은 음주는 안압을 다소 높일 수 있습니다. 빈도와 1회량을 줄여 보세요." },
        { t: "주 4회 이상", r: "고", fb: "안압 상승과 연관됩니다. 절주를 권하며 진료 때 상의해 보세요." },
      ]},
      { id: "Q12-2", type: "single", q: "1회 섭취량은? (맥주 1캔/소주 2~3잔 ≈ 1~2잔)", opts: [
        { t: "1잔 이하", r: "저", fb: "소량 음주입니다. 유지해 주세요." },
        { t: "2~3잔", r: "중", fb: "총 음주량이 늘수록 안압이 높아진다는 보고가 있습니다. 양을 줄여 보세요." },
        { t: "4잔 이상", r: "고", fb: "1회 다량 음주는 안압 변동과 연관됩니다. 폭음을 피하고 절주하세요." },
      ]},
    ]},
];
const FREQ_ORDER = ["초기 1회", "주 1회", "월 1회", "분기 1회"];

/* ============================================================
   UI primitives
   ============================================================ */
function RiskPill({ r, small }) {
  if (!r) return null;
  const m = RISK[r]; if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1 font-semibold" style={{ background: m.soft, color: m.c, borderRadius: 999, padding: small ? "2px 8px" : "3px 10px", fontSize: small ? 11 : 12 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: m.c }} />{m.label}
    </span>
  );
}
function RiskPillHover({ r, tip }) {
  const [pos, setPos] = useState(null);
  if (!r) return null;
  return (
    <span style={{ position: "relative", display: "inline-flex", cursor: "help" }}
      onMouseEnter={(e) => tip && setPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => tip && setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}>
      <RiskPill r={r} small />
      {pos && tip && (
        <div style={{ position: "fixed", left: Math.min(pos.x + 12, (typeof window !== "undefined" ? window.innerWidth : 1200) - 270), top: pos.y + 16, zIndex: 60, width: 250, background: C.ink, color: "#fff", fontSize: 11.5, lineHeight: 1.5, padding: "9px 12px", borderRadius: 10, boxShadow: "0 10px 28px rgba(0,0,0,.28)", pointerEvents: "none" }}>
          <div style={{ fontWeight: 800, marginBottom: 3, color: C.gold, fontSize: 11 }}>맞춤 안내</div>
          {tip}
        </div>
      )}
    </span>
  );
}
function Eyebrow({ children, color = C.sub }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.14em", color, fontWeight: 700, textTransform: "uppercase" }}>{children}</div>;
}
function Card({ children, style, className = "", onClick }) {
  return <div onClick={onClick} className={className} style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, ...style }}>{children}</div>;
}
function SectionTitle({ icon: Ic, children, right }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
      <div className="flex items-center gap-2">{Ic && <Ic size={17} color={C.primary} strokeWidth={2.2} />}<span style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>{children}</span></div>{right}
    </div>
  );
}
function DeviceChip({ icon: Ic, label, connected = true }) {
  return <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 999, background: connected ? C.lowSoft : "#F0F2F2", color: connected ? C.low : C.sub }}><Ic size={12} /> {label}</span>;
}
function DoseBadge({ dose, small }) {
  const single = dose === "일회용";
  return <span style={{ fontSize: small ? 9.5 : 10, fontWeight: 700, color: single ? C.aqua : C.primary, background: single ? "#E2F1F0" : C.mint, padding: "1px 7px", borderRadius: 99 }}>{dose}</span>;
}
function FreqBadge({ f }) {
  const map = { "초기 1회": C.sub, "주 1회": C.aqua, "월 1회": C.primary, "분기 1회": C.gold };
  return <span style={{ fontSize: 10, fontWeight: 700, color: map[f] || C.sub, background: "#F0F4F3", padding: "1px 7px", borderRadius: 99 }}>{f}</span>;
}
function Legend({ c, t, soft }) {
  return <div className="flex items-center gap-1.5"><span style={{ width: 14, height: 4, borderRadius: 99, background: c, opacity: soft ? 0.35 : 1 }} /><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{t}</span></div>;
}

/* ---------- Signature: IOP arc gauge ---------- */
function arcPath(cx, cy, r, a1, a2, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = (a1 + (a2 - a1) * (i / n)) * (Math.PI / 180); pts.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); }
  return "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L");
}
const v2a = (v, min = 8, max = 30) => 180 - Math.min(1, Math.max(0, (v - min) / (max - min))) * 180;
function IOPGauge({ value, target, eye }) {
  const W = 190, H = 118, cx = W / 2, cy = 104, r = 78, min = 8, max = 30;
  const a = v2a(value) * (Math.PI / 180);
  const needle = { x: cx + (r - 6) * Math.cos(a), y: cy - (r - 6) * Math.sin(a) };
  const over = value > target;
  const st = value <= target ? C.low : value <= target + 3 ? C.mid : C.high;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 200 }}>
        <path d={arcPath(cx, cy, r, 180, 0)} fill="none" stroke={C.mintDeep} strokeWidth={11} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, v2a(target - 3), v2a(target + 1))} fill="none" stroke={C.low} strokeWidth={11} strokeLinecap="round" opacity={0.55} />
        <path d={arcPath(cx, cy, r, 180, v2a(value))} fill="none" stroke={st} strokeWidth={11} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={C.ink} />
        <text x={cx - r} y={cy + 14} fontSize="9" fill={C.sub} textAnchor="middle">8</text>
        <text x={cx + r} y={cy + 14} fontSize="9" fill={C.sub} textAnchor="middle">30</text>
      </svg>
      <div className="flex items-baseline gap-1" style={{ marginTop: -6 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>{eye}</span>
        <span style={{ fontSize: 34, fontWeight: 800, color: st, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>mmHg</span>
      </div>
      <div style={{ fontSize: 11.5, color: over ? C.high : C.low, fontWeight: 600 }}>목표 {target} · {over ? `+${(value - target).toFixed(1)} 초과` : "목표 이내"}</div>
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */
function HomeScreen({ meds, sessions, go }) {
  const latest = sessions[sessions.length - 1];
  const overOD = latest.od > PATIENT.targetOD;
  const scheduled = meds.filter((m) => m.time !== "필요 시");
  const done = scheduled.filter((m) => m.taken).length;
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <Eyebrow>{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}</Eyebrow>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginTop: 2 }}>안녕하세요, {PATIENT.name}님</div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 1 }}>{PATIENT.dx} · 목표 안압 {PATIENT.targetOD}/{PATIENT.targetOS} mmHg</div>
      </div>

      {(overOD || WATCH.irn) && (
        <Card style={{ background: C.highSoft, border: "1px solid #F1CFC6", padding: 13 }}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} color={C.high} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#8A3A2A", lineHeight: 1.5 }}>
              {overOD && <div><b>우안(OD) 안압이 목표({PATIENT.targetOD})를 넘었습니다.</b> 점안 시간을 지키고 다음 측정값을 확인해 주세요.</div>}
              {WATCH.irn && <div style={{ marginTop: overOD ? 4 : 0 }}>워치 <b>불규칙 맥박</b> 감지({WATCH.irnDate}). 심장내과 심전도(ECG) 확인을 권장합니다.</div>}
            </div>
          </div>
        </Card>
      )}

      <Card style={{ padding: 16 }} className="cursor-pointer" onClick={() => go("iop")}>
        <SectionTitle icon={Eye} right={<span style={{ fontSize: 11.5, color: C.sub }}>오늘 {sessions.length}회 측정</span>}>최근 안압</SectionTitle>
        <div className="grid grid-cols-2 gap-2" style={{ marginTop: 4 }}>
          <IOPGauge value={latest.od} target={PATIENT.targetOD} eye="OD" />
          <IOPGauge value={latest.os} target={PATIENT.targetOS} eye="OS" />
        </div>
        <div className="flex items-center justify-center gap-1.5" style={{ marginTop: 8 }}><DeviceChip icon={Bluetooth} label="CVT200 연결됨" /><ChevronRight size={16} color={C.sub} /></div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card style={{ padding: 14 }} className="cursor-pointer" onClick={() => go("drops")}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}><Droplets size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>오늘 점안</span></div>
          <div className="flex items-baseline gap-1"><span style={{ fontSize: 26, fontWeight: 800, color: C.primary }}>{done}</span><span style={{ fontSize: 15, color: C.sub, fontWeight: 600 }}>/ {scheduled.length}</span></div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>약 {meds.length}종 관리 중</div>
        </Card>
        <Card style={{ padding: 14 }} className="cursor-pointer" onClick={() => go("health")}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}><Footprints size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>오늘 활동</span></div>
          <div className="flex items-baseline gap-1"><span style={{ fontSize: 26, fontWeight: 800, color: C.primary }}>{WATCH.steps.toLocaleString()}</span><span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>걸음</span></div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>수면 {WATCH.sleepH}시간 {WATCH.sleepM}분</div>
        </Card>
      </div>

      <Card style={{ padding: 14 }} className="cursor-pointer" onClick={() => go("survey")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5"><ClipboardList size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>전자 문진</span></div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.gold, background: C.goldSoft, padding: "3px 9px", borderRadius: 999 }}>12개 항목</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>생활습관 문진을 완료하면 의료진이 안압 변화의 배경 요인을 함께 확인할 수 있어요.</div>
      </Card>
    </div>
  );
}

/* ============================================================
   IOP — 실시간 다회 측정
   ============================================================ */
function nowHM() { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }

function IOPScreen({ sessions, setSessions }) {
  const [mode, setMode] = useState("today");
  const [period, setPeriod] = useState("1개월");
  const [from, setFrom] = useState(RANGE_FROM_DEFAULT);
  const [to, setTo] = useState(RANGE_TO_DEFAULT);
  const [measuring, setMeasuring] = useState(false);
  const trendPts = period === "custom" ? trendDataRange(from, to) : trendData(period);

  const latest = sessions[sessions.length - 1];
  const baseOD = sessions.length ? sessions.reduce((a, s) => a + s.od, 0) / sessions.length : 16;
  const avg1 = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  const odVals = sessions.map((s) => s.od), osVals = sessions.map((s) => s.os);

  const measure = () => {
    setMeasuring(true);
    setTimeout(() => {
      const noise = () => (Math.random() - 0.5) * 1.6;
      const od = +(baseOD + noise()).toFixed(1);
      const os = +(15.4 + noise()).toFixed(1);
      const d = new Date();
      const tv = d.getHours() + d.getMinutes() / 60;
      setSessions((ss) => [...ss, { id: "s" + Date.now(), t: nowHM(), tv, od, os, ctx: "" }]);
      setMeasuring(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div><Eyebrow color={C.primary}>실시간 측정 · CVT200</Eyebrow><div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>안압 (IOP)</div></div>
        <DeviceChip icon={Bluetooth} label="CVT200" />
      </div>

      {/* Measure button */}
      <Card style={{ padding: 15 }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>지금 측정하기</div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>CVT200으로 측정하면 값이 실시간으로 기록됩니다. 하루에도 여러 번 측정할 수 있어요.</div>
          </div>
          <button onClick={measure} disabled={measuring}
            className="flex items-center gap-2 cursor-pointer"
            style={{ border: "none", borderRadius: 14, padding: "12px 18px", background: measuring ? C.mintDeep : C.primary, color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: FONT }}>
            {measuring ? <RefreshCw size={17} className="animate-spin" /> : <Gauge size={17} />}
            {measuring ? "측정 중" : "측정"}
          </button>
        </div>
      </Card>

      {/* latest */}
      <Card style={{ padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>최근 측정 · {latest.t}</span>
          <DeviceChip icon={Bluetooth} label="CVT200 연결됨" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <IOPGauge value={latest.od} target={PATIENT.targetOD} eye="OD" />
          <IOPGauge value={latest.os} target={PATIENT.targetOS} eye="OS" />
        </div>
      </Card>

      {/* mode toggle */}
      <div className="flex" style={{ background: "#fff", borderRadius: 12, padding: 3, border: `1px solid ${C.line}` }}>
        {[{ id: "today", t: "오늘 실시간" }, { id: "trend", t: "기간 추세" }].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className="cursor-pointer" style={{ flex: 1, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT, background: mode === m.id ? C.mint : "transparent", color: mode === m.id ? C.primary : C.sub }}>{m.t}</button>
        ))}
      </div>

      {mode === "today" ? (
        <Card style={{ padding: 16 }}>
          <SectionTitle icon={Clock}>오늘 측정 ({sessions.length}회)</SectionTitle>
          <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 10 }}>
            <DayStat eye="우안 OD" avg={avg1(odVals)} min={Math.min(...odVals)} max={Math.max(...odVals)} col={C.od} />
            <DayStat eye="좌안 OS" avg={avg1(osVals)} min={Math.min(...osVals)} max={Math.max(...osVals)} col={C.os} />
          </div>
          <div style={{ height: 150, marginTop: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <ReferenceArea y1={12} y2={PATIENT.targetOS + 1} fill={C.low} fillOpacity={0.08} />
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis type="number" dataKey="tv" domain={[6, 22]} ticks={[6, 10, 14, 18, 22]} tickFormatter={(v) => `${v}시`} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} />
                <YAxis type="number" domain={[12, 22]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={34} />
                <ReferenceLine y={PATIENT.targetOD} stroke={C.low} strokeDasharray="3 3" />
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} formatter={(v, n) => [`${v} mmHg`, n === "od" ? "우안" : "좌안"]} labelFormatter={() => ""} />
                <Scatter name="od" data={sessions} fill={C.odC} dataKey="od" />
                <Scatter name="os" data={sessions} fill={C.osC} dataKey="os" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4" style={{ marginTop: 4 }}><Legend c={C.odC} t="우안 OD" /><Legend c={C.osC} t="좌안 OS" /><Legend c={C.low} t="목표선" soft /></div>

          <div className="flex flex-col" style={{ marginTop: 8 }}>
            {[...sessions].reverse().map((s) => (
              <MeasureRow key={s.id} s={s} />
            ))}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 16 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <Activity size={17} color={C.primary} strokeWidth={2.2} />
            <span style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>기간 추세</span>
            <span style={{ fontSize: 11, color: C.sub }}>일자별 평균 · 일중 범위</span>
          </div>
          <PeriodPicker period={period} from={from} to={to}
            onPreset={setPeriod}
            onFrom={(v) => { setFrom(v); setPeriod("custom"); }}
            onTo={(v) => { setTo(v); setPeriod("custom"); }} />
          <div style={{ marginTop: 12 }}>
            <TrendChart data={trendPts} height={190} targetOS={PATIENT.targetOS} />
          </div>
          <TrendLegend />
          <div style={{ fontSize: 11, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
            각 날짜의 안압은 그날 여러 번 측정한 실시간 값의 <b>평균</b>이며, 음영은 <b>최소–최대 범위</b>(일중 변동)입니다.
          </div>
        </Card>
      )}
    </div>
  );
}

function MeasureRow({ s }) {
  const over = s.od > PATIENT.targetOD;
  return (
    <div className="flex items-center justify-between" style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>{s.t}</span>
        {s.ctx && <span style={{ fontSize: 10.5, color: C.sub }}>· {s.ctx}</span>}
      </div>
      <div className="flex items-center gap-3" style={{ fontVariantNumeric: "tabular-nums" }}>
        <span style={{ fontSize: 13, color: over ? C.high : C.odC, fontWeight: 700 }}>OD {s.od.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: C.osC, fontWeight: 700 }}>OS {s.os.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ============================================================
   DROPS — 약 선택/수기 입력
   ============================================================ */
function DropsScreen({ meds, setMeds }) {
  const [adding, setAdding] = useState(false);
  const toggle = (id) => setMeds((ms) => ms.map((m) => m.id === id ? { ...m, taken: !m.taken, at: !m.taken ? nowHM() : undefined } : m));
  const removeMed = (id) => setMeds((ms) => ms.filter((m) => m.id !== id));
  const scheduled = meds.filter((m) => m.time !== "필요 시");
  const rate = scheduled.length ? Math.round((scheduled.filter((m) => m.taken).length / scheduled.length) * 100) : 0;

  if (adding) return <AddMed onDone={(m) => { if (m) setMeds((ms) => [...ms, m]); setAdding(false); }} />;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div><Eyebrow color={C.primary}>점안제 투약</Eyebrow><div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>오늘의 점안</div></div>
        <DeviceChip icon={Bluetooth} label="스마트 점안 디바이스" />
      </div>

      <Card style={{ padding: 16 }}>
        <div className="flex items-center justify-between">
          <div><div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>오늘 순응도</div><div className="flex items-baseline gap-1"><span style={{ fontSize: 30, fontWeight: 800, color: C.primary }}>{rate}</span><span style={{ fontSize: 16, color: C.sub, fontWeight: 700 }}>%</span></div></div>
          <div style={{ fontSize: 12, color: C.sub }}>관리 약물 <b style={{ color: C.ink }}>{meds.length}</b>종</div>
        </div>
        <div style={{ height: 8, background: C.mint, borderRadius: 99, marginTop: 10, overflow: "hidden" }}><div style={{ width: `${rate}%`, height: "100%", background: C.primary, borderRadius: 99, transition: "width .3s" }} /></div>
      </Card>

      <div className="flex flex-col gap-2.5">
        {meds.map((m) => (
          <Card key={m.id} style={{ padding: 14, opacity: m.taken ? 0.72 : 1 }}>
            <div className="flex items-center gap-3">
              <div onClick={() => toggle(m.id)} className="cursor-pointer flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 13, background: m.taken ? C.low : C.mint, color: m.taken ? "#fff" : C.primary }}>
                {m.taken ? <Check size={22} strokeWidth={3} /> : <Droplets size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{m.name}</span>
                  {m.dose && <DoseBadge dose={m.dose} />}
                  <span style={{ fontSize: 11, color: C.sub }}>{m.eye}</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{m.ingr}{m.maker ? ` · ${m.maker}` : ""} · {m.freq}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div style={{ fontSize: 14, fontWeight: 800, color: m.taken ? C.low : C.ink, fontVariantNumeric: "tabular-nums" }}>{m.time}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{m.taken ? `${m.at || m.time} 완료` : m.src === "device" ? "자동 감지" : "수기 입력"}</div>
              </div>
              <Trash2 size={16} color={C.grey} className="cursor-pointer flex-shrink-0" onClick={() => removeMed(m.id)} />
            </div>
          </Card>
        ))}
      </div>

      <div onClick={() => setAdding(true)} className="flex items-center justify-center gap-2 cursor-pointer" style={{ padding: "13px 0", border: `1.5px dashed ${C.mintDeep}`, borderRadius: 16, color: C.primary, fontWeight: 700, fontSize: 13.5 }}>
        <Plus size={17} /> 약 추가 · 종류 선택 또는 직접 입력
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, textAlign: "center", lineHeight: 1.5 }}>스마트 점안 디바이스가 자동 기록하며, 미사용 시 체크로 수기 입력할 수 있어요.</div>
    </div>
  );
}

function AddMed({ onDone }) {
  const [tab, setTab] = useState("lib");
  const [sel, setSel] = useState(null);       // {name, ingr, maker, dose, def}
  const [customName, setCustomName] = useState("");
  const [customIngr, setCustomIngr] = useState("");
  const [customMaker, setCustomMaker] = useState("");
  const [customDose, setCustomDose] = useState("다회용");
  const [eye, setEye] = useState("양안");
  const [time, setTime] = useState("21:00");
  const [freq, setFreq] = useState("1일 1회");

  const chosen = tab === "lib" ? sel : (customName ? { name: customName, ingr: customIngr, maker: customMaker, dose: customDose } : null);
  const save = () => {
    if (!chosen) return;
    onDone({ id: "m" + Date.now(), name: chosen.name, ingr: chosen.ingr || "", maker: chosen.maker || "", dose: chosen.dose || "다회용", time, freq, eye, taken: false, src: (chosen.dose === "일회용" ? "manual" : "device") });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onDone(null)} style={{ color: C.primary }}><ChevronLeft size={20} /><span style={{ fontSize: 14, fontWeight: 700 }}>점안 목록</span></div>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>약 추가</div>

      <div className="flex" style={{ background: "#fff", borderRadius: 12, padding: 3, border: `1px solid ${C.line}` }}>
        {[{ id: "lib", t: "종류 선택" }, { id: "custom", t: "직접 입력" }].map((m) => (
          <button key={m.id} onClick={() => setTab(m.id)} className="cursor-pointer" style={{ flex: 1, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT, background: tab === m.id ? C.mint : "transparent", color: tab === m.id ? C.primary : C.sub }}>{m.t}</button>
        ))}
      </div>

      {tab === "lib" ? (
        <div className="flex flex-col gap-3">
          {DRUG_LIB.map((g) => (
            <div key={g.cat}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, letterSpacing: "0.02em" }}>{g.cat}</span>
              </div>
              <div className="flex flex-col gap-2">
                {g.items.map((it) => {
                  const on = sel && sel.name === it.name && sel.ingr === it.ingr;
                  return (
                    <div key={it.name} onClick={() => { setSel(it); setFreq(it.def.split(" · ")[0]); if (it.def.includes("취침")) setTime("21:00"); }} className="cursor-pointer flex items-center gap-3" style={{ padding: "11px 13px", borderRadius: 13, border: `1.5px solid ${on ? C.primary : (it.own ? C.mintDeep : C.line)}`, background: on ? C.mint : (it.own ? "#F4FAF9" : "#fff") }}>
                      <Pill size={17} color={on || it.own ? C.primary : C.grey} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}><span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{it.name}</span><DoseBadge dose={it.dose} small /></div>
                        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{it.maker} · {it.def}</div>
                      </div>
                      {on && <Check size={17} color={C.primary} strokeWidth={3} className="flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="약 이름"><input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="예: OO 점안액" style={inp} /></Field>
          <Field label="성분 (선택)"><input value={customIngr} onChange={(e) => setCustomIngr(e.target.value)} placeholder="예: 라타노프로스트" style={inp} /></Field>
          <Field label="제약회사 (선택)"><input value={customMaker} onChange={(e) => setCustomMaker(e.target.value)} placeholder="예: 대우제약" style={inp} /></Field>
          <Field label="제형"><ChoiceRow value={customDose} set={setCustomDose} opts={["일회용", "다회용"]} /></Field>
        </div>
      )}

      {chosen && (
        <Card style={{ padding: 14 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>점안 일정</span>
            {chosen.dose && <DoseBadge dose={chosen.dose} />}
            {chosen.maker && <span style={{ fontSize: 11, color: C.sub }}>{chosen.maker}</span>}
          </div>
          <Field label="점안 눈"><ChoiceRow value={eye} set={setEye} opts={["양안", "우안", "좌안"]} /></Field>
          <div style={{ height: 10 }} />
          <Field label="횟수"><ChoiceRow value={freq} set={setFreq} opts={["1일 1회", "1일 2회", "1일 3회", "필요 시"]} /></Field>
          <div style={{ height: 10 }} />
          <Field label="시간"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inp} /></Field>
          {chosen.dose === "일회용" && <div style={{ fontSize: 11, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>일회용(BFS)은 스마트 점안 디바이스 자동 감지가 어려워 <b>수기 입력</b>으로 기록됩니다.</div>}
        </Card>
      )}

      <button onClick={save} disabled={!chosen} className="cursor-pointer" style={{ border: "none", borderRadius: 14, padding: "14px 0", background: chosen ? C.primary : C.mintDeep, color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: FONT }}>약 추가하기</button>
    </div>
  );
}
const inp = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px", fontSize: 14, fontFamily: FONT, color: C.ink, outline: "none", boxSizing: "border-box" };
function Field({ label, children }) { return <div><div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 6 }}>{label}</div>{children}</div>; }
function ChoiceRow({ value, set, opts }) {
  return <div className="flex gap-2">{opts.map((o) => <button key={o} onClick={() => set(o)} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${value === o ? C.primary : C.line}`, background: value === o ? C.mint : "#fff", color: value === o ? C.primary : C.sub, borderRadius: 10, padding: "8px 0", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>{o}</button>)}</div>;
}

/* ============================================================
   HEALTH (watch)
   ============================================================ */
function HealthScreen() {
  const stepPct = Math.min(100, Math.round((WATCH.steps / WATCH.stepGoal) * 100));
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div><Eyebrow color={C.primary}>워치 연동 · 건강</Eyebrow><div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>건강 데이터</div></div>
        <DeviceChip icon={Watch} label={WATCH.device} />
      </div>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5, marginTop: -6 }}>갤럭시·애플워치의 활동·수면·심박 리듬을 자동 수집합니다. 연동 항목은 문진 자동값으로 우선 반영돼요.</div>

      <Card style={{ padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="flex items-center gap-2"><Footprints size={18} color={C.primary} /><span style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>활동량 (걸음 수)</span></div>
          <span style={{ fontSize: 11, color: C.gold, background: C.goldSoft, padding: "3px 8px", borderRadius: 999, fontWeight: 700 }}>Q9 자동 반영</span>
        </div>
        <div className="flex items-baseline gap-1.5"><span style={{ fontSize: 30, fontWeight: 800, color: C.primary, fontVariantNumeric: "tabular-nums" }}>{WATCH.steps.toLocaleString()}</span><span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}>/ {WATCH.stepGoal.toLocaleString()} 걸음</span></div>
        <div style={{ height: 8, background: C.mint, borderRadius: 99, marginTop: 9, overflow: "hidden" }}><div style={{ width: `${stepPct}%`, height: "100%", background: C.aqua, borderRadius: 99 }} /></div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 7, lineHeight: 1.5 }}>유산소 활동은 안압을 낮추고 눈 혈류를 개선합니다. 주 평균 <b>7,100걸음</b>.</div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card style={{ padding: 15 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}><Moon size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>수면</span></div>
          <div className="flex items-baseline gap-1"><span style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>{WATCH.sleepH}</span><span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>시간</span><span style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginLeft: 2 }}>{WATCH.sleepM}</span><span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>분</span></div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>질 {WATCH.sleepQuality} · <span style={{ color: C.gold, fontWeight: 700 }}>Q10 반영</span></div>
        </Card>
        <Card style={{ padding: 15 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}><HeartPulse size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>심박 리듬</span></div>
          <div className="flex items-baseline gap-1"><span style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>{WATCH.hr}</span><span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>bpm</span></div>
          <div style={{ fontSize: 11.5, color: WATCH.irn ? C.high : C.low, marginTop: 3, fontWeight: 700 }}>{WATCH.irn ? "불규칙 맥박 감지" : "정상 리듬"}</div>
        </Card>
      </div>

      {WATCH.irn && (
        <Card style={{ padding: 14, background: C.highSoft, border: "1px solid #F1CFC6" }}>
          <div className="flex items-start gap-2.5"><AlertTriangle size={17} color={C.high} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: "#8A3A2A", lineHeight: 1.55 }}><b>불규칙 맥박 알림(IRN)</b>이 {WATCH.irnDate}에 감지되어 <b>문진 Q11</b>에 자동 병기되었습니다. 선별 신호이며 확진이 아니므로 심장내과 <b>심전도(ECG)</b> 확인을 권장합니다.</div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   SURVEY — 12 항목 전체
   ============================================================ */
function SurveyScreen() {
  const [open, setOpen] = useState(null);
  const [answers, setAnswers] = useState({}); // {subId: value(single=idx / multi=[idx] / packyear={cig,yr})}

  const isDone = (q) => q.subs.filter((s) => !s.showIf || s.showIf(answers)).every((s) => answers[s.id] != null && (s.type !== "multi" || answers[s.id].length > 0));
  const qRisk = (q) => {
    let worst = 0; const rank = { 저: 1, 중: 2, 고: 3 };
    q.subs.forEach((s) => { if (!s.opts) return; const a = answers[s.id]; if (a == null) return; const idxs = Array.isArray(a) ? a : [a]; idxs.forEach((i) => { const r = s.opts[i] && s.opts[i].r; if (rank[r] > worst) worst = rank[r]; }); });
    return worst ? Object.keys(rank).find((k) => rank[k] === worst) : null;
  };
  const doneCount = Q.filter(isDone).length;

  if (open) {
    const q = Q.find((x) => x.id === open);
    return <QuestionDetail q={q} answers={answers} setAnswers={setAnswers} back={() => setOpen(null)} />;
  }

  const grouped = FREQ_ORDER.map((f) => ({ f, items: Q.filter((q) => q.freq === f) })).filter((g) => g.items.length);

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <Eyebrow color={C.primary}>전자 문진</Eyebrow>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>생활습관 문진 · 12항목</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, lineHeight: 1.5 }}>기기가 자동으로 못 담는 행동·자세·복약 맥락을 모아 의료진에게 전달합니다.</div>
      </div>

      <Card style={{ padding: 14 }}>
        <div className="flex items-center justify-between"><span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>완료</span><span style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>{doneCount} / 12</span></div>
        <div style={{ height: 7, background: C.mint, borderRadius: 99, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${(doneCount / 12) * 100}%`, height: "100%", background: C.primary, borderRadius: 99, transition: "width .3s" }} /></div>
      </Card>

      {grouped.map((g) => (
        <div key={g.f}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}><FreqBadge f={g.f} /><span style={{ fontSize: 11.5, color: C.sub }}>{g.items.length}개 항목</span></div>
          <div className="flex flex-col gap-2.5">
            {g.items.map((q) => {
              const done = isDone(q);
              return (
                <Card key={q.id} style={{ padding: 14 }} className="cursor-pointer" onClick={() => setOpen(q.id)}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: done ? C.lowSoft : C.mint, color: done ? C.low : C.primary }}>
                      {done ? <Check size={19} strokeWidth={3} /> : <q.icon size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>{q.id}</span>
                        {done && <span style={{ fontSize: 10, color: C.low, fontWeight: 700 }}>완료</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 2 }}>{q.title}</div>
                    </div>
                    <ChevronRight size={18} color={C.sub} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionDetail({ q, answers, setAnswers, back }) {
  const setSingle = (sid, i) => setAnswers((a) => ({ ...a, [sid]: i }));
  const toggleMulti = (sid, i, exclusiveLast, lastIdx) => setAnswers((a) => {
    let cur = Array.isArray(a[sid]) ? [...a[sid]] : [];
    if (exclusiveLast && i === lastIdx) return { ...a, [sid]: cur.includes(i) ? [] : [i] };
    cur = cur.filter((x) => x !== lastIdx);
    cur = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
    return { ...a, [sid]: cur };
  });
  const setPY = (sid, key, val) => setAnswers((a) => ({ ...a, [sid]: { ...(a[sid] || {}), [key]: val } }));

  const visibleSubs = q.subs.filter((s) => !s.showIf || s.showIf(answers));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 cursor-pointer" onClick={back} style={{ color: C.primary }}><ChevronLeft size={20} /><span style={{ fontSize: 14, fontWeight: 700 }}>문진 목록</span></div>

      <div>
        <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{q.id}</span><FreqBadge f={q.freq} />
          {q.watchLink && <span style={{ fontSize: 10.5, color: C.gold, background: C.goldSoft, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{q.watchLink}</span>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{q.title}</div>
      </div>

      {visibleSubs.map((s) => (
        <div key={s.id} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, fontWeight: 800, color: C.primary, background: C.mint, padding: "2px 7px", borderRadius: 6 }}>{s.id}</span>
            {s.type === "multi" && <span style={{ fontSize: 10.5, color: C.sub }}>복수 선택</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.45 }}>{s.q}</div>

          {s.type === "packyear" ? (
            <PackYear v={answers[s.id]} set={(k, val) => setPY(s.id, k, val)} />
          ) : (
            <div className="flex flex-col gap-2">
              {s.opts.map((o, i) => {
                const multi = s.type === "multi";
                const arr = Array.isArray(answers[s.id]) ? answers[s.id] : [];
                const on = multi ? arr.includes(i) : answers[s.id] === i;
                return (
                  <div key={i} onClick={() => multi ? toggleMulti(s.id, i, true, s.opts.length - 1) : setSingle(s.id, i)} className="cursor-pointer"
                    style={{ padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${on ? C.primary : C.line}`, background: on ? C.mint : "#fff" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {multi && <span className="flex items-center justify-center flex-shrink-0" style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${on ? C.primary : C.mintDeep}`, background: on ? C.primary : "#fff" }}>{on && <Check size={13} color="#fff" strokeWidth={3.5} />}</span>}
                        <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 600, color: C.ink, lineHeight: 1.4 }}>{o.t}</span>
                      </div>
                      {!multi && on && <Check size={17} color={C.primary} strokeWidth={3} className="flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.5, padding: "4px 2px 0", borderTop: `1px solid ${C.line}` }}>
        <b style={{ color: C.primary }}>의료진 웹 전송:</b> {q.save}<br />
        위험도 평가와 맞춤 안내는 의료진 웹에서 제공됩니다.
      </div>

      <div className="flex gap-2.5" style={{ marginTop: 4 }}>
        <button onClick={back} className="cursor-pointer" style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 13, padding: "13px 0", fontSize: 14, fontWeight: 700, fontFamily: FONT, width: 110 }}>이전</button>
        <button onClick={back} className="cursor-pointer" style={{ flex: 1, border: "none", background: C.primary, color: "#fff", borderRadius: 13, padding: "13px 0", fontSize: 15, fontWeight: 800, fontFamily: FONT }}>저장</button>
      </div>
    </div>
  );
}
function Feedback({ r, text }) {
  const m = RISK[r] || RISK["-"];
  return (
    <Card style={{ padding: 13, background: m.soft, border: `1px solid ${m.c}30` }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 5 }}><Sparkles size={14} color={m.c} /><span style={{ fontSize: 11.5, fontWeight: 800, color: m.c }}>맞춤 안내</span><RiskPill r={r} small /></div>
      <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>{text}</div>
    </Card>
  );
}
function PackYear({ v, set }) {
  const cig = v?.cig ?? "", yr = v?.yr ?? "";
  const py = cig && yr ? +((cig / 20) * yr).toFixed(1) : null;
  const msg = py == null ? null : py < 10 ? ["저", "현재까지 흡연량은 비교적 낮은 편이나, 금연이 시야 보호에 도움이 됩니다."] : py < 20 ? ["중", "중등도 누적 흡연량입니다. 금연이 시야 진행 위험을 낮추는 데 도움이 됩니다."] : ["고", "20 pack-year 이상 누적 흡연은 녹내장 시야 진행 속도와 관련됩니다. 금연을 강력히 권장합니다."];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2.5">
        <div className="flex-1"><div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 5 }}>일평균 (개비/일)</div><input type="number" value={cig} onChange={(e) => set("cig", e.target.value)} placeholder="20" style={inp} /></div>
        <div className="flex-1"><div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 5 }}>흡연 기간 (년)</div><input type="number" value={yr} onChange={(e) => set("yr", e.target.value)} placeholder="15" style={inp} /></div>
      </div>
      {py != null && (
        <Card style={{ padding: 12, background: RISK[msg[0]].soft, border: `1px solid ${RISK[msg[0]].c}30` }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 5 }}><span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>Pack-year 자동 계산: {py}</span><RiskPill r={msg[0]} small /></div>
          <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>{msg[1]}</div>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   PHONE SHELL
   ============================================================ */
const TABS = [
  { id: "home", label: "홈", icon: Home }, { id: "iop", label: "안압", icon: Eye },
  { id: "drops", label: "점안", icon: Droplets }, { id: "survey", label: "문진", icon: ClipboardList },
  { id: "health", label: "건강", icon: Watch },
];
function PatientApp() {
  const [tab, setTab] = useState("home");
  const [meds, setMeds] = useState(MEDS_INIT);
  const [sessions, setSessions] = useState(SESSIONS_INIT);
  return (
    <div style={{ width: 380, maxWidth: "100%", height: 800, background: C.bg, borderRadius: 40, border: "10px solid #10262B", overflow: "hidden", position: "relative", boxShadow: "0 30px 70px -30px rgba(8,52,62,.5)" }}>
      <div className="flex items-center justify-between" style={{ padding: "13px 24px 6px", fontSize: 12.5, fontWeight: 700, color: C.ink }}>
        <span>9:41</span><div className="flex items-center gap-1.5" style={{ color: C.primary }}><Bluetooth size={13} /><Watch size={13} /><span style={{ fontSize: 11 }}>●●●</span></div>
      </div>
      <div className="flex items-center justify-between" style={{ padding: "2px 22px 10px" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 9, background: C.primary }}><Eye size={17} color="#fff" /></div>
          <div><div style={{ fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1 }}>안압케어</div><div style={{ fontSize: 9.5, color: C.sub, letterSpacing: "0.05em" }}>CVT200 · 녹내장 통합관리</div></div>
        </div>
        <div style={{ position: "relative" }}><Bell size={20} color={C.sub} /><span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 99, background: C.high }} /></div>
      </div>
      <div style={{ height: 656, overflowY: "auto", padding: "6px 18px 20px" }}>
        {tab === "home" && <HomeScreen meds={meds} sessions={sessions} go={setTab} />}
        {tab === "iop" && <IOPScreen sessions={sessions} setSessions={setSessions} />}
        {tab === "drops" && <DropsScreen meds={meds} setMeds={setMeds} />}
        {tab === "survey" && <SurveyScreen />}
        {tab === "health" && <HealthScreen />}
      </div>
      <div className="flex items-center justify-around" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 66, background: "rgba(255,255,255,.94)", borderTop: `1px solid ${C.line}`, backdropFilter: "blur(8px)" }}>
        {TABS.map((t) => { const on = tab === t.id; return (
          <div key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-1 cursor-pointer" style={{ flex: 1, paddingTop: 4 }}>
            <t.icon size={21} color={on ? C.primary : C.sub} strokeWidth={on ? 2.5 : 2} /><span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, color: on ? C.primary : C.sub }}>{t.label}</span>
          </div>
        ); })}
      </div>
    </div>
  );
}

/* ============================================================
   CLINICIAN WEB
   ============================================================ */
function ClinicianWeb() {
  const [iopMode, setIopMode] = useState("today");
  const [iopPeriod, setIopPeriod] = useState("1개월");
  const [iopFrom, setIopFrom] = useState(RANGE_FROM_DEFAULT);
  const [iopTo, setIopTo] = useState(RANGE_TO_DEFAULT);
  const [corrPeriod, setCorrPeriod] = useState("1개월");
  const [corrFrom, setCorrFrom] = useState(RANGE_FROM_DEFAULT);
  const [corrTo, setCorrTo] = useState(RANGE_TO_DEFAULT);
  const iopTrendPts = iopPeriod === "custom" ? trendDataRange(iopFrom, iopTo) : trendData(iopPeriod);
  const corr = corrPeriod === "custom" ? adhIopDataRange(corrFrom, corrTo) : adhIopData(corrPeriod);
  const flags = [
    { t: "우안(OD) 안압 목표 초과", d: "12:10 측정 17.2 (목표 15) · 오늘 3회 중 1회 초과", r: "고", icon: Eye },
    { t: "워치 불규칙 맥박(IRN) · 미확진", d: "6/30 감지 → Q11 자동 병기 · ECG 확인 권고", r: "중", icon: HeartPulse },
    { t: "수면 부족 + 야간 저혈압 소인", d: "Q10 6시간 미만 · Q3 취침 전 혈압약", r: "중", icon: Moon },
  ];
  const survey = [
    { id: "Q1", t: "수면 자세", v: "옆으로 누움 / 베개 겹침", r: "중", g: "옆으로 자면 아래쪽 눈의 안압이 높아질 수 있습니다. 침대 머리를 20~30° 올리도록 안내하세요." },
    { id: "Q2", t: "수면무호흡", v: "진단 없음 · 증상 1", r: "-", g: "선별 증상 1개. 증상이 늘면 수면 클리닉·이비인후과 상담을 고려하세요." },
    { id: "Q3", t: "혈압약 시점", v: "취침 전 복용", r: "고", g: "취침 전 복용은 야간 저혈압으로 시신경 관류를 낮출 수 있습니다. 복용 시점 조정을 내과와 상의하도록 권고하세요." },
    { id: "Q4", t: "동반질환", v: "제2형 당뇨 HbA1c 7~8% · 고혈압 1단계", r: "중", g: "혈당·혈압 조절 강화 권고. 야간 혈압 패턴이 시신경 관류에 영향을 줄 수 있어 함께 확인하세요." },
    { id: "Q5", t: "안압 유발 행동", v: "고중량 발살바 · 눈 비빔", r: "고", g: "발살바 동반 고중량 운동·눈 비빔은 안압을 급상승시킵니다. 호흡법 교정과 행동 수정을 안내하세요." },
    { id: "Q6", t: "흡연", v: "과거 흡연 · 12 pack-year · 금연 3년", r: "중", g: "금연 3년 유지 중. 지속 금연이 시야 진행 위험 감소에 도움이 됨을 격려하세요." },
    { id: "Q7", t: "카페인", v: "1~2잔 · 진한 커피 가끔", r: "저", g: "적정 범위. 안압이 잘 조절되면 현재 수준을 유지해도 됩니다." },
    { id: "Q8", t: "식이", v: "잎채소 주 3~5회 · 한식", r: "저", g: "충분한 잎채소 섭취. 가능하면 매일로 늘리도록 안내하세요." },
    { id: "Q9", t: "유산소 운동", v: "주 1~2회 · 저강도 (워치 7.1k보)", r: "중", g: "중강도 주 3회·회당 30분을 목표로 점진적 증가를 권고하세요." },
    { id: "Q10", t: "수면 시간·질", v: "6시간 미만 · 자주 깸", r: "중", g: "수면 부족·불량. 약 7시간 규칙적 수면을 권고하고, 지속 시 수면 클리닉을 안내하세요." },
    { id: "Q11", t: "부정맥·AF", v: "진단 없음 + 워치 IRN(미확진)", r: "중", g: "워치 IRN 미확진. 심장내과 심전도(ECG) 확인을 권고하세요." },
    { id: "Q12", t: "음주", v: "주 2~3회 · 2~3잔", r: "중", g: "잦은 음주는 안압을 다소 높일 수 있습니다. 빈도·양 절주를 권고하세요." },
  ];
  const meds = [
    { name: "잘타라노 점안액", cls: "PG 유사체", ingr: "라타노프로스트", maker: "대우제약", dose: "일회용", sched: "1일 1회 · 취침 전", src: "수기 기록", adh: 90 },
    { name: "콤비간 점안액", cls: "복합제 (α2+β)", ingr: "브리모니딘+티몰롤", maker: "한국애브비", dose: "다회용", sched: "1일 2회 · 08·20시", src: "스마트 디바이스", adh: 94 },
    { name: "리안점안액", cls: "인공눈물", ingr: "히알루론산 0.15%", maker: "삼일제약", dose: "일회용", sched: "필요 시", src: "수기 기록", adh: null },
  ];
  return (
    <div style={{ width: 900, maxWidth: "100%", background: C.card, borderRadius: 22, border: `1px solid ${C.line}`, overflow: "hidden", boxShadow: "0 30px 70px -35px rgba(8,52,62,.35)" }}>
      <div className="flex items-center justify-between" style={{ padding: "14px 22px", background: C.primaryDeep }}>
        <div className="flex items-center gap-2.5"><Stethoscope size={19} color="#fff" /><span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>안압케어 의료진 웹</span><span style={{ fontSize: 11.5, color: "#9FC4C6" }}>환자 모니터링 대시보드</span></div>
        <span style={{ fontSize: 11.5, color: "#9FC4C6" }}>동기화 · 방금 전</span>
      </div>

      <div className="flex items-center justify-between" style={{ padding: "16px 22px", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 13, background: C.mint }}><User size={22} color={C.primary} /></div>
          <div>
            <div className="flex items-center gap-2"><span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{PATIENT.name}</span><span style={{ fontSize: 12.5, color: C.sub }}>{PATIENT.age}세 · {PATIENT.dx}</span></div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>목표 안압 OD {PATIENT.targetOD} / OS {PATIENT.targetOS} mmHg · 다음 진료 7/18</div>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.high, background: C.highSoft, padding: "6px 12px", borderRadius: 10 }}>검토 필요 · 플래그 {flags.length}</span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4" style={{ gap: 0 }}>
        {[
          { l: "오늘 측정", v: "3", u: "회", sub: "실시간 다회 기록", c: C.primary },
          { l: "최근 OD", v: "17.2", u: "mmHg", sub: "목표 15 · +2.2", c: C.high },
          { l: "이번 주 순응도", v: "92", u: "%", sub: "점안 자동 기록", c: C.low },
          { l: "문진 위험 플래그", v: "6", u: "건", sub: "고 3 · 중 3", c: C.mid },
        ].map((k, i) => (
          <div key={i} style={{ padding: "15px 20px", borderRight: i < 3 ? `1px solid ${C.line}` : "none" }}>
            <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{k.l}</div>
            <div className="flex items-baseline gap-1" style={{ marginTop: 3 }}><span style={{ fontSize: 26, fontWeight: 800, color: k.c }}>{k.v}</span><span style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{k.u}</span></div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="col-span-2" style={{ padding: 20, borderRight: `1px solid ${C.line}` }}>
          {/* IOP: 오늘 실시간 / 기간 추세 */}
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>안압 (CVT200)</span>
            <div className="flex" style={{ background: C.bg, borderRadius: 9, padding: 2, border: `1px solid ${C.line}` }}>
              {[{ id: "today", t: "오늘 실시간" }, { id: "trend", t: "기간 추세" }].map((m) => (
                <button key={m.id} onClick={() => setIopMode(m.id)} className="cursor-pointer" style={{ border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT, background: iopMode === m.id ? "#fff" : "transparent", color: iopMode === m.id ? C.primary : C.sub, boxShadow: iopMode === m.id ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{m.t}</button>
              ))}
            </div>
          </div>
          {iopMode === "trend" && <div style={{ marginBottom: 10 }}><PeriodPicker period={iopPeriod} from={iopFrom} to={iopTo} onPreset={setIopPeriod} onFrom={(v) => { setIopFrom(v); setIopPeriod("custom"); }} onTo={(v) => { setIopTo(v); setIopPeriod("custom"); }} /></div>}
          {iopMode === "today" ? (
            <>
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <ReferenceArea y1={12} y2={16} fill={C.low} fillOpacity={0.08} />
                    <CartesianGrid stroke={C.line} vertical={false} />
                    <XAxis type="number" dataKey="tv" domain={[6, 22]} ticks={[6, 10, 14, 18, 22]} tickFormatter={(v) => `${v}시`} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} />
                    <YAxis type="number" domain={[12, 22]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={34} />
                    <ReferenceLine y={15} stroke={C.low} strokeDasharray="3 3" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} />
                    <Scatter data={SESSIONS_INIT} dataKey="od" fill={C.odC} />
                    <Scatter data={SESSIONS_INIT} dataKey="os" fill={C.osC} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4" style={{ marginTop: 4, marginBottom: 14 }}><Legend c={C.odC} t="우안 OD" /><Legend c={C.osC} t="좌안 OS" /><Legend c={C.low} t="목표선" soft /></div>
            </>
          ) : (
            <>
              <TrendChart data={iopTrendPts} height={160} targetOS={16} />
              <div style={{ marginBottom: 14 }}><TrendLegend /></div>
            </>
          )}

          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 8 }}>우선 검토 플래그</div>
          <div className="flex flex-col gap-2">
            {flags.map((f, i) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: "10px 13px", borderRadius: 12, background: RISK[f.r] ? RISK[f.r].soft : C.mint }}>
                <f.icon size={17} color={(RISK[f.r] || RISK["-"]).c} className="flex-shrink-0" />
                <div className="flex-1"><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{f.t}</div><div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{f.d}</div></div>
                <RiskPill r={f.r} small />
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}><ListChecks size={15} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>문진 12항목</span></div>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 10 }}>환자 앱 응답 → 자동 저장 · <span style={{ color: C.primary, fontWeight: 700 }}>위험도에 마우스를 올리면 맞춤 안내</span></div>
          <div className="flex flex-col" style={{ maxHeight: 430, overflowY: "auto" }}>
            {survey.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2" style={{ padding: "8px 0", borderBottom: i < survey.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, width: 26, flexShrink: 0 }}>{s.id}</span>
                <div className="flex-1 min-w-0"><div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{s.t}</div><div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{s.v}</div></div>
                <RiskPillHover r={s.r} tip={s.g} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 처방 점안제 */}
      <div style={{ padding: "18px 22px", borderTop: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="flex items-center gap-2"><Droplets size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>처방 점안제</span><span style={{ fontSize: 11, color: C.sub }}>제약회사 · 제형 · 순응도</span></div>
          <span style={{ fontSize: 11.5, color: C.sub }}>이번 주 평균 순응도 <b style={{ color: C.low }}>92%</b></span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "2.4fr 1.3fr 0.9fr 1.5fr 0.8fr", fontSize: 10.5, color: C.sub, fontWeight: 700, padding: "0 4px 8px", borderBottom: `1px solid ${C.line}` }}>
          <span>제품 · 성분</span><span>제약회사</span><span>제형</span><span>용법 · 기록방식</span><span style={{ textAlign: "right" }}>순응도</span>
        </div>
        {meds.map((m, i) => (
          <div key={i} className="grid items-center" style={{ gridTemplateColumns: "2.4fr 1.3fr 0.9fr 1.5fr 0.8fr", padding: "11px 4px", borderBottom: i < meds.length - 1 ? `1px solid ${C.line}` : "none" }}>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{m.name}</div><div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{m.cls} · {m.ingr}</div></div>
            <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{m.maker}</span>
            <span><DoseBadge dose={m.dose} /></span>
            <div><div style={{ fontSize: 12, color: C.ink }}>{m.sched}</div><div style={{ fontSize: 10.5, color: m.src === "스마트 디바이스" ? C.low : C.sub, fontWeight: 600 }}>{m.src}</div></div>
            <div style={{ textAlign: "right" }}>{m.adh != null ? <span style={{ fontSize: 14, fontWeight: 800, color: m.adh >= 80 ? C.low : C.mid }}>{m.adh}%</span> : <span style={{ fontSize: 11.5, color: C.sub }}>필요 시</span>}</div>
          </div>
        ))}
      </div>

      {/* 점안–안압 상관 (병렬 시각화) */}
      <div style={{ padding: "18px 22px", borderTop: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-2"><Droplets size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>점안 순응도 ↔ 안압</span><span style={{ fontSize: 11, color: C.sub }}>점안 누락 구간의 안압 변동</span></div>
          <span style={{ fontSize: 11, color: C.high, background: C.highSoft, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>누락 {corr.filter((e) => e.missed).length}회</span>
        </div>
        <div style={{ marginBottom: 10 }}><PeriodPicker period={corrPeriod} from={corrFrom} to={corrTo} onPreset={setCorrPeriod} onFrom={(v) => { setCorrFrom(v); setCorrPeriod("custom"); }} onTo={(v) => { setCorrTo(v); setCorrPeriod("custom"); }} /></div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>
          안압선(우안·좌안)과 점안 순응도 막대를 같은 축 위에 나란히 표시하는 <b>병렬 시각화</b>입니다. 누락 구간(붉은 점)에 안압이 함께 상승하는지 육안으로 확인하세요.
        </div>
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={corr} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <ReferenceArea yAxisId="l" y1={12} y2={16} fill={C.low} fillOpacity={0.07} />
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="d" interval="preserveStartEnd" minTickGap={16} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" domain={[12, 22]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={34} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9.5, fill: C.grey }} axisLine={false} tickLine={false} width={34} />
              <ReferenceLine yAxisId="l" y={15} stroke={C.low} strokeDasharray="3 3" />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} formatter={(v, n) => n === "adh" ? [`${v}%`, "순응도"] : [`${v} mmHg`, n === "od" ? "우안" : "좌안"]} />
              <Bar yAxisId="r" dataKey="adh" name="adh" barSize={14} radius={[3, 3, 0, 0]}>
                {corr.map((e, i) => <Cell key={i} fill={e.missed ? "#F2C9C0" : C.mintDeep} />)}
              </Bar>
              <Line yAxisId="l" type="monotone" dataKey="od" name="od" stroke={C.odC} strokeWidth={2.4} dot={<AdhIopDot />} />
              <Line yAxisId="l" type="monotone" dataKey="os" name="os" stroke={C.osC} strokeWidth={2.4} dot={<AdhIopDot />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: 6 }}>
          <Legend c={C.odC} t="우안 OD" /><Legend c={C.osC} t="좌안 OS" /><Legend c={C.high} t="점안 누락일" /><Legend c={C.mintDeep} t="순응도(%)" />
        </div>
        <div style={{ fontSize: 10.5, color: C.sub, marginTop: 10, lineHeight: 1.5, background: C.bg, borderRadius: 10, padding: "9px 11px" }}>
          <b style={{ color: C.primary }}>해석 안내:</b> 통계적 인과 판정이 아닌 두 데이터의 병렬 제시입니다. 안압 변동은 점안 외 수면 자세·야간 혈압·측정 시각 등 여러 요인의 영향을 받으므로, 임상적 판단의 참고 자료로만 활용하세요. (SaMD 표시 경계 준수)
        </div>
      </div>

      <div style={{ padding: "12px 22px", borderTop: `1px solid ${C.line}`, fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
        <b style={{ color: C.primary }}>데이터 출처:</b> 안압 CVT200 실시간 다회 측정 · 점안 스마트 디바이스/수기 · 활동·수면·심박 리듬 Galaxy/Apple Watch · 생활습관 전자문진 12항목.
      </div>
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
export default function App() {
  const [view, setView] = useState("patient");
  return (
    <div style={{ fontFamily: FONT, background: "#E9F0EF", minHeight: "100vh", padding: "28px 16px 48px" }}>
      <style>{`.animate-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div className="flex flex-col items-center" style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", color: C.primary, fontWeight: 800 }}>C&V TECH · CVT200 COMPANION</div>
          <h1 style={{ fontSize: 25, fontWeight: 800, color: C.ink, margin: "5px 0 3px" }}>안압케어 — 녹내장 통합관리</h1>
          <div style={{ fontSize: 13, color: C.sub, textAlign: "center", maxWidth: 560, lineHeight: 1.5 }}>실시간 안압 다회 측정·점안(약 선택/수기)·전자문진 12항목·워치 헬스를 한 앱에서 관리하고, 의미 있는 데이터를 의료진 웹으로 전송합니다.</div>
          <div className="flex items-center" style={{ marginTop: 16, background: "#fff", borderRadius: 999, padding: 4, border: `1px solid ${C.line}` }}>
            {[{ id: "patient", label: "환자 앱", icon: Smartphone }, { id: "clinician", label: "의료진 웹", icon: Stethoscope }].map((v) => {
              const on = view === v.id;
              return <button key={v.id} onClick={() => setView(v.id)} className="flex items-center gap-2 cursor-pointer" style={{ border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 13.5, fontWeight: 700, fontFamily: FONT, background: on ? C.primary : "transparent", color: on ? "#fff" : C.sub }}><v.icon size={16} /> {v.label}</button>;
            })}
          </div>
        </div>

        <div className="flex justify-center">{view === "patient" ? <PatientApp /> : <ClinicianWeb />}</div>

        <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginTop: 26, fontSize: 12, color: C.sub }}>
          <Flow icon={Bluetooth} t="CVT200 안압(실시간 다회)" /><Send size={13} color={C.mintDeep} />
          <Flow icon={Droplets} t="스마트 점안 / 수기" /><Send size={13} color={C.mintDeep} />
          <Flow icon={Watch} t="갤럭시·애플워치" /><Send size={13} color={C.mintDeep} />
          <Flow icon={ClipboardList} t="전자 문진 12항목" /><Send size={13} color={C.mintDeep} />
          <Flow icon={Stethoscope} t="의료진 웹" strong />
        </div>
      </div>
    </div>
  );
}
function Flow({ icon: Ic, t, strong }) {
  return <span className="inline-flex items-center gap-1.5" style={{ padding: "5px 11px", borderRadius: 999, background: strong ? C.primary : "#fff", color: strong ? "#fff" : C.ink, border: `1px solid ${strong ? C.primary : C.line}`, fontWeight: 600, fontSize: 12 }}><Ic size={13} /> {t}</span>;
}
