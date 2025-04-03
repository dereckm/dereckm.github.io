import { useState } from "react"
import FormStep, { FormStepData as FormStepSchema } from "./FormStep"
import './Form.css'
import styles from './Form.module.css'
import { FormContentData, HtmlInputFormContent } from "./form-builder-content/formContentDataTypes"


export type FormSchema = {
    steps: FormStepSchema[]
}
export type FormProps = {
    data: FormSchema
}

export type StepState = {
    canGoNext: boolean
}

type FormData = Record<string, object>

const Form = (props: FormProps) => {
    const { data } = props
    const [currentStep, setCurrentStep] = useState<FormStepSchema>(data.steps[0])
    const [formData, setFormData] = useState<FormData>({})
    const [stepState, setStepState] = useState<StepState>({ canGoNext: !currentStep.contents.some(isRequiredInput) })
    const handleNextClick = () => {
        const nextStep = data.steps.find(step => step.id === currentStep?.nextStep)
        if (nextStep) {
            setCurrentStep(nextStep ?? null)
            setStepState({ canGoNext: !nextStep.contents.some(isRequiredInput) })
        }
    }

    const setPartialState = (state: Partial<StepState>) => {
        setStepState(prev => {
            return { ...prev, ...state }
        })
    }

    const mergeData = (data: Record<string, any>) => {
        setFormData(prev => {
            return { ...prev, ...data }
        })
    }

    return (
        <>
            <div className={styles['form-container']}>
                <FormStep schema={currentStep} setData={mergeData} setState={setPartialState} />
                {currentStep.nextStep !== null && <button className={styles['form-control']} onClick={handleNextClick} disabled={!stepState.canGoNext}>Next</button>}
            </div>
        </>
    )
}

function isRequiredInput(contentPiece: FormContentData) {
    if (contentPiece.type === "html_input") {
        const content = contentPiece as HtmlInputFormContent
        if (content.isRequired) return true
    }
    return false
}

export default Form