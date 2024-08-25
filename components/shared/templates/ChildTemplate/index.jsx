'use client';

import './style.scss';

/**
 * ChildTemplate component responsible for creating a child template for Basic Atoms.
 *
 * This component adjusts its position and size based on the provided `position` and `size` props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the template.
 * @param {string} [props.className=''] - Additional class names to apply to the template.
 * @param {'center' | 'bottomRight' | 'topLeft' | 'bottomCenter' | 'left' | 'right' | 'centerRight' | 'centerLeft' | 'leftRight' | 'bottomLeft'} props.position - The position of the template.
 * @param {'s' | 'm' | 'full'} props.size - The size of the template. Can be 's', 'm', or 'full'.
 * @returns {JSX.Element} The rendered template component.
 */
export default function ChildTemplate({ children, className = '', position, size, ...props }) {
	return (
		<div {...props} className={`${className} child-template-w-${size}-${position}`}>
			{children}
		</div>
	);
}
