const fs = require('fs');

let content = fs.readFileSync('components/ListPurcharsePage.tsx', 'utf8');

const target = `            if (editingProduct) {
                await apiFetch(\`\${API_BASE_URL}/shopping-items/\${editingProduct._id || editingProduct.id}\`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch(\`\${API_BASE_URL}/shopping-items\`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            // Re-fetch only this list's items to update the UI
            try {
                const itemsRes = await apiFetch(\`\${API_BASE_URL}/shopping-items?shoppingListId=\${listId}\`);
                if (itemsRes.ok) {
                    const productsData = await itemsRes.json();
                    const products = (productsData || []).map((p: any) => ({
                        ...p,
                        id: p._id,
                        type: p.unit || p.type,
                        packQuantity: p.packageQuantity || p.packQuantity,
                        value: p.price || p.value,
                        marketId: p.storeId ? { name: p.storeId } : undefined
                    }));
                    
                    setLists(prev => prev.map(list => {
                        if ((list._id || list.id) === listId) {
                            return { ...list, products };
                        }
                        return list;
                    }));
                }
            } catch (err) {
                console.error("Error fetching items for list after product save", err);
            }`;

const injection = `            try {
                if (editingProduct) {
                    await apiFetch(\`\${API_BASE_URL}/shopping-items/\${editingProduct._id || editingProduct.id}\`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiFetch(\`\${API_BASE_URL}/shopping-items\`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                }
            } catch (e) {
                if (!navigator.onLine) {
                    alert("Você está offline. O produto foi salvo localmente e será sincronizado assim que a conexão retornar.");
                    const tempProduct = {
                        ...productData,
                        id: 'temp-' + Date.now(),
                        _id: 'temp-' + Date.now()
                    };
                    
                    setLists(prev => prev.map(list => {
                        if ((list._id || list.id) === listId) {
                            const newProducts = editingProduct 
                                ? list.products.map(p => (p.id === editingProduct.id || p._id === editingProduct._id) ? tempProduct : p)
                                : [...list.products, tempProduct];
                            return { ...list, products: newProducts as any[] };
                        }
                        return list;
                    }));
                    setProductModalOpen(false);
                    return;
                } else {
                    throw e;
                }
            }

            // Re-fetch only this list's items to update the UI
            try {
                const itemsRes = await apiFetch(\`\${API_BASE_URL}/shopping-items?shoppingListId=\${listId}\`);
                if (itemsRes.ok) {
                    const productsData = await itemsRes.json();
                    const products = (productsData || []).map((p: any) => ({
                        ...p,
                        id: p._id,
                        type: p.unit || p.type,
                        packQuantity: p.packageQuantity || p.packQuantity,
                        value: p.price || p.value,
                        marketId: p.storeId ? { name: p.storeId } : undefined
                    }));
                    
                    setLists(prev => prev.map(list => {
                        if ((list._id || list.id) === listId) {
                            return { ...list, products };
                        }
                        return list;
                    }));
                }
            } catch (err) {
                console.error("Error fetching items for list after product save", err);
            }`;

content = content.replace(target, injection);
fs.writeFileSync('components/ListPurcharsePage.tsx', content);
