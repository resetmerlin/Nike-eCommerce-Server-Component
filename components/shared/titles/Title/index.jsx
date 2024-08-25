'use client';

import './style.scss';

/**
 * AtomicTitle component responsible for creating a title element for Basic Atoms.
 *
 * This component adjusts its size, color, and font strength based on the provided props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the title.
 * @param {string} [props.className=''] - Additional class names to apply to the title.
 * @param {'xs' | 's' | 'm' | 'l' | 'max'} [props.size='m'] - The size of the title.
 * @param {'primary' | 'secondary'} [props.color='primary'] - The color of the title.
 * @param {'400' | '500' | '600' | '700'} [props.strength='400'] - The font weight of the title.
 * @returns {JSX.Element} The rendered title component.
 */
export default function Title({
	children,
	className = '',
	size = 'm',
	strength = '400',
	color = 'primary',
	...props
}) {
	return (
		<span
			{...props}
			className={`${className} title-${size} title-${color} title-${strength} title`}
		>
			{children}
		</span>
	);
}
