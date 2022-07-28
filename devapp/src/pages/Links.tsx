import React, { useState } from 'react'
import { Card, Chip, createStyles, Grid, Group, Space, Text, Box, Divider, Select, SelectItem, CloseButton, Highlight, FocusTrap, Center, Stack } from '@mantine/core'
import PageHeader from '../components/PageHeader'
import links from '../data/links.json'
import { useEventListener } from '@mantine/hooks'

const useStyle = createStyles((theme) => ({
    card: {
        cursor: 'pointer'
    },
    clearFilterButton: {
        backgroundColor: theme.colors[theme.primaryColor][5],
        color: '#FFF',
        marginLeft: '-20px',
        minHeight: '36px',
        borderRadius: '0 5px 5px 0',
        '&:hover': {
            backgroundColor: theme.colors[theme.primaryColor][3]
        }
    }
}))

interface LinkModel {
    label: string,
    url: string,
    description: string,
    tags: string[]
}

const Links = function() {
    const [tags, setTags] = useState<string[]>([])
    const { classes } = useStyle()
    const enterKeyRef = useEventListener('keydown', (event: KeyboardEvent) => {
        if (event.code === 'Enter') {
            const selectValue = enterKeyRef.current.value
            if (selectValue) {
                handleTagClicked(selectValue)
            }
        }
    })
    const handleTagClicked = (tag: string) => {
        const tagsSet = new Set<string>(tags)
        console.log(tagsSet)
        if (tagsSet.has(tag)) {
            tagsSet.delete(tag)
        } else {
            tagsSet.add(tag.toLowerCase())
        }
        setTags(Array.from(tagsSet))
    }

    const allTags = Array.from(new Set<string>(links.flatMap(link => link.tags)))
    const selectedTags = new Set<string>(tags)
    const selectableTags: SelectItem[] = allTags
        .filter(tag => !selectedTags.has(tag))
        .map(tag => ({ value: tag, label: tag }))
    const filteredLinks = selectedTags.size > 0
        ? links.filter(link => tags.some(tag => link.label.toLowerCase().includes(tag)) || link.tags.some(tag => selectedTags.has(tag)))
        : links
    
    return (
        <>
            <PageHeader title='Links' description='Collection of some useful links related to software development topics.' />
            <FocusTrap active>
                <Group style={{padding: '10px'}} align='flex-end'>
                    <Select
                        ref={enterKeyRef}
                        label='Add tags'
                        searchable
                        creatable
                        getCreateLabel={(query) => {
                            if (selectedTags.has(query.toLowerCase())) {
                                return `- Remove ${query}`
                            }
                            return `+ Create ${query}`
                        }}
                        onCreate={(query) => {
                            const item = { value: query, label: query };
                            return item
                        }}
                        placeholder='Add tag..'
                        data={selectableTags}
                        value={null}
                        onChange={handleTagClicked}
                        data-autofocus
                    />
                    <CloseButton className={classes.clearFilterButton} onClick={() => setTags([])}/>
                    {tags.map(tag => <Chip key={tag} checked={true} onChange={() => handleTagClicked(tag)}>{tag}</Chip>)}
                </Group>
            </FocusTrap>
            <Divider />
            <Space h='lg'></Space>
            <Grid>
                {filteredLinks.map((link, i) => (
                    <Grid.Col key={`link_${i}`} span={3}>
                        <Link link={link} onTagClicked={handleTagClicked} selectedTags={selectedTags} />
                    </Grid.Col>
                ))}
                {filteredLinks.length === 0 && (
                    <>
                        <Center style={{width: '100%', paddingTop: '150px'}}>
                            <Stack>
                                <Text weight='bold'>Nothing to see here..</Text>
                                <Text size='sm' color='dimmed'>Perhaps trying different keywords might help?</Text>
                            </Stack>
                        </Center>
                    </>
                )}
            </Grid>
        </>
    )
}

interface LinkProps {
    link: LinkModel
    selectedTags: Set<string>
    onTagClicked: (tag: string) => void
}

const Link = function(props: LinkProps) {
    const { link, selectedTags, onTagClicked } = props
    const { classes } = useStyle()
    const handleExternalLinkClick = (url: string) => {
        window.location.assign(url)
    }

    return (
        <>
            <Card className={classes.card} shadow='sm' p='lg' radius='md' withBorder>
                <Box onClick={() => handleExternalLinkClick(link.url)}>
                    <Highlight highlight={Array.from(selectedTags)} weight={500}>{link.label}</Highlight>
                    <Text size='sm' color='dimmed'>{link.description}</Text>
                    <Space h='md' />
                </Box>
                <Group spacing='xs'>
                    {link.tags.map(tag => <Chip key={tag} checked={selectedTags.has(tag)} onClick={() => onTagClicked(tag)}>{tag}</Chip>)}
                </Group>
            </Card>
        </>
    )
}

export default Links
