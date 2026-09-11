import { useEffect, useState } from 'react';
import { FlaskConical, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { fetchProtocols, saveProtocol, deleteProtocol } from '../../lib/api';

/* ============================================================================
 * CIBRC protocol sampadak — dawa aur MATRA, adhikari ke haath me
 *
 * PEHLE
 *   Matraayein dashboard ke code me likhi thi. Badalne ke liye programmer,
 *   build aur deploy chahiye tha. Yani CIBRC koi matra badal de ya kisi
 *   dawa par rok laga de, to purani matra tab tak chalti rehti jab tak
 *   koi coder khali na ho. Kheti me hafton ki der ka matlab ek poori fasal.
 *
 * AB
 *   Adhikari yahin se jodta, badalta aur hataata hai — turant. Har row par
 *   likha rehta hai kisne aur kab badla, kyunki matra galat nikle to pata
 *   chalna chahiye ki wo kahan se aayi.
 *
 * "Pratiksha avadhi" (waiting period) ka khana jaan-boojhkar alag hai —
 * chhidkav ke kitne din baad fasal todi ja sakti hai. Yeh seedha khane
 * wale ki sehat se juda hai aur aksar bhula diya jata hai.
 * ========================================================================= */

const EMPTY = {
  id: '', crop: '', cropNameHi: '', disease: '', diseaseEn: '',
  chemical: '', dose: '', waitingPeriodDays: '', cibrcRegNo: '', notes: '',
};

export default function ProtocolEditor({ currentLanguage }) {
  const hi = currentLanguage !== 'en';
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    const d = await fetchProtocols();
    setRows((d && d.protocols) || []);
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await saveProtocol({
      ...form,
      waitingPeriodDays: form.waitingPeriodDays === '' ? null : Number(form.waitingPeriodDays),
    });
    setBusy(false);
    if (!res || !res.ok) {
      setMsg({ bad: true, text: (res && res.messageHi) || 'सेव नहीं हुआ। लॉगिन जाँच लीजिए।' });
      return;
    }
    setMsg({ bad: false, text: 'सेव हो गया — किसानों की ऐप अगली बार यही मात्रा पढ़ेगी।' });
    setForm(EMPTY);
    load();
  };

  const edit = (r) => {
    setForm({ ...EMPTY, ...r, waitingPeriodDays: r.waitingPeriodDays ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (r) => {
    if (!window.confirm('यह प्रोटोकॉल हटा दें?\n\n' + r.crop + ' — ' + r.disease + '\nमात्रा: ' + r.dose)) return;
    await deleteProtocol(r.id);
    load();
  };

  const field = (label, key, opts = {}) => (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-bold text-gray-700">{label}</span>
      <input
        value={form[key]}
        onChange={set(key)}
        required={opts.required}
        type={opts.type || 'text'}
        placeholder={opts.placeholder || ''}
        className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-green-600"
      />
    </label>
  );

  return (
    <div className="space-y-4">

      <div className="agri-card p-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-green-600" />
          <span>{hi ? 'दवा व मात्रा (CIBRC प्रोटोकॉल)' : 'Chemicals & doses (CIBRC protocols)'}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {hi
            ? 'यहाँ जो मात्रा लिखी जाएगी, वही किसानों की ऐप में दिखेगी। पहले यह कोड में थी और बदलने के लिए डेवलपर चाहिए था।'
            : 'What you write here is what farmers see in the app. It used to live in code and needed a developer to change.'}
        </p>

        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            मात्रा हमेशा CIBRC लेबल से मिलाकर लिखें। यहाँ लिखी गलत मात्रा सीधे किसान के
            खेत में और छिड़काव करने वाले की सेहत पर जाती है। हर बदलाव के साथ आपकी
            पोर्टल आईडी दर्ज होती है।
          </span>
        </div>
      </div>

      {/* Naya / badla hua */}
      <form onSubmit={submit} className="agri-card p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {field(hi ? 'फसल (अंग्रेज़ी आईडी, जैसे rice)' : 'Crop id', 'crop', { required: true, placeholder: 'rice' })}
          {field(hi ? 'फसल का नाम (हिन्दी)' : 'Crop name (Hindi)', 'cropNameHi', { placeholder: 'धान' })}
          {field(hi ? 'रोग / कीट' : 'Disease / pest', 'disease', { required: true, placeholder: 'झुलसा' })}
          {field(hi ? 'रोग (अंग्रेज़ी)' : 'Disease (English)', 'diseaseEn', { placeholder: 'Leaf blast' })}
          {field(hi ? 'दवा का नाम' : 'Chemical', 'chemical', { placeholder: 'Tricyclazole 75 WP' })}
          {field(hi ? 'मात्रा (ज़रूरी)' : 'Dose (required)', 'dose', { required: true, placeholder: '0.6 g / लीटर पानी' })}
          {field(hi ? 'प्रतीक्षा अवधि (दिन)' : 'Waiting period (days)', 'waitingPeriodDays', { type: 'number', placeholder: '14' })}
          {field(hi ? 'CIBRC पंजीकरण संख्या' : 'CIBRC reg. no.', 'cibrcRegNo')}
        </div>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-bold text-gray-700">{hi ? 'अतिरिक्त निर्देश' : 'Notes'}</span>
          <textarea
            rows={3} value={form.notes} onChange={set('notes')}
            placeholder={hi ? 'जैसे: बारिश की संभावना हो तो छिड़काव न करें।' : ''}
            className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-green-600"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold"
          >
            {form.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{busy ? 'सेव हो रहा है…' : (form.id ? 'बदलाव सेव करें' : 'जोड़ें')}</span>
          </button>

          {form.id && (
            <button
              type="button" onClick={() => setForm(EMPTY)}
              className="text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              रद्द करें
            </button>
          )}

          {msg && (
            <span className={`text-xs font-semibold ${msg.bad ? 'text-red-600' : 'text-green-700'}`}>
              {msg.text}
            </span>
          )}
        </div>
      </form>

      {/* List */}
      <div className="agri-card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          {hi ? 'दर्ज प्रोटोकॉल' : 'Saved protocols'} ({rows.length})
        </h3>

        {rows.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            {hi
              ? 'अभी कोई प्रोटोकॉल दर्ज नहीं है। ऊपर से जोड़िए — जब तक कोई मात्रा दर्ज नहीं होती, ऐप किसान को दवा की मात्रा नहीं बताती।'
              : 'Nothing saved yet. Until a dose is entered, the app tells farmers no dose at all.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3 font-bold">फसल</th>
                  <th className="py-2 pr-3 font-bold">रोग</th>
                  <th className="py-2 pr-3 font-bold">दवा</th>
                  <th className="py-2 pr-3 font-bold">मात्रा</th>
                  <th className="py-2 pr-3 font-bold">प्रतीक्षा</th>
                  <th className="py-2 pr-3 font-bold">अंतिम बदलाव</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-3 font-semibold">{r.cropNameHi || r.crop}</td>
                    <td className="py-2 pr-3">{r.disease}</td>
                    <td className="py-2 pr-3">{r.chemical || '—'}</td>
                    <td className="py-2 pr-3 font-bold text-gray-900">{r.dose}</td>
                    <td className="py-2 pr-3">
                      {r.waitingPeriodDays ? r.waitingPeriodDays + ' दिन' : '—'}
                    </td>
                    <td className="py-2 pr-3 text-gray-500">
                      {r.updatedBy || '—'}
                      <span className="block text-[10px]">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-IN') : ''}
                      </span>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => edit(r)} className="text-green-700 font-bold mr-3">बदलें</button>
                      <button onClick={() => remove(r)} className="text-red-600">
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
