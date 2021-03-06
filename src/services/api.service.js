import axios from 'axios';
import clone from 'lodash.clone';
import { QueryTransformer, sort } from '../helpers/utils';
import { Suggestion } from '../models';

const PRODUCT_FETCH_LIMIT = 10;

const cache = {
  products: []
};

let productsPromise;

export const fetchProducts = () => {
  if (!productsPromise) {
    productsPromise = axios
      .get('https://my-json-server.typicode.com/carlosrobles/simple-api-mock/products')
      .then(unwrap)
      .then((products) => {
        cache.products = clone(products);
        return products;
      })
      .catch(() => (productsPromise = null));
  }

  return productsPromise;
};

export const fetchProduct = id => axios
  .get(`https://my-json-server.typicode.com/carlosrobles/simple-api-mock/products/${id}`)
  .then(unwrap);

export const getProductData = id => fetchProduct(id);

const unwrap = (response) => {
  if (response.status !== 200) {
    console.error('Error fetching data', response.status, response);
    throw new Error(response);
  }

  return response.data;
};

const transform = (products = [], query = '', order = '', key = '') => {
  const q = query.trim();

  let transformed = products;

  if (q) {
    const matcher = new QueryTransformer(q);
    transformed = products.filter(p => p.name.match(matcher));
  }

  if (order && key) {
    transformed = sort(transformed, order, key);
  }

  return transformed;
};

export const getProductsData = (index, { query, order, key }) => new Promise((resolve, reject) => {
  if (cache.products.length) {
    const chunk = transform(clone(cache.products), query, order, key).slice(
      index,
      PRODUCT_FETCH_LIMIT + index
    );

    setTimeout(() => resolve(chunk), 1000);
  } else {
    fetchProducts()
      .then((products) => {
        const chunk = transform(products, query, order, key).slice(index, PRODUCT_FETCH_LIMIT);

        resolve(chunk);
      })
      .catch(reject);
  }
});

export const getSearchSuggestions = query => new Promise((resolve, reject) => {
  const q = query.trim();
  let suggestions = [];

  if (q) {
    const matcher = new QueryTransformer(q);

    fetchProducts().then(() => {
      suggestions = cache.products
        .filter(p => p.name.match(matcher))
        .map(item => new Suggestion(item.name));

      resolve(suggestions);
    });
  } else {
    resolve(suggestions);
  }
});

// FETCHING products data immediately instead of waiting for components to mount.
// productsPromise = fetchProducts();
