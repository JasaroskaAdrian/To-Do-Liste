document.addEventListener('DOMContentLoaded', () => {
    const ProductList = document.getElementById('ProductList');

    const fetchProducts = () => {
        fetch('/products/main')
            .then(response => response.json())
            .then(Products => {
                ProductList.innerHTML = '';
                Products.forEach(Product => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between items-center border-b py-2';
                    li.innerHTML = `
                        <div>
                            <span class="text-gray-600">ID: ${Product.id}</span>
                            <span class="text-blue-500 ml-4">${Product.title || 'Untitled Task'}</span>
                        </div>
                        <div>
                            <a href="/products/${Product.id}/show" class="bg-green-500 text-white px-4 py-2 rounded">Show</a>
                            <a href="/products/${Product.id}/edit" class="bg-yellow-500 text-white px-4 py-2 rounded ml-2">Edit</a>
                            <button class="bg-red-500 text-white px-4 py-2 rounded ml-2" onclick="deleteTask(${Product.id})">Delete</button>
                        </div>
                    `;
                    ProductList.appendChild(li);
                });
            });
    };

    document.getElementById('createProductButton').addEventListener('click', () => {
        fetch('/products/main', { method: 'POST' })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                }
            });
    });

    window.deleteProducts = (ProductId) => {
        fetch(`/products/${ProductId}`, { method: 'DELETE' })
            .then(() => {
                fetchProducts();
            });
    };

    fetchProducts();
});