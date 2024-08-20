// @ts-nocheck
import { Suspense } from 'react';
import '../../components/shared/global.scss';
import { getAllProducts } from '../../data/db.js';
import Product from '../../components/Product';

export async function ProductPage() {
	const products = await getAllProducts();
	return <Product products={products}></Product>;
}
export default async function Page() {
	return (
		<Suspense fallback="data is loading...">
			<ProductPage />
		</Suspense>
	);
}
