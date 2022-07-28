import { Button, createStyles, Modal, Stack, TextInput, Group, Anchor } from '@mantine/core'
import { IconDownload } from '@tabler/icons'
import React, { useRef, useState } from 'react'

const useStyle = createStyles(() => ({
    filetype: {
        marginLeft: '-16px',
        width: '50px'
    }
}))

interface DownloadButtonProps {
    content: Blob
    extension: 'csv'
}

const DownloadButton = function (props: DownloadButtonProps) {
    const [showDownload, setShowDownload] = useState(false)
    return (
        <>
            <Button onClick={() => setShowDownload(true)}>Download <IconDownload size={16}/></Button>
            <DownloadWindow show={showDownload} onClose={() => setShowDownload(false)} content={props.content} extension={props.extension} />
        </>
    )
}

interface DownloadWindowProps {
    show: boolean
    onClose: () => void
    content: Blob
    extension: 'csv'
}

const downloadFilenamePlaceholder = 'download'

const DownloadWindow = function (props: DownloadWindowProps) {
    const { show, onClose, content, extension } = props
    const [filename, setFilename] = useState('')
    const { classes } = useStyle()
    const downloadRef = useRef<HTMLAnchorElement>(null)

    const handleConfirmDownload = () => {
        if (downloadRef.current) {
            const fileNameToUse = filename ? filename : downloadFilenamePlaceholder 
            const url = window.URL.createObjectURL(content)
            downloadRef.current.href = url
            downloadRef.current.download = `${fileNameToUse}.${extension}`
            downloadRef.current.click()
        }
    }

    return (
        <Modal
            title='Download GUIDs'
            opened={show}
            withCloseButton
            size='lg'
            radius='md'
            onClose={() => onClose()}
        >
            <Group align='flex-end'>
                <TextInput
                    value={filename}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFilename(event.currentTarget.value)}
                    label='File name'
                    placeholder={downloadFilenamePlaceholder}
                    required 
                />
                <TextInput className={classes.filetype} disabled value='.csv' />
            </Group>
            <Stack align='flex-end'>
                <Button onClick={handleConfirmDownload}>Download</Button>
            </Stack>
            <Anchor ref={downloadRef} />
        </Modal>
    )
}

export default DownloadButton