import { useEffect } from 'react';
import Preloader from './components/Preloader';
import PageFx from './components/PageFx';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Mission from './components/Mission';
import WorkScene from './components/WorkScene';
import Work from './components/Work';
import CtaScene from './components/CtaScene';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ProjectModal from './components/ProjectModal';
import { initSite } from './lib/engine';

export default function App() {
  // Starts the scroll experience once the markup above is in the DOM.
  useEffect(() => initSite(), []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Preloader />
      <PageFx />
      <Nav />
      <main id="main">
        <Hero />
        <Stats />
        <Mission />
        <WorkScene />
        <Work />
        <CtaScene />
        <Contact />
      </main>
      <Footer />
      <ProjectModal />
    </>
  );
}