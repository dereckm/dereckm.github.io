import React, { useState } from 'react';
import styles from './App.module.css'

import Menu from './components/menu/Menu';
import AboutPage from './pages/AboutPage';


function App() {
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('about-me')

  return (
    
    <div className={styles['App']}>
      <Menu selectedMenuItem={selectedMenuItem} setSelectedMenuItem={setSelectedMenuItem} />
      {selectedMenuItem === 'about-me' && <AboutPage />}
    </div>
      
  )
}

export default App;
