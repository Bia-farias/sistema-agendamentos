import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Limpeza automática de dados de demonstração legados do navegador
const DEMO_CLEAN_VERSION = 'clean_demo_v2';
if (localStorage.getItem('agenda_ai_demo_cleaned') !== DEMO_CLEAN_VERSION) {
  localStorage.removeItem('agenda_ai_appointments');
  localStorage.removeItem('agenda_ai_customers');
  localStorage.removeItem('agenda_ai_services');
  localStorage.removeItem('agenda_ai_professionals');
  localStorage.removeItem('ngb_agenda_whatsapp_state');
  localStorage.removeItem('agenda_ai_user');
  localStorage.removeItem('agenda_ai_profile');
  localStorage.removeItem('agenda_ai_tenant');
  localStorage.setItem('agenda_ai_demo_cleaned', DEMO_CLEAN_VERSION);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
