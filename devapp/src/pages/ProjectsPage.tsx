import { Board } from "../projects/chess/BoardView"

const ProjectsPage = () => {
    return (
        <div>
            <h1 id='projects'>Projects</h1>
            <h2>Chess engine</h2>
            <p>Chess board and chess engine. <a href="https://github.com/dereckm/dereckm.github.io/tree/master/devapp/src/projects/chess">Source code available here.</a></p>
            <Board />
            <p>Key concepts: Bitboards, Minimax, Quiescence search, Iterative Deepening, Optimization, Scoring heuristics, Parsing,</p>
        </div>
    )
}

export default ProjectsPage