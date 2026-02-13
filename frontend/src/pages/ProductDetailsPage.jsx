import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => { api.get(`/products/${id}`).then((r) => setProduct(r.data)); }, [id]);

  const add = async () => {
    await api.post('/cart/items', { productId: id, quantity: 1 });
    alert('Added to cart');
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded border">
      <img src={product.imageUrl || 'https://placehold.co/600x300'} alt={product.name} className="mb-4 rounded" />
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p>{product.description}</p>
      <p className="my-2 font-semibold">${Number(product.price).toFixed(2)}</p>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={add}>Add to cart</button>
    </div>
  );
}
