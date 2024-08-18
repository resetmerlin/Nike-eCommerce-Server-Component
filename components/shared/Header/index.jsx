'use client';

import SubTitle from '../titles/SubTitle';
import Button from '../Button';
import SvgCartAlt from '../svgs/SvgsCartAlt';
import SvgLogIn from '../svgs/SvgLogIn';
import SvgUserCircle from '../svgs/SvgUserCircle';

import './style.scss';
import Logo from '../Logo';

/**
 * Header component responsible for rendering the main header of the application.
 *
 * This component combines various atomic and molecular components to form a functional header,
 * including navigation links, user authentication buttons, and a shopping cart button.
 *
 * @param {object} props - The properties passed to the component.
 * @param {any} props.userInfo - The user information object, containing details like user token.
 * @param {function} props.logOut - The function to log out the user.
 * @returns {JSX.Element} The rendered header component.
 */
const Header = ({ userInfo, logOut }) => {
	return (
		<div className="header" id="header">
			<div className="header__left">
				<a href="/">
					<Logo src={`/nike-logo-black.png`} size="l" />
				</a>
			</div>

			<div className="header__center">
				<SubTitle size="l" strength="600">
					MEN
				</SubTitle>
				<SubTitle size="l" strength="600">
					WOMEN
				</SubTitle>
				<a href="/products">
					<SubTitle size="l" strength="600">
						ALL
					</SubTitle>
				</a>
			</div>

			<div className="header__right">
				<a href="/cart">
					<Button shape="round" color="secondary" size="s">
						<SvgCartAlt size="1.8rem" color="black" />
					</Button>
				</a>

				{userInfo && userInfo.token ? (
					<>
						<input type="checkbox" name="userCheck" id="userCheck" />
						<label htmlFor="userCheck" className="userCheck">
							<SvgUserCircle size="3rem" color="white" />
						</label>
						<div className="userCheck-popup">
							<a href="/profile">
								<Button shape="rect" size="xs" color="secondary">
									Profile
								</Button>
							</a>

							<Button shape="rect" size="xs" color="secondary">
								Log Out
							</Button>
						</div>
					</>
				) : (
					<a href="/login">
						<Button shape="round" color="primary" size="s">
							<SvgLogIn size="1.8rem" color="white" />
						</Button>
					</a>
				)}
			</div>
		</div>
	);
};

export default Header;
