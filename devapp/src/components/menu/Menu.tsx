import { ReactComponent as PersonIcon } from './person.svg'
import { ReactComponent as ResumeIcon } from './resume.svg'
import { ReactComponent as ProjectsIcon } from './projects.svg'
import { ReactComponent as ContactIcon } from './contact.svg'

import styles from './Menu.module.css'
import MenuItem from './MenuItem'
import { useState } from 'react'

const Menu = () => {
    const [selectedMenuItem, setSelectedMenuItem] = useState<string>('about-me')
    const handleClick = (key: string) => () => setSelectedMenuItem(key)
    const check = (key: string) => selectedMenuItem == key
    return (
        <div className={styles['menu-container']}>
            <MenuItem icon={<PersonIcon />} title='About me' onClick={handleClick('about-me')} isSelected={check('about-me')} />
            <MenuItem icon={<ResumeIcon />} title='Resume' onClick={handleClick('resume')} isSelected={check('resume')} />
            <MenuItem icon={<ProjectsIcon />} title='Projects' onClick={handleClick('projects')} isSelected={check('projects')} />
            <MenuItem icon={<ContactIcon />} title='Contact' onClick={handleClick('contact')} isSelected={check('contact')} />
        </div>
        
    )
}


export default Menu