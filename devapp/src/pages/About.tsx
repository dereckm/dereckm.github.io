import React from 'react'
import { Image, createStyles, Group, Title, Text, Stack, Timeline, Divider, Space } from '@mantine/core'
import ProfileImage from '../resources/dereckm.jpg'


const useStyle = createStyles(() => ({
    headerBackground: {
        backgroundColor: '#000',
        opacity: '0.7',
        backgroundImage: 'linear-gradient(30deg, #444cf7 12%, transparent 12.5%, transparent 87%, #444cf7 87.5%, #444cf7), linear-gradient(150deg, #444cf7 12%, transparent 12.5%, transparent 87%, #444cf7 87.5%, #444cf7), linear-gradient(30deg, #444cf7 12%, transparent 12.5%, transparent 87%, #444cf7 87.5%, #444cf7), linear-gradient(150deg, #444cf7 12%, transparent 12.5%, transparent 87%, #444cf7 87.5%, #444cf7), linear-gradient(60deg, #444cf777 25%, transparent 25.5%, transparent 75%, #444cf777 75%, #444cf777), linear-gradient(60deg, #444cf777 25%, transparent 25.5%, transparent 75%, #444cf777 75%, #444cf777)',
        backgroundSize: '20px 35px',
        backgroundPosition:'0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px',
        height: '200px'
    },
    quoteGroup: {
        paddingTop: '60px',
        paddingBottom: '60px',
        backgroundColor: '#7C82F9'
    },
    quoteText: {
        fontStyle: 'italic',
        color: '#FFF',
        width: '50%'
    },
    experienceGroup: {
        paddingTop: '60px',
        paddingBottom: '60px',
        backgroundColor: '#FFF',
        color: 'rgb(99, 101, 157)'
    }
}))

const About = function () {
    const { classes } = useStyle()
    return (
        <>
            <div className={classes.headerBackground}>
                <Header />
                <Summary />
                <Experience />
            </div>
        </>
    )
}

const Header = function () {
    return (
        <>
            <Group position='center' align={'center'} style={{height: '100%'}}>
                <Image width={80} height={80} src={ProfileImage} radius={40}></Image>
                <Stack>
                    <Title style={{ color: '#FFF' }}>Dereck Melancon</Title>
                    <Title order={3} style={{ color: '#CCCCCC' }}>Software Developer</Title>
                </Stack>
            </Group>
        </>
    )
}

const Summary = function () {
    const { classes } = useStyle()
    return (
        <>
            <Group className={classes.quoteGroup} position='center'>
                <Text className={classes.quoteText}>"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nunc felis, sollicitudin id posuere sed, dictum vel velit. Nullam scelerisque, metus eu congue elementum, lectus ipsum dictum sem, nec cursus lorem nibh quis turpis. Praesent rhoncus, lacus vitae mollis maximus, leo purus sollicitudin urna, pharetra bibendum massa elit non tortor."</Text>
            </Group>
        </>
    )
}

const Experience = function () {
    const { classes } = useStyle()
    return (
        <>
            <div className={classes.experienceGroup}>
                <Group position='center'>
                    <Group position='center'>
                        <Title order={2}>Experience</Title>
                        <Divider orientation='vertical'></Divider>
                        <Timeline active={0}>
                            <Timeline.Item title='Senior IT Developer'>
                                <Text color="dimmed" size="sm">Ubisoft Montreal</Text>
                                <Text size="xs" mt={4}>April 2022 - Now</Text>
                            </Timeline.Item>
                            <Timeline.Item title='IT Developer'>
                                <Text color="dimmed" size="sm">Ubisoft Montreal</Text>
                                <Text size="xs" mt={4}>Sept 2020 - April 2022</Text>
                            </Timeline.Item>
                            <Timeline.Item title='Software Developer'>
                                <Text color="dimmed" size="sm">iBwave Solutions Inc.</Text>
                                <Text size="xs" mt={4}>April 2018 - Sept 2020</Text>
                            </Timeline.Item>
                            <Timeline.Item title='Web Developer (intern)'>
                                <Text color="dimmed" size="sm">Videotron</Text>
                                <Text size="xs" mt={4}>April 2017 - Aug 2017</Text>
                            </Timeline.Item>
                            <Timeline.Item title='Software Developer (intern)'>
                                <Text color="dimmed" size="sm">iBwave Solutions Inc.</Text>
                                <Text size="xs" mt={4}>Sept 2016 - Dec 2016</Text>
                            </Timeline.Item>
                            <Timeline.Item title='Web Developer'>
                                <Text color="dimmed" size="sm">Bath Fitter</Text>
                                <Text size="xs" mt={4}>April 2015 - Sept 2016</Text>
                            </Timeline.Item>
                        </Timeline>
                    </Group>
                    <Space w='xl' />
                    <Group position='center'>
                        <Title order={2}>Education</Title>
                        <Divider orientation='vertical'></Divider>
                        <Timeline>
                            <Timeline.Item title='B. Ing. Software Engineering'>
                                <Text color="dimmed" size="sm">Ecole de technologie superieure</Text>
                                <Text size="xs" mt={4}>2018</Text>
                            </Timeline.Item>
                            <Timeline.Item title='D.E.C. Science Nature'>
                                <Text color="dimmed" size="sm">College Lionel-Groulx</Text>
                                <Text size="xs" mt={4}>2013</Text>
                            </Timeline.Item>
                        </Timeline>
                    </Group>
                </Group>
                

            </div>
        </>
    )
}

export default About
