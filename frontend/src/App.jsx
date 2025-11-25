import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('Caricamento...')
  const [error, setError] = useState(null)

  useEffect(() => {
    // Effettua la richiesta GET al backend al caricamento del componente
    fetch('http://localhost:8000/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Errore nella risposta del server')
        }
        return response.json()
      })
      .then(data => {
        setMessage(data.message)
      })
      .catch(err => {
        setError(err.message)
        setMessage('Impossibile connettersi al backend')
      })
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0'
    }}>
      <h1 style={{ color: '#333' }}>Frontend React</h1>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <p style={{ 
          fontSize: '18px', 
          color: error ? '#d32f2f' : '#2e7d32',
          margin: 0
        }}>
          {message}
        </p>
      </div>
      {!error && (
        <p style={{ 
          marginTop: '20px', 
          color: '#666',
          fontSize: '14px'
        }}>
          ✓ Connessione al backend riuscita!
        </p>
      )}
    </div>
  )
}

export default App