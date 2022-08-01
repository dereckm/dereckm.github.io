import React, { useState } from 'react'
import { Button, createStyles, Group, NumberInput, Table } from '@mantine/core'
import { useClipboard, useListState } from '@mantine/hooks'
import { IconClipboardCheck, IconCopy } from '@tabler/icons'
import DownloadButton from '../components/DownloadButton'
import PageHeader from '../components/PageHeader'

const maxDisplayedGuids = 20

const useStyle = createStyles((theme) => ({
    copyButton: {
        cursor: 'pointer',
        backgroundColor: theme.colors[theme.primaryColor][5],
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'center',
    },
    copyButtonCopied: {
        cursor: 'pointer',
        backgroundColor: theme.colors.green[5],
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'center',
    }
}))

const GuidGenerator = function() {
    const [amount, setAmount] = useState(1)
    const [guids, guidsHandlers] = useListState<string>([])
    const clipboard = useClipboard({ timeout: 1000 })
    const { classes } = useStyle()

    const handleGenerate = () => {
        if (isNaN(amount)) {
            // TODO: Set error
            return
        }

        const generatedGuids = []
        for(let i = 0; i < amount; i++) {
            generatedGuids.push(crypto.randomUUID())
        }
        guidsHandlers.setState(generatedGuids)
    }

    const getContent = () => new Blob([guids.join(',\n') + '\n'], { type: 'text/csv' })
    
    return (
        <>
            <PageHeader title='Guid generator' description='Use this tool to rapidly generate some guids or create and download a list.' />
            <Group position='right'>
                <DownloadButton getContent={getContent} extension='csv' />
            </Group>
            <Group position='apart' grow align={'flex-end'}>
                <NumberInput 
                    label='Number of Guids'
                    placeholder='How many?'
                    value={amount}
                    onChange={(value) => setAmount(value ?? 1)}
                    required
                />
                <Button onClick={() => handleGenerate()}>Generate</Button>
            </Group>
            {guids.length > 0 && (
                <Table highlightOnHover>
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Value</th>
                            <th></th></tr>
                    </thead>
                    <tbody>
                        {guids.slice(0, maxDisplayedGuids).map((g, i) => (
                            <tr key={g}>
                                <td>{i}</td>
                                <td>{g}</td>
                                { clipboard.copied 
                                    ? <td className={classes.copyButtonCopied}><IconClipboardCheck size={24} /></td>
                                    : <td className={classes.copyButton}><IconCopy onClick={() => clipboard.copy(g)} size={24} /></td>
                                }
                            </tr>
                        ))}
                        {guids.length > maxDisplayedGuids && (
                            <tr>
                                <td>...</td>
                                <td>...</td>
                                <td>...</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </>
    )
}

export default GuidGenerator