import React, { useState } from 'react';
import styles from './App.module.css'

import Menu from './components/menu/Menu';
import AboutPage from './pages/AboutPage';
import ResumePage from './pages/ResumePage';
import ContactPage from './pages/ContactPage';
import ProjectsPage from './pages/ProjectsPage';


function App() {
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('about-me')

  return (
    
    <div className={styles['App']}>
      <Menu selectedMenuItem={selectedMenuItem} setSelectedMenuItem={setSelectedMenuItem} />
      <div className={styles['pages-container']}>
        <AboutPage />
        <ResumePage />
        <ProjectsPage />
        <ContactPage />
      </div>
    </div>
      
  )
}

export default App;
