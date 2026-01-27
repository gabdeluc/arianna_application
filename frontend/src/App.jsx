import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:8000'

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [characterCount, setCharacterCount] = useState(null)
  const [participants, setParticipants] = useState([])
  const [selectedParticipant, setSelectedParticipant] = useState('')

  // Carica i partecipanti all'avvio
  useEffect(() => {
    loadParticipants()
  }, [])

  const loadParticipants = async () => {
    try {
      const response = await fetch(`${API_URL}/participants`)
      const data = await response.json()
      setParticipants(data.participants)
    } catch (err) {
      console.error('Errore caricamento partecipanti:', err)
    }
  }

  const countCharacters = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Usa l'endpoint custom per il conteggio
      let url = `${API_URL}/meeting/mtg001/character-count`
      if (selectedParticipant) {
        url += `?participant_id=${selectedParticipant}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      setCharacterCount(data)
      
    } catch (err) {
      setError(err.message)
      setCharacterCount(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Titolo */}
        <h1 style={{
          fontSize: '1.75rem',
          marginBottom: '1.5rem',
          color: '#333',
          textAlign: 'center'
        }}>
          📊 Conteggio Caratteri Transcript
        </h1>

        {/* Filtro Partecipante */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#666'
          }}>
            Filtra per partecipante (opzionale):
          </label>
          <select
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}
          >
            <option value="">Tutti i partecipanti</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pulsante */}
        <button
          onClick={countCharacters}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Caricamento...' : 'Conta Caratteri'}
        </button>

        {/* Errore */}
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            color: '#c33'
          }}>
            ⚠️ Errore: {error}
          </div>
        )}

        {/* Risultato */}
        {characterCount && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '2px solid #1976d2'
          }}>
            <h2 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.25rem',
              color: '#1976d2'
            }}>
              Risultato
            </h2>
            
            {characterCount.participant && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                📌 Partecipante: <strong>{characterCount.participant.name}</strong>
              </div>
            )}

            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              <ResultRow 
                label="Totale Caratteri" 
                value={characterCount.total_characters.toLocaleString()} 
                icon="🔤"
              />
              <ResultRow 
                label="Totale Parole" 
                value={characterCount.total_words.toLocaleString()} 
                icon="📝"
              />
              <ResultRow 
                label="Totale Messaggi" 
                value={characterCount.total_messages} 
                icon="💬"
              />
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#666',
          lineHeight: '1.6'
        }}>
          <strong>💡 Data Format:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            <li>Backend rispetta il format con campi: <code>uid</code>, <code>nickname</code>, <code>text</code>, <code>from</code>, <code>to</code></li>
            <li>Participant IDs come nell'esempio: fj93829, dkd9320</li>
            <li>Endpoint: <code>GET /meeting/&#123;meetingId&#125;/transcript/</code></li>
          </ul>
        </div>
      </div>

      {/* Footer con test links */}
      <div style={{
        marginTop: '2rem',
        fontSize: '0.85rem',
        color: '#666',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          Backend: <code>{API_URL}</code>
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          Test endpoints:
          <a href={`${API_URL}/meeting/mtg001`} target="_blank" style={{ marginLeft: '0.5rem', color: '#1976d2' }}>
            Metadata
          </a>
          {' | '}
          <a href={`${API_URL}/meeting/mtg001/transcript/`} target="_blank" style={{ color: '#1976d2' }}>
            Transcript
          </a>
          {' | '}
          <a href={`${API_URL}/docs`} target="_blank" style={{ color: '#1976d2' }}>
            API Docs
          </a>
        </div>
      </div>
    </div>
  )
}

// Componente per mostrare una riga di risultato
function ResultRow({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem',
      backgroundColor: 'white',
      borderRadius: '6px'
    }}>
      <span style={{ color: '#666', fontSize: '0.95rem' }}>
        {icon} {label}
      </span>
      <span style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: '#1976d2' 
      }}>
        {value}
      </span>
    </div>
  )
}

export default App