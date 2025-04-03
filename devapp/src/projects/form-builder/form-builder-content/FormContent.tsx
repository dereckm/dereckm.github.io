import React from "react"
import { FormContentData, HtmlInputFormContent, RegexValidationSchema, SimpleHtmlFormContent, ValidationSchema } from "./formContentDataTypes"
import { StepState } from "../Form"

export type FormContentProps = {
    data: FormContentData
    setData: (entries: Record<string, any>) => void
    setState: (state: Partial<StepState>) => void
}
const FormContent = (props: FormContentProps) => {
    const { data, setData, setState } = props

    if (data.type === 'html') {
        const htmlContent = data as SimpleHtmlFormContent

        return React.createElement(htmlContent.tag, htmlContent.props, htmlContent.content)
    } else if (data.type === 'html_input') {
        const htmlInputContent = data as HtmlInputFormContent
        return React.createElement(htmlInputContent.tag, 
            WithDataCapture(
                WithValidation(htmlInputContent.props, htmlInputContent.validation, setState), 
                htmlInputContent.id, 
                setData)
            , null)
    }


    return <></>
}

function WithDataCapture(props: React.DetailsHTMLAttributes<HTMLInputElement>, key: string, setData: (entries: Record<string, any>) => void) {
    props.onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.currentTarget.value
        setData({ [key]: str })
    }
    return props
}

function WithValidation(
    props: React.DetailsHTMLAttributes<HTMLInputElement>,
    validation: ValidationSchema,
    setState: (state: Partial<StepState>) => void) {

    const decoratedProps = props;
    if (validation.type === 'regex') {
        const regexValidation = validation as RegexValidationSchema
        decoratedProps.onBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
            const str = e.currentTarget.value
            const match = str.match(regexValidation.regex)

            if (match === null) {
                e.currentTarget.classList.add('input-error')
                setState({ canGoNext: false })
            } else {
                e.currentTarget.classList.remove('input-error')
                setState({ canGoNext: true })
            }
        }
    }

    return decoratedProps;
}

export default FormContent