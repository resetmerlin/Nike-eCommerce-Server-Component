import './style.scss';

/**
 * Logo component responsible for rendering a logo image.
 *
 * This component allows customization of the logo size through props.
 * It also handles error events to provide a fallback image source.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} [props.className=''] - Additional class names to apply to the logo.
 * @param {'s' | 'm' | 'l' | 'xl'} [props.size='m'] - The size of the logo.
 * @param {string} [props.src] - Additional class names to apply to the logo.
 * @returns {JSX.Element} The rendered logo component.
 */
export default function Logo({ className = '', src, size = 'm', ...props }) {
	return (
		<img
			{...props}
			src={src}
			alt="nike-logo-black"
			id="nike-logo"
			className={`nike-${size} nike ${className}`}
		/>
	);
}
