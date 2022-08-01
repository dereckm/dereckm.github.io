import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { Space, Group, Button, Divider, SegmentedControl, Tooltip } from '@mantine/core'
import Editor from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useListState } from '@mantine/hooks'
import ConsoleOutput, { ConsoleMessage } from '../components/ConsoleOutput/ConsoleOutput'
import ConsoleRunner from '../components/ConsoleOutput/ConsoleRunner'
import editorDefault from '../data/editor-default.json'
import { IconAlignLeft, IconSearch, IconZoomIn, IconZoomOut } from '@tabler/icons'
import DownloadButton from '../components/DownloadButton'

const jsLang = 'javascript'

const supportedLanguages = [{ 
    label: 'Js',
    value: jsLang,
}, {
    label: 'Json',
    value: 'json'
}
]

const CodeEditor = function () {
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>()
    const [messages, messagesHandlers] = useListState<ConsoleMessage>([])
    const [language, setLanguage] = useState(supportedLanguages[0].value)
    const [zoom, setZoom] = useState(100)
    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        setEditor(editor)
    }

    const handleRun = () => {
        if (editor) {
            const model = editor.getModel()
            if (model?.getLanguageId() === jsLang) {
                ConsoleRunner.run(model.getValue(), messagesHandlers)
            }
        }
    }

    const handleFormatButtonClick = () => {
        if (editor) {
            const action = editor.getAction('editor.action.formatDocument')
            action.run()
        }
    }

    const handleSearchButtonClick = () => {
        if (editor) {
            const action = editor.getAction('editor.action.startFindReplaceAction')
            action.run()
        }
    }

    const handleLanguageChange = (language: string) => {
        if (editor) {
            const model = editor.getModel()
            if (model) {
                monaco.editor.setModelLanguage(model, language)
                setLanguage(language)
                console.log(editor.getModel()?.getLanguageId())
            }
        }
    }

    const handleZoomInClicked = () => {
        if (editor) {
            const action = editor.getAction('editor.action.fontZoomIn')
            action.run()
            setZoom(zoom)
        }
    }

    const handleZoomOutClicked = () => {
        if (editor) {
            const action = editor.getAction('editor.action.fontZoomOut')
            action.run()
            setZoom(zoom)
        }
    }
    
    const getContent = () => {
        if (editor) {
            const model = editor.getModel()
            if (model) {
                return new Blob([model?.getValue()])
            }
        }

        return new Blob([''])
    }

    return (
        <>
            <PageHeader title='Editor' description='Visualize/edit file(s) within this editor.'></PageHeader>
            <Group position='apart'>
                <Button.Group>
                    <Tooltip label='Format document'><Button variant='outline' onClick={handleFormatButtonClick}><IconAlignLeft /></Button></Tooltip>
                    <Tooltip label='Find in document'><Button variant='outline' onClick={handleSearchButtonClick}><IconSearch /></Button></Tooltip>
                    <Tooltip label='Download'><DownloadButton getContent={getContent} extension={getExtension(language)} /></Tooltip>
                </Button.Group>
                <Button.Group>
                    <SegmentedControl data={supportedLanguages} value={language} onChange={handleLanguageChange}></SegmentedControl>
                    <Tooltip label='Zoom in'><Button variant='subtle' onClick={handleZoomInClicked}><IconZoomIn /></Button></Tooltip>
                    <Tooltip label='Zoom out'><Button variant='subtle' onClick={handleZoomOutClicked}><IconZoomOut /></Button></Tooltip>
                </Button.Group>
                <Button color='primary' onClick={handleRun} disabled={language !== jsLang}>Run</Button>
            </Group>
            <Space h='md'></Space> 
            <Divider my='sm' />
            <Editor height='calc(100vh - 300px)' language={language} defaultValue={editorDefault.content} onMount={handleEditorDidMount}/>
            <ConsoleOutput messages={messages} />
        </>
    )
}

function getExtension(language: string): 'js' | 'json' {
    if (language !== jsLang) {
        return 'json'
    }

    return 'js'
}

export default CodeEditor
