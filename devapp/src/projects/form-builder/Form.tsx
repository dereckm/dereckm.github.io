import { useState } from "react"
import FormStep, { FormStepData as FormStepSchema } from "./FormStep"
import './Form.css'
import styles from './Form.module.css'
import { FormContentData, HtmlInputFormContent, RegexValidationSchema } from "./form-builder-content/formContentDataTypes"
import { IconCircleCheck } from "@tabler/icons-react"

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
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

    // Compute validation dynamically on every render
    const currentStepRequiredFields = currentStep.contents
        .filter(isRequiredInput)
        .map(c => c.id)

    const canGoNext = currentStepRequiredFields.every(fieldId => {
        const value = formData[fieldId]
        if (value === undefined || value === null || String(value).trim() === '') {
            return false
        }
        
        const contentPiece = currentStep.contents.find(c => c.id === fieldId) as HtmlInputFormContent
        if (contentPiece?.validation?.type === 'regex') {
            try {
                const regexVal = contentPiece.validation as RegexValidationSchema
                const regex = new RegExp(regexVal.regex)
                return regex.test(String(value))
            } catch (err) {
                return true
            }
        }
        return true
    })

    const handleNextClick = () => {
        const nextStep = data.steps.find(step => step.id === currentStep?.nextStep)
        if (nextStep) {
            setCurrentStep(nextStep)
        }
    }

    const handleSubmit = () => {
        setIsSubmitted(true)
    }

    const mergeData = (data: Record<string, any>) => {
        setFormData(prev => {
            return { ...prev, ...data }
        })
    }

    // Unused placeholder to satisfy typescript on FormStep interface callbacks
    const setPartialState = (state: Partial<StepState>) => {}

    return (
        <div className={styles['form-container']}>
            {isSubmitted ? (
                <div className={styles['success-screen']}>
                    <div className={styles['success-icon']}>
                        <IconCircleCheck size={48} />
                    </div>
                    <h3>Success!</h3>
                    <p>Your inquiry details were captured locally.</p>
                    
                    <div className={styles['summary-box']}>
                        {Object.entries(formData).map(([key, val]) => (
                            <div key={key} className={styles['summary-row']}>
                                <span className={styles['summary-key']}>{key.replace(/_input|_/g, ' ')}</span>
                                <span className={styles['summary-val']}>{String(val)}</span>
                            </div>
                        ))}
                    </div>
                    
                    <button className={styles['form-control']} onClick={() => {
                        setFormData({})
                        setCurrentStep(data.steps[0])
                        setIsSubmitted(false)
                    }}>Reset Form</button>
                </div>
            ) : (
                <>
                    <FormStep schema={currentStep} setData={mergeData} setState={setPartialState} />
                    <div className={styles['form-buttons']}>
                        {currentStep.nextStep !== null ? (
                            <button className={styles['form-control']} onClick={handleNextClick} disabled={!canGoNext}>Next</button>
                        ) : (
                            <button className={styles['form-control']} onClick={handleSubmit} disabled={!canGoNext}>Submit</button>
                        )}
                    </div>
                </>
            )}
        </div>
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