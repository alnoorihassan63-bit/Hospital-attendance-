import React, { useState, useEffect, useCallback } from "react";
import { Stethoscope, LogIn, LogOut, ClipboardList, ChevronDown, Clock, CheckCircle2, AlertCircle, RefreshCw, MapPin, Navigation } from "lucide-react";

// ---- Static config -------------------------------------------------------

const HOSPITAL_NAME = "مستشفى الحكيم التعليمي";

// Al-Hakeem Teaching Hospital, Amarah, Maysan, Iraq (precise coordinates)
const HOSPITAL_LOCATION = { lat: 31.85675, lng: 47.16527 };
const ALLOWED_RADIUS_METERS = 300; // doctors should be within this distance to count as "on site"

const DEPARTMENTS = [
  {
    id: "emergency",
    name: "الطوارئ",
    color: "#C2410C",
    doctors: [
      "د. ابا الحسن فلاح ابراهيم خليل",
      "د. احمد جبار حسين سويلم",
      "د. المجتبى محمد عبد الله صيهود",
      "د. ام البنين حميد حاتم غالي",
      "د. حسين محمد زاير مطر",
      "د. رازي حليم ربيع تامول",
      "د. رفاه لطيف كاظم صحين",
      "د. زهراء نزار عوده موسى",
      "د. سارة عباس صاحب علي",
      "د. شيرين ناهض حسن مفد",
      "د. صفا احمد رحيم احمد",
      "د. عبدالله معين عظيم جبار",
      "د. عبدالصاحب حسين عبدالحسين",
      "د. كرار عبد السجاد سعيد علي",
      "د. مرتضى مكي صاحب راضي",
      "د. منتظر محمود سيد خفي",
      "د. نور فاضل محسن ياسين",
      "د. هاجر عدنان بدر ياسين",
      "د. هالة علاء عبد الحسين ثابت",
      "د. ذو الفقار علي فنجان حسناوي",
      "د. شهد مهدي ناصر",
      "د. حيدر محمد حسون",
    ],
  },
  {
    id: "internal_men",
    name: "الباطنية - رجال",
    color: "#0E7490",
    doctors: [
      "د. حسن علي كريم صالح",
      "د. زين العابدين عدنان حمود فعل",
      "د. زينب طالب هاشم حمد",
      "د. طيبة حازم عبد الامير ديوان",
      "د. عذراء محمد حسين رحم",
      "د. حسن علي راضي محسن",
      "د. مؤمل فاضل موسى عبد الحسن",
      "د. هبة سلام غالي راضي",
    ],
  },
  {
    id: "internal_women",
    name: "الباطنية - نساء",
    color: "#155E75",
    doctors: [
      "د. بنين زهير صالح مهنة",
      "د. دعاء سلام رسول شاكر",
      "د. زهراء عطية كاظم حسن",
      "د. ضحى مكي جبار يونس",
      "د. عمار احمد عليوي عبود",
      "د. كرار حاكم شنان جبر",
      "د. وفاء عادل جندي محمد",
      "د. رحيق علي عباس",
      "د. ابرار فاضل جميل",
      "د. علي صلاح مهدي",
    ],
  },
  {
    id: "nicu",
    name: "الخدج المعقم",
    color: "#0369A1",
    doctors: [
      "د. حنين اسماعيل ثقيل كمر",
      "د. مهند عادل حنون داود",
      "د. نور الهدى علي حسين",
    ],
  },
  {
    id: "icu",
    name: "العناية المركزة",
    color: "#4D7C0F",
    doctors: [
      "د. تقى جعفر علي هويرف",
      "د. ريام ماجد شيال رحيمة",
      "د. مرتضى فاهم كاطع",
      "د. عذراء علي هاشم جاسم",
      "د. عيسى عباس كاظم جعفر",
      "د. فاطمة صبيح محسن جار الله",
      "د. مريم عبد الامير عبد الرب",
      "د. منتظر نعيم عبدالرضا حسين",
    ],
  },
  {
    id: "obgyn",
    name: "النسائية",
    color: "#BE185D",
    doctors: [
      "د. اديان ماجد جميل عبد",
      "د. ازل عبد النبي ثاني جبر",
      "د. ايمان طالب عبد الرضا ساجت",
      "د. تبارك صاحب جواد هذال",
      "د. زينب عبدالله عوده عباس",
      "د. شذى فالح حسن جبار",
      "د. مرام جمال عبد الناصر",
      "د. نجلاء عبد الرحمن عبد العباس",
      "د. نور عبد الحسن قاسم زامل",
      "د. ود احمد عبد الكريم عبد الجبار",
      "د. سلوان نبيل",
    ],
  },
  {
    id: "surgery",
    name: "الجراحة",
    color: "#7C2D12",
    doctors: [
      "د. زينب طارق كاظم حسين",
      "د. ضحى عبيد طالب خشه",
      "د. عبدالله ثامر علي راضي",
    ],
  },
  {
    id: "kidney_burns",
    name: "الكلية الصناعية والحروق",
    color: "#A16207",
    doctors: [
      "د. مختار حسين طه جبر",
      "د. مصطفى عباس محمد علي",
    ],
  },
];

