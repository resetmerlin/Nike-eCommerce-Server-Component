// @ts-nocheck
import { Suspense } from 'react';
import '../../components/shared/global.scss';
import { getAllProducts } from '../../data/db.js';
import Products from '../../components/Products';

export async function ProductsPage() {
	const products = await getAllProducts();
	return <Products products={products}></Products>;
}
export default async function Page() {
	return (
		<Suspense fallback="data is loading...">
			<ProductsPage />
		</Suspense>
	);
}
