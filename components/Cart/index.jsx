import Header from '../shared/Header';
import ChildTemplate from '../shared/templates/ChildTemplate';
import ParentTemplate from '../shared/templates/ParentTemplate';
import Intro from './Intro';

import './style.scss';

const Cart = () => {
	return (
		<>
			<Header userInfo={false} logOut={() => 'blabla'} />
			<main id="container">
				<ParentTemplate size="s">
					<ChildTemplate position="center" size="s">
						<Intro />
					</ChildTemplate>
					<ChildTemplate position="bottomRight" size="s">
						'blabla'
					</ChildTemplate>
				</ParentTemplate>
			</main>
		</>
	);
};

export default Cart;
