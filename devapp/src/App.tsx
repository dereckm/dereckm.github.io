import React from 'react';
import './App.css';
import { AppShell, Group, Header, Navbar, NavLink, Title } from '@mantine/core';
import { IconBeach, IconHome2 } from '@tabler/icons';
import Actionbar from './components/Actionbar';
import { SpotlightAction, SpotlightProvider } from '@mantine/spotlight';
import actions from './data/actions.json'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import GuidGenerator from './pages/GuidGenerator';
import Home from './pages/Home';
import Links from './pages/Links';
import CodeEditor from './pages/CodeEditor';
import Colors from './pages/Colors';
import About from './pages/About';

function App() {
  const actionGroups = Array.from(new Set<string>(actions.filter(action => action.group !== '').map(action => action.group)))
  const singleActions = Array.from(actions.filter(action => action.group === ''))
  const location = useLocation()
  const navigate = useNavigate()

  const handleActionTrigger = (action: SpotlightAction) => navigate(`/${action.id}`)
  const mappedActions: SpotlightAction[] = actions.map(action => ({
    id: action.id,
    title: action.title,
    group: action.group,
    onTrigger: handleActionTrigger
  }))

  return (
      <SpotlightProvider 
        shortcut={'mod + K'} 
        actions={mappedActions}
        transition='slide-down'
        nothingFoundMessage='There is nothing here..'
      >
        <AppShell
          navbar={
          <Navbar width={{ base: 300 }} height={'100%'} p='xs'>
            <NavLink label="Home" onClick={() => navigate('/')} icon={<IconHome2 size={16} stroke={1.5} />} active={location.pathname === '/'} />
            {actionGroups.map(group => (
                <NavLink key={group} label={group} defaultOpened>
                  {mappedActions.filter(action => action.group === group).map(action => (
                    <NavLink key={action.id} label={action.title} onClick={() => handleActionTrigger(action)} active={location.pathname === `/${action.id}`} />
                  ))}
                </NavLink>
              )
            )}  
            {singleActions.map(action => 
              <NavLink key={action.id} label={action.title} onClick={() => navigate(`/${action.id}`)} active={location.pathname === `/${action.id}`} />
            )}
          </Navbar>
          }
          header={
            <Header height={60} p='xs'>
              <Group position='apart'>
                <Title order={1}><IconBeach size={32} stroke={1.5} />Sandbox</Title>
                <Actionbar />
              </Group>
            </Header>
          }
        >
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/guidgen' element={<GuidGenerator />} />
            <Route path='/links' element={<Links />} />
            <Route path='/editor' element={<CodeEditor />} />
            <Route path='/colors' element={<Colors />} />
            <Route path='/about' element={<About />} />
          </Routes>
        </AppShell>
      </SpotlightProvider>
  )
}

export default App;
