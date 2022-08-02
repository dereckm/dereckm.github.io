import { Button, ColorPicker, Group, Select, Space, Stack, TextInput, Input, Notification, useMantineTheme, Tooltip } from '@mantine/core'
import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useClipboard } from '@mantine/hooks'
import { IconCheck } from '@tabler/icons'
import Color from 'color'

const numberOfShades = 10

const colorFormats = [
    { label: 'hex', value: 'hex' },
    { label: 'rgba', value: 'rgba' },
    { label: 'rgb', value: 'rgb' },
    { label: 'hsl', value: 'hsl' },
    { label: 'hsla', value: 'hsla' },
]

const defaultColorFormat = 'hex'

type ColorFormat = 'hex' | 'rgba' | 'rgb' | 'hsl' | 'hsla'

const Colors = function() {
    const [colorFormat, setColorFormat] = useState<ColorFormat>(defaultColorFormat)
    const [color, setColor] = useState<Color>(new Color('hsl(97, 48%, 40%)'))
    const [textColor, setTextColor] = useState('')
    const theme = useMantineTheme()
    const handleColorTextChange = (value: string) => {
       setTextColor(value)
       try {
        const newColor = new Color(value)
        setColor(newColor)
       } catch {

       }
    }
    return (
        <>
            <PageHeader title='Color utilities' description='Use these tools to generate palettes, convert to/from hexadecimal.' />
            <Group position='left' align='flex-start'>
                <ColorPicker format={colorFormat} value={color.hexa()} onChange={(color: string) => {
                    const newColor = new Color(color)
                    setColor(newColor)
                    setTextColor(getTextColor(newColor, colorFormat))
                }} />
                <Stack>
                    <Select label='Format' data={colorFormats} value={colorFormat} onChange={(value: string | null) => setColorFormat(getColorFormat(value))} />
                    <TextInput value={textColor} onChange={(e) => handleColorTextChange(e.currentTarget.value)}></TextInput>
                </Stack>
            </Group>
            <Space h='md' />
            <Stack>
                <Input.Wrapper label='Lighter'>
                    <Button.Group>
                        {Array.from(Array(numberOfShades).keys()).map(i => <ColorButton key={i} color={theme.fn.lighten(color.rgb().string(), 0.1 * i)} />)}
                    </Button.Group>
                </Input.Wrapper>
                <Input.Wrapper label='Darker'>
                    <Button.Group>
                        {Array.from(Array(numberOfShades).keys()).map(i => <ColorButton key={i} color={theme.fn.darken(color.rgb().string(), 0.1 * i)} />)}
                    </Button.Group>
                </Input.Wrapper>
                <Input.Wrapper label='Palette'>
                    <Button.Group>
                        <ColorButton color={'#FFF'} />
                        {Array.from(Array((numberOfShades / 2) - 1).keys()).reverse().map(i => <ColorButton key={i} color={theme.fn.lighten(color.rgb().string(), 0.2 * (i + 1))} />)}
                        <ColorButton color={color.rgb().string()} />
                        {Array.from(Array((numberOfShades / 2) - 1).keys()).map(i => <ColorButton key={i} color={theme.fn.darken(color.rgb().string(), 0.2 * (i + 1))} />)}
                    </Button.Group>
                </Input.Wrapper>
            </Stack>
        </>
    )
}

function getColorFormat(name: string | null): ColorFormat {
    if (name === 'hex') return name
    if (name === 'rgba') return name
    if (name === 'rgb') return name
    if (name === 'hsl') return name
    if (name === 'hsla') return name

    return 'hex'
}

const getTextColor = function(color: Color, format: ColorFormat) {
    if (format === 'hex') return color.hex()
    if (format === 'hsl') return color.hsl().string()
    if (format === 'hsla') return color.hsl().string()
    if (format === 'rgb') return color.rgb().string()
    if (format === 'rgba') return color.rgb().string()

    return color.hex()
}

interface ColorButtonProps {
    color: string
}

const ColorButton = function(props: ColorButtonProps) {
    const { color } = props
    const colorObj = new Color(color)
    const colorText = colorObj.alpha() === 1 ? colorObj.hex() : colorObj.rgb().string()
    const clipboard = useClipboard({ timeout: 1500 })
    return(
        <div style={{ position: 'relative' }}>
            <Tooltip label={`Copy - ${colorText}`}>
                <Button onClick={() => clipboard.copy(colorText)} style={{backgroundColor: color, borderTop: '1px solid #888', borderBottom: '1px solid #888'}}></Button>
            </Tooltip>
            
            { clipboard.copied && <Notification style={{position: 'absolute', zIndex: 99, top: '20px', left: '10px', width: '250px' }} icon={<IconCheck size={18} />} color="teal" title="Copied">Color has been copied to clipboard!</Notification> }
        </div>
    )
}



export default Colors
