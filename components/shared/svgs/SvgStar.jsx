/**
 * SvgStar component renders an SVG star icon.
 *
 * This component allows customization of its size and color through props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} [props.size='1rem'] - The size of the SVG icon.
 * @param {string} [props.color='black'] - The color of the SVG icon.
 * @returns {JSX.Element} The rendered SVG star icon.
 */
function SvgStar({ size = '1rem', color = 'black' }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			style={{
				fill: color
			}}
		>
			<path d="M21.947 9.179a1.001 1.001 0 0 0-.868-.676l-5.701-.453-2.467-5.461a.998.998 0 0 0-1.822-.001L8.622 8.05l-5.701.453a1 1 0 0 0-.619 1.713l4.213 4.107-1.49 6.452a1 1 0 0 0 1.53 1.057L12 18.202l5.445 3.63a1.001 1.001 0 0 0 1.517-1.106l-1.829-6.4 4.536-4.082c.297-.268.406-.686.278-1.065z" />
		</svg>
	);
}

export default SvgStar;
