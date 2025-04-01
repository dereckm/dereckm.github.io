import styles from './FormStep.module.css'
import FormContent from "./form-builder-content/FormContent"
import { FormContentData } from "./form-builder-content/formContentDataTypes"

export type FormStepData = {
    id: string
    content: FormContentData[]
    nextStep: string | null
}

export type FormStepProps = {
    data: FormStepData
}
const FormStep = (props: FormStepProps) => {
    const { data } = props
    return (
        <>
        <div>
            <div className={styles['form-step-content-container']}>
                {data.content.map(contentPiece => <FormContent key={contentPiece.id} data={contentPiece} />)}
            </div>
        </div>
        </>
    )
}

export default FormStep