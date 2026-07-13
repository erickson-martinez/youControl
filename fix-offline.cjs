const fs = require('fs');

let content = fs.readFileSync('components/ListPurcharsePage.tsx', 'utf8');

// Replace handleSaveList block to handle offline locally
const target1 = `const response = await apiFetch(\`\${API_BASE_URL}/shopping-lists\`, { method: 'POST', body: JSON.stringify(payload) });
                const data = await response.json();
                
                // Mapeia o retorno para o objeto ShoppingList
                const rawList = data.shoppingList || data.list || data;
                if (rawList && (rawList._id || rawList.id)) {
                    createdList = {
                        ...rawList,
                        id: rawList._id || rawList.id,
                        products: rawList.products || [],
                        total: 0
                    };
                }`;

const injection1 = `try {
                    const response = await apiFetch(\`\${API_BASE_URL}/shopping-lists\`, { method: 'POST', body: JSON.stringify(payload) });
                    const data = await response.json();
                    
                    const rawList = data.shoppingList || data.list || data;
                    if (rawList && (rawList._id || rawList.id)) {
                        createdList = {
                            ...rawList,
                            id: rawList._id || rawList.id,
                            products: rawList.products || [],
                            total: 0
                        };
                    }
                } catch (e) {
                    if (!navigator.onLine) {
                        alert("Você está offline. A lista foi salva localmente e será sincronizada assim que a conexão retornar.");
                        createdList = {
                            ...payload,
                            id: 'temp-' + Date.now(),
                            products: [],
                            total: 0
                        } as ShoppingList;
                    } else {
                        throw e;
                    }
                }`;

content = content.replace(target1, injection1);

// Add to local state
const target2 = `await fetchData();
            setListModalOpen(false);`;

const injection2 = `if (createdList && !navigator.onLine) {
                setLists(prev => [createdList!, ...prev]);
            } else {
                await fetchData();
            }
            setListModalOpen(false);`;

content = content.replace(target2, injection2);

fs.writeFileSync('components/ListPurcharsePage.tsx', content);
