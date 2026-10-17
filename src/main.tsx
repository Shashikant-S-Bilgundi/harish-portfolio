import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './style-v2.css'; // must stay after style.css so the overrides win

// No <StrictMode>: the legacy GSAP/Lenis script must only initialise once.
createRoot(document.getElementById('root') as HTMLElement).render(<App />);