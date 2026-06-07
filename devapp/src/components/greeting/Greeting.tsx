import styles from './Greeting.module.css';
import { IconBrandLinkedin, IconBrandGithub, IconMail } from '@tabler/icons-react';

const Greeting = () => {
    return (
        <div className={styles['hero-container']}>
            <span className={styles['overline']}>Hi, my name is</span>
            <h1 className={styles['name']}>Dereck Melancon</h1>
            <h2 className={styles['subtitle']}>Software Dev Team Lead, B. Eng.</h2>
            <p className={styles['tagline']}>
                Building high-performance backend engines, scalable cloud architectures, and cohesive software development teams.
            </p>
            <div className={styles['social-links']}>
                <a href="https://www.linkedin.com/in/dereck-melancon/" target="_blank" rel="noreferrer" className={styles['social-button']} title="LinkedIn">
                    <IconBrandLinkedin size={18} />
                    <span>LinkedIn</span>
                </a>
                <a href="https://github.com/dereckm" target="_blank" rel="noreferrer" className={styles['social-button']} title="GitHub">
                    <IconBrandGithub size={18} />
                    <span>GitHub</span>
                </a>
                <a href="mailto:dereck.melancon@gmail.com" className={styles['social-button']} title="Email">
                    <IconMail size={18} />
                    <span>Email</span>
                </a>
            </div>
        </div>
    )
}

export default Greeting