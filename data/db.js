import products from './products.json';

/**
 * @typedef {Object} IProduct
 * @property {string} _id - The unique identifier for the product.
 * @property {string} user - The user associated with the product.
 * @property {string} name - The name of the product.
 * @property {string} brand - The brand of the product.
 * @property {string} category - The category of the product.
 * @property {string} description - The description of the product.
 * @property {number} rating - The rating of the product.
 * @property {number} numReviews - The number of reviews for the product.
 * @property {number} threeValue - Some specific value related to the product (context needed).
 * @property {number} price - The price of the product.
 * @property {number} countInStock - The number of items in stock.
 * @property {string} review - The review associated with the product.
 * @property {number} __v - The version key used by MongoDB.
 * @property {string} createAt - The creation date of the product.
 * @property {string} updatedt - The last update date of the product.
 */

/**
 * @typedef {IProduct[]} IProducts - An array of product objects.
 */

/**
 * @typedef {Object} IProductId
 * @property {string} _id - The unique identifier for the product.
 */

/**
 * @typedef {Object} IUser
 * @property {string} email - The email of the user.
 * @property {boolean} isAdmin - Whether the user has admin privileges.
 * @property {string} name - The name of the user.
 * @property {string} token - The authentication token of the user.
 * @property {string} _id - The unique identifier for the user.
 */

/**
 * @typedef {Object} ICart
 * @property {string} name - The name of the product.
 * @property {number} price - The price of the product.
 * @property {number} countInStock - The number of items in stock.
 * @property {number} qty - The quantity of the product in the cart.
 * @property {string} product - The unique identifier for the product in the cart.
 */

/**
 * @typedef {ICart[]} ICarts - An array of cart objects.
 */

/**
 * @typedef {IUser[]} IUsers - An array of user objects.
 */

/**
 * @typedef {Object} IAddress
 * @property {string} address - The shipping address.
 */

/**
 * @typedef {Object} IOrder
 * @property {IAddress} shippingAddress - The shipping address object.
 * @property {string} _id - The unique identifier for the order.
 * @property {IUser} user - The user who placed the order.
 * @property {string} email - The email of the user who placed the order.
 * @property {string} name - The name of the user who placed the order.
 * @property {ICart[]} orderItems - The items included in the order.
 * @property {string} paymentMethod - The method of payment used for the order.
 * @property {number} productPrice - The total price of the products in the order.
 * @property {number} taxPrice - The tax amount for the order.
 * @property {number} shippingPrice - The shipping cost for the order.
 * @property {string} totalPrice - The total price of the order.
 * @property {boolean} isPaid - Whether the order has been paid.
 * @property {boolean} isDelivered - Whether the order has been delivered.
 * @property {string} createdAt - The creation date of the order.
 * @property {string} updatedAt - The last update date of the order.
 * @property {number} __v - The version key used by MongoDB.
 */

const artificialWait = (ms = 1500) => new Promise((resolve) => setTimeout(resolve, ms));

/** @returns {Promise<IProducts>} */
export async function getAllProducts() {
	await artificialWait();
	return [...products];
}
