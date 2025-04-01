import { useState } from "react"
import FormStep, { FormStepData } from "./FormStep"


export type FormData = {
    steps: FormStepData[]
}
export type FormProps = {
    data: FormData
}
const Form = (props: FormProps) => {
    const { data } = props

    const [currentStep, setCurrentStep] = useState<FormStepData>(data.steps[0])

    const handleNextClick = () => {
        const nextStep = data.steps.find(step => step.id === currentStep?.nextStep)
        if (nextStep) {
            setCurrentStep(nextStep ?? null)
        }
    }
    
    return (
        <>
            <FormStep data={currentStep} />
            { currentStep.nextStep !== null && <button onClick={handleNextClick}>Next</button> }
        </>
    )
}

export default Form