// ---- Geolocation helper ----------------------------------------------------

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: "غير مدعوم" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        resolve({ error: err.message || "تم رفض إذن الموقع" });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

// ---- Helpers ---------------------------------------------------------------

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- Supabase config ---------------------------------------------------

const SUPABASE_URL = "https://wimgnentczdapqsulhws.supabase.co";
const SUPABASE_KEY = "sb_publishable_lINL1wur40QBJTu1rT24nw_H8JZPW9u";
const TABLE = "shift_log";

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// Convert a DB row (snake_case) to the app's entry shape
function rowToEntry(row) {
  return {
    id: row.id,
    dept: row.dept,
    deptName: row.dept_name,
    doctor: row.doctor,
    type: row.type,
    time: row.time,
    day: row.day,
    location:
      row.lat != null
        ? { lat: row.lat, lng: row.lng, accuracy: row.accuracy, distance: row.distance }
        : null,
  };
}

// Convert an app entry to a DB row for insertion
function entryToRow(entry) {
  return {
    id: entry.id,
    dept: entry.dept,
    dept_name: entry.deptName,
    doctor: entry.doctor,
    type: entry.type,
    time: entry.time,
    day: entry.day,
    lat: entry.location?.lat ?? null,
    lng: entry.location?.lng ?? null,
    accuracy: entry.location?.accuracy ?? null,
    distance: entry.location?.distance ?? null,
  };
}

