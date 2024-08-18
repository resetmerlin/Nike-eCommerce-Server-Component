import SubTitle from '../shared/titles/SubTitle';
import Title from '../shared/titles/Title';

const Intro = () => {
	return (
		<div className="intro">
			<div className="intro-left">
				<Title size="m" strength="600">
					JUST
				</Title>
				<Title size="m" strength="600">
					DO
				</Title>
				<Title size="m" strength="600">
					IT
				</Title>

				<SubTitle color="secondary" size="m">
					You will experience outstanding <br /> Nike Resell shop ever <br /> seen before
				</SubTitle>
			</div>
			{/* <IntroCenter /> */}
			<div className="intro-background">
				<Title size="max" color="secondary" strength="500">
					NIKE
				</Title>
			</div>
			<div className="intro-right">
				<Title size="xs" strength="500">
					NIKE ZOOM AIR
				</Title>
				<Title size="s" strength="600">
					$260
				</Title>

				<SubTitle color="primary" size="m">
					GET IT NOW
				</SubTitle>
			</div>
		</div>
	);
};

export default Intro;
