'use client';

import SubTitle from '../shared/titles/SubTitle';
import SvgStar from '../shared/svgs/SvgStar';

import './Card.scss';

const Card = ({ product }) => {
	return (
		<div className="card">
			<img src={`./products/${product._id}.png`} alt="productId" id="nike-product" />
			<div className="card__content">
				<SubTitle size="m">{product?.name}</SubTitle>

				<div className="card__stars">
					<SvgStar color="black" />
					<SvgStar color="black" />
					<SvgStar color="black" />
					<SvgStar color="black" />
					<SvgStar color="black" />
				</div>
				<SubTitle size="m">$ {product?.price}</SubTitle>
			</div>
		</div>
	);
};

export default Card;
