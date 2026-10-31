import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// No <StrictMode>: the GSAP/Lenis engine must only initialise once.
createRoot(document.getElementById('root') as HTMLElement).render(<App />);