async function loadEntries() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=time.asc`,
      { headers: sbHeaders }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map(rowToEntry);
  } catch (e) {
    console.error("Load error", e);
    return [];
  }
}

async function insertEntry(entry) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify(entryToRow(entry)),
    });
    return res.ok;
  } catch (e) {
    console.error("Insert error", e);
    return false;
  }
}

// ---- Department check-in/out view ------------------------------------------

function DeptCheckView({ dept, onSwitchToAdmin, hideAdminLink, onBackToPicker }) {
  const [doctor, setDoctor] = useState("");
  const [entries, setEntries] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [locStatus, setLocStatus] = useState(null); // { ok, distance, error }

  const refresh = useCallback(async () => {
    const all = await loadEntries();
    setEntries(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // status of currently selected doctor for today
  const myEntries = (entries || [])
    .filter((e) => e.dept === dept.id && e.doctor === doctor && e.day === todayKey())
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  const lastAction = myEntries.length ? myEntries[myEntries.length - 1].type : null;
  const nextAction = lastAction === "in" ? "out" : "in";

  async function handleLog() {
    if (!doctor) return;
    setBusy(true);
    setLocStatus(null);

    const loc = await getLocation();
    let locationData = null;
    let status = null;

    if (loc.error) {
      status = { ok: false, error: loc.error };
    } else {
      const dist = distanceMeters(loc.lat, loc.lng, HOSPITAL_LOCATION.lat, HOSPITAL_LOCATION.lng);
      locationData = { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, distance: Math.round(dist) };
      status = { ok: dist <= ALLOWED_RADIUS_METERS, distance: Math.round(dist) };
    }
    setLocStatus(status);

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dept: dept.id,
      deptName: dept.name,
      doctor,
      type: nextAction,
      time: new Date().toISOString(),
      day: todayKey(),
      location: locationData,
    };
    try {
      const ok = await insertEntry(entry);
      if (ok) {
        const all = await loadEntries();
        setEntries(all);
        setToast(nextAction === "in" ? "تم تسجيل الحضور" : "تم تسجيل الانصراف");
        setTimeout(() => setToast(null), 2200);
      } else {
        setToast("حدث خطأ، حاول مرة أخرى");
        setTimeout(() => setToast(null), 2500);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        fontFamily: "'Tajawal', 'Segoe UI', sans-serif",
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 14, color: "#A89B86", fontSize: 13, fontWeight: 600 }}>
        {HOSPITAL_NAME}
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
          overflow: "hidden",
          border: "1px solid #ECE6DB",
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: dept.color,
            padding: "28px 24px",
            color: "#FFF5EC",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Stethoscope size={26} strokeWidth={2} />
            <div>
              <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: 0.5 }}>قسم</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dept.name}</div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 24, top: 28, fontSize: 13, opacity: 0.85 }}>
            {fmtDate(new Date().toISOString())}
          </div>
        </div>

        <div style={{ padding: "24px 24px 28px" }}>
          {/* Doctor select */}
          <label style={{ display: "block", fontSize: 13, color: "#8A7E6D", marginBottom: 8, fontWeight: 600 }}>
            اختر اسمك
          </label>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 40px 13px 16px",
                borderRadius: 12,
                border: "1.5px solid #E4DCCC",
                fontSize: 16,
                color: "#3A322A",
                background: "#FBF9F5",
                appearance: "none",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="">-- اختر طبيب --</option>
              {dept.doctors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#A89B86", pointerEvents: "none" }}
            />
          </div>

          {/* Today's log for this doctor */}
          {doctor && (
            <div
              style={{
                background: "#FBF9F5",
                border: "1px solid #ECE6DB",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, color: "#8A7E6D", marginBottom: 6, fontWeight: 600 }}>سجل اليوم</div>
              {myEntries.length === 0 ? (
                <div style={{ fontSize: 13, color: "#B0A491" }}>لا يوجد تسجيلات اليوم</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {myEntries.map((e) => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#3A322A" }}>
                      {e.type === "in" ? (
                        <LogIn size={15} color="#4D7C0F" />
                      ) : (
                        <LogOut size={15} color="#C2410C" />
                      )}
                      <span style={{ fontWeight: 600 }}>{e.type === "in" ? "حضور" : "انصراف"}</span>
                      <span style={{ color: "#8A7E6D" }}>— {fmtTime(e.time)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleLog}
            disabled={!doctor || busy}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "none",
              fontSize: 17,
              fontWeight: 700,
              color: "#FFF8F0",
              background: !doctor ? "#D8CFC0" : nextAction === "in" ? "#4D7C0F" : "#C2410C",
              cursor: !doctor ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {nextAction === "in" ? <LogIn size={20} /> : <LogOut size={20} />}
            {nextAction === "in" ? "تسجيل حضور" : "تسجيل انصراف"}
          </button>

          {toast && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#4D7C0F",
                fontSize: 14,
                fontWeight: 600,
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={17} />
              {toast}
            </div>
          )}

          {locStatus && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: locStatus.error ? "#C2410C" : locStatus.ok ? "#4D7C0F" : "#A16207",
                fontSize: 12.5,
                fontWeight: 600,
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {locStatus.error ? (
                <>
                  <AlertCircle size={15} />
                  لم يتم تحديد الموقع — {locStatus.error}
                </>
              ) : locStatus.ok ? (
                <>
                  <MapPin size={15} />
                  تم تأكيد الموقع داخل المستشفى
                </>
              ) : (
                <>
                  <Navigation size={15} />
                  تنبيه: الموقع على بُعد {locStatus.distance} متر من المستشفى
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!hideAdminLink && (
        <button
          onClick={onSwitchToAdmin}
          style={{
            marginTop: 28,
            background: "none",
            border: "none",
            color: "#A89B86",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <ClipboardList size={15} />
          عرض لوحة المتابعة (رئيس الأطباء)
        </button>
      )}
      {onBackToPicker && (
        <button
          onClick={onBackToPicker}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            color: "#A89B86",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          ← تغيير القسم
        </button>
      )}
    </div>
  );
}

// ---- Admin dashboard --------------------------------------------------------

function AdminDashboard({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayKey());

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await loadEntries();
    setEntries(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dayEntries = entries.filter((e) => e.day === selectedDay);

  // Build per-doctor status
  const rows = [];
  DEPARTMENTS.forEach((dept) => {
    dept.doctors.forEach((doctor) => {
      const docEntries = dayEntries
        .filter((e) => e.dept === dept.id && e.doctor === doctor)
        .sort((a, b) => new Date(a.time) - new Date(b.time));

      const checkIn = docEntries.find((e) => e.type === "in");
      const checkOut = [...docEntries].reverse().find((e) => e.type === "out");

      let status = "absent";
      if (checkIn && checkOut) status = "completed";
      else if (checkIn) status = "present";

      rows.push({
        dept,
        doctor,
        checkIn,
        checkOut,
        status,
      });
    });
  });

  const summary = {
    total: rows.length,
    present: rows.filter((r) => r.status === "present").length,
    completed: rows.filter((r) => r.status === "completed").length,
    absent: rows.filter((r) => r.status === "absent").length,
  };

  const availableDays = Array.from(new Set(entries.map((e) => e.day))).sort().reverse();
  if (!availableDays.includes(todayKey())) availableDays.unshift(todayKey());

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        fontFamily: "'Tajawal', 'Segoe UI', sans-serif",
        direction: "rtl",
        padding: "28px 16px 60px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#8A7E6D", fontWeight: 600, letterSpacing: 0.5 }}>لوحة المتابعة</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#3A322A" }}>متابعة خفارات الأطباء</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={refresh}
              title="تحديث"
              style={{
                background: "#FFFFFF",
                border: "1px solid #ECE6DB",
                borderRadius: 10,
                padding: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <RefreshCw size={16} color="#8A7E6D" />
            </button>
            <div style={{ position: "relative" }}>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{
                  padding: "10px 36px 10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ECE6DB",
                  background: "#FFFFFF",
                  fontSize: 14,
                  color: "#3A322A",
                  appearance: "none",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {availableDays.map((d) => (
                  <option key={d} value={d}>
                    {d === todayKey() ? `اليوم — ${d}` : d}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A89B86", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "إجمالي الأطباء", value: summary.total, color: "#3A322A" },
            { label: "أنهوا الخفارة", value: summary.completed, color: "#4D7C0F" },
            { label: "متواجد حالياً", value: summary.present, color: "#0E7490" },
            { label: "لم يسجلوا", value: summary.absent, color: "#C2410C" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#FFFFFF",
                border: "1px solid #ECE6DB",
                borderRadius: 14,
                padding: "16px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#8A7E6D", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per department */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#A89B86", padding: 40 }}>جاري التحميل...</div>
        ) : (
          DEPARTMENTS.map((dept) => {
            const deptRows = rows.filter((r) => r.dept.id === dept.id);
            return (
              <div key={dept.id} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: dept.color }} />
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: "#3A322A" }}>{dept.name}</div>
                  <div style={{ fontSize: 12, color: "#A89B86" }}>
                    ({deptRows.filter((r) => r.status !== "absent").length} / {deptRows.length})
                  </div>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #ECE6DB", borderRadius: 14, overflow: "hidden" }}>
                  {deptRows.map((r, idx) => (
                    <div
                      key={r.doctor}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderTop: idx === 0 ? "none" : "1px solid #F2EDE3",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <StatusDot status={r.status} />
                        <span style={{ fontSize: 14.5, color: "#3A322A", fontWeight: 600, whiteSpace: "nowrap" }}>{r.doctor}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#8A7E6D", flexShrink: 0 }}>
                        <TimeChip icon={<LogIn size={13} />} label="حضور" value={r.checkIn ? fmtTime(r.checkIn.time) : "—"} ok={!!r.checkIn} loc={r.checkIn?.location} />
                        <TimeChip icon={<LogOut size={13} />} label="انصراف" value={r.checkOut ? fmtTime(r.checkOut.time) : "—"} ok={!!r.checkOut} loc={r.checkOut?.location} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        <button
          onClick={onBack}
          style={{
            marginTop: 20,
            background: "none",
            border: "none",
            color: "#A89B86",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          ← رجوع إلى صفحة تسجيل القسم
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colorMap = {
    completed: "#4D7C0F",
    present: "#0E7490",
    absent: "#D8CFC0",
  };
  return <div style={{ width: 9, height: 9, borderRadius: "50%", background: colorMap[status], flexShrink: 0 }} />;
}

function TimeChip({ icon, label, value, ok, loc }) {
  const outOfRange = loc && loc.distance > ALLOWED_RADIUS_METERS;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: ok ? "#3A322A" : "#C8BFAE" }}>
      {icon}
      <span style={{ fontWeight: ok ? 600 : 400 }}>{value}</span>
      {outOfRange && (
        <span title={`على بُعد ${loc.distance} متر من المستشفى`} style={{ display: "flex" }}>
          <Navigation size={12} color="#C2410C" />
        </span>
      )}
    </div>
  );
}

// ---- Root --------------------------------------------------------------------

function getDeptFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const deptParam = params.get("dept");
    if (deptParam && DEPARTMENTS.some((d) => d.id === deptParam)) return deptParam;
  } catch {}
  return null;
}

export default function App() {
  const urlDept = getDeptFromUrl();
  const [view, setView] = useState(urlDept ? "dept" : "picker"); // "picker" | "dept" | "admin"
  const [deptId, setDeptId] = useState(urlDept);
  const locked = !!urlDept; // opened via a department's QR code: go straight in, no switcher/admin link

  if (view === "admin") {
    return <AdminDashboard onBack={() => setView(locked ? "dept" : "picker")} />;
  }

  if (view === "picker") {
    return (
      <DeptPickerView
        onSelect={(id) => {
          setDeptId(id);
          setView("dept");
        }}
        onOpenAdmin={() => setView("admin")}
      />
    );
  }

  const dept = DEPARTMENTS.find((d) => d.id === deptId);

  return (
    <DeptCheckView
      dept={dept}
      onSwitchToAdmin={() => setView("admin")}
      hideAdminLink={locked}
      onBackToPicker={locked ? null : () => setView("picker")}
    />
  );
}

// ---- Department picker (fallback when no QR/dept param) -----------------------

function DeptPickerView({ onSelect, onOpenAdmin }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        fontFamily: "'Tajawal', 'Segoe UI', sans-serif",
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 8, color: "#A89B86", fontSize: 13, fontWeight: 600 }}>
        {HOSPITAL_NAME}
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#3A322A", margin: "0 0 6px", textAlign: "center" }}>
        تسجيل الحضور والانصراف
      </h1>
      <p style={{ color: "#8A7E6D", fontSize: 13.5, margin: "0 0 28px", textAlign: "center" }}>
        اختر قسمك لتسجيل الحضور أو الانصراف
      </p>

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              borderRadius: 14,
              border: "1px solid #ECE6DB",
              background: "#FFFFFF",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "right",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 15.5, fontWeight: 700, color: "#3A322A" }}>{d.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onOpenAdmin}
        style={{
          marginTop: 28,
          background: "none",
          border: "none",
          color: "#A89B86",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
        }}
      >
        <ClipboardList size={15} />
        عرض لوحة المتابعة (رئيس الأطباء)
      </button>
    </div>
  );
}
