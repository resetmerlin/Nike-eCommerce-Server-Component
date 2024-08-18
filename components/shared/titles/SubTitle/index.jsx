'use client';

import './style.scss';

/**
 * SubTitle component responsible for creating a subtitle element for Basic Atoms.
 *
 * This component adjusts its size, color, and font strength based on the provided props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the subtitle.
 * @param {string} [props.className=''] - Additional class names to apply to the subtitle.
 * @param {'s' | 'm' | 'l' | 'xl'} [props.size='m'] - The size of the subtitle.
 * @param {'primary' | 'secondary' | 'tertiary'} [props.color='primary'] - The color of the subtitle.
 * @param {'400' | '500' | '600' | '700'} [props.strength='400'] - The font weight of the subtitle.
 * @returns {JSX.Element} The rendered subtitle component.
 */
export default function SubTitle({
	children,
	className = '',
	size = 'm',
	color = 'primary',
	strength = '400',
	...props
}) {
	return (
		<span
			{...props}
			className={`${className} subtitle-${size} subtitle-${strength} subtitle-${color} subtitle`}
		>
			{children}
		</span>
	);
}
