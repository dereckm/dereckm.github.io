import React from 'react'
import styles from './Experiences.module.css'

const experiences: ExperienceProps[] = [{ 
        title: 'Software development Team Lead', 
        employer: 'Ubisoft Montreal - Online Programmer (Ubisoft Help)',
        date: '2024 (current)',
        tasks: [
        "Manage the performance and professional development of developers, and administrators",
        "Define the optimal resource allocation to execute a roadmap for 4 products",
        "Continue to provide technical leadership to the team, via coaching and organize knowledge sharing sessions",
        "Communicate with other development teams and key partners to deliver ambitious initiatives"]
    }, {
        title: "Technical lead",
        employer: "Ubisoft Montreal - Online Programmer (Ubisoft Help)",
        date: '2022 - 2024',
        tasks: [
          "Analyze and make recommendations on code quality, in alignment with business objectives",
          "Define software engineering standards and the software architecture suited to customer service needs",
          "Resolve technical obstacles in a complex ecosystem",
          "Ensure the resilience of support services offered to players submitting thousands of cases daily",
          "Lead cross-functional technical convergence initiatives to technologically align public-facing applications",
        ]
    }, {
        title: "Senior full-stack developer",
        employer: "Ubisoft Montreal - Personalization",
        date: '2020-2022',
        tasks: [
          "Design cost-effective cloud solutions for data processing",
          "Develop microservices and tools used by CRM operators for content segmentation and personalization for players",
          "Deploy and monitor the health of web services"
        ]
    }, {
        title: "C# .NET Software developer",
        employer: "iBwave Solutions Inc, Montreal",
        date: '2018-2020',
        tasks: [
          "Implement the module for high-performance simulations (calculatine engine and ray-tracing) of wave propagation in MIMO systems",
          "Contribute to the architecture team for a system serialization overhaul project (approx. 300 distinct types)",
          "Implement the conversion of part of a monolithic system into microservices (3 new services)"
        ]
    }, {
        title: "Web developer",
        employer: "Bathfitter (Bain Magique), Saint-Eustache",
        date: '2015-2016',
        tasks: [
          "Develop various services (RESTful APIs) and web interfaces",
          "Design databases and web software to accelerate sales, such as a \"design your own bathroom app\"",
          "Set up Orchard CMS and implement additional modules"
        ]
    }
]

const Experiences = () => {
    return (
        <>
            <h2>Experiences</h2>
            <div className={styles['experiences-container']}>
                <div className={styles['experiences-content']}>
                    <div className={styles['timeline-container']}>
                        {experiences.map(exp => <Experience key={exp.title} title={exp.title} employer={exp.employer} date={exp.date} tasks={exp.tasks} />)}
                    </div>
                </div> 
            </div>
        </>
    )
}

type ExperienceProps = {
    title: string
    employer: string
    tasks: string[]
    date: string
}

const Experience = ({ title, employer, date, tasks }: ExperienceProps) => {
    return (
        <div className={styles['timeline-element-container']}>
            <div className={styles['timeline-branch']}><p>{date}</p></div>
            <div>
                <h3 className={styles['experience-title']}>{title}</h3>
                <sub>{employer}</sub>
                <ul>
                    {tasks.map((task, i) => <li key={i}>{task}</li>)}
                </ul>
            </div>
        </div>
        
    )
}

export default Experiences