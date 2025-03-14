import styles from './Skills.module.css'

const Skills = () => {
    return (
        <>
            <h2>Software expertise</h2>
            <div className={styles['skills-content']}>
                <SkillSection title='Programming languages'>
                    <p>C#, Javascript / Typescript, Python, HTML, CSS, SQL </p>
                </SkillSection>
                <SkillSection title='Frameworks'>
                    <p>.NET, .NET Core, .NET Framework, Entity Framework (EF), ReactJS, NextJs</p>
                </SkillSection>
                <SkillSection title='Cloud programming'>
                    <>
                        <p>AWS: S3, DynamoDB, IAM, Aurora MySQL/PGSQL, Parameter Store, Elasticache / Redis, EC2, ECS</p>
                        <p>Google Cloud: Machine translations, reCaptcha Enterprise</p>
                    </>
                </SkillSection>
                <SkillSection title='Software tools'>
                    <p>Visual studio (VS), Visual studio code, Rider, Git, Github, Gitlab, Octopus, Jenkins, dotPeek, dotTrace, dotCover, dotMemory</p>
                </SkillSection>
                <SkillSection title='Concepts'>
                    <p>Agile methodology, Kanban, Scrum, DevOps, REST API, site-reliability engineering (SRE), software security, microservices architecture, domain-centric architecture, event-driven architecture, GRASP, SOLID, software design patterns, test-driven development (TDD), object-oriented programming (OOP), Continus integration and Continuous Deployment (CI/CD), Unit testing, Integration testing</p>
                </SkillSection>
            </div>   
        </>
    )
}

type SkillSectionProps = {
    title: string,
    children: JSX.Element
}
const SkillSection = ({ title, children }: SkillSectionProps) => {
    return (
    <div>
        <h3>{title}</h3>
        {children}
    </div>
    )
}

export default Skills