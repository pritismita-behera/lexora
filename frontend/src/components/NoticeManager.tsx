import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Pagination from './Pagination'

const API = 'http://127.0.0.1:8000/api/v1'
const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('lexora_access_token') ?? ''}` })

type Notice = {
  notice_id: number
  title: string
  content: string
  is_published: boolean
  published_at: string | null
  scheduled_at: string | null
  is_important: boolean
  expires_at: string | null
  status: 'published' | 'scheduled' | 'draft' | 'expired'
  created_date: string
  updated_date: string
}

type NoticeForm = {
  title: string
  content: string
  is_published: boolean
  scheduled_at: string
  is_important: boolean
  expires_at: string
}

const emptyForm: NoticeForm = {
  title: '',
  content: '',
  is_published: false,
  scheduled_at: '',
  is_important: false,
  expires_at: '',
}

function toInputDateTime(iso: string | null): string {
  if (!iso) return ''
  const parsed = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(parsed.getTime())) return ''
  const offsetMs = parsed.getTimezoneOffset() * 60000
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toApiIso(localValue: string): string | null {
  if (!localValue) return null
  const parsed = new Date(localValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function formatDateTime(iso: string | null, fallback: string): string {
  if (!iso) return fallback
  const parsed = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(parsed.getTime())) return fallback
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function NoticeManager({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void
}) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Notice['status']>('all')
  const [importantOnly, setImportantOnly] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Notice | null>(null)
  const [form, setForm] = useState<NoticeForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchNotices = useCallback(async () => {
    try {
      const response = await fetch(`${API}/notices`, { headers: authHeaders() })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? 'Could not load notices.')
      setNotices(data)
    } catch (error) {
      onNotify('error', error instanceof Error ? error.message : 'Could not load notices.')
    } finally {
      setLoading(false)
    }
  }, [onNotify])

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/notices`, { headers: authHeaders() })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.detail ?? 'Could not load notices.')
        if (!cancelled) setNotices(data)
      })
      .catch((error) => {
        if (!cancelled) onNotify('error', error instanceof Error ? error.message : 'Could not load notices.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onNotify])

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const matchesQuery = `${notice.title} ${notice.content}`.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'all' || notice.status === statusFilter
      const matchesImportant = !importantOnly || notice.is_important
      return matchesQuery && matchesStatus && matchesImportant
    })
  }, [notices, query, statusFilter, importantOnly])

  const pagedNotices = filteredNotices.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (notice: Notice) => {
    setEditing(notice)
    setForm({
      title: notice.title,
      content: notice.content,
      is_published: notice.is_published,
      scheduled_at: toInputDateTime(notice.scheduled_at),
      is_important: notice.is_important,
      expires_at: toInputDateTime(notice.expires_at),
    })
    setShowModal(true)
  }

  const saveNotice = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        is_published: form.is_published,
        scheduled_at: toApiIso(form.scheduled_at),
        is_important: form.is_important,
        expires_at: toApiIso(form.expires_at),
      }
      const response = await fetch(
        editing ? `${API}/notices/${editing.notice_id}` : `${API}/notices`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? 'Could not save notice.')
      setShowModal(false)
      onNotify('success', editing ? 'Notice updated successfully.' : 'Notice created successfully.')
      await fetchNotices()
    } catch (error) {
      onNotify('error', error instanceof Error ? error.message : 'Could not save notice.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (notice: Notice) => {
    const action = notice.is_published ? 'unpublish' : 'publish'
    try {
      const response = await fetch(`${API}/notices/${notice.notice_id}/${action}`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? `Could not ${action} notice.`)
      onNotify('success', notice.is_published ? 'Notice unpublished.' : 'Notice published.')
      await fetchNotices()
    } catch (error) {
      onNotify('error', error instanceof Error ? error.message : `Could not ${action} notice.`)
    }
  }

  const toggleImportant = async (notice: Notice) => {
    try {
      const response = await fetch(`${API}/notices/${notice.notice_id}/important`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ is_important: !notice.is_important }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? 'Could not update importance.')
      onNotify('success', !notice.is_important ? 'Notice marked as important.' : 'Removed important flag.')
      await fetchNotices()
    } catch (error) {
      onNotify('error', error instanceof Error ? error.message : 'Could not update importance.')
    }
  }

  const removeNotice = async (notice: Notice) => {
    if (!window.confirm(`Delete notice “${notice.title}”?`)) return
    try {
      const response = await fetch(`${API}/notices/${notice.notice_id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail ?? 'Could not delete notice.')
      }
      onNotify('success', 'Notice deleted successfully.')
      await fetchNotices()
    } catch (error) {
      onNotify('error', error instanceof Error ? error.message : 'Could not delete notice.')
    }
  }

  return (
    <section>
      <div className="page-intro">
        <div>
          <p className="eyebrow">ANNOUNCEMENTS</p>
          <h2>Notice Management</h2>
          <p>Create, schedule, publish, prioritize, and expire library notices.</p>
        </div>
        <button className="button primary" onClick={openCreate}>
          ＋ Add new notice
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          ⌕
          <input
            placeholder="Search notice title or content"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <label className="sort-control">
          Status
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'all' | Notice['status'])
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="notice-filter-check">
          <input
            type="checkbox"
            checked={importantOnly}
            onChange={(event) => {
              setImportantOnly(event.target.checked)
              setPage(1)
            }}
          />
          Important only
        </label>
      </div>

      <div className="panel table-panel">
        {loading ? (
          <p className="muted" style={{ padding: 22 }}>
            Loading notices...
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Notice</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Expiry date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedNotices.map((notice) => (
                <tr key={notice.notice_id}>
                  <td>
                    <div className="notice-cell">
                      <div className="notice-title-row">
                        <strong>{notice.title}</strong>
                        {notice.is_important && <span className="notice-important">★ Important</span>}
                      </div>
                      <small className="notice-preview">{notice.content}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${notice.status}`}>{notice.status}</span>
                  </td>
                  <td>{formatDateTime(notice.scheduled_at, 'Immediate')}</td>
                  <td>{formatDateTime(notice.expires_at, 'No expiry')}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => openEdit(notice)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => void togglePublish(notice)}>
                        {notice.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" onClick={() => void toggleImportant(notice)}>
                        {notice.is_important ? 'Unmark' : 'Important'}
                      </button>
                      <button type="button" onClick={() => void removeNotice(notice)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !filteredNotices.length && <p className="empty">No notices found.</p>}
        {!loading && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredNotices.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={saveNotice}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">NOTICE MANAGEMENT</p>
                <h2>{editing ? 'Edit notice' : 'Add new notice'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="notice-form-stack">
              <label>
                Title
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Extended Exam Week Hours"
                />
              </label>
              <label>
                Content
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  placeholder="Write the notice details for library members..."
                />
              </label>
              <div className="form-grid">
                <label>
                  Schedule publication
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })}
                  />
                </label>
                <label>
                  Expiry date
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(event) => setForm({ ...form, expires_at: event.target.value })}
                  />
                </label>
              </div>
              <div className="notice-toggles">
                <label className="notice-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
                  />
                  Publish notice
                </label>
                <label className="notice-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_important}
                    onChange={(event) => setForm({ ...form, is_important: event.target.checked })}
                  />
                  Mark as important
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="button primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create notice'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
