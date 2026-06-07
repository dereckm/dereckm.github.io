import styles from "./ContactPage.module.css"
import { IconBrandLinkedin, IconMail } from "@tabler/icons-react"

const ContactPage = () => {
    return (
        <div className={styles['contact-container']}>
            <h1 id='contact'>Contact</h1>
            <div className={styles['contact-card']}>
                <p>Always happy to connect to discuss technology, software engineering, or team leadership opportunities.</p>
                <div className={styles['contact-methods']}>
                    <a href="mailto:dereck.melancon@gmail.com" className={styles['contact-btn']}>
                        <IconMail size={20} />
                        <span>Email Me</span>
                    </a>
                    <a href="https://www.linkedin.com/in/dereck-melancon/" target="_blank" rel="noreferrer" className={styles['contact-btn']}>
                        <IconBrandLinkedin size={20} />
                        <span>LinkedIn</span>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default ContactPage