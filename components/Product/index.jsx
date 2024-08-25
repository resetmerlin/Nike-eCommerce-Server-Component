'use client';

import Header from '../shared/Header';
import ChildTemplate from '../shared/templates/ChildTemplate';
import ParentTemplate from '../shared/templates/ParentTemplate';
import ItemNav from './ItemNav';

const Product = ({ products }) => {
	return (
		<>
			<Header userInfo={false} logOut={() => 'blabla'} />
			<main id="container">
				<ParentTemplate size="full">
					<ChildTemplate position="left" size="full">
						{/* <Intro /> */}blablas
					</ChildTemplate>
					<ChildTemplate position="centerRight" size="full">
						blabla
					</ChildTemplate>
					<ChildTemplate position="right" size="full">
						<ItemNav products={products} />
					</ChildTemplate>
				</ParentTemplate>
			</main>
		</>
	);
};

export default Product;
