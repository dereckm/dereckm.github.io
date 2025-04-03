import FormContent from "./form-builder-content/FormContent"
import { FormContentData } from "./form-builder-content/formContentDataTypes"
import { StepState } from './Form'

export type FormStepData = {
    id: string
    contents: FormContentData[]
    nextStep: string | null
}

export type FormStepProps = {
    schema: FormStepData,
    setData: (entries: Record<string, any>) => void
    setState: (state: Partial<StepState>) => void
}

const FormStep = (props: FormStepProps) => {
    const { schema, setData, setState } = props

    return (
        <>
            <div>
                {schema.contents.map(contentPiece => <FormContent key={contentPiece.id} data={contentPiece} setData={setData} setState={setState} />)}
            </div>
        </>
    )
}

export default FormStep