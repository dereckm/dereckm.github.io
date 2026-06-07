import styles from './Skills.module.css'
import { IconCode, IconLayersIntersect, IconCloud, IconTerminal2, IconBrain } from '@tabler/icons-react'

const Skills = () => {
    const categories = [
        {
            title: 'Programming Languages',
            icon: <IconCode size={20} />,
            skills: ['C#', 'Javascript / Typescript', 'Python', 'HTML', 'CSS', 'SQL']
        },
        {
            title: 'Frameworks & Libraries',
            icon: <IconLayersIntersect size={20} />,
            skills: ['.NET / .NET Core', 'Entity Framework (EF)', 'React', 'Next.js']
        },
        {
            title: 'Cloud & Database',
            icon: <IconCloud size={20} />,
            skills: [
                'AWS (EC2, ECS, S3, DynamoDB, Aurora, IAM)',
                'GCP (Machine Translation, reCaptcha Enterprise)',
                'Redis / ElastiCache',
                'MySQL / PostgreSQL'
            ]
        },
        {
            title: 'Software Tools & CI/CD',
            icon: <IconTerminal2 size={20} />,
            skills: ['Git / GitHub / GitLab', 'Jenkins', 'Octopus Deploy', 'Rider', 'Visual Studio', 'dotPeek', 'dotTrace', 'dotMemory']
        },
        {
            title: 'Concepts & Architectures',
            icon: <IconBrain size={20} />,
            skills: [
                'Agile / Scrum / Kanban',
                'Microservices',
                'Domain-Centric Architecture',
                'Event-Driven Architecture',
                'REST APIs',
                'SRE / DevOps',
                'CI/CD',
                'SOLID / Design Patterns',
                'TDD / Unit & Integration Testing'
            ]
        }
    ]

    return (
        <div className={styles['skills-container']}>
            <h2>Software expertise</h2>
            <div className={styles['skills-grid']}>
                {categories.map((cat, idx) => (
                    <div key={idx} className={styles['skill-card']}>
                        <div className={styles['card-header']}>
                            <span className={styles['card-icon']}>{cat.icon}</span>
                            <h3>{cat.title}</h3>
                        </div>
                        <div className={styles['skills-list']}>
                            {cat.skills.map((skill, sIdx) => (
                                <span key={sIdx} className={styles['skill-pill']}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Skills