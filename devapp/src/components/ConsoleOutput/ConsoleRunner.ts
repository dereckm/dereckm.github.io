import { UseListStateHandlers } from "@mantine/hooks"
import { ConsoleMessage, ConsoleMessageType } from "./ConsoleOutput"

const ConsoleRunner = {
    run: function (code: string, sink: UseListStateHandlers<ConsoleMessage>) {
        const trace = console.log
        console.log = (value: string) => sink.append({ value: value, type: ConsoleMessageType.Trace, timestamp: new Date() })
        const info = console.info
        console.info = (value: string) => sink.append({ value: value, type: ConsoleMessageType.Info, timestamp: new Date() })
        const warn = console.warn
        console.warn = (value: string) => sink.append({ value: value, type: ConsoleMessageType.Warning, timestamp: new Date() })
        const error = console.error
        console.error = (value: string) => sink.append({ value: value, type: ConsoleMessageType.Error, timestamp: new Date() })
        try {
            // eslint-disable-next-line no-eval
            const result = eval(code)
            if (result) {
                sink.append({ value: result.toString(), type: ConsoleMessageType.Result, timestamp: new Date() })
            } else {
                sink.append({ value: 'Code evaluation returned no result.', type: ConsoleMessageType.Trace, timestamp: new Date() })
            }
        }
        catch (error) {
            console.error((error as Error).message + ':' + (error as Error).stack)
        }
        console.log = trace
        console.info = info
        console.warn = warn
        console.error = error
    }
}

export default ConsoleRunner
