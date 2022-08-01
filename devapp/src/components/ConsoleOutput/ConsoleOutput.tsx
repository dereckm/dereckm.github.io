import { Affix, Card, createStyles, Divider, Group, Text } from '@mantine/core'
import { IconAlertTriangle, IconBug, IconChevronRight, IconInfoCircle, IconReportSearch } from '@tabler/icons'
import React from 'react'

const useStyle = createStyles((theme) => ({
    consoleOutputContainer: {
        width: 'calc(100% - 300px)',
        height: '20%',
        minHeight: '20%',
        overflowY: 'hidden',
        borderTop: '1px solid #000',
        borderLeft: '1px solid #000'
    },
    consoleOutput: {
        height: '100%',
        overflow: 'scroll',
        backgroundColor: theme.colors.gray[0]
    }
}))

interface ConsoleOutputProps {
    messages: ConsoleMessage[]
}

export const enum ConsoleMessageType {
    Trace,
    Info,
    Warning,
    Error,
    Result
}

export interface ConsoleMessage {
    value: string
    type: ConsoleMessageType
    timestamp: Date
}

const ConsoleOutput = function (props: ConsoleOutputProps) {
    const { messages } = props
    const { classes } = useStyle()
    return (
        <>
            <Affix className={classes.consoleOutputContainer}>
                <Card shadow='md' withBorder className={classes.consoleOutput}>
                    {messages.map((message, i) => <span key={`console_message_${i}`}><ConsoleMessageComp {...message}></ConsoleMessageComp></span>)}
                </Card>
            </Affix>
        </>
    )
}


const ConsoleMessageComp = function (message: ConsoleMessage) {
    let formattedMessage: React.ReactNode = <Text>{message.value}</Text>
    switch (message.type) {
        case ConsoleMessageType.Result:
            formattedMessage = <ConsoleMessageResult {...message} />
            break
        case ConsoleMessageType.Trace:
            formattedMessage = <ConsoleMessageTrace {...message} />
            break
        case ConsoleMessageType.Info:
            formattedMessage = <ConsoleMessageInfo {...message} />
            break;
        case ConsoleMessageType.Warning:
            formattedMessage = <ConsoleMessageWarn {...message} />
            break;
        case ConsoleMessageType.Error:
            formattedMessage = <ConsoleMessageError {...message} />
            break
        default:
            formattedMessage = <Text>{message.value}</Text>
            break
    }

    return (
        <>
            {formattedMessage}
            <Divider size='xs'></Divider>
        </>
    )
}

const ConsoleMessageResult = function(message: ConsoleMessage) {
    return (
        <>
            <Group position='apart' align='flex-start'>
                <Text color='teal'><IconChevronRight size='12'/> {message.value}</Text>
                <Text color='dimmed'>{message.timestamp.toLocaleString()}</Text>
            </Group>
        </>
    )
}

const ConsoleMessageTrace = function(message: ConsoleMessage) {
    return (
        <>
            <Group position='apart' align='flex-start'>
                <Text color='dimmed'><IconReportSearch size='12'/> {message.value}</Text>
                <Text color='dimmed'>{message.timestamp.toLocaleString()}</Text>
            </Group>
        </>
    )
}

const ConsoleMessageInfo = function(message: ConsoleMessage) {
    return (
        <>
            <Group position='apart' align='flex-start'>
                <Text color='cyan'><IconInfoCircle size='12'/> {message.value}</Text>
                <Text color='dimmed'>{message.timestamp.toLocaleString()}</Text>
            </Group>
        </>
    )
}

const ConsoleMessageWarn = function(message: ConsoleMessage) {
    return (
        <>
            <Group position='apart' align='flex-start'>
                <Text color='yellow'><IconAlertTriangle size='12'/> {message.value}</Text>
                <Text color='dimmed'>{message.timestamp.toLocaleString()}</Text>
            </Group>
        </>
    )
}

const ConsoleMessageError = function(message: ConsoleMessage) {
    return (
        <>
            <Group position='apart' align='flex-start'>
                <Text color='red' style={{width: '50%'}}><IconBug size='12'/> {message.value}</Text>
                <Text color='dimmed'>{message.timestamp.toLocaleString()}</Text>
            </Group>
        </>
    )
}

export default ConsoleOutput
