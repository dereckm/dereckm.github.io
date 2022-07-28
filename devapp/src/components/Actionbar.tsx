import React from 'react'
import { createStyles, Kbd, UnstyledButton } from '@mantine/core'
import { IconSearch } from '@tabler/icons'
import { useSpotlight } from '@mantine/spotlight';

const useStyle = createStyles((theme) => ({
    button: {
        border: `solid 2px ${theme.colors.gray[3]}`,
        borderRadius: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        width: '200px',
        height: '35px'
    },
    content: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '20px'
    },
    shortcut: {
        fontWeight: 'bold',
        color: theme.colors.dark[9],
        padding: '1px 5px'
    }
}))

const Actionbar = function() {
    const spotlight = useSpotlight()
    const { classes } = useStyle()
    return (
        <>
            <UnstyledButton onClick={spotlight.openSpotlight} className={classes.button}>
                <div className={classes.content}>
                    <IconSearch size={16} />
                    <div>Search</div>
                    <Kbd className={classes.shortcut}>Ctrl + K</Kbd>
                </div>
            </UnstyledButton>
        </>
    )
}

export default Actionbar
