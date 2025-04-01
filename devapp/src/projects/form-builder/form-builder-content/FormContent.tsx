import React from "react"
import { FormContentData, SimpleHtmlFormContent } from "./formContentDataTypes"

export type FormContentProps = {
    data: FormContentData
}
const FormContent = (props: FormContentProps) => {
    const { data } = props

    if (data.type === 'html') {
        const htmlContent = data as SimpleHtmlFormContent
        return React.createElement(htmlContent.tag, htmlContent.props, htmlContent.content)
    }

    return <></>
}

export default FormContent