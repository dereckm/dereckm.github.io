import React, { useEffect } from 'react'

import { ReactComponent as PersonIcon } from './person.svg'
import { ReactComponent as ResumeIcon } from './resume.svg'
import { ReactComponent as ProjectsIcon } from './projects.svg'
import { ReactComponent as ContactIcon } from './contact.svg'

import styles from './Menu.module.css'
import MenuItem from './MenuItem'

let visibleEntries: string[] = []
const sections = ['about-me', 'resume', 'projects', 'contact'];

const Menu = ({ selectedMenuItem, setSelectedMenuItem }: MenuProps) => {
  
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            const allVisible: string[] = []
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                visibleEntries.push(entry.target.id)
              } else {
                visibleEntries = visibleEntries.filter(v => v !== entry.target.id)
              }
            });
            console.log(visibleEntries)
            if (visibleEntries.length > 0) {
                setSelectedMenuItem(visibleEntries.sort((a, b) => {
                    const indexA = sections.indexOf(a);
                    const indexB = sections.indexOf(b);
                
                    return indexA - indexB;
                  })[0]);
            }
          },
          { threshold: 0 }
        );
    
        sections.forEach((id) => {
          const element = document.getElementById(id);
          if (element) observer.observe(element);
        });
    
        // Cleanup the observer on component unmount
        return () => observer.disconnect();
      }, [setSelectedMenuItem]);

    const handleClick = (key: string) => () => {
        const element = document.getElementById(key);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }
        setSelectedMenuItem(key)
    }
    const check = (key: string) => selectedMenuItem === key
    return (
        <div className={styles['menu-container']}>
            <MenuItem icon={<PersonIcon />} title='About me' onClick={handleClick('about-me')} isSelected={check('about-me')} />
            <MenuItem icon={<ResumeIcon />} title='Resume' onClick={handleClick('resume')} isSelected={check('resume')} />
            <MenuItem icon={<ProjectsIcon />} title='Projects' onClick={handleClick('projects')} isSelected={check('projects')} />
            <MenuItem icon={<ContactIcon />} title='Contact' onClick={handleClick('contact')} isSelected={check('contact')} />
        </div>
        
    )
}

type MenuProps = {
    selectedMenuItem: string
    setSelectedMenuItem: (key: string) => void
}


export default Menu