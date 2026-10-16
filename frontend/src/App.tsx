import { useState } from 'react'
import './App.css'

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  status: 'Available' | 'Checked Out';
}

function App() {
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