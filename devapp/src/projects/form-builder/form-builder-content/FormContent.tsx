import React from "react"
import { FormContentData, HtmlInputFormContent, RegexValidationSchema, SimpleHtmlFormContent, ValidationSchema } from "./formContentDataTypes"
import { StepState } from "../Form"

export type FormContentProps = {
    data: FormContentData
    setData: (entries: Record<string, any>) => void
    setState: (state: Partial<StepState>) => void
}

const FormContent = (props: FormContentProps) => {
    const { data, setData } = props

    if (data.type === 'html') {
        const htmlContent = data as SimpleHtmlFormContent
        return React.createElement(htmlContent.tag, htmlContent.props, htmlContent.content)
    } else if (data.type === 'html_input') {
        const htmlInputContent = data as HtmlInputFormContent
        
        let inputProps = { ...htmlInputContent.props }
        inputProps = WithValidation(inputProps, htmlInputContent.validation)
        inputProps = WithDataCapture(inputProps, htmlInputContent.id, setData, htmlInputContent.validation)
        
        return React.createElement(htmlInputContent.tag, inputProps, null)
    }

    return <></>
}

function WithDataCapture(
    props: React.DetailsHTMLAttributes<HTMLInputElement>, 
    key: string, 
    setData: (entries: Record<string, any>) => void,
    validation: ValidationSchema | undefined) {
    
    const originalOnChange = props.onChange
    
    props.onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.currentTarget.value
        setData({ [key]: str })
        
        if (validation && validation.type === 'regex') {
            try {
                const regexVal = validation as RegexValidationSchema
                const regex = new RegExp(regexVal.regex)
                if (regex.test(str)) {
                    e.currentTarget.classList.remove('input-error')
                }
            } catch (err) {}
        } else {
            e.currentTarget.classList.remove('input-error')
        }
        
        if (originalOnChange) {
            originalOnChange(e)
        }
    }
    return props
}

function WithValidation(
    props: React.DetailsHTMLAttributes<HTMLInputElement>,
    validation: ValidationSchema | undefined) {

    const decoratedProps = props
    if (validation && validation.type === 'regex') {
        const regexValidation = validation as RegexValidationSchema
        decoratedProps.onBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
            const str = e.currentTarget.value
            try {
                const regex = new RegExp(regexValidation.regex)
                if (!regex.test(str)) {
                    e.currentTarget.classList.add('input-error')
                } else {
                    e.currentTarget.classList.remove('input-error')
                }
            } catch (err) {}
        }
    }

    return decoratedProps
}

export default FormContent