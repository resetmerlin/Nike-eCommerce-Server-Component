import Header from '../shared/Header';
import ParentTemplate from '../shared/templates/ParentTemplate';
import ChildTemplate from '../shared/templates/ChildTemplate';
import Title from '../shared/titles/Title';
import Item from './Item';

import './style.scss';

const Products = ({ products }) => {
	return (
		<>
			<Header userInfo={false} logOut={() => 'blabla'} />
			<main id="container">
				<ParentTemplate size="s">
					<ChildTemplate position="topLeft" size="s">
						<Title size="xs">Latest Products</Title>
					</ChildTemplate>
					<ChildTemplate position="bottomCenter" size="s">
						<div className="item-lists">
							{products?.map((product) => {
								return (
									<a href={`/product/${product._id}`} key={product._id}>
										<Item product={product} />
									</a>
								);
							})}
						</div>{' '}
					</ChildTemplate>
				</ParentTemplate>
			</main>
		</>
	);
};

export default Products;
