import { Board } from "../projects/chess/BoardView"
import FormBuilder from "../projects/form-builder/FormBuilder"
import BedrockCalculator from "../projects/bedrock-calculator/BedrockCalculator"
import styles from "./ProjectsPage.module.css"
import { IconBrandGithub } from "@tabler/icons-react"

const ProjectsPage = () => {
    return (
        <div className={styles['projects-container']}>
            <h1 id='projects'>Projects</h1>
            
            <div className={styles['project-card']}>
                <div className={styles['project-header']}>
                    <div className={styles['project-title-area']}>
                        <h2>Chess Engine</h2>
                        <p className={styles['project-description']}>
                            An interactive chess board and custom chess engine running directly in the browser. Powered by optimized search heuristics and move evaluation.
                        </p>
                        <div className={styles['tech-tags']}>
                            {['Bitboards', 'Minimax', 'Quiescence Search', 'Iterative Deepening', 'Heuristic Scoring'].map(tag => (
                                <span key={tag} className={styles['tech-tag']}>{tag}</span>
                            ))}
                        </div>
                    </div>
                    <a href="https://github.com/dereckm/dereckm.github.io/tree/master/devapp/src/projects/chess" target="_blank" rel="noreferrer" className={styles['github-link']}>
                        <IconBrandGithub size={18} />
                        <span>Source Code</span>
                    </a>
                </div>
                <div className={styles['demo-container']}>
                    <Board />
                </div>
            </div>

            <div className={styles['project-card']}>
                <div className={styles['project-header']}>
                    <div className={styles['project-title-area']}>
                        <h2>Form Builder</h2>
                        <p className={styles['project-description']}>
                            A schema-driven dynamic form generator that allows building fully validated multi-step workflows using structured JSON configurations.
                        </p>
                        <div className={styles['tech-tags']}>
                            {['State Machine', 'JSON Schema', 'Dynamic Rendering', 'Regex Validation'].map(tag => (
                                <span key={tag} className={styles['tech-tag']}>{tag}</span>
                            ))}
                        </div>
                    </div>
                    <a href="https://github.com/dereckm/dereckm.github.io/tree/master/devapp/src/projects/form-builder" target="_blank" rel="noreferrer" className={styles['github-link']}>
                        <IconBrandGithub size={18} />
                        <span>Source Code</span>
                    </a>
                </div>
                <div className={styles['demo-container']}>
                    <FormBuilder />
                </div>
            </div>

            <div className={styles['project-card']}>
                <div className={styles['project-header']}>
                    <div className={styles['project-title-area']}>
                        <h2>AWS Bedrock Calculator</h2>
                        <p className={styles['project-description']}>
                            An interactive cost estimation dashboard for AWS Bedrock Agents and RAG. Simulates multi-turn conversation token compounding and ReAct orchestration steps.
                        </p>
                        <div className={styles['tech-tags']}>
                            {['AWS Bedrock', 'RAG & Agents', 'Cost Optimization', 'Interactive Analytics', 'SVG Visualization'].map(tag => (
                                <span key={tag} className={styles['tech-tag']}>{tag}</span>
                            ))}
                        </div>
                    </div>
                    <a href="https://github.com/dereckm/dereckm.github.io/tree/master/devapp/src/projects/bedrock-calculator" target="_blank" rel="noreferrer" className={styles['github-link']}>
                        <IconBrandGithub size={18} />
                        <span>Source Code</span>
                    </a>
                </div>
                <div className={styles['demo-container']}>
                    <BedrockCalculator />
                </div>
            </div>
        </div>
    )
}

export default ProjectsPage