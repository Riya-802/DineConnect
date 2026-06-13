import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import store from './store/store'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#F5ECD9',
                color: '#2C2416',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(176,120,80,0.12)',
                fontFamily: '"DM Sans", sans-serif',
              },
              success: { iconTheme: { primary: '#5A7A5C', secondary: '#FDF6EE' } },
              error:   { iconTheme: { primary: '#D85A30', secondary: '#FDF6EE' } },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
