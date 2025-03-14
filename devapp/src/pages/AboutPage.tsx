import Greeting from '../components/greeting/Greeting';
import Summary from '../components/summary/Summary';

const AboutPage = () => {
    return (
        <div>
            <h1 id='about-me'>About me</h1>
            <Greeting />
            <Summary />
        </div>
    )
}

export default AboutPage