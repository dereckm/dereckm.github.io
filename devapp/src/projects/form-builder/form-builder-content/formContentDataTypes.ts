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

export type SupportedContentTags = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'