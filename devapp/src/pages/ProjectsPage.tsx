import { Board } from "../projects/chess/BoardView"
import FormBuilder from "../projects/form-builder/FormBuilder"

const ProjectsPage = () => {
    return (
        <>
            <h1 id='projects'>Projects</h1>
            <ChessProject />
            <FormBuilderProject />
        </>

    )
}

const ChessProject = () => {
    return (
        <div>
            <h2>Chess engine</h2>
            <p>Chess board and chess engine. <a href="https://github.com/dereckm/dereckm.github.io/tree/master/devapp/src/projects/chess">Source code available here.</a></p>
            <Board />
            <p>Key concepts: Bitboards, Minimax, Quiescence search, Iterative Deepening, Optimization, Scoring heuristics, Parsing,</p>
        </div>
    )
}

const FormBuilderProject = () => {
    return (
        <div>
            <h2>Form builder</h2>
            <p>Tool to allow building form with strictly json. <a href="https://github.com/dereckm/dereckm.github.io/tree/master/devapp/src/projects/form-builder">Source code available here.</a></p>
            <FormBuilder />
            <p>Key concentps: State machine, schema-driven</p>
        </div >
    )
}

export default ProjectsPage