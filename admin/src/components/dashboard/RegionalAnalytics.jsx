import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { BarChart3, Download, Info } from 'lucide-react';
import { fetchStats } from '../../lib/api';

/* ============================================================================
 * Kshetriya vishleshan — sirf ginne ja sakne wali cheezein
 *
 * PEHLE KYA THA
 *   "Crop Loss Prevented ₹450 Cr", "38% chemical reduction", "SLA 4.2 hrs"
 *   — ek "Impact Scorecard" jiska har number ek JS file me haath se likha
 *   tha. Aise number sarkari report me chale jate hain aur budget unhi par
 *   banta hai. Jo maapa nahi gaya use maapa hua dikhana sabse mehenga
 *   jhooth hai.
 *
 * AB KYA HAI
 *   Wahi jo hum sach me gin sakte hain — kisano ki bheji hui jaanchein:
 *   fasal ke hisaab se, zile ke hisaab se, aur unka status.
 *
 *   "Kitni fasal bachi" jaisa aarthik asar tab hi aayega jab ropit rakba,
 *   upaj aur mandi bhav jud jayein. Tab tak wo khana khaali hai — aur
 *   kyun khaali hai, wo bhi likha hai.
 *
 *   Report download ab asli hai: jo aankde screen par hain, wahi CSV me
 *   utarte hain (pehle sirf ek alert() khulta tha).
 * ========================================================================= */

const BARS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export default function RegionalAnalytics({ currentLanguage }) {
  const hi = currentLanguage === 'hi';
  const [stats, setStats] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const d = await fetchStats();
      if (!alive) return;
      if (d && d.ok) { setStats(d); setState('ok'); }
      else setState(d && d.error === 'login' ? 'login' : 'error');
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const m = (stats && stats.metrics) || {};
  const toRows = (obj) =>
    Object.entries(obj || {}).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 10);

  const byCrop = toRows(stats && stats.byCrop);
  const byDistrict = toRows(stats && stats.byDistrict);

  const downloadCsv = () => {
    const lines = [['खंड', 'नाम', 'संख्या']];
    Object.entries(m).forEach(([k, v]) => lines.push(['सारांश', k, v === null ? '' : v]));
    byCrop.forEach(r => lines.push(['फसल', r.name, r.value]));
    byDistrict.forEach(r => lines.push(['ज़िला', r.name, r.value]));
    (stats && stats.clusters ? stats.clusters : []).forEach(c =>
      lines.push(['क्लस्टर', c.district + ' — ' + c.disease, c.scanCount]));

    /* ﻿ = BOM. Iske bina Excel me Hindi "à¤§à¤¾à¤¨" jaisi tooti dikhti hai. */
    const csv = '﻿' + lines.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vridhi-ai-aankde-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const Tile = ({ label, value, sub }) => (
    <div className="agri-card p-3.5">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <p className="text-2xl font-extrabold text-gray-900 mt-1.5">
        {value === null || value === undefined ? '—' : value.toLocaleString('en-IN')}
      </p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">

      <div className="agri-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>{hi ? 'जाँचों के आँकड़े' : 'Scan analytics'}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {hi
              ? 'किसानों की ऐप से आए असली रिकॉर्ड — फसल, ज़िला और स्थिति के हिसाब से।'
              : 'Real records from the farmer app — by crop, district and status.'}
          </p>
        </div>

        <button
          onClick={downloadCsv}
          disabled={state !== 'ok'}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{hi ? 'CSV डाउनलोड' : 'Download CSV'}</span>
        </button>
      </div>

      {state === 'login' && (
        <div className="agri-card p-4 text-xs font-semibold text-amber-800 bg-amber-50 border-amber-200">
          {hi ? 'सत्र समाप्त — दोबारा लॉगिन कीजिए।' : 'Session expired — please log in again.'}
        </div>
      )}
      {state === 'error' && (
        <div className="agri-card p-4 text-xs font-semibold text-gray-600">
          {hi ? 'आँकड़े नहीं आ पाए। एक मिनट में दोबारा कोशिश होगी।' : 'Could not load data. Retrying shortly.'}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label={hi ? 'कुल जाँचें' : 'Total scans'} value={m.totalScans} />
        <Tile label={hi ? '7 दिन' : 'Last 7 days'} value={m.scans7d}
              sub={hi ? (m.scans24h ?? '—') + ' आज' : (m.scans24h ?? '—') + ' today'} />
        <Tile label={hi ? 'सत्यापित' : 'Verified'} value={m.verifiedScans}
              sub={hi ? 'लैब भेजी: ' + (m.labScans ?? '—') : 'Sent to lab: ' + (m.labScans ?? '—')} />
        <Tile label={hi ? 'प्रतीक्षा में' : 'Pending'} value={m.pendingScans}
              sub={m.slaHours === null || m.slaHours === undefined
                ? (hi ? 'कोई प्रतीक्षा नहीं' : 'nothing waiting')
                : (hi ? 'औसत ' + m.slaHours + ' घंटे' : 'avg ' + m.slaHours + ' hrs')} />
      </div>

      {/* Aarthik asar — jaan-boojhkar khali */}
      <div className="agri-card p-4 flex gap-3 bg-gray-50/70">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <p className="font-bold text-gray-900">
            {hi ? 'आर्थिक प्रभाव (बचाई गई फसल) अभी नहीं दिखाया जा रहा' : 'Economic impact is not shown yet'}
          </p>
          <p className="mt-1">
            {hi
              ? 'इसके लिए रोपित रकबा, अपेक्षित उपज और मंडी भाव — तीनों चाहिए। ये अभी नहीं जुड़े, इसलिए यहाँ कोई रुपये का आँकड़ा नहीं दिखता। ऐसे आँकड़े सरकारी रिपोर्ट और बजट में चले जाते हैं; बिना माप के उन्हें दिखाना सबसे महँगा झूठ होगा।'
              : 'That needs sown area, expected yield and mandi prices — none are wired yet. Such figures end up in official reports and budgets, so no rupee number is shown until it can actually be measured.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="agri-card p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            {hi ? 'फसल के हिसाब से जाँचें' : 'Scans by crop'}
          </h3>
          {byCrop.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">
              {hi ? 'अभी कोई जाँच नहीं आई।' : 'No scans yet.'}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCrop}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {byCrop.map((_, i) => <Cell key={i} fill={BARS[i % BARS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="agri-card p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            {hi ? 'ज़िले के हिसाब से जाँचें' : 'Scans by district'}
          </h3>
          {byDistrict.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">
              {hi
                ? 'किसानों ने ज़िला नहीं भरा — ज़िला ऐप में वैकल्पिक है।'
                : 'No district on record — farmers leave it optional in the app.'}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byDistrict} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
