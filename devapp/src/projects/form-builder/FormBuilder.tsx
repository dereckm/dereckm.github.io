import defaultConfiguration from './default_configuration.json'
import { useState } from 'react'
import styles from './ConfigurationInput.module.css'
import Form from './Form'
import { FormSchema } from './Form'

const FormBuilder = () => {
    const [configuration, setConfiguration] = useState<FormSchema>(defaultConfiguration)

    return (
        <>
            <ConfigurationInput configuration={JSON.stringify(configuration)} onConfigurationChanged={setConfiguration} />
            <Form data={configuration}></Form>
        </>
    )
}

type ConfigurationInputProps = {
    configuration: string
    onConfigurationChanged: (config: any) => void
}
const ConfigurationInput = (props: ConfigurationInputProps) => {
    const { configuration, onConfigurationChanged } = props

    const handleConfigurationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const content = JSON.parse(e.currentTarget.value)
            onConfigurationChanged(content)
        } catch (err) {
            // ignore
        }
    }
    return (
        <>
            <div className={styles['configuration-input-container']}>
                <label>Schema</label>
                <textarea value={configuration} onChange={handleConfigurationChange}>
                </textarea>
            </div>

        </>
    )
}











export default FormBuilder