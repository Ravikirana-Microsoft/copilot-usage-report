import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { FluentProvider } from '@fluentui/react-components'
import { store } from './store'
import { darkTheme } from './theme'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <FluentProvider theme={darkTheme}>
        <App />
      </FluentProvider>
    </Provider>
  </StrictMode>,
)
