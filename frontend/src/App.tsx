import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import './App.css'
import ReferenceManager from './components/ReferenceManager'
import UserManager from './components/UserManager'
import IssueManager from './components/IssueManager'
import NoticeManager from './components/NoticeManager'
import Pagination from './components/Pagination'

type Book = { id:number; book_id:number; title:string; author:string; isbn?:string; category?:string; status:'available'|'unavailable'|'maintenance'; total_copies:number; available_copies:number; location?:string; published_year?:number }
type Author = { author_id:number; name:string }
type Publisher = { publisher_id:number; name:string }
type Category = { category_id:number; category_name:string; description?:string }
type Toast = { id:number; type:'success'|'error'; message:string }
type RouteKey = 'Dashboard' | 'Books' | 'Users' | 'Borrowing' | 'Notice Management' | 'Authors' | 'Publishers' | 'Categories' | 'Reports' | 'Settings'
type NavItem = { key: Exclude<RouteKey, 'Settings'>; path: string; icon: string }

const API = 'http://127.0.0.1:8000/api/v1'
const NAV_ITEMS: NavItem[] = [
  { key: 'Dashboard', path: '/dashboard', icon: '⌂' },
  { key: 'Books', path: '/books', icon: '▤' },
  { key: 'Users', path: '/users', icon: '♙' },
  { key: 'Borrowing', path: '/borrowing', icon: '↔' },
  { key: 'Notice Management', path: '/notices', icon: '✦' },
  { key: 'Authors', path: '/authors', icon: '♙' },
  { key: 'Publishers', path: '/publishers', icon: '◒' },
  { key: 'Categories', path: '/categories', icon: '▦' },
  { key: 'Reports', path: '/reports', icon: '◒' },
]
const ROUTE_BY_PATH: Record<string, RouteKey> = {
  '/dashboard': 'Dashboard',
  '/books': 'Books',
  '/users': 'Users',
  '/borrowing': 'Borrowing',
  '/notices': 'Notice Management',
  '/authors': 'Authors',
  '/publishers': 'Publishers',
  '/categories': 'Categories',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '').toLowerCase()
  return trimmed || '/'
}

function resolveRoute(pathname: string): RouteKey {
  return ROUTE_BY_PATH[normalizePath(pathname)] ?? 'Dashboard'
}

const emptyBook = { title:'', author:'', isbn:'', category:'', category_id:0, author_id:0, publisher_id:0, total_copies:1, available_copies:1, location:'', status:'available' as Book['status'], published_year:new Date().getFullYear() }

