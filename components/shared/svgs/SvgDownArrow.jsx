/**
 * SvgDownArrow component renders an SVG down arrow icon.
 *
 * This component allows customization of its size and color through props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} [props.size='1rem'] - The size of the SVG icon.
 * @param {string} [props.color='black'] - The color of the SVG icon.
 * @returns {JSX.Element} The rendered SVG down arrow icon.
 */
const SvgDownArrow = ({ size = '1rem', color = 'black' }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		style={{
			fill: color
		}}
	>
		<path d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z" />
	</svg>
);

export default SvgDownArrow;
