import styles from './Greeting.module.css';

const Greeting = () => {
    return (
        <div>
            <h2 className={styles['name']}>Dereck Melancon</h2>
            <sub>Software Dev Team Lead, B. Eng</sub>
        </div>
    )
}

export default Greeting