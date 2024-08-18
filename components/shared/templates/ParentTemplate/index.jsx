'use client';

import './style.scss';

/**
 * ParentTemplate component responsible for creating a parent template for Basic Atoms.
 *
 * This component adjusts its size based on the provided `size` prop.
 *
 * @param {object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the template.
 * @param {string} [props.className=''] - Additional class names to apply to the template.
 * @param {'s' | 'm' | 'full'} props.size - The size of the template. Can be 's', 'm', or 'full'.
 * @returns {JSX.Element} The rendered template component.
 */
export default function ParentTemplate({ children, className = '', size, ...props }) {
	return (
		<div {...props} className={`${className} template-${size} template`}>
			{children}
		</div>
	);
}