function App() {
  const [authenticated,setAuthenticated] = useState(()=>Boolean(window.localStorage.getItem('lexora_access_token')))
  const [pathname,setPathname] = useState(()=>normalizePath(window.location.pathname))
  const active = resolveRoute(pathname)
  const [books,setBooks] = useState<Book[]>([]); const [authors,setAuthors] = useState<Author[]>([]); const [publishers,setPublishers] = useState<Publisher[]>([]); const [categories,setCategories] = useState<Category[]>([]); const [loading,setLoading] = useState(true); const [error,setError] = useState(''); const [toasts,setToasts] = useState<Toast[]>([]); const [profileOpen,setProfileOpen] = useState(false); const [showModal,setShowModal] = useState(false); const [editing,setEditing] = useState<Book|null>(null); const [form,setForm] = useState(emptyBook); const [query,setQuery] = useState('')
  const navigate = (to: string, replace = false) => {
    const next = normalizePath(to)
    if (normalizePath(window.location.pathname) !== next) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', next)
    }
    setPathname(next)
  }
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(path)
  }
  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    if (!authenticated) {
      document.title = 'Lexora Admin — Sign in'
      return
    }
    if (!ROUTE_BY_PATH[pathname]) {
      window.history.replaceState({}, '', '/dashboard')
    }
    document.title = `Lexora Admin — ${active}`
  }, [authenticated, pathname, active])
  const notify = (type:Toast['type'], message:string) => { const id=Date.now()+Math.random(); setToasts(current=>[...current,{id,type,message}]); window.setTimeout(()=>setToasts(current=>current.filter(toast=>toast.id!==id)),4500) }
  const loadBooks = async () => { setLoading(true); try { const response=await fetch(`${API}/books`); if(!response.ok) throw new Error('Could not load books. Is FastAPI running?'); setBooks(await response.json()); setError('') } catch(err) { setError(err instanceof Error ? err.message : 'Could not connect to the API.') } finally { setLoading(false) } }
  const loadReferences = async () => { try { const [a,p,c]=await Promise.all([fetch(`${API}/authors`),fetch(`${API}/publishers`),fetch(`${API}/categories`)]); if(!a.ok||!p.ok||!c.ok) throw new Error('Could not load authors, publishers, or categories.'); setAuthors(await a.json()); setPublishers(await p.json()); setCategories(await c.json()) } catch(err) { setError(err instanceof Error ? err.message : 'Could not load reference data.') } }
  useEffect(()=>{ void Promise.all([loadBooks(),loadReferences()]) },[])
  const filteredBooks=useMemo(()=>books.filter(book=>`${book.title} ${book.author} ${book.category??''}`.toLowerCase().includes(query.toLowerCase())),[books,query]); const totalCopies=books.reduce((sum,book)=>sum+book.total_copies,0); const availableCopies=books.reduce((sum,book)=>sum+book.available_copies,0)
  const openCreate=()=>{setEditing(null);setForm(emptyBook);setShowModal(true)}
  const openEdit=(book:Book)=>{setEditing(book);setForm({...emptyBook,title:book.title,author:book.author,isbn:book.isbn??'',category:book.category??'',total_copies:book.total_copies,available_copies:book.available_copies,location:book.location??'',status:book.status,published_year:book.published_year??new Date().getFullYear(),author_id:(book as Book & {author_id?:number}).author_id??0,publisher_id:(book as Book & {publisher_id?:number}).publisher_id??0,category_id:(book as Book & {category_id?:number}).category_id??0});setShowModal(true)}
  const saveBook=async(event:FormEvent)=>{event.preventDefault();setError('');try{const response=await fetch(editing?`${API}/books/${editing.id}`:`${API}/books`,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.detail??'The book could not be saved.');setShowModal(false);notify('success',editing?'Book updated successfully.':'Book added successfully.');await loadBooks()}catch(err){const message=err instanceof Error?err.message:'The book could not be saved.';setError(message);notify('error',message)}}
  const removeBook=async(book:Book)=>{if(!window.confirm(`Delete “${book.title}”?`))return;const response=await fetch(`${API}/books/${book.id}`,{method:'DELETE'});if(!response.ok){const data=await response.json().catch(()=>({}));const message=data.detail??'The book could not be deleted.';setError(message);notify('error',message);return}notify('success','Book deleted successfully.');await loadBooks()}
  if (!authenticated) return <Login onSuccess={()=>{setAuthenticated(true); if (!ROUTE_BY_PATH[pathname]) navigate('/dashboard', true)}} />
  return <div className="admin-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">L</span><div><strong>Lexora</strong><small>E-LIBRARY</small></div></div><div className="admin-badge">ADMIN CONSOLE</div><nav>{NAV_ITEMS.map(item=><a key={item.key} href={item.path} className={active===item.key?'active':''} aria-current={active===item.key?'page':undefined} onClick={event=>handleNavClick(event,item.path)}><span>{item.icon}</span>{item.key}</a>)}</nav></aside><main className="main-content"><header className="topbar"><div><p className="eyebrow">LEXORA / ADMIN</p><h1>{active}</h1></div><div className="top-actions"><span className="api-status"><i/> API connected</span><div className="profile-wrap"><button className="profile-trigger" onClick={()=>setProfileOpen(value=>!value)} aria-expanded={profileOpen}><span className="avatar">AD</span><span className="profile-label"><strong>Admin</strong><small>Administrator</small></span></button>{profileOpen&&<div className="profile-menu"><button onClick={()=>{navigate('/settings');setProfileOpen(false)}}><span>⚙</span> Settings</button><button onClick={()=>{window.localStorage.removeItem('lexora_access_token');setAuthenticated(false);setProfileOpen(false);navigate('/login',true)}}><span>↪</span> Sign out</button></div>}</div></div></header>{error&&<div className="alert">⚠ {error}<button onClick={()=>setError('')}>×</button></div>}{active==='Dashboard'&&<Dashboard books={books} totalCopies={totalCopies} availableCopies={availableCopies} onManage={()=>navigate('/books')}/>} {active==='Books'&&<Books books={filteredBooks} loading={loading} query={query} setQuery={setQuery} onAdd={openCreate} onEdit={openEdit} onDelete={removeBook}/>} {active==='Users'&&<UserManager onNotify={notify}/>} {active==='Borrowing'&&<IssueManager onNotify={notify}/>} {active==='Notice Management'&&<NoticeManager onNotify={notify}/>} {active==='Authors'&&<ReferenceManager kind="authors" onNotify={notify}/>} {active==='Publishers'&&<ReferenceManager kind="publishers" onNotify={notify}/>} {active==='Categories'&&<ReferenceManager kind="categories" onNotify={notify}/>} {active==='Reports'&&<Reports books={books} totalCopies={totalCopies} availableCopies={availableCopies}/>} {active==='Settings'&&<Settings/>}</main>{toasts.length>0&&<div className="toast-region" aria-live="polite">{toasts.map(toast=><div key={toast.id} className={`toast ${toast.type}`}><span>{toast.type==='success'?'✓':'!'}</span><p>{toast.message}</p><button onClick={()=>setToasts(current=>current.filter(item=>item.id!==toast.id))}>×</button></div>)}</div>}{showModal&&<div className="modal-backdrop"><form className="modal" onSubmit={saveBook}><div className="modal-head"><div><p className="eyebrow">CATALOGUE</p><h2>{editing?'Edit book':'Add new book'}</h2></div><button type="button" className="close" onClick={()=>setShowModal(false)}>×</button></div><div className="form-grid"><label>Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Author<input required value={form.author} onChange={e=>setForm({...form,author:e.target.value})}/></label><label>Author record<select required value={form.author_id||''} onChange={e=>setForm({...form,author_id:Number(e.target.value)})}><option value="">Select author</option>{authors.map(item=><option key={item.author_id} value={item.author_id}>{item.name}</option>)}</select></label><label>Publisher record<select required value={form.publisher_id||''} onChange={e=>setForm({...form,publisher_id:Number(e.target.value)})}><option value="">Select publisher</option>{publishers.map(item=><option key={item.publisher_id} value={item.publisher_id}>{item.name}</option>)}</select></label><label>Category record<select required value={form.category_id||''} onChange={e=>{const selected=categories.find(item=>item.category_id===Number(e.target.value));setForm({...form,category_id:Number(e.target.value),category:selected?.category_name??form.category})}}><option value="">Select category</option>{categories.map(item=><option key={item.category_id} value={item.category_id}>{item.category_name}</option>)}</select></label><label>ISBN<input value={form.isbn} onChange={e=>setForm({...form,isbn:e.target.value})}/></label><label>Published year<input type="number" value={form.published_year} onChange={e=>setForm({...form,published_year:Number(e.target.value)})}/></label><label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label>Total copies<input type="number" min="0" value={form.total_copies} onChange={e=>setForm({...form,total_copies:Number(e.target.value)})}/></label><label>Available copies<input type="number" min="0" value={form.available_copies} onChange={e=>setForm({...form,available_copies:Number(e.target.value)})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Book['status']})}><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="maintenance">Maintenance</option></select></label></div><div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setShowModal(false)}>Cancel</button><button className="button primary">{editing?'Save changes':'Add book'}</button></div></form></div>}</div>
}
function Dashboard({books,totalCopies,availableCopies,onManage}:{books:Book[];totalCopies:number;availableCopies:number;onManage:()=>void}){return <section><div className="welcome"><div><p className="eyebrow">THURSDAY, NOVEMBER 6, 2026</p><h2>Good morning, Admin.</h2><p>Here’s what is happening in your library today.</p></div><button className="button primary" onClick={onManage}>Manage catalogue <span>→</span></button></div><div className="stat-grid"><Stat label="Total books" value={books.length.toLocaleString()} note="In catalogue" icon="▤"/><Stat label="Total copies" value={totalCopies.toLocaleString()} note="Across all titles" icon="◫"/><Stat label="Available copies" value={availableCopies.toLocaleString()} note="Ready to borrow" icon="✓"/><Stat label="Availability" value={totalCopies?`${Math.round(availableCopies/totalCopies*100)}%`:'—'} note="Current inventory" icon="◒"/></div><div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><p className="eyebrow">INVENTORY</p><h3>Recently added books</h3></div><button className="text-button" onClick={onManage}>View all →</button></div>{books.slice(0,5).map(book=><BookRow key={book.id} book={book}/>)}{!books.length&&<p className="muted">No books have been added yet.</p>}</div><div className="panel insight"><p className="eyebrow">QUICK INSIGHT</p><h3>Keep your catalogue fresh</h3><p>Add locations and copy counts to help staff find and manage physical books quickly.</p><div className="progress"><span style={{width:`${totalCopies?availableCopies/totalCopies*100:0}%`}}/></div><small>{availableCopies} of {totalCopies} copies available</small></div></div></section>}
function Stat({label,value,note,icon}:{label:string;value:string;note:string;icon:string}){return <div className="stat-card"><span className="stat-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{note}</small></div>}
function BookRow({book}:{book:Book}){return <div className="book-row"><div className="book-cover">{book.title.slice(0,1)}</div><div className="book-info"><strong>{book.title}</strong><span>{book.author}</span></div><span className={`status ${book.status}`}>{book.status}</span><span className="copies">{book.available_copies}/{book.total_copies}</span></div>}
function Books({books,loading,query,setQuery,onAdd,onEdit,onDelete}:{books:Book[];loading:boolean;query:string;setQuery:(value:string)=>void;onAdd:()=>void;onEdit:(book:Book)=>void;onDelete:(book:Book)=>void}){const [page,setPage]=useState(1);const [pageSize,setPageSize]=useState(10);const pagedBooks=books.slice((page-1)*pageSize,page*pageSize);return <section><div className="page-intro"><div><p className="eyebrow">CATALOGUE MANAGEMENT</p><h2>Books</h2><p>Manage every title in the Lexora collection.</p></div><button className="button primary" onClick={onAdd}>＋ Add book</button></div><div className="toolbar"><div className="search">⌕<input placeholder="Search title, author or category" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></div><button className="filter">Filter <span>☷</span></button></div><div className="panel table-panel">{loading?<p className="muted">Loading books...</p>:<table><thead><tr><th>Book</th><th>Category</th><th>Inventory</th><th>Status</th><th>Location</th><th/></tr></thead><tbody>{pagedBooks.map(book=><tr key={book.id}><td><div className="table-book"><span className="book-cover">{book.title.slice(0,1)}</span><div><strong>{book.title}</strong><small>{book.author}</small></div></div></td><td>{book.category||'Uncategorized'}</td><td><strong>{book.available_copies}</strong> <span className="muted">/ {book.total_copies}</span></td><td><span className={`status ${book.status}`}>{book.status}</span></td><td>{book.location||'—'}</td><td><div className="row-actions"><button onClick={()=>onEdit(book)}>Edit</button><button onClick={()=>onDelete(book)}>Delete</button></div></td></tr>)}</tbody></table>}{!loading&&!books.length&&<p className="empty">No matching books found.</p>}{!loading&&<Pagination page={page} pageSize={pageSize} total={books.length} onPageChange={setPage} onPageSizeChange={setPageSize}/>}</div></section>}
export function Categories({books,categories,authors,publishers}:{books:Book[];categories:Category[];authors:Author[];publishers:Publisher[]}){return <section><div className="page-intro"><div><p className="eyebrow">REFERENCE DATA</p><h2>Categories</h2><p>Manage the records used by book relationships.</p></div></div><div className="category-grid">{categories.map(category=><div className="category-card" key={category.category_id}><span>▦</span><h3>{category.category_name}</h3><p>{books.filter(book=>book.category===category.category_name).length} titles</p></div>)}{!categories.length&&<div className="panel empty">Create categories through POST /api/v1/categories in Swagger.</div>}</div><div className="reference-summary"><div className="panel"><p className="eyebrow">AUTHORS</p><strong>{authors.length}</strong><span>records available for book assignment</span></div><div className="panel"><p className="eyebrow">PUBLISHERS</p><strong>{publishers.length}</strong><span>records available for book assignment</span></div></div></section>}
function Reports({books,totalCopies,availableCopies}:{books:Book[];totalCopies:number;availableCopies:number}){return <section><div className="page-intro"><div><p className="eyebrow">LIBRARY OVERVIEW</p><h2>Reports</h2><p>A quick view of catalogue health and inventory.</p></div></div><div className="report-grid"><div className="panel report-card"><span className="stat-icon">▤</span><p>Titles in catalogue</p><strong>{books.length}</strong><small>Unique books</small></div><div className="panel report-card"><span className="stat-icon">◫</span><p>Copies on shelves</p><strong>{totalCopies}</strong><small>Total inventory</small></div><div className="panel report-card"><span className="stat-icon">✓</span><p>Available now</p><strong>{availableCopies}</strong><small>{totalCopies?Math.round(availableCopies/totalCopies*100):0}% availability</small></div></div></section>}
function Settings(){return <section><div className="page-intro"><div><p className="eyebrow">ACCOUNT & SYSTEM</p><h2>Settings</h2><p>Admin console configuration and API connection details.</p></div></div><div className="panel"><div className="panel-head"><div><p className="eyebrow">CONNECTION</p><h3>Backend API</h3></div></div><p className="muted">Connected to <code>{API}</code></p></div></section>}
export default App

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { const response = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) }); const data = await response.json(); if (!response.ok) throw new Error(data.detail ?? 'Login failed.'); window.localStorage.setItem('lexora_access_token', data.access_token); onSuccess() } catch (err) { setError(err instanceof Error ? err.message : 'Login failed.') } finally { setLoading(false) } }
  return <div className="login-page"><form className="login-card" onSubmit={submit}><span className="brand-mark">L</span><p className="eyebrow">LEXORA ADMIN</p><h1>Welcome back</h1><p>Sign in to manage your library.</p>{error && <div className="alert">⚠ {error}</div>}<label>Email<input required type="email" value={email} onChange={event=>setEmail(event.target.value)} /></label><label>Password<div className="password-field"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={event=>setPassword(event.target.value)} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={()=>setShowPassword(value=>!value)}>{showPassword ? '◉' : '◌'}</button></div></label><button className="button primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></div>
}
