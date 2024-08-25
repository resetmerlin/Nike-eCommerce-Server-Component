'use client';

import SvgStar from '../shared/svgs/SvgStar';
import SubTitle from '../shared/titles/SubTitle';

import './Item.scss';

const Item = ({ product }) => {
	return (
		<div className="item">
			<img src={`./products/${product._id}.png`} alt="item-image" />
			<SubTitle size="l">{product?.name}</SubTitle>
			<div className="card__stars">
				<SvgStar color="black" />
				<SvgStar color="black" />
				<SvgStar color="black" />
				<SvgStar color="black" />
				<SvgStar color="black" />
			</div>
			<SubTitle size="l">$ {product?.price}</SubTitle>
		</div>
	);
};

export default Item;
