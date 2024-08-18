import Header from '../shared/Header';
import ChildTemplate from '../shared/templates/ChildTemplate';
import ParentTemplate from '../shared/templates/ParentTemplate';
import Card from './Card';
import Intro from './Intro';

import './style.scss';

const Home = ({ products }) => {
	return (
		<>
			<Header userInfo={false} logOut={() => 'blabla'} />
			<main id="container">
				<ParentTemplate size="s">
					<ChildTemplate position="center" size="s">
						<Intro />
					</ChildTemplate>
					<ChildTemplate position="bottomRight" size="s">
						{!products ? (
							<div className="card-lists">
								<Card product={undefined} />
								<Card product={undefined} />
								<Card product={undefined} />
							</div>
						) : (
							<div className="card-lists">
								{products?.map((product) => {
									return <Card product={product} key={product._id} />;
								})}
							</div>
						)}
					</ChildTemplate>
				</ParentTemplate>
			</main>
		</>
	);
};

export default Home;
