'use client';

import './style.scss';

/**
 * Button component responsible for creating a button element for Basic Atoms.
 *
 * This component adjusts its type, color, shape, and size based on the provided props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The content to be rendered inside the button.
 * @param {string} [props.className=''] - Additional class names to apply to the button.
 * @param {'submit' | 'button'} [props.type='button'] - The type of the button.
 * @param {'primary' | 'secondary'} [props.color='primary'] - The color of the button.
 * @param {'normal' | 'round' | 'rect' | 'none'} [props.shape='normal'] - The shape of the button.
 * @param {'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl'} [props.size] - The size of the button.
 * @returns {JSX.Element} The rendered button component.
 */
export default function Button({
	children,
	className = '',
	color = 'primary',
	shape = 'normal',
	type = 'button',
	size,
	...props
}) {
	return (
		<button
			{...props}
			type={type}
			className={`${className} button-${color} button-${shape} button button-${size}`}
		>
			{children}
		</button>
	);
}
