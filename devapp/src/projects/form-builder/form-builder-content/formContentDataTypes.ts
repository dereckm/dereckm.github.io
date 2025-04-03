export interface FormContentData { 
    id: string
    type: string
}

export interface SimpleHtmlFormContent extends FormContentData {
    type: 'html'
    tag: string
    props: object
    content: string
}

export interface HtmlInputFormContent extends FormContentData {
    type: 'html_input'
    validation: ValidationSchema
    tag: string
    props: object
    isRequired: boolean
}

export interface ValidationSchema {
    type: string
}

export interface RegexValidationSchema extends ValidationSchema {
    regex: string
}

export type SupportedContentTags = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'