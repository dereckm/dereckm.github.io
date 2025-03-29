import React, { useEffect, useState } from 'react'

import PersonIcon  from './person.svg'
import ResumeIcon from './resume.svg'
import ProjectsIcon from './projects.svg'
import ContactIcon from './contact.svg'

import styles from './Menu.module.css'
import MenuItem from './MenuItem'
import { IconProps } from '@tabler/icons-react'

let visibleEntries: string[] = []
const sections = ['about-me', 'resume', 'projects', 'contact'];

const Menu = ({ selectedMenuItem, setSelectedMenuItem }: MenuProps) => {
    const [isScrolling, setIsScrolling] = useState(false)
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (isScrolling) return; // prevent switching during triggered scroll
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                visibleEntries.push(entry.target.id)
              } else {
                visibleEntries = visibleEntries.filter(v => v !== entry.target.id)
              }
            });
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
      }, [setSelectedMenuItem, isScrolling]);

      useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;
        window.addEventListener('scroll', (e) => {
          clearTimeout(scrollTimeout)
          scrollTimeout = setTimeout(() => {
            setIsScrolling(false)
          }, 100)
        })
      }, [])


    const handleClick = (key: string) => () => {
        setIsScrolling(true)
        setSelectedMenuItem(key)
        const element = document.getElementById(key);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }
    }
    const check = (key: string) => selectedMenuItem === key
    return (
        <div className={styles['menu-container']}>
            <MenuItem icon={<Icon data={PersonIcon} />} title='About me' onClick={handleClick('about-me')} isSelected={check('about-me')} />
            <MenuItem icon={<Icon data={ResumeIcon} />} title='Resume' onClick={handleClick('resume')} isSelected={check('resume')} />
            <MenuItem icon={<Icon data={ProjectsIcon} />} title='Projects' onClick={handleClick('projects')} isSelected={check('projects')} />
            <MenuItem icon={<Icon data={ContactIcon} />} title='Contact' onClick={handleClick('contact')} isSelected={check('contact')} />
        </div>
        
    )
}

type IconProps = {
  data: string
}
const Icon = (props: IconProps) => {
  return <img src={props.data}></img>
}

type MenuProps = {
    selectedMenuItem: string
    setSelectedMenuItem: (key: string) => void
}


export default Menu