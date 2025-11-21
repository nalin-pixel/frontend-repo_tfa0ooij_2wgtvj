import { useEffect, useMemo, useState } from 'react'
import { LogIn, UserPlus, FileText, Users, HandCoins, Wallet, Box, BarChart3, CheckCircle2, Loader2 } from 'lucide-react'

const API = import.meta.env.VITE_BACKEND_URL || '/api'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [role, setRole] = useState(localStorage.getItem('role') || '')
  const login = async (email, password) => {
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!r.ok) throw new Error('Login gagal')
    const data = await r.json()
    setToken(data.access_token)
    // decode role from token is optional; we will keep role locally if needed
    localStorage.setItem('token', data.access_token)
    // naive decode
    try {
      const [, payload] = data.access_token.split('.')
      const obj = JSON.parse(atob(payload))
      if (obj.role) {
        setRole(obj.role)
        localStorage.setItem('role', obj.role)
      }
    } catch {}
  }
  const register = async (name, email, password) => {
    const r = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
    if (!r.ok) throw new Error('Registrasi gagal')
    const data = await r.json()
    setToken(data.access_token)
    localStorage.setItem('token', data.access_token)
  }
  const logout = () => { setToken(''); setRole(''); localStorage.removeItem('token'); localStorage.removeItem('role') }
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, [token])
  return { token, role, headers, login, register, logout }
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow border border-emerald-100 p-5">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

function AuthPanel({ auth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (mode === 'login') await auth.login(email, password)
      else await auth.register(name, email, password)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  return (
    <Card title={mode === 'login' ? 'Masuk' : 'Daftar'} icon={mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama" className="w-full border rounded px-3 py-2" required />
        )}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full border rounded px-3 py-2" required />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full bg-emerald-600 text-white rounded px-3 py-2 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {mode === 'login' ? 'Masuk' : 'Daftar'}
        </button>
        <p className="text-sm text-gray-600">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button type="button" className="text-emerald-700 font-medium" onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Daftar' : 'Masuk'}</button></p>
      </form>
    </Card>
  )
}

function Dashboard({ auth }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/dashboard/metrics`, { headers: auth.headers })
        if (r.ok) setMetrics(await r.json())
      } finally { setLoading(false) }
    })()
  }, [])
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card title="Penduduk" icon={<Users className="w-4 h-4" />}>{loading ? '...' : <div className="text-3xl font-bold text-emerald-700">{metrics?.penduduk || 0}</div>}</Card>
      <Card title="Surat" icon={<FileText className="w-4 h-4" />}>{loading ? '...' : <div className="text-3xl font-bold text-emerald-700">{metrics?.surat || 0}</div>}</Card>
      <Card title="Bansos" icon={<HandCoins className="w-4 h-4" />}>{loading ? '...' : <div className="text-3xl font-bold text-emerald-700">{metrics?.bansos || 0}</div>}</Card>
      <Card title="Keuangan" icon={<Wallet className="w-4 h-4" />}>{loading ? '...' : <div className="text-sm text-emerald-700">Pemasukan: {metrics?.keuangan?.pemasukan || 0}<br/>Pengeluaran: {metrics?.keuangan?.pengeluaran || 0}</div>}</Card>
    </div>
  )
}

function PendudukForm({ auth, onCreated }) {
  const [nik, setNik] = useState('')
  const [nama, setNama] = useState('')
  const [pekerjaan, setPekerjaan] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const r = await fetch(`${API}/penduduk`, { method: 'POST', headers: auth.headers, body: JSON.stringify({ nik, nama, pekerjaan }) })
    if (!r.ok) {
      const txt = await r.text(); setError(txt); return
    }
    onCreated(); setNik(''); setNama(''); setPekerjaan('')
  }
  return (
    <Card title="Tambah Penduduk" icon={<Users className="w-4 h-4" />}>
      <form onSubmit={submit} className="grid md:grid-cols-4 gap-2">
        <input value={nik} onChange={e=>setNik(e.target.value)} placeholder="NIK" className="border rounded px-2 py-2" required />
        <input value={nama} onChange={e=>setNama(e.target.value)} placeholder="Nama" className="border rounded px-2 py-2" required />
        <input value={pekerjaan} onChange={e=>setPekerjaan(e.target.value)} placeholder="Pekerjaan" className="border rounded px-2 py-2" />
        <button className="bg-emerald-600 text-white rounded px-3 py-2">Simpan</button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </Card>
  )
}

function PendudukList({ auth, refreshKey }) {
  const [items, setItems] = useState([])
  useEffect(() => { (async () => { const r = await fetch(`${API}/penduduk`, { headers: auth.headers }); if (r.ok) setItems(await r.json()) })() }, [refreshKey])
  return (
    <Card title="Data Penduduk" icon={<Users className="w-4 h-4" />}>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-emerald-50 text-emerald-800"><th className="text-left p-2">NIK</th><th className="text-left p-2">Nama</th><th className="text-left p-2">Pekerjaan</th></tr></thead>
          <tbody>{items.map((it)=> (<tr key={it._id}><td className="p-2">{it.nik}</td><td className="p-2">{it.nama}</td><td className="p-2">{it.pekerjaan||'-'}</td></tr>))}</tbody>
        </table>
      </div>
    </Card>
  )
}

function SuratForm({ auth }) {
  const [jenis, setJenis] = useState('sku')
  const submit = async (e) => {
    e.preventDefault()
    await fetch(`${API}/surat`, { method: 'POST', headers: auth.headers, body: JSON.stringify({ pemohon_user_id: localStorage.getItem('email') || 'me', jenis, data: {} }) })
    alert('Pengajuan surat dikirim')
  }
  return (
    <Card title="Ajukan Surat" icon={<FileText className="w-4 h-4" />}>
      <form onSubmit={submit} className="flex gap-2">
        <select value={jenis} onChange={e=>setJenis(e.target.value)} className="border rounded px-3 py-2">
          <option value="sku">SKU</option>
          <option value="domisili">Domisili</option>
          <option value="tidak_mampu">Tidak Mampu</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <button className="bg-emerald-600 text-white rounded px-3 py-2">Kirim</button>
      </form>
    </Card>
  )
}

export default function App() {
  const auth = useAuth()
  const [refresh, setRefresh] = useState(0)

  if (!auth.token) {
    return (
      <div className="min-h-screen bg-emerald-50">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600"></div>
            <div className="font-bold text-emerald-700">Smart Desa</div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-emerald-800">Sistem Informasi Terintegrasi Desa</h1>
            <p className="text-emerald-700/80">Kelola penduduk, surat digital, bantuan sosial, keuangan, aset, dan dashboard transparansi dalam satu aplikasi modern.</p>
            <ul className="grid grid-cols-2 gap-2 text-sm text-emerald-900/80">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>Login & Registrasi</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>Surat Digital</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>Bantuan Sosial</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>Keuangan Desa</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>Aset Desa</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>Dashboard Transparansi</li>
            </ul>
          </div>
          <AuthPanel auth={auth} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600"></div>
            <div className="font-bold text-emerald-700">Smart Desa</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-emerald-800/80">{auth.role || 'warga'}</span>
            <button onClick={auth.logout} className="text-sm bg-emerald-600 text-white rounded px-3 py-1">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Dashboard auth={auth} />
          <PendudukForm auth={auth} onCreated={()=>setRefresh(x=>x+1)} />
          <SuratForm auth={auth} />
        </div>
        <div className="space-y-6">
          <PendudukList auth={auth} refreshKey={refresh} />
        </div>
      </main>
    </div>
  )
}
