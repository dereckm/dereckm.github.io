import React from 'react'
import { Title, Space, Text } from '@mantine/core'

interface PageHeaderProps {
    title: string
    description: string
}

const PageHeader = function (props: PageHeaderProps) {
    const { title, description } = props
    return (
        <>
            <Title order={2}>{title}</Title>
            <Space h='xs'></Space>
            <Text color='gray'>{description}</Text>
            <Space h='lg'></Space>
        </>
    )
}

export default PageHeader
