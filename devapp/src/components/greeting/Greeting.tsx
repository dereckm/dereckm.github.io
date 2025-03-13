import styles from './Greeting.module.css';

const Greeting = () => {
    return (
    <div className={styles['greeting-container']}>
        <div>
            <h2 className={styles['name']}>Dereck Melancon</h2>
            <sub>B. Ing Software</sub>
        </div>
    </div>
    )
}

export default Greeting