<<<<<<< HEAD
import { useState } from 'react'
=======
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
>>>>>>> af2efbf (Add backend and frontend)
import './App.css'
import ReferenceManager from './ReferenceManager'

type Book = { id:number; book_id:number; title:string; author:string; isbn?:string; category?:string; status:'available'|'unavailable'|'maintenance'; total_copies:number; available_copies:number; location?:string; published_year?:number }
type Author = { author_id:number; name:string }
type Publisher = { publisher_id:number; name:string }
type Category = { category_id:number; category_name:string; description?:string }
type Toast = { id:number; type:'success'|'error'; message:string }
const API = 'http://127.0.0.1:8000/api/v1'
const emptyBook = { title:'', author:'', isbn:'', category:'', category_id:0, author_id:0, publisher_id:0, total_copies:1, available_copies:1, location:'', status:'available' as Book['status'], published_year:new Date().getFullYear() }

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  status: 'Available' | 'Checked Out';
}

function App() {
<<<<<<< HEAD
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample initial books for Lexora
  const books: Book[] = [
    { id: 1, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', status: 'Available' },
    { id: 2, title: 'Clean Code', author: 'Robert C. Martin', category: 'Software Engineering', status: 'Checked Out' },
    { id: 3, title: 'Python Crash Course', author: 'Eric Matthes', category: 'Programming', status: 'Available' },
    { id: 4, title: 'Design Patterns', author: 'Erich Gamma et al.', category: 'Software Engineering', status: 'Available' },
  ];

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#38bdf8' }}>Lexora</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>Your Digital E-Library Management System</p>
        </div>
        <input 
          type="text" 
          placeholder="Search books or authors..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#fff', width: '300px' }}
        />
      </header>

      {/* Main Content / Catalog */}
      <main>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Library Catalog</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredBooks.map(book => (
            <div key={book.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#0369a1', color: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                {book.category}
              </span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.2rem' }}>{book.title}</h3>
              <p style={{ color: '#94a3b8', margin: '0 0 1rem 0' }}>By {book.author}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ color: book.status === 'Available' ? '#4ade80' : '#f87171', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  ● {book.status}
                </span>
                <button style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {book.status === 'Available' ? 'Borrow' : 'Reserved'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
=======
  const [active,setActive] = useState('Dashboard'); const [books,setBooks] = useState<Book[]>([]); const [authors,setAuthors] = useState<Author[]>([]); const [publishers,setPublishers] = useState<Publisher[]>([]); const [categories,setCategories] = useState<Category[]>([]); const [loading,setLoading] = useState(true); const [error,setError] = useState(''); const [toasts,setToasts] = useState<Toast[]>([]); const [showModal,setShowModal] = useState(false); const [editing,setEditing] = useState<Book|null>(null); const [form,setForm] = useState(emptyBook); const [query,setQuery] = useState('')
  const notify = (type:Toast['type'], message:string) => { const id=Date.now()+Math.random(); setToasts(current=>[...current,{id,type,message}]); window.setTimeout(()=>setToasts(current=>current.filter(toast=>toast.id!==id)),4500) }
  const loadBooks = async () => { setLoading(true); try { const response=await fetch(`${API}/books`); if(!response.ok) throw new Error('Could not load books. Is FastAPI running?'); setBooks(await response.json()); setError('') } catch(err) { setError(err instanceof Error ? err.message : 'Could not connect to the API.') } finally { setLoading(false) } }
  const loadReferences = async () => { try { const [a,p,c]=await Promise.all([fetch(`${API}/authors`),fetch(`${API}/publishers`),fetch(`${API}/categories`)]); if(!a.ok||!p.ok||!c.ok) throw new Error('Could not load authors, publishers, or categories.'); setAuthors(await a.json()); setPublishers(await p.json()); setCategories(await c.json()) } catch(err) { setError(err instanceof Error ? err.message : 'Could not load reference data.') } }
  useEffect(()=>{ void Promise.all([loadBooks(),loadReferences()]) },[])
  const filteredBooks=useMemo(()=>books.filter(book=>`${book.title} ${book.author} ${book.category??''}`.toLowerCase().includes(query.toLowerCase())),[books,query]); const totalCopies=books.reduce((sum,book)=>sum+book.total_copies,0); const availableCopies=books.reduce((sum,book)=>sum+book.available_copies,0)
  const openCreate=()=>{setEditing(null);setForm(emptyBook);setShowModal(true)}
  const openEdit=(book:Book)=>{setEditing(book);setForm({...emptyBook,title:book.title,author:book.author,isbn:book.isbn??'',category:book.category??'',total_copies:book.total_copies,available_copies:book.available_copies,location:book.location??'',status:book.status,published_year:book.published_year??new Date().getFullYear(),author_id:(book as Book & {author_id?:number}).author_id??0,publisher_id:(book as Book & {publisher_id?:number}).publisher_id??0,category_id:(book as Book & {category_id?:number}).category_id??0});setShowModal(true)}
  const saveBook=async(event:FormEvent)=>{event.preventDefault();setError('');try{const response=await fetch(editing?`${API}/books/${editing.id}`:`${API}/books`,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.detail??'The book could not be saved.');setShowModal(false);notify('success',editing?'Book updated successfully.':'Book added successfully.');await loadBooks()}catch(err){const message=err instanceof Error?err.message:'The book could not be saved.';setError(message);notify('error',message)}}
  const removeBook=async(book:Book)=>{if(!window.confirm(`Delete “${book.title}”?`))return;const response=await fetch(`${API}/books/${book.id}`,{method:'DELETE'});if(!response.ok){const data=await response.json().catch(()=>({}));const message=data.detail??'The book could not be deleted.';setError(message);notify('error',message);return}notify('success','Book deleted successfully.');await loadBooks()}
  const nav=['Dashboard','Books','Authors','Publishers','Categories','Reports']
  return <div className="admin-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">L</span><div><strong>Lexora</strong><small>E-LIBRARY</small></div></div><div className="admin-badge">ADMIN CONSOLE</div><nav>{nav.map(item=><button key={item} className={active===item?'active':''} onClick={()=>setActive(item)}><span>{item==='Dashboard'?'⌂':item==='Books'?'▤':item==='Users'?'♙':item==='Categories'?'▦':item==='Authors'?'♙':'◒'}</span>{item}</button>)}</nav><div className="sidebar-bottom"><button><span>⚙</span> Settings</button><button><span>↪</span> Sign out</button></div></aside><main className="main-content"><header className="topbar"><div><p className="eyebrow">LEXORA / ADMIN</p><h1>{active}</h1></div><div className="top-actions"><span className="api-status"><i/> API connected</span><div className="avatar">AD</div><div><strong>Admin</strong><small>Administrator</small></div></div></header>{error&&<div className="alert">⚠ {error}<button onClick={()=>setError('')}>×</button></div>}{active==='Dashboard'&&<Dashboard books={books} totalCopies={totalCopies} availableCopies={availableCopies} onManage={()=>setActive('Books')}/>} {active==='Books'&&<Books books={filteredBooks} loading={loading} query={query} setQuery={setQuery} onAdd={openCreate} onEdit={openEdit} onDelete={removeBook}/>} {active==='Users'&&<EmptyPage icon="♙" title="User management" text="User accounts, roles, and access will appear here when authentication is enabled."/>}{active==='Authors'&&<ReferenceManager kind="authors" onNotify={notify}/>} {active==='Publishers'&&<ReferenceManager kind="publishers" onNotify={notify}/>} {active==='Categories'&&<ReferenceManager kind="categories" onNotify={notify}/>} {active==='Reports'&&<Reports books={books} totalCopies={totalCopies} availableCopies={availableCopies}/>}</main>{toasts.length>0&&<div className="toast-region" aria-live="polite">{toasts.map(toast=><div key={toast.id} className={`toast ${toast.type}`}><span>{toast.type==='success'?'✓':'!'}</span><p>{toast.message}</p><button onClick={()=>setToasts(current=>current.filter(item=>item.id!==toast.id))}>×</button></div>)}</div>}{showModal&&<div className="modal-backdrop"><form className="modal" onSubmit={saveBook}><div className="modal-head"><div><p className="eyebrow">CATALOGUE</p><h2>{editing?'Edit book':'Add new book'}</h2></div><button type="button" className="close" onClick={()=>setShowModal(false)}>×</button></div><div className="form-grid"><label>Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Author<input required value={form.author} onChange={e=>setForm({...form,author:e.target.value})}/></label><label>Author record<select required value={form.author_id||''} onChange={e=>setForm({...form,author_id:Number(e.target.value)})}><option value="">Select author</option>{authors.map(item=><option key={item.author_id} value={item.author_id}>{item.name}</option>)}</select></label><label>Publisher record<select required value={form.publisher_id||''} onChange={e=>setForm({...form,publisher_id:Number(e.target.value)})}><option value="">Select publisher</option>{publishers.map(item=><option key={item.publisher_id} value={item.publisher_id}>{item.name}</option>)}</select></label><label>Category record<select required value={form.category_id||''} onChange={e=>{const selected=categories.find(item=>item.category_id===Number(e.target.value));setForm({...form,category_id:Number(e.target.value),category:selected?.category_name??form.category})}}><option value="">Select category</option>{categories.map(item=><option key={item.category_id} value={item.category_id}>{item.category_name}</option>)}</select></label><label>ISBN<input value={form.isbn} onChange={e=>setForm({...form,isbn:e.target.value})}/></label><label>Published year<input type="number" value={form.published_year} onChange={e=>setForm({...form,published_year:Number(e.target.value)})}/></label><label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label>Total copies<input type="number" min="0" value={form.total_copies} onChange={e=>setForm({...form,total_copies:Number(e.target.value)})}/></label><label>Available copies<input type="number" min="0" value={form.available_copies} onChange={e=>setForm({...form,available_copies:Number(e.target.value)})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Book['status']})}><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="maintenance">Maintenance</option></select></label></div><div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setShowModal(false)}>Cancel</button><button className="button primary">{editing?'Save changes':'Add book'}</button></div></form></div>}</div>
}
function Dashboard({books,totalCopies,availableCopies,onManage}:{books:Book[];totalCopies:number;availableCopies:number;onManage:()=>void}){return <section><div className="welcome"><div><p className="eyebrow">THURSDAY, NOVEMBER 6, 2026</p><h2>Good morning, Admin.</h2><p>Here’s what is happening in your library today.</p></div><button className="button primary" onClick={onManage}>Manage catalogue <span>→</span></button></div><div className="stat-grid"><Stat label="Total books" value={books.length.toLocaleString()} note="In catalogue" icon="▤"/><Stat label="Total copies" value={totalCopies.toLocaleString()} note="Across all titles" icon="◫"/><Stat label="Available copies" value={availableCopies.toLocaleString()} note="Ready to borrow" icon="✓"/><Stat label="Availability" value={totalCopies?`${Math.round(availableCopies/totalCopies*100)}%`:'—'} note="Current inventory" icon="◒"/></div><div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><p className="eyebrow">INVENTORY</p><h3>Recently added books</h3></div><button className="text-button" onClick={onManage}>View all →</button></div>{books.slice(0,5).map(book=><BookRow key={book.id} book={book}/>)}{!books.length&&<p className="muted">No books have been added yet.</p>}</div><div className="panel insight"><p className="eyebrow">QUICK INSIGHT</p><h3>Keep your catalogue fresh</h3><p>Add locations and copy counts to help staff find and manage physical books quickly.</p><div className="progress"><span style={{width:`${totalCopies?availableCopies/totalCopies*100:0}%`}}/></div><small>{availableCopies} of {totalCopies} copies available</small></div></div></section>}
function Stat({label,value,note,icon}:{label:string;value:string;note:string;icon:string}){return <div className="stat-card"><span className="stat-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{note}</small></div>}
function BookRow({book}:{book:Book}){return <div className="book-row"><div className="book-cover">{book.title.slice(0,1)}</div><div className="book-info"><strong>{book.title}</strong><span>{book.author}</span></div><span className={`status ${book.status}`}>{book.status}</span><span className="copies">{book.available_copies}/{book.total_copies}</span></div>}
function Books({books,loading,query,setQuery,onAdd,onEdit,onDelete}:{books:Book[];loading:boolean;query:string;setQuery:(value:string)=>void;onAdd:()=>void;onEdit:(book:Book)=>void;onDelete:(book:Book)=>void}){return <section><div className="page-intro"><div><p className="eyebrow">CATALOGUE MANAGEMENT</p><h2>Books</h2><p>Manage every title in the Lexora collection.</p></div><button className="button primary" onClick={onAdd}>＋ Add book</button></div><div className="toolbar"><div className="search">⌕<input placeholder="Search title, author or category" value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="filter">Filter <span>☷</span></button></div><div className="panel table-panel">{loading?<p className="muted">Loading books...</p>:<table><thead><tr><th>Book</th><th>Category</th><th>Inventory</th><th>Status</th><th>Location</th><th/></tr></thead><tbody>{books.map(book=><tr key={book.id}><td><div className="table-book"><span className="book-cover">{book.title.slice(0,1)}</span><div><strong>{book.title}</strong><small>{book.author}</small></div></div></td><td>{book.category||'Uncategorized'}</td><td><strong>{book.available_copies}</strong> <span className="muted">/ {book.total_copies}</span></td><td><span className={`status ${book.status}`}>{book.status}</span></td><td>{book.location||'—'}</td><td><div className="row-actions"><button onClick={()=>onEdit(book)}>Edit</button><button onClick={()=>onDelete(book)}>Delete</button></div></td></tr>)}</tbody></table>}{!loading&&!books.length&&<p className="empty">No matching books found.</p>}</div></section>}
export function Categories({books,categories,authors,publishers}:{books:Book[];categories:Category[];authors:Author[];publishers:Publisher[]}){return <section><div className="page-intro"><div><p className="eyebrow">REFERENCE DATA</p><h2>Categories</h2><p>Manage the records used by book relationships.</p></div></div><div className="category-grid">{categories.map(category=><div className="category-card" key={category.category_id}><span>▦</span><h3>{category.category_name}</h3><p>{books.filter(book=>book.category===category.category_name).length} titles</p></div>)}{!categories.length&&<div className="panel empty">Create categories through POST /api/v1/categories in Swagger.</div>}</div><div className="reference-summary"><div className="panel"><p className="eyebrow">AUTHORS</p><strong>{authors.length}</strong><span>records available for book assignment</span></div><div className="panel"><p className="eyebrow">PUBLISHERS</p><strong>{publishers.length}</strong><span>records available for book assignment</span></div></div></section>}
function Reports({books,totalCopies,availableCopies}:{books:Book[];totalCopies:number;availableCopies:number}){return <section><div className="page-intro"><div><p className="eyebrow">LIBRARY OVERVIEW</p><h2>Reports</h2><p>A quick view of catalogue health and inventory.</p></div></div><div className="report-grid"><div className="panel report-card"><span className="stat-icon">▤</span><p>Titles in catalogue</p><strong>{books.length}</strong><small>Unique books</small></div><div className="panel report-card"><span className="stat-icon">◫</span><p>Copies on shelves</p><strong>{totalCopies}</strong><small>Total inventory</small></div><div className="panel report-card"><span className="stat-icon">✓</span><p>Available now</p><strong>{availableCopies}</strong><small>{totalCopies?Math.round(availableCopies/totalCopies*100):0}% availability</small></div></div></section>}
function EmptyPage({icon,title,text}:{icon:string;title:string;text:string}){return <section><div className="empty-page"><span>{icon}</span><h2>{title}</h2><p>{text}</p><button className="button secondary">Coming soon</button></div></section>}
export default App
>>>>>>> af2efbf (Add backend and frontend)
