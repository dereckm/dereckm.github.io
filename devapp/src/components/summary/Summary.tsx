import styles from './Summary.module.css'

const Summary = () => {

    return (
        <div>
            <div className={styles['summary-content']}>
                <p>
                    Software development team lead working full time for Ubisoft Montreal. Currently working with a team of passionate  developers to improve <a href='https://help.ubisoft.com' target='_blank' rel="noreferrer">help.ubisoft.com</a> and other awesome player support products. I'm passionate about technologies, problem-solving and particularly enjoy bringing cohesion between business domain and technical expertise.

        Previously worked on CRM solutions such as an Audience Management Platform and more technical products such as Calculation engine/Propagation engine for RF simulations.
                </p>
            </div>
        </div>
    )
}

export default Summary