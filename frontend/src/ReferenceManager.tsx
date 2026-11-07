import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

const API = 'http://127.0.0.1:8000/api/v1'
type Kind = 'authors' | 'publishers' | 'categories'
type Reference = { id: number; name: string; detail?: string }

const config = {
  authors: { label: 'Authors', singular: 'author', id: 'author_id', name: 'name' },
  publishers: { label: 'Publishers', singular: 'publisher', id: 'publisher_id', name: 'name' },
  categories: { label: 'Categories', singular: 'category', id: 'category_id', name: 'category_name' },
} as const

export default function ReferenceManager({ kind, onNotify }: { kind: Kind; onNotify: (type: 'success' | 'error', message: string) => void }) {
  const meta = config[kind]
  const [items, setItems] = useState<Reference[]>([])
  const [name, setName] = useState('')
  const [detail, setDetail] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API}/${kind}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? `Could not load ${meta.label.toLowerCase()}.`)
      setItems(data.map((item: Record<string, string | number>) => ({ id: Number(item[meta.id]), name: String(item[meta.name]), detail: String(item.description ?? item.biography ?? item.address ?? '') })))
    } catch (err) { const message = err instanceof Error ? err.message : 'Could not load records.'; setError(message); onNotify('error', message) } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [kind])
  const reset = () => { setName(''); setDetail(''); setEditing(null) }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    const payload = kind === 'categories' ? { category_name: name, description: detail } : kind === 'authors' ? { name, biography: detail } : { name, address: detail }
    try {
      const response = await fetch(editing ? `${API}/${kind}/${editing}` : `${API}/${kind}`, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? `Could not save ${meta.singular}.`)
      reset(); onNotify('success', editing ? `${meta.singular} updated successfully.` : `${meta.singular} added successfully.`); await load()
    } catch (err) { const message = err instanceof Error ? err.message : `Could not save ${meta.singular}.`; setError(message); onNotify('error', message) }
  }
  const remove = async (item: Reference) => {
    if (!window.confirm(`Delete ${item.name}?`)) return
    const response = await fetch(`${API}/${kind}/${item.id}`, { method: 'DELETE' })
    if (!response.ok) { const data = await response.json(); const message = data.detail ?? `Could not delete ${meta.singular}.`; setError(message); onNotify('error', message); return }
    onNotify('success', `${meta.singular} deleted successfully.`)
    await load()
  }
  return <section>
    <div className="page-intro"><div><p className="eyebrow">REFERENCE DATA</p><h2>{meta.label}</h2><p>Create and manage records used by books.</p></div></div>
    {error && <div className="alert">⚠ {error}<button onClick={() => setError('')}>×</button></div>}
    <div className="panel reference-editor"><form onSubmit={save} className="reference-form"><label>{meta.singular[0].toUpperCase() + meta.singular.slice(1)} name<input required value={name} onChange={event => setName(event.target.value)} placeholder={`Enter ${meta.singular} name`} /></label><label>{kind === 'authors' ? 'Biography' : kind === 'publishers' ? 'Address' : 'Description'}<input value={detail} onChange={event => setDetail(event.target.value)} placeholder="Optional details" /></label><div><button className="button primary">{editing ? 'Save changes' : `Add ${meta.singular}`}</button>{editing && <button type="button" className="button secondary" onClick={reset}>Cancel</button>}</div></form></div>
    <div className="panel table-panel reference-table">{loading ? <p className="muted">Loading...</p> : <table><thead><tr><th>ID</th><th>Name</th><th>Details</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.id}</td><td><strong>{item.name}</strong></td><td>{item.detail || '—'}</td><td><div className="row-actions"><button onClick={() => { setEditing(item.id); setName(item.name); setDetail(item.detail ?? '') }}>Edit</button><button onClick={() => void remove(item)}>Delete</button></div></td></tr>)}</tbody></table>}{!loading && !items.length && <p className="empty">No {meta.label.toLowerCase()} have been added.</p>}</div>
  </section>
}
