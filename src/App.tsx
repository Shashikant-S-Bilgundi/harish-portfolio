import { useEffect } from 'react';
import Preloader from './components/Preloader';
import GlobalFx from './components/GlobalFx';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Mission from './components/Mission';
import Builder from './components/Builder';
import Work from './components/Work';
import CtaScene from './components/CtaScene';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Overlays from './components/Overlays';
import { initPortfolio } from './lib/portfolio';

export default function App() {
  // Starts the GSAP / Lenis experience once the markup above is in the DOM.
  useEffect(() => initPortfolio(), []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Preloader />
      <GlobalFx />
      <Nav />
      <main id="main">
        <Hero />
        <Stats />
        <Mission />
        <Builder />
        <Work />
        <CtaScene />
        <Contact />
      </main>
      <Footer />
      <Overlays />
    </>
  );
}