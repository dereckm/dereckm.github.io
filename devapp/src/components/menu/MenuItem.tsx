import styles from './MenuItem.module.css'

const MenuItem = ({icon, title, onClick, isSelected}: MenuItemProps) => {
    let containerClassesNames = styles['menu-item-container']
    if (isSelected) containerClassesNames += ` ${styles['selected']}`

    let menuItemClassesNames = styles['menu-item']
    if (isSelected) menuItemClassesNames += ` ${styles['selected']}`

    console.log(isSelected)
    return (
        <div onClick={onClick} className={containerClassesNames}>
            <div className={menuItemClassesNames}>
                {icon}
                <div>{title}</div>
            </div>
        </div>
    )
}

type MenuItemProps = {
    icon: JSX.Element
    title: string
    onClick: () => void
    isSelected: boolean
}

export default MenuItem;