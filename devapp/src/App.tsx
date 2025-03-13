import React from 'react';
import styles from './App.module.css'
import Greeting from './components/greeting/Greeting';
import Menu from './components/menu/Menu';

function App() {


  return (
    <div className={styles['App']}>
      <Menu />
      <Greeting />
    </div>
      
  )
}

export default App;
