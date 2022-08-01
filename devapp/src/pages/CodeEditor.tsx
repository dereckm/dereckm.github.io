import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { createStyles, Space, Group, ActionIcon, Modal, TextInput, Stack, Button, Divider } from '@mantine/core'
import { IconPlus } from '@tabler/icons'
import Editor from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useListState } from '@mantine/hooks'
import ConsoleOutput, { ConsoleMessage } from '../components/ConsoleOutput/ConsoleOutput'
import ConsoleRunner from '../components/ConsoleOutput/ConsoleRunner'
import editorDefault from '../data/editor-default.json'

const CodeEditor = function () {
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>()
    const [messages, messagesHandlers] = useListState<ConsoleMessage>([])
    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        setEditor(editor)
    }

    const handleRun = () => {
        if (editor) {
            const model = editor.getModel()
            if (model?.getLanguageId() === 'javascript') {
                ConsoleRunner.run(model.getValue(), messagesHandlers)
            }
        }
    }

    return (
        <>
            <PageHeader title='Editor' description='Visualize/edit file(s) within this editor.'></PageHeader>
            <Group position='right'>
                <Button color='primary' onClick={handleRun}>Run</Button>
            </Group>
            <Space h='md'></Space> 
            <Divider my='sm' />
            <Editor height='calc(100vh - 300px)' defaultLanguage='javascript' defaultValue={editorDefault.content} onMount={handleEditorDidMount}/>
            <ConsoleOutput messages={messages} />
        </>
    )
}

export default CodeEditor
